---
name: fastapi-patterns
description: FastAPI patterns for API design. Use when creating endpoints, handling dependencies, error handling, working with OpenAPI schemas, WebSockets, background tasks, testing, and production deployment patterns.
---

# FastAPI Patterns

## Problem Statement

FastAPI API design directly affects frontend integration, system reliability, and operational excellence. Bad patterns cause frontend bugs, poor developer experience, integration issues, and production incidents. The OpenAPI schema drives frontend code generation, making schema hygiene critical.

---

## Pattern: Dependency Injection

**Problem:** Repetitive code for auth, sessions, and services creates maintenance burden and inconsistency.

```python
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import AsyncGenerator, Annotated

# ✅ CORRECT: Dependencies for common needs
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_session),
) -> User:
    user = await verify_token_and_get_user(token, session)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

async def get_current_active_user(
    user: User = Depends(get_current_user),
) -> User:
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )
    return user

# ✅ CORRECT: Type aliases for cleaner signatures (Python 3.9+)
SessionDep = Annotated[AsyncSession, Depends(get_session)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]

# ✅ CORRECT: Endpoint using annotated dependencies
@router.post("/assessments", response_model=AssessmentRead, status_code=201)
async def create_assessment(
    data: AssessmentCreate,
    current_user: CurrentUser,
    session: SessionDep,
) -> AssessmentRead:
    assessment = Assessment(**data.model_dump(), user_id=current_user.id)
    session.add(assessment)
    await session.commit()
    await session.refresh(assessment)
    return assessment
```

**Dependency chain:** `get_session` → `get_current_user` → `get_current_active_user`

**Advanced: Parameterized Dependencies**

```python
# ✅ CORRECT: Factory function for permissions
def require_permission(permission: str):
    async def check_permission(user: CurrentUser) -> User:
        if permission not in user.permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission '{permission}' required",
            )
        return user
    return check_permission

@router.delete("/assessments/{id}")
async def delete_assessment(
    id: UUID,
    user: User = Depends(require_permission("assessment:delete")),
    session: SessionDep,
):
    ...
```

---

## Pattern: Lifespan Events (Startup/Shutdown)

**Problem:** Resources like database pools, message queues, and caches need proper initialization and cleanup.

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
import asyncpg
import redis.asyncio as redis

# ✅ CORRECT: Lifespan context manager (FastAPI 0.93+)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize resources
    app.state.db_pool = await asyncpg.create_pool(
        DATABASE_URL,
        min_size=5,
        max_size=20,
    )
    app.state.redis = redis.from_url(REDIS_URL)
    
    # Optional: Run migrations, warm caches, etc.
    await warm_cache(app.state.redis)
    
    yield  # Application runs here
    
    # Shutdown: Clean up resources
    await app.state.db_pool.close()
    await app.state.redis.close()

app = FastAPI(lifespan=lifespan)

# ✅ CORRECT: Accessing state in dependencies
async def get_db_pool(request: Request) -> asyncpg.Pool:
    return request.app.state.db_pool

# ❌ WRONG: Using deprecated on_event (still works but avoid)
@app.on_event("startup")
async def startup():
    ...
```

---

## Pattern: Response Models

**Problem:** Inconsistent responses, exposing internal fields, poor OpenAPI docs.

```python
from pydantic import ConfigDict
from sqlmodel import SQLModel, Field
from datetime import datetime
from uuid import UUID

# ✅ CORRECT: Separate models for different operations
class AssessmentBase(SQLModel):
    """Shared fields for assessment models."""
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=1000)
    skill_areas: list[str] = Field(min_length=1)

class AssessmentCreate(AssessmentBase):
    """Fields required when creating an assessment."""
    pass

class AssessmentUpdate(SQLModel):
    """Fields that can be updated (all optional)."""
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    skill_areas: list[str] | None = Field(default=None, min_length=1)

class AssessmentRead(AssessmentBase):
    """Fields returned to client (excludes internal fields)."""
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# ✅ CORRECT: Explicit response_model
@router.get("/users/{user_id}", response_model=UserRead)
async def get_user(user_id: UUID, session: SessionDep) -> UserRead:
    user = await get_user_or_404(user_id, session)
    return user  # Automatically filtered to UserRead fields

# ✅ CORRECT: Paginated response with generics
from typing import Generic, TypeVar

T = TypeVar("T")

class PaginatedResponse(SQLModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    size: int
    pages: int  # Total number of pages

@router.get("/assessments", response_model=PaginatedResponse[AssessmentRead])
async def list_assessments(
    session: SessionDep,
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
) -> PaginatedResponse[AssessmentRead]:
    offset = (page - 1) * size
    
    # Count total
    count_result = await session.execute(select(func.count(Assessment.id)))
    total = count_result.scalar_one()
    
    # Fetch page
    result = await session.execute(
        select(Assessment).offset(offset).limit(size)
    )
    items = result.scalars().all()
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=(total + size - 1) // size,
    )

# ❌ WRONG: No response_model (exposes everything)
@router.get("/users/{user_id}")
async def get_user(user_id: UUID) -> User:  # Exposes hashed_password!
    ...
```

**Why response_model matters:**
1. Filters output to only specified fields
2. Generates accurate OpenAPI schema
3. Frontend Orval/openapi-typescript codegen depends on this
4. Prevents accidental exposure of sensitive data

---

## Pattern: Error Handling

**Problem:** Inconsistent error responses, missing context, poor debugging experience.

```python
from fastapi import HTTPException, status, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel

# ✅ CORRECT: Structured error response
class ErrorResponse(BaseModel):
    detail: str
    error_code: str
    context: dict | None = None

# ✅ CORRECT: Custom domain exceptions
class DomainError(Exception):
    """Base class for domain-specific errors."""
    def __init__(
        self,
        detail: str,
        error_code: str,
        status_code: int = 400,
        context: dict | None = None,
    ):
        self.detail = detail
        self.error_code = error_code
        self.status_code = status_code
        self.context = context or {}

class AssessmentNotFoundError(DomainError):
    def __init__(self, assessment_id: UUID):
        super().__init__(
            detail=f"Assessment {assessment_id} not found",
            error_code="ASSESSMENT_NOT_FOUND",
            status_code=404,
            context={"assessment_id": str(assessment_id)},
        )

class AssessmentLimitExceededError(DomainError):
    def __init__(self, limit: int):
        super().__init__(
            detail=f"Maximum of {limit} assessments allowed",
            error_code="ASSESSMENT_LIMIT_EXCEEDED",
            status_code=429,
            context={"limit": limit},
        )

# ✅ CORRECT: Global exception handler
@app.exception_handler(DomainError)
async def domain_error_handler(request: Request, exc: DomainError):
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            detail=exc.detail,
            error_code=exc.error_code,
            context=exc.context,
        ).model_dump(),
    )

# ✅ CORRECT: Enhanced validation error handler
@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
            "type": error["type"],
        })
    return JSONResponse(
        status_code=422,
        content=ErrorResponse(
            detail="Validation error",
            error_code="VALIDATION_ERROR",
            context={"errors": errors},
        ).model_dump(),
    )

# ✅ CORRECT: Usage in endpoints
@router.get("/assessments/{id}", response_model=AssessmentRead)
async def get_assessment(id: UUID, session: SessionDep) -> AssessmentRead:
    result = await session.execute(
        select(Assessment).where(Assessment.id == id)
    )
    assessment = result.scalar_one_or_none()
    
    if not assessment:
        raise AssessmentNotFoundError(id)
    
    return assessment
```

**HTTP Status Codes:**

| Code | Use For |
|------|---------|
| 200 | Successful GET, PUT, PATCH |
| 201 | Successful POST (created) |
| 204 | Successful DELETE (no content) |
| 400 | Bad request (malformed syntax) |
| 401 | Unauthorized (not authenticated) |
| 403 | Forbidden (authenticated but not allowed) |
| 404 | Resource not found |
| 409 | Conflict (duplicate, state conflict) |
| 422 | Validation error (semantic issues) |
| 429 | Rate limit exceeded |
| 500 | Server error (unexpected) |
| 503 | Service unavailable (maintenance, overload) |

---

## Pattern: Background Tasks

**Problem:** Long-running operations block HTTP responses; need async processing.

```python
from fastapi import BackgroundTasks
from typing import Any

# ✅ CORRECT: Simple background task
async def send_notification(user_id: UUID, message: str):
    """Runs after response is sent."""
    await notification_service.send(user_id, message)

@router.post("/assessments", response_model=AssessmentRead, status_code=201)
async def create_assessment(
    data: AssessmentCreate,
    background_tasks: BackgroundTasks,
    current_user: CurrentUser,
    session: SessionDep,
) -> AssessmentRead:
    assessment = Assessment(**data.model_dump(), user_id=current_user.id)
    session.add(assessment)
    await session.commit()
    await session.refresh(assessment)
    
    # Queue background work AFTER commit
    background_tasks.add_task(
        send_notification,
        current_user.id,
        f"Assessment '{assessment.title}' created",
    )
    
    return assessment

# ✅ CORRECT: Multiple background tasks
@router.post("/assessments/{id}/complete")
async def complete_assessment(
    id: UUID,
    background_tasks: BackgroundTasks,
    session: SessionDep,
):
    assessment = await get_assessment_or_404(id, session)
    assessment.status = "completed"
    await session.commit()
    
    # Queue multiple tasks
    background_tasks.add_task(generate_report, assessment.id)
    background_tasks.add_task(notify_user, assessment.user_id)
    background_tasks.add_task(update_analytics, assessment.id)
    
    return {"status": "completed"}

# ✅ CORRECT: Dependency that adds background tasks
async def audit_log_dependency(
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: CurrentUser,
):
    yield
    # After endpoint completes, log the action
    background_tasks.add_task(
        log_audit_event,
        user_id=current_user.id,
        path=request.url.path,
        method=request.method,
    )
```

**When to use BackgroundTasks vs. Task Queue (Celery/ARQ):**

| BackgroundTasks | Task Queue |
|-----------------|------------|
| Quick operations (<30s) | Long-running jobs |
| Non-critical (can fail) | Must complete reliably |
| Same process | Separate worker process |
| No retry needed | Retry/backoff required |

---

## Pattern: WebSocket Connections

**Problem:** Real-time communication for equipment status, live updates, message streams.

```python
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict
import asyncio

# ✅ CORRECT: Connection manager for multiple clients
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self._lock = asyncio.Lock()
    
    async def connect(self, client_id: str, websocket: WebSocket):
        await websocket.accept()
        async with self._lock:
            self.active_connections[client_id] = websocket
    
    async def disconnect(self, client_id: str):
        async with self._lock:
            self.active_connections.pop(client_id, None)
    
    async def send_personal(self, client_id: str, message: dict):
        if ws := self.active_connections.get(client_id):
            await ws.send_json(message)
    
    async def broadcast(self, message: dict, exclude: str | None = None):
        async with self._lock:
            connections = list(self.active_connections.items())
        for client_id, ws in connections:
            if client_id != exclude:
                try:
                    await ws.send_json(message)
                except Exception:
                    await self.disconnect(client_id)

manager = ConnectionManager()

# ✅ CORRECT: WebSocket endpoint with authentication
@router.websocket("/ws/{client_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    client_id: str,
    token: str = Query(...),
):
    # Validate token before accepting connection
    user = await verify_token(token)
    if not user:
        await websocket.close(code=4001, reason="Unauthorized")
        return
    
    await manager.connect(client_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            
            # Handle different message types
            match data.get("type"):
                case "ping":
                    await websocket.send_json({"type": "pong"})
                case "subscribe":
                    await handle_subscription(client_id, data)
                case "message":
                    await process_message(client_id, data, manager)
                case _:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Unknown message type: {data.get('type')}",
                    })
    except WebSocketDisconnect:
        await manager.disconnect(client_id)
        await manager.broadcast(
            {"type": "user_left", "client_id": client_id},
            exclude=client_id,
        )

# ✅ CORRECT: Heartbeat for connection health
@router.websocket("/ws/equipment/{equipment_id}")
async def equipment_stream(websocket: WebSocket, equipment_id: str):
    await websocket.accept()
    
    async def heartbeat():
        while True:
            try:
                await websocket.send_json({"type": "heartbeat"})
                await asyncio.sleep(30)
            except Exception:
                break
    
    heartbeat_task = asyncio.create_task(heartbeat())
    
    try:
        async for message in equipment_message_stream(equipment_id):
            await websocket.send_json(message)
    finally:
        heartbeat_task.cancel()
```

---

## Pattern: Streaming Responses

**Problem:** Large data transfers or real-time data need streaming, not buffered responses.

```python
from fastapi.responses import StreamingResponse
from typing import AsyncGenerator
import asyncio
import json

# ✅ CORRECT: Server-Sent Events (SSE)
async def event_generator(
    equipment_id: str,
) -> AsyncGenerator[str, None]:
    """Generate SSE events for equipment status."""
    try:
        async for event in equipment_event_stream(equipment_id):
            yield f"event: {event['type']}\n"
            yield f"data: {json.dumps(event['data'])}\n\n"
    except asyncio.CancelledError:
        # Client disconnected
        pass

@router.get("/equipment/{id}/events")
async def equipment_events(id: str):
    return StreamingResponse(
        event_generator(id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )

# ✅ CORRECT: Streaming large file downloads
async def file_streamer(file_path: Path, chunk_size: int = 64 * 1024):
    async with aiofiles.open(file_path, "rb") as f:
        while chunk := await f.read(chunk_size):
            yield chunk

@router.get("/reports/{id}/download")
async def download_report(id: UUID, session: SessionDep):
    report = await get_report_or_404(id, session)
    
    return StreamingResponse(
        file_streamer(report.file_path),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{report.filename}"',
        },
    )

# ✅ CORRECT: Streaming JSON arrays (for large datasets)
async def stream_json_array(
    items: AsyncGenerator[dict, None],
) -> AsyncGenerator[str, None]:
    yield "["
    first = True
    async for item in items:
        if not first:
            yield ","
        yield json.dumps(item)
        first = False
    yield "]"

@router.get("/assessments/export")
async def export_assessments(session: SessionDep):
    async def fetch_assessments():
        async for batch in fetch_assessments_batched(session, batch_size=100):
            for assessment in batch:
                yield assessment.model_dump()
    
    return StreamingResponse(
        stream_json_array(fetch_assessments()),
        media_type="application/json",
    )
```

---

## Pattern: File Uploads

**Problem:** Handling file uploads with validation, size limits, and proper storage.

```python
from fastapi import File, UploadFile, HTTPException
from pathlib import Path
import aiofiles
import hashlib

# ✅ CORRECT: File upload with validation
ALLOWED_TYPES = {"application/pdf", "image/png", "image/jpeg"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

async def validate_file(file: UploadFile) -> bytes:
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"File type {file.content_type} not allowed",
        )
    
    contents = await file.read()
    
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds {MAX_FILE_SIZE // 1024 // 1024}MB limit",
        )
    
    return contents

@router.post("/documents", response_model=DocumentRead, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    current_user: CurrentUser,
    session: SessionDep,
) -> DocumentRead:
    contents = await validate_file(file)
    
    # Generate unique filename with hash
    file_hash = hashlib.sha256(contents).hexdigest()[:16]
    ext = Path(file.filename).suffix
    filename = f"{file_hash}{ext}"
    file_path = UPLOAD_DIR / filename
    
    # Save file asynchronously
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(contents)
    
    # Save metadata to database
    document = Document(
        filename=file.filename,
        storage_path=str(file_path),
        content_type=file.content_type,
        size=len(contents),
        user_id=current_user.id,
    )
    session.add(document)
    await session.commit()
    await session.refresh(document)
    
    return document

# ✅ CORRECT: Multiple file upload
@router.post("/documents/batch")
async def upload_multiple(
    files: list[UploadFile] = File(...),
    current_user: CurrentUser,
    session: SessionDep,
):
    if len(files) > 10:
        raise HTTPException(400, "Maximum 10 files per upload")
    
    results = []
    for file in files:
        try:
            doc = await process_single_upload(file, current_user, session)
            results.append({"filename": file.filename, "status": "success", "id": doc.id})
        except Exception as e:
            results.append({"filename": file.filename, "status": "error", "error": str(e)})
    
    return {"results": results}
```

---

## Pattern: Health Checks and Readiness Probes

**Problem:** Kubernetes/container orchestration needs endpoint health verification.

```python
from enum import Enum

class HealthStatus(str, Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"

class ComponentHealth(BaseModel):
    status: HealthStatus
    latency_ms: float | None = None
    message: str | None = None

class HealthResponse(BaseModel):
    status: HealthStatus
    components: dict[str, ComponentHealth]
    version: str

# ✅ CORRECT: Liveness probe (is the process alive?)
@router.get("/health/live", response_model=dict)
async def liveness():
    """Simple liveness check - always returns 200 if process is running."""
    return {"status": "alive"}

# ✅ CORRECT: Readiness probe (can it handle traffic?)
@router.get("/health/ready", response_model=HealthResponse)
async def readiness(request: Request):
    """Check if all dependencies are available."""
    components = {}
    overall_status = HealthStatus.HEALTHY
    
    # Check database
    try:
        start = time.time()
        async with request.app.state.db_pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        latency = (time.time() - start) * 1000
        components["database"] = ComponentHealth(
            status=HealthStatus.HEALTHY,
            latency_ms=latency,
        )
    except Exception as e:
        components["database"] = ComponentHealth(
            status=HealthStatus.UNHEALTHY,
            message=str(e),
        )
        overall_status = HealthStatus.UNHEALTHY
    
    # Check Redis
    try:
        start = time.time()
        await request.app.state.redis.ping()
        latency = (time.time() - start) * 1000
        components["redis"] = ComponentHealth(
            status=HealthStatus.HEALTHY,
            latency_ms=latency,
        )
    except Exception as e:
        components["redis"] = ComponentHealth(
            status=HealthStatus.DEGRADED,  # Redis might be optional
            message=str(e),
        )
        if overall_status == HealthStatus.HEALTHY:
            overall_status = HealthStatus.DEGRADED
    
    response = HealthResponse(
        status=overall_status,
        components=components,
        version=settings.VERSION,
    )
    
    status_code = 200 if overall_status != HealthStatus.UNHEALTHY else 503
    return JSONResponse(content=response.model_dump(), status_code=status_code)

# ✅ CORRECT: Startup probe (has initialization completed?)
startup_complete = asyncio.Event()

@router.get("/health/startup")
async def startup_check():
    if startup_complete.is_set():
        return {"status": "started"}
    return JSONResponse(
        status_code=503,
        content={"status": "starting"},
    )
```

---

## Pattern: Rate Limiting

**Problem:** Prevent abuse and ensure fair resource usage.

```python
from fastapi import Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# ✅ CORRECT: Rate limiter setup
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/minute"],
    storage_uri="redis://localhost:6379",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ✅ CORRECT: Per-endpoint rate limits
@router.post("/auth/login")
@limiter.limit("5/minute")  # Stricter for auth endpoints
async def login(request: Request, credentials: LoginRequest):
    ...

@router.get("/assessments")
@limiter.limit("60/minute")
async def list_assessments(request: Request):
    ...

# ✅ CORRECT: Custom key function (per-user limiting)
def get_user_id(request: Request) -> str:
    """Extract user ID from token for per-user rate limiting."""
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        try:
            payload = decode_token(auth[7:])
            return payload.get("sub", get_remote_address(request))
        except Exception:
            pass
    return get_remote_address(request)

@router.post("/expensive-operation")
@limiter.limit("10/hour", key_func=get_user_id)
async def expensive_operation(request: Request):
    ...
```

---

## Pattern: Request Context and Structured Logging

**Problem:** Tracing requests through the system, debugging production issues.

```python
from contextvars import ContextVar
from uuid import uuid4
import structlog

# ✅ CORRECT: Request ID context
request_id_ctx: ContextVar[str] = ContextVar("request_id", default="")

# ✅ CORRECT: Middleware for request context
@app.middleware("http")
async def request_context_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid4()))
    request_id_ctx.set(request_id)
    
    # Add to structlog context
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(
        request_id=request_id,
        path=request.url.path,
        method=request.method,
    )
    
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    
    # Log request completion
    logger.info(
        "request_completed",
        status_code=response.status_code,
        duration_ms=round(duration * 1000, 2),
    )
    
    response.headers["X-Request-ID"] = request_id
    return response

# ✅ CORRECT: Logger configuration
def configure_logging():
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
    )

logger = structlog.get_logger()

# ✅ CORRECT: Usage in endpoints
@router.post("/assessments")
async def create_assessment(data: AssessmentCreate, session: SessionDep):
    logger.info("creating_assessment", title=data.title)
    
    assessment = Assessment(**data.model_dump())
    session.add(assessment)
    await session.commit()
    
    logger.info("assessment_created", assessment_id=str(assessment.id))
    return assessment
```

---

## Pattern: Database Transactions

**Problem:** Ensuring data consistency across multiple operations.

```python
from sqlalchemy.ext.asyncio import AsyncSession

# ✅ CORRECT: Automatic transaction with session
@router.post("/transfers")
async def create_transfer(
    data: TransferCreate,
    session: SessionDep,
):
    """Session auto-commits on success, rolls back on exception."""
    from_account = await get_account_or_404(data.from_account_id, session)
    to_account = await get_account_or_404(data.to_account_id, session)
    
    if from_account.balance < data.amount:
        raise HTTPException(400, "Insufficient balance")
    
    from_account.balance -= data.amount
    to_account.balance += data.amount
    
    transfer = Transfer(**data.model_dump())
    session.add(transfer)
    
    await session.commit()  # Both balance updates + transfer in one transaction
    return transfer

# ✅ CORRECT: Explicit transaction control
@router.post("/complex-operation")
async def complex_operation(session: SessionDep):
    async with session.begin():  # Explicit transaction block
        # All operations here are in one transaction
        result1 = await operation_1(session)
        result2 = await operation_2(session, result1)
        # Commits automatically at end of block
        # Rolls back if any exception

# ✅ CORRECT: Nested savepoints for partial rollback
@router.post("/batch-import")
async def batch_import(items: list[ItemCreate], session: SessionDep):
    results = []
    
    for item in items:
        try:
            async with session.begin_nested():  # Savepoint
                new_item = Item(**item.model_dump())
                session.add(new_item)
                await session.flush()
                results.append({"id": new_item.id, "status": "success"})
        except Exception as e:
            # Savepoint rolled back, but outer transaction continues
            results.append({"error": str(e), "status": "failed"})
    
    await session.commit()  # Commit successful items
    return {"results": results}

# ✅ CORRECT: Select for update (row locking)
@router.post("/counters/{id}/increment")
async def increment_counter(id: UUID, session: SessionDep):
    result = await session.execute(
        select(Counter)
        .where(Counter.id == id)
        .with_for_update()  # Lock row until transaction ends
    )
    counter = result.scalar_one_or_none()
    
    if not counter:
        raise HTTPException(404, "Counter not found")
    
    counter.value += 1
    await session.commit()
    return counter
```

---

## Pattern: Caching

**Problem:** Reduce database load and improve response times.

```python
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from fastapi_cache.decorator import cache

# ✅ CORRECT: Initialize cache in lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    redis = aioredis.from_url(REDIS_URL)
    FastAPICache.init(RedisBackend(redis), prefix="api-cache")
    yield
    await redis.close()

# ✅ CORRECT: Cache GET endpoints
@router.get("/assessments/{id}", response_model=AssessmentRead)
@cache(expire=60)  # Cache for 60 seconds
async def get_assessment(id: UUID, session: SessionDep):
    ...

# ✅ CORRECT: Custom cache key
def assessment_list_key_builder(
    func,
    namespace: str = "",
    *,
    request: Request,
    **kwargs,
):
    """Cache key includes query params."""
    return f"{namespace}:{func.__name__}:{request.url.query}"

@router.get("/assessments")
@cache(expire=30, key_builder=assessment_list_key_builder)
async def list_assessments(
    request: Request,
    status: str | None = None,
    page: int = 1,
):
    ...

# ✅ CORRECT: Invalidate cache on mutations
@router.post("/assessments", response_model=AssessmentRead)
async def create_assessment(
    data: AssessmentCreate,
    session: SessionDep,
):
    assessment = Assessment(**data.model_dump())
    session.add(assessment)
    await session.commit()
    
    # Invalidate list cache
    await FastAPICache.clear(namespace="assessment-list")
    
    return assessment

# ✅ CORRECT: Manual caching for complex scenarios
@router.get("/dashboard/stats")
async def get_dashboard_stats(request: Request):
    redis = request.app.state.redis
    cache_key = "dashboard:stats"
    
    # Try cache first
    cached = await redis.get(cache_key)
    if cached:
        return json.loads(cached)
    
    # Compute expensive stats
    stats = await compute_dashboard_stats()
    
    # Cache with TTL
    await redis.setex(cache_key, 300, json.dumps(stats))  # 5 min TTL
    
    return stats
```

---

## Pattern: Testing

**Problem:** Reliable, fast, isolated tests for API endpoints.

```python
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# ✅ CORRECT: Test database setup
@pytest.fixture
async def test_db():
    """Create a fresh database for each test."""
    engine = create_async_engine(
        "postgresql+asyncpg://test:test@localhost/test_db",
        echo=False,
    )
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()

@pytest.fixture
async def test_session(test_db):
    """Provide a transactional session that rolls back after each test."""
    async_session = sessionmaker(
        test_db, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        async with session.begin():
            yield session
            await session.rollback()

# ✅ CORRECT: Override dependencies for testing
@pytest.fixture
async def client(test_session):
    """HTTP client with overridden dependencies."""
    
    async def override_get_session():
        yield test_session
    
    async def override_get_current_user():
        return User(id=uuid4(), email="test@example.com", is_active=True)
    
    app.dependency_overrides[get_session] = override_get_session
    app.dependency_overrides[get_current_user] = override_get_current_user
    
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac
    
    app.dependency_overrides.clear()

# ✅ CORRECT: Test examples
@pytest.mark.asyncio
async def test_create_assessment(client: AsyncClient, test_session: AsyncSession):
    response = await client.post(
        "/api/assessments",
        json={
            "title": "Test Assessment",
            "description": "A test",
            "skill_areas": ["fundamentals"],
        },
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Assessment"
    assert "id" in data
    
    # Verify in database
    result = await test_session.execute(
        select(Assessment).where(Assessment.id == data["id"])
    )
    assessment = result.scalar_one()
    assert assessment.title == "Test Assessment"

@pytest.mark.asyncio
async def test_get_assessment_not_found(client: AsyncClient):
    response = await client.get(f"/api/assessments/{uuid4()}")
    
    assert response.status_code == 404
    assert response.json()["error_code"] == "ASSESSMENT_NOT_FOUND"

@pytest.mark.asyncio
async def test_create_assessment_validation_error(client: AsyncClient):
    response = await client.post(
        "/api/assessments",
        json={"title": "", "skill_areas": []},  # Invalid: empty title and areas
    )
    
    assert response.status_code == 422

# ✅ CORRECT: Testing WebSocket
@pytest.mark.asyncio
async def test_websocket_connection(client: AsyncClient):
    async with client.websocket_connect("/ws/test-client?token=valid") as ws:
        await ws.send_json({"type": "ping"})
        response = await ws.receive_json()
        assert response["type"] == "pong"

# ✅ CORRECT: Test fixtures for common data
@pytest.fixture
async def sample_assessment(test_session: AsyncSession):
    assessment = Assessment(
        title="Sample",
        description="For testing",
        skill_areas=["fundamentals"],
        user_id=uuid4(),
    )
    test_session.add(assessment)
    await test_session.flush()
    return assessment
```

---

## Pattern: API Versioning

**Problem:** Evolving APIs without breaking existing clients.

```python
# ✅ CORRECT: URL path versioning (most explicit)
from fastapi import APIRouter

v1_router = APIRouter(prefix="/api/v1")
v2_router = APIRouter(prefix="/api/v2")

# V1 endpoint
@v1_router.get("/assessments/{id}", response_model=AssessmentReadV1)
async def get_assessment_v1(id: UUID, session: SessionDep):
    ...

# V2 endpoint with breaking changes
@v2_router.get("/assessments/{id}", response_model=AssessmentReadV2)
async def get_assessment_v2(id: UUID, session: SessionDep):
    ...

app.include_router(v1_router)
app.include_router(v2_router)

# ✅ CORRECT: Header-based versioning
async def get_api_version(
    accept: str = Header(default="application/vnd.api+json; version=1"),
) -> int:
    """Extract version from Accept header."""
    match = re.search(r"version=(\d+)", accept)
    return int(match.group(1)) if match else 1

@router.get("/assessments/{id}")
async def get_assessment(
    id: UUID,
    version: int = Depends(get_api_version),
    session: SessionDep,
):
    assessment = await get_assessment_or_404(id, session)
    
    if version == 1:
        return AssessmentReadV1.model_validate(assessment)
    elif version == 2:
        return AssessmentReadV2.model_validate(assessment)
    else:
        raise HTTPException(400, f"Unsupported API version: {version}")
```

---

## Pattern: Route Ordering

**Problem:** FastAPI matches first route. Order matters for overlapping paths.

```python
# ❌ WRONG: Generic route before specific
@router.get("/users/{user_id}")  # This catches "me" as user_id!
async def get_user(user_id: str):
    ...

@router.get("/users/me")  # Never reached
async def get_current_user():
    ...

# ✅ CORRECT: Specific routes before generic
@router.get("/users/me")  # Specific first
async def get_current_user():
    ...

@router.get("/users/{user_id}")  # Generic after
async def get_user(user_id: UUID):  # UUID type also helps validate
    ...
```

**Remember:** Always define specific routes before generic parameterized routes.

---

## Pattern: Path and Query Parameters

```python
from fastapi import Path, Query
from enum import Enum

# Path parameter - required, part of URL identity
@router.get("/users/{user_id}")
async def get_user(
    user_id: UUID = Path(..., description="User's unique identifier"),
):
    ...

# Query parameters - filtering, pagination, sorting
@router.get("/assessments")
async def list_assessments(
    status: AssessmentStatus | None = Query(default=None, description="Filter by status"),
    q: str | None = Query(default=None, min_length=2, description="Search query"),
    skip: int = Query(default=0, ge=0, description="Number of records to skip"),
    limit: int = Query(default=20, ge=1, le=100, description="Maximum records to return"),
    sort_by: str = Query(default="created_at", regex="^(created_at|title|status)$"),
    sort_order: str = Query(default="desc", regex="^(asc|desc)$"),
):
    ...

# Enum for constrained values
class AssessmentStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"

# Multiple values for same parameter
@router.get("/assessments")
async def list_assessments(
    skill_areas: list[str] = Query(default=[]),  # ?skill_areas=a&skill_areas=b
):
    ...
```

---

## Pattern: Request Body Validation

```python
from pydantic import Field, field_validator, model_validator

class AssessmentCreate(SQLModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=1000)
    skill_areas: list[str] = Field(min_length=1, max_length=10)
    start_date: datetime
    end_date: datetime
    
    @field_validator("skill_areas")
    @classmethod
    def validate_skill_areas(cls, v: list[str]) -> list[str]:
        valid_areas = {"fundamentals", "advanced", "strategy"}
        for area in v:
            if area not in valid_areas:
                raise ValueError(f"Invalid skill area: {area}. Must be one of {valid_areas}")
        return v
    
    @model_validator(mode="after")
    def validate_dates(self) -> "AssessmentCreate":
        if self.end_date <= self.start_date:
            raise ValueError("end_date must be after start_date")
        return self

# Automatic validation - returns 422 on failure
@router.post("/assessments", response_model=AssessmentRead, status_code=201)
async def create_assessment(data: AssessmentCreate):
    ...
```

---

## Pattern: Middleware

**Problem:** Cross-cutting concerns like logging, CORS, timing.

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

app = FastAPI()

# CORS - add early (middleware order: last added = first executed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,  # ["http://localhost:3000"] or ["*"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "X-Process-Time"],
)

# GZip compression for responses > 500 bytes
app.add_middleware(GZipMiddleware, minimum_size=500)

# ✅ CORRECT: Custom middleware class
class TimingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.time()
        response = await call_next(request)
        duration = time.time() - start
        response.headers["X-Process-Time"] = f"{duration:.3f}"
        return response

app.add_middleware(TimingMiddleware)

# ✅ CORRECT: Middleware for trusted proxies
class TrustedHostMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Get real IP from X-Forwarded-For if behind proxy
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            request.state.client_ip = forwarded.split(",")[0].strip()
        else:
            request.state.client_ip = request.client.host
        return await call_next(request)
```

---

## Pattern: OpenAPI Schema

**Problem:** Schema affects frontend codegen. Keep it clean and accurate.

```python
from fastapi import FastAPI

app = FastAPI(
    title="SECS/GEM Simulator API",
    version="1.0.0",
    description="API for semiconductor equipment simulation",
    openapi_tags=[
        {"name": "Assessments", "description": "Skill assessment operations"},
        {"name": "Equipment", "description": "Equipment management"},
        {"name": "Messages", "description": "SECS-II message handling"},
    ],
)

# Good schema descriptions
class AssessmentCreate(SQLModel):
    """Create a new skill assessment."""
    
    title: str = Field(
        description="Assessment title shown to users",
        examples=["Q1 Safety Assessment"],
    )
    skill_areas: list[str] = Field(
        description="List of skill areas to assess",
        examples=[["fundamentals", "strategy"]],
    )

# Endpoint documentation
@router.post(
    "/assessments",
    response_model=AssessmentRead,
    status_code=201,
    summary="Create assessment",
    description="Creates a new skill assessment for the current user.",
    responses={
        201: {
            "description": "Assessment created successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": "550e8400-e29b-41d4-a716-446655440000",
                        "title": "Q1 Safety Assessment",
                    }
                }
            },
        },
        422: {"description": "Validation error"},
    },
    tags=["Assessments"],
)
async def create_assessment(data: AssessmentCreate):
    ...

# Hide internal endpoints from docs
@router.get("/internal/metrics", include_in_schema=False)
async def internal_metrics():
    ...
```

---

## Pattern: Router Organization

```python
# app/routers/assessments.py
from fastapi import APIRouter

router = APIRouter(
    prefix="/assessments",
    tags=["Assessments"],
    responses={404: {"description": "Not found"}},
)

@router.get("/")
async def list_assessments():
    ...

@router.post("/", status_code=201)
async def create_assessment():
    ...

@router.get("/{id}")
async def get_assessment(id: UUID):
    ...

# app/routers/__init__.py
from .assessments import router as assessments_router
from .users import router as users_router
from .equipment import router as equipment_router

# app/main.py
from app.routers import assessments_router, users_router, equipment_router

app.include_router(assessments_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(equipment_router, prefix="/api")
```

---

## References

- OpenAPI at `/docs` (Swagger UI) or `/redoc` (ReDoc) or `/openapi.json`
- FastAPI documentation: https://fastapi.tiangolo.com/
- Pydantic V2 documentation: https://docs.pydantic.dev/
- SQLModel documentation: https://sqlmodel.tiangolo.com/

---

## Common Issues

| Issue | Likely Cause | Solution |
|-------|--------------|----------|
| Wrong endpoint matched | Route ordering | Put specific routes before generic |
| Internal fields exposed | Missing response_model | Add `response_model=` parameter |
| 422 errors on valid input | Pydantic v2 strictness | Check field validators, types |
| CORS errors | Missing/wrong middleware | Add CORSMiddleware first |
| Frontend types wrong | Schema mismatch | Check OpenAPI, regenerate API client |
| Slow responses | Missing async, N+1 queries | Use async DB driver, optimize queries |
| Memory issues | Not streaming large data | Use StreamingResponse |
| Connection pool exhausted | Sessions not closed | Use dependency injection with `yield` |
| Background task failures | Session already closed | Create new session in background task |
| WebSocket auth fails | Token in query param | Validate before `accept()` |

---

## Detection Commands

```bash
# Find endpoints missing response_model
grep -rn "@router\." --include="*.py" | grep -v "response_model"

# Find potential route ordering issues
grep -rn "@router.get" --include="*.py" | grep -E '"/\w+/\{|"/\w+/\w+"'

# Check OpenAPI schema
curl http://localhost:8000/openapi.json | jq '.paths'

# Find sync functions in async context (potential blocking)
grep -rn "def " --include="*.py" api/ | grep -v "async def"

# Check for missing status codes on POST
grep -rn "@router.post" --include="*.py" | grep -v "status_code"

# Find endpoints without tags
grep -rn "APIRouter(" --include="*.py" | grep -v "tags="
```

---

## Quick Reference: Common Patterns

```python
# Standard CRUD endpoint signatures
@router.get("/items", response_model=list[ItemRead])
@router.get("/items/{id}", response_model=ItemRead)
@router.post("/items", response_model=ItemRead, status_code=201)
@router.put("/items/{id}", response_model=ItemRead)
@router.patch("/items/{id}", response_model=ItemRead)
@router.delete("/items/{id}", status_code=204)

# Standard dependency chain
SessionDep = Annotated[AsyncSession, Depends(get_session)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]

# Standard error raising
raise HTTPException(status_code=404, detail="Item not found")
raise DomainError("Custom error", "ERROR_CODE", 400)

# Standard pagination
page: int = Query(default=1, ge=1)
size: int = Query(default=20, ge=1, le=100)
```