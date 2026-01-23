# Dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy project files
COPY pyproject.toml .
COPY src/ src/

# Install package
RUN pip install --no-cache-dir -e .

# Expose ports
EXPOSE 8000 5000

# Run API server
CMD ["uvicorn", "scavenger.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
