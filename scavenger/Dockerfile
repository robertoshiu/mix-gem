# Dockerfile - Multi-stage build for Scavenger services
# Supports: api, simulator, recorder targets

# =============================================================================
# Base stage: Common dependencies
# =============================================================================
FROM python:3.12-slim AS base

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy project files
COPY pyproject.toml .
COPY src/ src/

# Install package
RUN pip install --no-cache-dir -e .

# =============================================================================
# API stage: FastAPI application server
# =============================================================================
FROM base AS api

# Expose API port
EXPOSE 8000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run API server
CMD ["uvicorn", "scavenger.api.main:app", "--host", "0.0.0.0", "--port", "8000"]

# =============================================================================
# Simulator stage: SECS/GEM equipment simulator
# =============================================================================
FROM base AS simulator

# Create scenarios directory
RUN mkdir -p /app/scenarios

# Expose HSMS ports
# 5000: Passive mode (equipment accepts connections from host)
# 5001: Active mode (equipment connects to host)
EXPOSE 5000 5001

# Health check: verify HSMS port is listening
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD python -c "import socket; s=socket.socket(); s.settimeout(1); s.connect(('localhost', 5000)); s.close()" || exit 1

# Run simulator (entrypoint will be added when CLI is implemented)
# For now, use a placeholder that keeps container running
CMD ["python", "-m", "scavenger.simulator.main"]

# =============================================================================
# Recorder stage: Message recording service
# =============================================================================
FROM base AS recorder

# Health check: verify Redis connectivity
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD python -c "import os; import redis; r=redis.from_url(os.environ.get('REDIS_URL', 'redis://localhost:6379/0')); r.ping()" || exit 1

# Run recorder service
CMD ["python", "-m", "scavenger.simulator.recorder.main"]

# =============================================================================
# Development stage: Full dev environment with test tools
# =============================================================================
FROM base AS dev

# Install dev dependencies
RUN pip install --no-cache-dir -e ".[dev]"

# Expose all ports
EXPOSE 8000 5000 5001

# Default to shell for interactive development
CMD ["/bin/bash"]
