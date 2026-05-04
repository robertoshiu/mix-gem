@echo off
REM Mix-GEM Development Stack Startup Script for Windows

setlocal enabledelayedexpansion

set COMPOSE_FILE=docker-compose.dev.yml
set ENV_FILE=.env.dev

REM Parse command
set COMMAND=%1
if "%COMMAND%"=="" set COMMAND=up

REM Shift arguments
shift

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker Desktop and try again.
    exit /b 1
)

REM Execute command
if "%COMMAND%"=="up" goto :start
if "%COMMAND%"=="down" goto :stop
if "%COMMAND%"=="restart" goto :restart
if "%COMMAND%"=="logs" goto :logs
if "%COMMAND%"=="ps" goto :ps
if "%COMMAND%"=="clean" goto :clean
if "%COMMAND%"=="help" goto :help
if "%COMMAND%"=="--help" goto :help
if "%COMMAND%"=="-h" goto :help

echo [ERROR] Unknown command: %COMMAND%
echo.
goto :help

:start
echo [INFO] Starting Mix-GEM Development Stack...
if not exist "%ENV_FILE%" (
    echo [WARNING] %ENV_FILE% not found. Using defaults...
)
docker-compose -f %COMPOSE_FILE% --env-file %ENV_FILE% up %*
goto :eof

:stop
echo [INFO] Stopping Mix-GEM Development Stack...
docker-compose -f %COMPOSE_FILE% --env-file %ENV_FILE% down
echo [SUCCESS] Services stopped
goto :eof

:restart
echo [INFO] Restarting Mix-GEM Development Stack...
docker-compose -f %COMPOSE_FILE% --env-file %ENV_FILE% down
docker-compose -f %COMPOSE_FILE% --env-file %ENV_FILE% up %*
goto :eof

:logs
docker-compose -f %COMPOSE_FILE% --env-file %ENV_FILE% logs -f
goto :eof

:ps
docker-compose -f %COMPOSE_FILE% --env-file %ENV_FILE% ps
goto :eof

:clean
echo [WARNING] This will remove ALL containers, volumes, and data!
set /p confirm="Are you sure? (yes/no): "
if /i "%confirm%"=="yes" (
    echo [INFO] Cleaning up...
    docker-compose -f %COMPOSE_FILE% --env-file %ENV_FILE% down -v --remove-orphans
    echo [SUCCESS] Cleanup complete
) else (
    echo [INFO] Cleanup cancelled
)
goto :eof

:help
echo Mix-GEM Development Stack
echo.
echo Usage: %0 [COMMAND] [OPTIONS]
echo.
echo Commands:
echo     up          Start all services (default)
echo     down        Stop all services
echo     restart     Restart all services
echo     logs        Show logs (tail -f)
echo     ps          Show running services
echo     clean       Stop and remove volumes (WARNING: deletes all data)
echo     help        Show this help message
echo.
echo Options:
echo     --build     Force rebuild of images
echo     -d          Run in detached mode
echo.
echo Examples:
echo     %0 up                  # Start all services
echo     %0 up -d               # Start in background
echo     %0 up --build          # Rebuild and start
echo     %0 logs                # View logs
echo     %0 down                # Stop services
echo     %0 clean               # Remove everything
echo.
echo Services and Ports:
echo     PostgreSQL         : 5432  (pgvector/pgvector:pg17)
echo     Redis              : 6379  (redis:7-alpine)
echo     Ollama             : 11434 (ollama/ollama:latest)
echo     RAG Engine         : 8001  (FastAPI)
echo     Scavenger API      : 8000  (FastAPI)
echo     SECS/GEM Simulator : 5000, 5001 (HSMS Passive/Active)
echo     Prometheus         : 9090  (Metrics)
echo     Grafana            : 3001  (Dashboards, admin/admin)
echo     pgAdmin            : 5050  (admin@mixgem.dev/admin)
echo     Redis Commander    : 8081  (Redis GUI)
echo.
echo Quick Access URLs:
echo     Grafana            : http://localhost:3001 (admin/admin)
echo     Prometheus         : http://localhost:9090
echo     pgAdmin            : http://localhost:5050 (admin@mixgem.dev/admin)
echo     Redis Commander    : http://localhost:8081
echo     Scavenger API      : http://localhost:8000/docs
echo     RAG Engine         : http://localhost:8001/docs
echo.
goto :eof
