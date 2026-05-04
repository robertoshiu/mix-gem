#!/bin/bash

# Mix-GEM Development Stack Startup Script
# Starts all services in development mode with sensible defaults

set -e

COMPOSE_FILE="docker-compose.dev.yml"
ENV_FILE=".env.dev"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Function to check if docker-compose is available
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        print_error "docker-compose not found. Please install docker-compose."
        exit 1
    fi
    print_success "docker-compose is available"
}

# Function to display help
show_help() {
    cat << EOF
Mix-GEM Development Stack

Usage: $0 [COMMAND] [OPTIONS]

Commands:
    up          Start all services (default)
    down        Stop all services
    restart     Restart all services
    logs        Show logs (tail -f)
    ps          Show running services
    clean       Stop and remove volumes (WARNING: deletes all data)
    help        Show this help message

Options:
    --build     Force rebuild of images
    -d          Run in detached mode

Examples:
    $0 up                  # Start all services
    $0 up -d               # Start in background
    $0 up --build          # Rebuild and start
    $0 logs                # View logs
    $0 down                # Stop services
    $0 clean               # Remove everything

Services and Ports:
    PostgreSQL         : 5432  (pgvector/pgvector:pg17)
    Redis              : 6379  (redis:7-alpine)
    Ollama             : 11434 (ollama/ollama:latest)
    RAG Engine         : 8001  (FastAPI)
    Scavenger API      : 8000  (FastAPI)
    SECS/GEM Simulator : 5000, 5001 (HSMS Passive/Active)
    Prometheus         : 9090  (Metrics)
    Grafana            : 3001  (Dashboards, admin/admin)
    pgAdmin            : 5050  (admin@mixgem.dev/admin)
    Redis Commander    : 8081  (Redis GUI)
    Node Exporter      : 9100  (System metrics)
    Postgres Exporter  : 9187  (DB metrics)
    Redis Exporter     : 9121  (Redis metrics)
    cAdvisor           : 8080  (Container metrics)

Quick Access URLs:
    Grafana            : http://localhost:3001 (admin/admin)
    Prometheus         : http://localhost:9090
    pgAdmin            : http://localhost:5050 (admin@mixgem.dev/admin)
    Redis Commander    : http://localhost:8081
    Scavenger API      : http://localhost:8000/docs
    RAG Engine         : http://localhost:8001/docs

EOF
}

# Function to start services
start_services() {
    local extra_args="$@"

    print_info "Starting Mix-GEM Development Stack..."

    if [ ! -f "$ENV_FILE" ]; then
        print_warning "$ENV_FILE not found. Creating from defaults..."
        cp .env.dev.example .env.dev 2>/dev/null || true
    fi

    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up $extra_args
}

# Function to stop services
stop_services() {
    print_info "Stopping Mix-GEM Development Stack..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down
    print_success "Services stopped"
}

# Function to clean everything
clean_services() {
    print_warning "This will remove ALL containers, volumes, and data!"
    read -p "Are you sure? (yes/no): " confirm

    if [ "$confirm" = "yes" ]; then
        print_info "Cleaning up..."
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down -v --remove-orphans
        print_success "Cleanup complete"
    else
        print_info "Cleanup cancelled"
    fi
}

# Function to show logs
show_logs() {
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs -f
}

# Function to show running services
show_services() {
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
}

# Main script logic
main() {
    # Check prerequisites
    check_docker
    check_docker_compose

    # Parse command
    COMMAND="${1:-up}"
    shift || true

    case "$COMMAND" in
        up)
            start_services "$@"
            ;;
        down)
            stop_services
            ;;
        restart)
            stop_services
            start_services "$@"
            ;;
        logs)
            show_logs
            ;;
        ps)
            show_services
            ;;
        clean)
            clean_services
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $COMMAND"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
