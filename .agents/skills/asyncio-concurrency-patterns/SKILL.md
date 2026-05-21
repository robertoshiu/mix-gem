---
name: asyncio-concurrency-patterns
description: Complete guide for asyncio concurrency patterns including event loops, coroutines, tasks, futures, async context managers, error handling, sync/async bridging, and production-ready patterns
tags: [asyncio, concurrency, async, python, event-loop, coroutines, performance, aiohttp, production]
tier: tier-1
version: 2.0.0
python_version: "3.9+"
last_updated: 2025-10
---

# Asyncio Concurrency Patterns

A comprehensive skill for mastering Python's asyncio library and concurrent programming patterns. This skill covers event loops, coroutines, tasks, futures, synchronization primitives, async context managers, error handling, sync/async bridging, debugging, and production-ready patterns for building high-performance asynchronous applications.

## Quick Reference

### Essential Patterns at a Glance

```python
# 1. Run multiple coroutines concurrently
results = await asyncio.gather(coro1(), coro2(), coro3())

# 2. Limit concurrency with semaphore
sem = asyncio.Semaphore(10)
async with sem:
    await operation()

# 3. Create background task
task = asyncio.create_task(background_work())

# 4. Wait with timeout
async with asyncio.timeout(5.0):
    await slow_operation()

# 5. Run blocking code in executor
result = await loop.run_in_executor(None, blocking_func)

# 6. TaskGroup (Python 3.11+) - structured concurrency
async with asyncio.TaskGroup() as tg:
    tg.create_task(task1())
    tg.create_task(task2())
```

### Decision Tree: Which Pattern to Use?

| Scenario | Pattern | Example |
|----------|---------|---------|
| Run N tasks, need all results | `asyncio.gather()` | Fetch multiple URLs |
| Run N tasks, need first result | `asyncio.wait(FIRST_COMPLETED)` | Race multiple services |
| Limit concurrent operations | `asyncio.Semaphore` | Rate-limit API calls |
| Protect shared state | `asyncio.Lock` | Counter updates |
| Signal between coroutines | `asyncio.Event` | Ready notifications |
| Producer/consumer workflow | `asyncio.Queue` | Job processing |
| Run blocking I/O | `run_in_executor()` | File I/O, legacy libs |
| Run CPU-bound work | `ProcessPoolExecutor` | Data processing |

---

## When to Use This Skill

Use this skill when:

- Building I/O-bound applications that need to handle many concurrent operations
- Creating web servers, API clients, or websocket applications
- Implementing real-time systems with event-driven architecture
- Optimizing application performance with concurrent request handling
- Managing multiple async operations with proper coordination and error handling
- Building background task processors or job queues
- Implementing async database operations and connection pooling
- Creating chat applications, real-time dashboards, or notification systems
- Handling parallel HTTP requests efficiently
- Managing websocket connections with multiple event sources
- Building microservices with async communication patterns
- Bridging synchronous legacy code with async applications
- Implementing resilient services with retry logic and circuit breakers

---

## Core Concepts

### What is Asyncio?

Asyncio is Python's built-in library for writing concurrent code using the async/await syntax. It provides:

- **Event Loop**: The core scheduler that runs asynchronous tasks cooperatively
- **Coroutines**: Functions defined with `async def` that can be paused and resumed at `await` points
- **Tasks**: Scheduled coroutines that run concurrently within the event loop
- **Futures**: Low-level objects representing the eventual result of an async operation
- **Synchronization Primitives**: Locks, semaphores, events, and conditions for coordination

### The Event Loop Model

The event loop is the heart of asyncio's concurrency model. Unlike threading, asyncio uses cooperative multitasking where tasks voluntarily yield control at `await` points.

```python
import asyncio

# Modern approach (Python 3.7+) - recommended
async def main():
    print("Hello")
    await asyncio.sleep(1)
    print("World")

asyncio.run(main())
```

**Key Event Loop Concepts:**

1. **Single-threaded concurrency**: One thread manages many tasks, avoiding thread-safety issues
2. **Cooperative multitasking**: Tasks yield control at `await` points, not preemptively
3. **I/O multiplexing**: Efficiently waits on many I/O operations simultaneously
4. **Non-blocking operations**: While one task waits for I/O, others continue running

### Coroutines vs Regular Functions

The fundamental difference is that coroutines can pause execution and yield control back to the event loop:

```python
# Regular function - blocks until complete
def sync_fetch_data():
    import requests
    response = requests.get('http://api.example.com')  # Blocks thread!
    return response.json()

# Coroutine - yields control while waiting
async def async_fetch_data():
    import aiohttp
    async with aiohttp.ClientSession() as session:
        async with session.get('http://api.example.com') as resp:
            return await resp.json()  # Yields control during I/O
```

The coroutine version allows other tasks to run while waiting for the HTTP response, dramatically improving throughput for I/O-bound applications.

### Tasks and Futures

**Tasks** wrap coroutines and schedule them to run on the event loop:

```python
import asyncio

async def fetch_data():
    await asyncio.sleep(2)
    return "data"

async def main():
    # Create task - starts running immediately in background
    task = asyncio.create_task(fetch_data())
    
    # Do other work while task runs
    print("Task started, doing other work...")
    await asyncio.sleep(1)
    
    # Wait for result when needed
    result = await task
    print(f"Got result: {result}")

asyncio.run(main())
```

**Named Tasks (Python 3.8+)** help with debugging:

```python
task = asyncio.create_task(
    fetch_data(),
    name="fetch-user-data"
)
print(task.get_name())  # 'fetch-user-data'
```

**Futures** are lower-level objects that represent eventual results. You rarely create them directly, but tasks are built on top of futures:

```python
# Low-level future usage (rarely needed)
loop = asyncio.get_running_loop()
future = loop.create_future()

# Set result from somewhere
future.set_result(42)

# Await the result
result = await future  # Returns 42
```

---

## Concurrency Patterns

### Pattern 1: Gather - Run Coroutines Concurrently

`asyncio.gather()` runs multiple coroutines concurrently and returns results in order:

```python
import asyncio
import aiohttp

async def fetch(session: aiohttp.ClientSession, url: str) -> dict:
    """Fetch a URL and return result info."""
    async with session.get(url) as response:
        content = await response.text()
        return {
            'url': url,
            'status': response.status,
            'length': len(content)
        }

async def main():
    urls = [
        'http://python.org',
        'http://docs.python.org',
        'http://pypi.org'
    ]
    
    async with aiohttp.ClientSession() as session:
        # All fetches run concurrently
        results = await asyncio.gather(
            *[fetch(session, url) for url in urls]
        )
    
    # Results are in same order as inputs
    for result in results:
        print(f"{result['url']}: {result['status']}")

asyncio.run(main())
```

**Handling Exceptions with `return_exceptions=True`:**

```python
async def main():
    results = await asyncio.gather(
        successful_task(),
        failing_task(),      # Raises ValueError
        successful_task(),
        return_exceptions=True  # Don't raise, return exceptions
    )
    
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            print(f"Task {i} failed: {result}")
        else:
            print(f"Task {i} succeeded: {result}")
```

**When to use `gather()`:**
- You need all results and care about order
- You want fail-fast behavior (default) or graceful degradation (`return_exceptions=True`)
- Running a known set of coroutines concurrently

### Pattern 2: TaskGroup - Structured Concurrency (Python 3.11+)

TaskGroup provides structured concurrency with automatic cleanup and proper exception handling:

```python
import asyncio

async def process_item(item: int) -> int:
    await asyncio.sleep(0.1)
    if item == 3:
        raise ValueError(f"Bad item: {item}")
    return item * 2

async def main():
    results = []
    
    try:
        async with asyncio.TaskGroup() as tg:
            for i in range(5):
                # Tasks are automatically awaited when exiting the context
                task = tg.create_task(process_item(i))
                # Note: We can't easily get results this way
    except* ValueError as eg:
        # ExceptionGroup handling (Python 3.11+)
        print(f"Some tasks failed: {eg.exceptions}")
    
asyncio.run(main())
```

**TaskGroup vs Gather:**

| Feature | `gather()` | `TaskGroup` |
|---------|-----------|-------------|
| Exception handling | Returns or raises first | Collects all in ExceptionGroup |
| Cleanup on error | Manual cancellation needed | Automatic cancellation |
| Structured concurrency | No | Yes |
| Python version | 3.4+ | 3.11+ |

### Pattern 3: Wait - Flexible Waiting Strategies

`asyncio.wait()` gives fine-grained control over how to wait for tasks:

```python
import asyncio

async def task(name: str, delay: float):
    await asyncio.sleep(delay)
    return f"{name} complete"

async def main():
    tasks = [
        asyncio.create_task(task("A", 2)),
        asyncio.create_task(task("B", 1)),
        asyncio.create_task(task("C", 3))
    ]
    
    # Wait for FIRST to complete
    done, pending = await asyncio.wait(
        tasks,
        return_when=asyncio.FIRST_COMPLETED
    )
    
    # Get first result
    first = done.pop()
    print(f"First result: {first.result()}")
    
    # Cancel remaining tasks (optional)
    for task in pending:
        task.cancel()
    
    # Wait for cancellations to complete
    await asyncio.gather(*pending, return_exceptions=True)

asyncio.run(main())
```

**Wait Strategies:**

```python
# Wait for first completion
done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)

# Wait for first exception (or all complete if no exceptions)
done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_EXCEPTION)

# Wait for all (default)
done, pending = await asyncio.wait(tasks, return_when=asyncio.ALL_COMPLETED)

# Wait with timeout
done, pending = await asyncio.wait(tasks, timeout=5.0)
```

### Pattern 4: Semaphore - Limit Concurrency

Control the maximum number of concurrent operations to avoid overwhelming resources:

```python
import asyncio
import aiohttp

async def fetch_with_limit(
    session: aiohttp.ClientSession,
    url: str,
    semaphore: asyncio.Semaphore
) -> str:
    """Fetch URL with concurrency limit."""
    async with semaphore:
        # Only N requests run concurrently
        async with session.get(url) as resp:
            return await resp.text()

async def main():
    # Limit to 10 concurrent requests
    semaphore = asyncio.Semaphore(10)
    
    urls = [f'http://api.example.com/item/{i}' for i in range(100)]
    
    async with aiohttp.ClientSession() as session:
        tasks = [
            fetch_with_limit(session, url, semaphore)
            for url in urls
        ]
        results = await asyncio.gather(*tasks)
    
    print(f"Fetched {len(results)} URLs")

asyncio.run(main())
```

**When to use Semaphore:**
- Rate limiting API requests to respect quotas
- Controlling database connection usage
- Preventing resource exhaustion (memory, file handles)
- Respecting external service limits

### Pattern 5: Lock - Mutual Exclusion

Ensure only one coroutine accesses a shared resource at a time:

```python
import asyncio

class SharedCounter:
    """Thread-safe counter using asyncio Lock."""
    
    def __init__(self):
        self.value = 0
        self._lock = asyncio.Lock()
    
    async def increment(self):
        async with self._lock:
            # Critical section - only one coroutine at a time
            current = self.value
            await asyncio.sleep(0)  # Simulate async work
            self.value = current + 1
    
    async def get(self) -> int:
        async with self._lock:
            return self.value

async def worker(counter: SharedCounter, iterations: int):
    for _ in range(iterations):
        await counter.increment()

async def main():
    counter = SharedCounter()
    
    # Run 10 workers, each incrementing 100 times
    await asyncio.gather(*[
        worker(counter, 100) for _ in range(10)
    ])
    
    print(f"Final count: {await counter.get()}")  # Always 1000

asyncio.run(main())
```

**Important:** Even in async code, race conditions exist! Without the lock, the counter would be wrong because `await asyncio.sleep(0)` is a context switch point.

### Pattern 6: Event - Signaling Between Coroutines

Coordinate multiple coroutines with events:

```python
import asyncio

async def waiter(event: asyncio.Event, name: str):
    print(f"{name}: Waiting for event...")
    await event.wait()
    print(f"{name}: Event received!")

async def setter(event: asyncio.Event, delay: float):
    await asyncio.sleep(delay)
    print("Setting event!")
    event.set()

async def main():
    event = asyncio.Event()
    
    # Multiple waiters + one setter
    await asyncio.gather(
        waiter(event, "Waiter-1"),
        waiter(event, "Waiter-2"),
        waiter(event, "Waiter-3"),
        setter(event, 2.0)
    )

asyncio.run(main())
```

### Pattern 7: Queue - Producer/Consumer

Coordinate work between producers and consumers:

```python
import asyncio
from typing import Any

async def producer(queue: asyncio.Queue, producer_id: int, items: int):
    """Produce items to the queue."""
    for i in range(items):
        item = f"item-{producer_id}-{i}"
        await queue.put(item)
        print(f"Producer {producer_id}: produced {item}")
        await asyncio.sleep(0.1)
    
    # Signal this producer is done
    await queue.put(None)

async def consumer(queue: asyncio.Queue, consumer_id: int):
    """Consume items from the queue."""
    while True:
        item = await queue.get()
        
        if item is None:
            # Propagate sentinel to other consumers
            await queue.put(None)
            queue.task_done()
            break
        
        print(f"Consumer {consumer_id}: processing {item}")
        await asyncio.sleep(0.2)  # Simulate processing
        queue.task_done()

async def main():
    # Use maxsize for backpressure
    queue: asyncio.Queue[Any] = asyncio.Queue(maxsize=10)
    
    # Start producers and consumers
    await asyncio.gather(
        producer(queue, 1, 5),
        producer(queue, 2, 5),
        consumer(queue, 1),
        consumer(queue, 2),
        consumer(queue, 3)
    )

asyncio.run(main())
```

### Pattern 8: Condition - Complex Coordination

For more complex synchronization scenarios:

```python
import asyncio

async def consumer(condition: asyncio.Condition, data: list):
    async with condition:
        # Wait until data is available
        await condition.wait_for(lambda: len(data) > 0)
        item = data.pop(0)
        return item

async def producer(condition: asyncio.Condition, data: list):
    async with condition:
        data.append("new item")
        condition.notify()  # Wake one waiting consumer
        # condition.notify_all()  # Wake all waiting consumers
```

---

## aiohttp Patterns

### ClientSession Best Practices

**Critical Rule:** Always create `ClientSession` inside an async function, never at module level.

```python
import aiohttp
import asyncio

# ❌ WRONG - Session created outside event loop
# session = aiohttp.ClientSession()  # Can cause hangs!

# ✅ CORRECT - Session created inside async context
async def main():
    async with aiohttp.ClientSession() as session:
        async with session.get('http://python.org') as resp:
            print(await resp.text())

asyncio.run(main())
```

**Why?** The session binds to the event loop at creation time. If you create it at module level and later use a different event loop (e.g., in tests or with uvloop), the session becomes invalid.

### Connection Pooling

Configure connection pools for optimal performance:

```python
import aiohttp

# Configure connector with pool settings
connector = aiohttp.TCPConnector(
    limit=100,           # Total max connections
    limit_per_host=30,   # Max per host (prevents overwhelming one server)
    ttl_dns_cache=300,   # DNS cache TTL in seconds
    use_dns_cache=True,  # Enable DNS caching
    keepalive_timeout=30,  # Keep connections alive
    enable_cleanup_closed=True,  # Clean up closed connections
)

async with aiohttp.ClientSession(connector=connector) as session:
    # Use session with optimized connection handling
    pass
```

### Timeout Configuration

Always configure timeouts for production:

```python
import aiohttp

timeout = aiohttp.ClientTimeout(
    total=30,        # Total request timeout
    connect=10,      # Connection establishment timeout
    sock_read=10,    # Socket read timeout
    sock_connect=10, # Socket connect timeout
)

async with aiohttp.ClientSession(timeout=timeout) as session:
    try:
        async with session.get(url) as response:
            return await response.text()
    except asyncio.TimeoutError:
        print("Request timed out")
```

### Streaming Large Responses

Don't load large responses entirely into memory:

```python
async def download_file(session: aiohttp.ClientSession, url: str, dest: str):
    """Stream download a file without loading into memory."""
    async with session.get(url) as response:
        with open(dest, 'wb') as f:
            async for chunk in response.content.iter_chunked(8192):
                f.write(chunk)
```

### Proper Cleanup with Zero-Sleep

Allow underlying connections to close properly:

```python
async def fetch_and_cleanup():
    async with aiohttp.ClientSession() as session:
        async with session.get('http://example.org/') as resp:
            await resp.read()
    
    # Zero-sleep allows underlying connections to close cleanly
    await asyncio.sleep(0)
```

### WebSocket Client

```python
import aiohttp

async def websocket_client(url: str):
    async with aiohttp.ClientSession() as session:
        async with session.ws_connect(url) as ws:
            # Send message
            await ws.send_str("Hello!")
            
            # Receive messages
            async for msg in ws:
                if msg.type == aiohttp.WSMsgType.TEXT:
                    print(f"Received: {msg.data}")
                    if msg.data == "close":
                        break
                elif msg.type == aiohttp.WSMsgType.ERROR:
                    print(f"Error: {ws.exception()}")
                    break
```

### aiohttp Server with Middleware

```python
from aiohttp import web

@web.middleware
async def error_middleware(request, handler):
    """Global error handling middleware."""
    try:
        response = await handler(request)
        return response
    except web.HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        return web.json_response(
            {'error': str(e)},
            status=500
        )

@web.middleware
async def logging_middleware(request, handler):
    """Request logging middleware."""
    print(f"→ {request.method} {request.path}")
    response = await handler(request)
    print(f"← {response.status}")
    return response

async def handle_get(request):
    name = request.match_info.get('name', 'World')
    return web.json_response({'message': f'Hello, {name}'})

# Application setup
app = web.Application(middlewares=[
    logging_middleware,
    error_middleware
])
app.router.add_get('/', handle_get)
app.router.add_get('/{name}', handle_get)

if __name__ == '__main__':
    web.run_app(app, port=8080)
```

---

## Mixing Sync and Async Code

### Running Blocking Code from Async

Use `run_in_executor()` to run blocking code without blocking the event loop:

```python
import asyncio
from concurrent.futures import ThreadPoolExecutor

def blocking_io_operation(path: str) -> str:
    """Blocking file read."""
    with open(path) as f:
        return f.read()

async def async_read_file(path: str) -> str:
    """Run blocking file read in executor."""
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(
        None,  # Use default executor (ThreadPoolExecutor)
        blocking_io_operation,
        path
    )

async def main():
    content = await async_read_file("myfile.txt")
    print(content)

asyncio.run(main())
```

**For CPU-bound work, use `ProcessPoolExecutor`:**

```python
from concurrent.futures import ProcessPoolExecutor
import asyncio

def cpu_intensive(data):
    """CPU-bound computation."""
    return sum(x * x for x in range(data))

async def process_data(items: list[int]):
    loop = asyncio.get_running_loop()
    
    with ProcessPoolExecutor(max_workers=4) as executor:
        results = await asyncio.gather(*[
            loop.run_in_executor(executor, cpu_intensive, item)
            for item in items
        ])
    
    return results
```

### Decorator Pattern for Blocking Functions

```python
import asyncio
import functools
from typing import Callable, TypeVar

T = TypeVar('T')

def run_in_executor(func: Callable[..., T]) -> Callable[..., asyncio.coroutine]:
    """Decorator to run sync function in executor."""
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(
            None,
            functools.partial(func, *args, **kwargs)
        )
    return wrapper

@run_in_executor
def blocking_operation(x: int) -> int:
    """This blocking function can now be awaited."""
    import time
    time.sleep(1)
    return x * 2

async def main():
    result = await blocking_operation(21)
    print(result)  # 42
```

### Running Async Code from Sync

```python
import asyncio

async def async_function():
    await asyncio.sleep(1)
    return "done"

# From sync code - use asyncio.run()
def sync_wrapper():
    return asyncio.run(async_function())

# For Jupyter notebooks or nested event loops
# pip install nest-asyncio
import nest_asyncio
nest_asyncio.apply()
```

### Common Pitfalls When Mixing

```python
# ❌ DON'T: Call asyncio.run() from async code
async def bad():
    result = asyncio.run(other_async())  # RuntimeError!

# ✅ DO: Just await
async def good():
    result = await other_async()

# ❌ DON'T: Use time.sleep() in async code
async def bad():
    time.sleep(5)  # Blocks entire event loop!

# ✅ DO: Use asyncio.sleep()
async def good():
    await asyncio.sleep(5)

# ❌ DON'T: Use blocking I/O directly
async def bad():
    with open("file.txt") as f:  # Blocks!
        return f.read()

# ✅ DO: Use executor or async library
async def good():
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, read_file, "file.txt")

# ✅ BETTER: Use async file library
import aiofiles
async def better():
    async with aiofiles.open("file.txt") as f:
        return await f.read()
```

---

## Error Handling Patterns

### Retry with Exponential Backoff

```python
import asyncio
import random
from typing import TypeVar, Callable, Awaitable

T = TypeVar("T")

async def retry_with_backoff(
    func: Callable[[], Awaitable[T]],
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    exponential_base: float = 2.0,
    jitter: bool = True,
    retryable_exceptions: tuple = (Exception,),
) -> T:
    """
    Retry async function with exponential backoff.
    
    The delay doubles after each failure, with optional jitter
    to prevent thundering herd problems.
    """
    last_exception = None
    
    for attempt in range(max_retries + 1):
        try:
            return await func()
        except retryable_exceptions as e:
            last_exception = e
            
            if attempt == max_retries:
                raise
            
            # Calculate delay with exponential backoff
            delay = min(
                base_delay * (exponential_base ** attempt),
                max_delay
            )
            
            # Add jitter (±25%) to prevent synchronized retries
            if jitter:
                delay *= 0.75 + random.random() * 0.5
            
            print(f"Attempt {attempt + 1} failed: {e}. Retrying in {delay:.1f}s...")
            await asyncio.sleep(delay)
    
    raise last_exception  # Should never reach here

# Usage
async def fetch_with_retry(url: str) -> str:
    import aiohttp
    
    async def fetch():
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as resp:
                resp.raise_for_status()
                return await resp.text()
    
    return await retry_with_backoff(
        fetch,
        max_retries=3,
        retryable_exceptions=(aiohttp.ClientError, asyncio.TimeoutError)
    )
```

### Retry Decorator

```python
import functools
from typing import Type

def async_retry(
    max_retries: int = 3,
    base_delay: float = 1.0,
    exceptions: tuple[Type[Exception], ...] = (Exception,)
):
    """Decorator for async retry with backoff."""
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            return await retry_with_backoff(
                lambda: func(*args, **kwargs),
                max_retries=max_retries,
                base_delay=base_delay,
                retryable_exceptions=exceptions
            )
        return wrapper
    return decorator

@async_retry(max_retries=3, exceptions=(ConnectionError,))
async def fetch_data(url: str) -> dict:
    # Automatically retries on ConnectionError
    pass
```

### Circuit Breaker

Prevent cascading failures by failing fast when a service is down:

```python
import asyncio
import time
from enum import Enum
from dataclasses import dataclass

class CircuitState(Enum):
    CLOSED = "closed"       # Normal operation
    OPEN = "open"           # Failing fast, rejecting calls
    HALF_OPEN = "half_open" # Testing if service recovered

@dataclass
class CircuitBreakerConfig:
    failure_threshold: int = 5      # Failures before opening
    success_threshold: int = 3      # Successes to close from half-open
    timeout: float = 60.0           # Seconds before trying half-open

class CircuitBreakerOpen(Exception):
    """Raised when circuit breaker is open."""
    pass

class CircuitBreaker:
    """
    Circuit breaker pattern for protecting against cascading failures.
    
    States:
    - CLOSED: Normal operation, tracking failures
    - OPEN: Rejecting calls immediately, waiting for timeout
    - HALF_OPEN: Testing with limited calls to see if service recovered
    """
    
    def __init__(self, config: CircuitBreakerConfig | None = None):
        self.config = config or CircuitBreakerConfig()
        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._success_count = 0
        self._last_failure_time: float = 0
        self._lock = asyncio.Lock()
    
    @property
    def state(self) -> CircuitState:
        return self._state
    
    async def call(self, func, *args, **kwargs):
        """Execute function through circuit breaker."""
        async with self._lock:
            self._check_state_transition()
            
            if self._state == CircuitState.OPEN:
                raise CircuitBreakerOpen(
                    f"Circuit open, retry after {self._retry_after():.1f}s"
                )
        
        try:
            result = await func(*args, **kwargs)
            await self._record_success()
            return result
        except Exception as e:
            await self._record_failure()
            raise
    
    def _check_state_transition(self):
        """Check if state should transition based on timeout."""
        if self._state == CircuitState.OPEN:
            if time.time() - self._last_failure_time >= self.config.timeout:
                self._state = CircuitState.HALF_OPEN
                self._success_count = 0
                print("Circuit breaker: OPEN → HALF_OPEN")
    
    async def _record_success(self):
        async with self._lock:
            self._failure_count = 0
            
            if self._state == CircuitState.HALF_OPEN:
                self._success_count += 1
                if self._success_count >= self.config.success_threshold:
                    self._state = CircuitState.CLOSED
                    print("Circuit breaker: HALF_OPEN → CLOSED (recovered)")
    
    async def _record_failure(self):
        async with self._lock:
            self._failure_count += 1
            self._last_failure_time = time.time()
            
            if self._state == CircuitState.HALF_OPEN:
                self._state = CircuitState.OPEN
                print("Circuit breaker: HALF_OPEN → OPEN (still failing)")
            elif self._failure_count >= self.config.failure_threshold:
                self._state = CircuitState.OPEN
                print("Circuit breaker: CLOSED → OPEN (threshold reached)")
    
    def _retry_after(self) -> float:
        elapsed = time.time() - self._last_failure_time
        return max(0, self.config.timeout - elapsed)
```

### Fallback Pattern

```python
from typing import TypeVar, Callable, Awaitable

T = TypeVar("T")

async def with_fallback(
    primary: Callable[[], Awaitable[T]],
    fallback: Callable[[], Awaitable[T]],
    exceptions: tuple = (Exception,)
) -> T:
    """Try primary function, fall back on failure."""
    try:
        return await primary()
    except exceptions as e:
        print(f"Primary failed ({e}), using fallback")
        return await fallback()

# Usage
result = await with_fallback(
    lambda: fetch_from_api(),
    lambda: fetch_from_cache(),
    exceptions=(ConnectionError, TimeoutError)
)
```

### Bulkhead Pattern

Isolate failures by limiting concurrent access to a resource:

```python
class Bulkhead:
    """
    Bulkhead pattern to isolate failures.
    Limits concurrent calls to protect resources.
    """
    
    def __init__(
        self,
        max_concurrent: int,
        max_waiting: int = 0,
        timeout: float | None = None
    ):
        self._semaphore = asyncio.Semaphore(max_concurrent)
        self._max_waiting = max_waiting
        self._waiting = 0
        self._timeout = timeout
        self._lock = asyncio.Lock()
    
    async def call(self, func, *args, **kwargs):
        """Execute function within bulkhead limits."""
        async with self._lock:
            if self._waiting >= self._max_waiting:
                raise BulkheadFull("Bulkhead queue full")
            self._waiting += 1
        
        try:
            if self._timeout:
                async with asyncio.timeout(self._timeout):
                    async with self._semaphore:
                        return await func(*args, **kwargs)
            else:
                async with self._semaphore:
                    return await func(*args, **kwargs)
        finally:
            async with self._lock:
                self._waiting -= 1

class BulkheadFull(Exception):
    """Raised when bulkhead cannot accept more calls."""
    pass

# Usage - isolate external API calls
api_bulkhead = Bulkhead(
    max_concurrent=10,  # Max 10 concurrent calls
    max_waiting=50,     # Max 50 in queue
    timeout=30.0        # 30s timeout
)

async def call_external_api(data):
    return await api_bulkhead.call(http_client.post, "/api", json=data)
```

---

## Debugging Async Code

### Enable Debug Mode

Debug mode catches common mistakes like unawaited coroutines:

```python
import asyncio

# Option 1: Pass debug=True to asyncio.run()
asyncio.run(main(), debug=True)

# Option 2: Environment variable
# PYTHONASYNCIODEBUG=1 python script.py

# Option 3: On running loop
loop = asyncio.get_running_loop()
loop.set_debug(True)
```

**What debug mode detects:**
- Coroutines that were never awaited
- Callbacks taking too long (>100ms by default)
- Resources not properly closed
- Tasks destroyed while pending

### Finding Slow Callbacks

```python
import asyncio
import logging

# Enable asyncio debug logging
logging.getLogger("asyncio").setLevel(logging.DEBUG)

# Custom slow callback threshold
async def main():
    loop = asyncio.get_running_loop()
    loop.slow_callback_duration = 0.05  # 50ms threshold
    loop.set_debug(True)
    
    await my_application()

asyncio.run(main())
```

### Task Introspection

```python
import asyncio

async def debug_tasks():
    # Get all currently running tasks
    all_tasks = asyncio.all_tasks()
    print(f"Total tasks: {len(all_tasks)}")
    
    for task in all_tasks:
        print(f"Task: {task.get_name()}")
        print(f"  Done: {task.done()}")
        print(f"  Cancelled: {task.cancelled()}")
        
        # Get stack frames for running tasks
        if not task.done():
            for frame in task.get_stack():
                print(f"  at {frame.f_code.co_filename}:{frame.f_lineno}")

# Get current task
current = asyncio.current_task()
```

### Common Issues and Solutions

**Issue: "Task was destroyed but it is pending"**

```python
# ❌ WRONG - orphaned task
async def bad():
    asyncio.create_task(background_work())  # Lost reference!

# ✅ CORRECT - track tasks
background_tasks = set()

async def good():
    task = asyncio.create_task(background_work())
    background_tasks.add(task)
    task.add_done_callback(background_tasks.discard)
```

**Issue: "Event loop is closed"**

```python
# ❌ WRONG - reusing closed loop
loop = asyncio.get_event_loop()
loop.run_until_complete(coro1())
loop.close()
loop.run_until_complete(coro2())  # Error!

# ✅ CORRECT - use asyncio.run() (creates new loop each time)
asyncio.run(coro1())
asyncio.run(coro2())
```

**Issue: Program hangs (blocked event loop)**

```python
# Find the blocking call by enabling debug mode
async def debug_blocking():
    loop = asyncio.get_running_loop()
    loop.slow_callback_duration = 0.001  # 1ms threshold
    loop.set_debug(True)
    
    # Debug logging will show slow callbacks
    await your_code()
```

### Profiling with yappi (async-aware)

```python
# pip install yappi
import yappi
import asyncio

yappi.set_clock_type("wall")  # For async code (not CPU time)
yappi.start()

asyncio.run(main())

yappi.stop()

# Print statistics
func_stats = yappi.get_func_stats()
func_stats.print_all()

# Filter to only async functions
asyncio_stats = yappi.get_func_stats(
    filter_callback=lambda x: asyncio.iscoroutinefunction(x.full_name)
)
```

---

## Performance Optimization

### uvloop - High-Performance Event Loop

uvloop is a drop-in replacement for asyncio's event loop, providing 2-4x performance improvement:

```python
# pip install uvloop

# Option 1: Install globally (before any asyncio calls)
import uvloop
uvloop.install()

import asyncio

async def main():
    # Now using uvloop automatically
    pass

asyncio.run(main())

# Option 2: Use explicitly with Runner (Python 3.11+)
import asyncio
import uvloop

async def main():
    pass

with asyncio.Runner(loop_factory=uvloop.new_event_loop) as runner:
    runner.run(main())

# Option 3: Graceful fallback
def get_event_loop_policy():
    try:
        import uvloop
        return uvloop.EventLoopPolicy()
    except ImportError:
        return asyncio.DefaultEventLoopPolicy()

asyncio.set_event_loop_policy(get_event_loop_policy())
```

### Connection Pool Sizing

| Service Type | Min Size | Max Size | Notes |
|--------------|----------|----------|-------|
| Database (heavy) | 10 | 50 | Match CPU cores × 2-4 |
| Database (light) | 5 | 20 | Standard web apps |
| HTTP external API | N/A | 100 | Limited by rate limits |
| HTTP per-host | N/A | 30 | Prevent overwhelming |
| Redis | 10 | 50 | Very fast, less critical |

### Request Batching

Combine multiple requests into single operations for efficiency:

```python
import asyncio
from typing import TypeVar, Callable

T = TypeVar("T")

class BatchProcessor:
    """Batch multiple individual requests into single operations."""
    
    def __init__(
        self,
        batch_func: Callable[[list[str]], dict[str, T]],
        max_batch_size: int = 100,
        max_delay: float = 0.01  # 10ms
    ):
        self._batch_func = batch_func
        self._max_batch_size = max_batch_size
        self._max_delay = max_delay
        self._pending: dict[str, asyncio.Future] = {}
        self._batch: list[str] = []
        self._lock = asyncio.Lock()
        self._timer: asyncio.Task | None = None
    
    async def get(self, key: str) -> T:
        """Get single item (batched with other requests)."""
        async with self._lock:
            if key in self._pending:
                return await self._pending[key]
            
            future = asyncio.get_event_loop().create_future()
            self._pending[key] = future
            self._batch.append(key)
            
            if len(self._batch) >= self._max_batch_size:
                await self._flush()
            elif not self._timer:
                self._timer = asyncio.create_task(self._delayed_flush())
        
        return await future
    
    async def _delayed_flush(self):
        await asyncio.sleep(self._max_delay)
        async with self._lock:
            await self._flush()
    
    async def _flush(self):
        if not self._batch:
            return
        
        batch = self._batch
        pending = self._pending
        self._batch = []
        self._pending = {}
        self._timer = None
        
        try:
            results = await self._batch_func(batch)
            for key in batch:
                if key in results:
                    pending[key].set_result(results[key])
                else:
                    pending[key].set_exception(KeyError(key))
        except Exception as e:
            for key in batch:
                pending[key].set_exception(e)

# Usage
async def batch_fetch_users(user_ids: list[str]) -> dict[str, dict]:
    # Single database query for multiple users
    return {u['id']: u for u in await db.fetch_users(user_ids)}

user_batcher = BatchProcessor(batch_fetch_users, max_batch_size=50)

# These calls get batched together:
user1, user2 = await asyncio.gather(
    user_batcher.get("user-1"),
    user_batcher.get("user-2")
)
```

### Performance Checklist

- [ ] **uvloop installed and configured** - 2-4x throughput improvement
- [ ] **Connection pools properly sized** - Match workload patterns
- [ ] **Timeouts on all external calls** - Prevent hung connections
- [ ] **Semaphores limiting concurrency** - Prevent resource exhaustion
- [ ] **Large responses streamed** - Don't load into memory
- [ ] **DNS caching enabled** - Reduce DNS lookup latency
- [ ] **Connection keep-alive configured** - Reuse connections
- [ ] **Profiling in place for hot paths** - Identify bottlenecks

---

## Production Patterns

### Graceful Shutdown

Handle shutdown signals properly to finish in-flight work:

```python
import asyncio
import signal
from contextlib import suppress

class GracefulShutdown:
    """Handle graceful shutdown with signal handlers."""
    
    def __init__(self):
        self._shutdown = asyncio.Event()
        self._tasks: set[asyncio.Task] = set()
    
    @property
    def should_exit(self) -> bool:
        return self._shutdown.is_set()
    
    async def wait_for_shutdown(self):
        """Block until shutdown signal received."""
        await self._shutdown.wait()
    
    def trigger_shutdown(self):
        """Signal shutdown to all waiting coroutines."""
        self._shutdown.set()
    
    def register_task(self, task: asyncio.Task):
        """Track task for cleanup on shutdown."""
        self._tasks.add(task)
        task.add_done_callback(self._tasks.discard)
    
    async def cleanup(self, timeout: float = 30.0):
        """Cancel and await all tracked tasks."""
        for task in self._tasks:
            task.cancel()
        
        if self._tasks:
            await asyncio.wait(
                self._tasks,
                timeout=timeout,
                return_when=asyncio.ALL_COMPLETED
            )

async def main():
    shutdown = GracefulShutdown()
    loop = asyncio.get_running_loop()
    
    # Register signal handlers
    for sig in (signal.SIGTERM, signal.SIGINT):
        loop.add_signal_handler(sig, shutdown.trigger_shutdown)
    
    try:
        # Start background workers
        worker = asyncio.create_task(background_worker(shutdown))
        shutdown.register_task(worker)
        
        # Run until shutdown
        await shutdown.wait_for_shutdown()
    finally:
        print("Shutting down gracefully...")
        await shutdown.cleanup(timeout=30.0)
        
        # Remove signal handlers
        for sig in (signal.SIGTERM, signal.SIGINT):
            loop.remove_signal_handler(sig)

async def background_worker(shutdown: GracefulShutdown):
    """Worker that respects shutdown signals."""
    while not shutdown.should_exit:
        try:
            await process_next_item()
        except asyncio.CancelledError:
            await finish_current_work()  # Complete in-progress work
            raise
```

### Health Check Probes

Implement Kubernetes-style liveness and readiness probes:

```python
import asyncio
from dataclasses import dataclass
from enum import Enum

class HealthStatus(str, Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"

@dataclass
class ComponentHealth:
    name: str
    status: HealthStatus
    latency_ms: float | None = None
    error: str | None = None

class HealthProbes:
    """Kubernetes-style health probes."""
    
    def __init__(self):
        self._ready = asyncio.Event()
        self._alive = True
    
    def set_ready(self):
        """Mark application as ready to receive traffic."""
        self._ready.set()
    
    def set_not_ready(self):
        """Mark application as not ready (drain traffic)."""
        self._ready.clear()
    
    def set_not_alive(self):
        """Mark application as dead (trigger restart)."""
        self._alive = False
    
    async def liveness(self) -> bool:
        """
        Liveness probe - is the process healthy?
        Failing this triggers a container restart.
        """
        return self._alive
    
    async def readiness(self) -> bool:
        """
        Readiness probe - can the app handle traffic?
        Failing this removes the pod from service.
        """
        return self._ready.is_set()

async def check_database(pool) -> ComponentHealth:
    """Check database connectivity."""
    try:
        start = asyncio.get_event_loop().time()
        async with pool.acquire() as conn:
            await conn.execute("SELECT 1")
        latency = (asyncio.get_event_loop().time() - start) * 1000
        return ComponentHealth("database", HealthStatus.HEALTHY, latency)
    except Exception as e:
        return ComponentHealth("database", HealthStatus.UNHEALTHY, error=str(e))
```

### Background Tasks with Application Lifecycle

```python
import asyncio
from contextlib import suppress
from aiohttp import web

async def listen_to_redis(app):
    """Background task that listens to Redis."""
    try:
        while True:
            message = await app['redis'].get_message()
            if message:
                await process_message(message)
    except asyncio.CancelledError:
        print("Redis listener stopped")
        raise

async def background_tasks(app):
    """Cleanup context for managing background tasks."""
    # Startup: Create background task
    app['redis_listener'] = asyncio.create_task(
        listen_to_redis(app)
    )
    
    yield  # Application is running
    
    # Cleanup: Cancel background task
    app['redis_listener'].cancel()
    with suppress(asyncio.CancelledError):
        await app['redis_listener']

# Setup application
app = web.Application()
app.cleanup_ctx.append(background_tasks)
```

### Periodic Tasks

```python
async def periodic_task(
    interval: float,
    func,
    shutdown_event: asyncio.Event | None = None
):
    """Run a coroutine periodically."""
    while True:
        if shutdown_event and shutdown_event.is_set():
            break
        
        try:
            await func()
        except asyncio.CancelledError:
            raise
        except Exception as e:
            print(f"Periodic task error: {e}")
        
        # Wait for interval or shutdown
        if shutdown_event:
            try:
                await asyncio.wait_for(
                    shutdown_event.wait(),
                    timeout=interval
                )
                break  # Shutdown signaled
            except asyncio.TimeoutError:
                pass  # Continue loop
        else:
            await asyncio.sleep(interval)
```

### WebSocket with Multiple Event Sources

Handle WebSocket messages alongside background events:

```python
import asyncio
from aiohttp import web

async def read_subscription(ws, redis):
    """Background task sending Redis events to WebSocket."""
    channel = await redis.subscribe('events')
    try:
        async for message in channel:
            await ws.send_str(message)
    finally:
        await redis.unsubscribe('events')

async def websocket_handler(request):
    """WebSocket handler with parallel event sources."""
    ws = web.WebSocketResponse()
    await ws.prepare(request)
    
    # Background task for Redis subscription
    redis = request.app['redis']
    task = asyncio.create_task(read_subscription(ws, redis))
    
    try:
        # Handle incoming WebSocket messages
        async for msg in ws:
            if msg.type == web.WSMsgType.TEXT:
                await ws.send_str(f"Echo: {msg.data}")
            elif msg.type == web.WSMsgType.ERROR:
                print(f"WebSocket error: {ws.exception()}")
    finally:
        # Always cleanup background task
        task.cancel()
        with suppress(asyncio.CancelledError):
            await task
    
    return ws
```

---

## Testing Async Code

### pytest-asyncio

```python
import pytest
import asyncio

@pytest.mark.asyncio
async def test_async_function():
    result = await async_operation()
    assert result == "expected"

@pytest.mark.asyncio
async def test_with_timeout():
    with pytest.raises(asyncio.TimeoutError):
        async with asyncio.timeout(0.1):
            await slow_function()

@pytest.mark.asyncio
async def test_aiohttp_client(aiohttp_client):
    """Test aiohttp application."""
    client = await aiohttp_client(create_app())
    resp = await client.get('/')
    assert resp.status == 200
```

### Mocking Async Functions

```python
from unittest.mock import AsyncMock, patch

@pytest.mark.asyncio
async def test_with_mock():
    # Create async mock
    mock = AsyncMock(return_value="mocked")
    
    result = await mock()
    assert result == "mocked"
    mock.assert_awaited_once()

@pytest.mark.asyncio
async def test_patch_async():
    with patch('module.async_function', new_callable=AsyncMock) as mock:
        mock.return_value = {"data": "mocked"}
        
        result = await function_under_test()
        
        assert result == {"data": "mocked"}
```

### Testing Event Loop Utilities

```python
from aiohttp.test_utils import unused_port, loop_context

def test_with_loop_context():
    with loop_context() as loop:
        result = loop.run_until_complete(async_operation())
        assert result == "expected"

def test_get_unused_port():
    port = unused_port()
    # Use port for test server
```

---

## Common Pitfalls

### Pitfall 1: Creating ClientSession Outside Event Loop

```python
# ❌ BAD - Session binds to event loop at creation
session = aiohttp.ClientSession()  # Created at import time!

# ✅ GOOD - Create inside async function
async def main():
    async with aiohttp.ClientSession() as session:
        await fetch(session, url)
```

### Pitfall 2: Forgetting await

```python
# ❌ BAD - Returns coroutine object, doesn't execute!
result = fetch_data()  # Missing await

# ✅ GOOD
result = await fetch_data()
```

### Pitfall 3: Blocking the Event Loop

```python
# ❌ BAD - Blocks all tasks for 5 seconds
time.sleep(5)

# ✅ GOOD - Yields control to other tasks
await asyncio.sleep(5)

# For blocking I/O, use executor
await loop.run_in_executor(None, blocking_function)
```

### Pitfall 4: Not Handling Cancellation

```python
# ❌ BAD - No cleanup on cancellation
async def bad_task():
    while True:
        await asyncio.sleep(1)
        process_data()

# ✅ GOOD - Proper cleanup
async def good_task():
    try:
        while True:
            await asyncio.sleep(1)
            process_data()
    except asyncio.CancelledError:
        await cleanup()  # Clean up resources
        raise  # Re-raise to mark as cancelled
```

### Pitfall 5: Orphaned Tasks

```python
# ❌ BAD - Task reference lost, "Task was destroyed but pending"
async def bad():
    asyncio.create_task(background_work())

# ✅ GOOD - Track all tasks
background_tasks = set()

async def good():
    task = asyncio.create_task(background_work())
    background_tasks.add(task)
    task.add_done_callback(background_tasks.discard)
```

### Pitfall 6: Deadlocks with Locks

```python
# ❌ BAD - Potential deadlock (different acquisition order)
async def task_a():
    async with lock1:
        async with lock2:
            pass

async def task_b():
    async with lock2:  # Different order!
        async with lock1:
            pass

# ✅ GOOD - Always acquire in same order
async def task_a():
    async with lock1:
        async with lock2:
            pass

async def task_b():
    async with lock1:  # Same order
        async with lock2:
            pass
```

---

## Resources

- **Python asyncio Documentation**: https://docs.python.org/3/library/asyncio.html
- **aiohttp Documentation**: https://docs.aiohttp.org/
- **Real Python asyncio Guide**: https://realpython.com/async-io-python/
- **PEP 492 - Coroutines with async and await**: https://peps.python.org/pep-0492/
- **uvloop**: https://github.com/MagicStack/uvloop
- **pytest-asyncio**: https://github.com/pytest-dev/pytest-asyncio

---

**Skill Version**: 2.0.0  
**Last Updated**: October 2025  
**Skill Category**: Concurrency, Performance, Async Programming  
**Compatible With**: Python 3.9+, aiohttp, asyncio, uvloop  
**Documentation Sources**: Python docs, aiohttp docs, Context7 library patterns