#!/bin/bash
# Mix-GEM Production Stack - Interactive Start Script
# Helps users configure and start the appropriate services

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env"
ENV_EXAMPLE=".env.example"

# Banner
print_banner() {
    echo -e "${CYAN}${BOLD}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║                                                           ║"
    echo "║           Mix-GEM Production Stack Launcher               ║"
    echo "║                                                           ║"
    echo "║  Semiconductor Equipment Monitoring & AI/RAG Platform    ║"
    echo "║                                                           ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $*"
}

log_success() {
    echo -e "${GREEN}✓${NC} $*"
}

log_error() {
    echo -e "${RED}✗${NC} $*"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $*"
}

log_step() {
    echo -e "\n${CYAN}${BOLD}▶${NC} ${BOLD}$*${NC}\n"
}

# Check prerequisites
check_prerequisites() {
    log_step "Checking prerequisites..."

    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        echo "Please install Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi
    log_success "Docker found: $(docker --version | cut -d',' -f1)"

    # Check Docker Compose
    if ! docker-compose version &> /dev/null; then
        log_error "Docker Compose is not installed"
        echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
        exit 1
    fi
    log_success "Docker Compose found: $(docker-compose version --short)"

    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        echo "Please start Docker and try again"
        exit 1
    fi
    log_success "Docker daemon is running"
}

# Check/create environment file
check_environment() {
    log_step "Checking environment configuration..."

    if [ ! -f "$ENV_FILE" ]; then
        log_warning "Environment file not found: $ENV_FILE"

        if [ -f "$ENV_EXAMPLE" ]; then
            echo ""
            read -p "$(echo -e ${YELLOW}Create .env from template? [y/N]:${NC} )" -n 1 -r
            echo

            if [[ $REPLY =~ ^[Yy]$ ]]; then
                cp "$ENV_EXAMPLE" "$ENV_FILE"
                log_success "Created $ENV_FILE from $ENV_EXAMPLE"
                echo ""
                log_warning "IMPORTANT: Edit $ENV_FILE and set required passwords and API keys!"
                echo ""
                echo "Required settings:"
                echo "  - POSTGRES_PASSWORD"
                echo "  - GRAFANA_ADMIN_PASSWORD"
                echo "  - ANTHROPIC_API_KEY (for RAG profile)"
                echo "  - CERTBOT_EMAIL and CERTBOT_DOMAIN (for gateway profile)"
                echo ""
                read -p "$(echo -e ${YELLOW}Press Enter to open $ENV_FILE in editor...${NC})"
                ${EDITOR:-nano} "$ENV_FILE"
            else
                log_error "Cannot proceed without environment file"
                exit 1
            fi
        else
            log_error "Template file not found: $ENV_EXAMPLE"
            exit 1
        fi
    else
        log_success "Environment file found: $ENV_FILE"

        # Check for default passwords
        if grep -q "CHANGE_ME" "$ENV_FILE"; then
            log_warning "Default passwords detected in $ENV_FILE"
            echo ""
            read -p "$(echo -e ${YELLOW}Edit environment file? [y/N]:${NC} )" -n 1 -r
            echo

            if [[ $REPLY =~ ^[Yy]$ ]]; then
                ${EDITOR:-nano} "$ENV_FILE"
            fi
        fi
    fi
}

# Display available profiles
show_profiles() {
    log_step "Available Service Profiles"

    echo -e "${BOLD}Core Services${NC} (always enabled):"
    echo "  • PostgreSQL (pgvector) - Database"
    echo "  • Redis - Caching & message queue"
    echo ""

    echo -e "${BOLD}Optional Profiles:${NC}"
    echo ""

    echo -e "${GREEN}[1] scavenger${NC} - SECS/GEM Equipment Ingestion"
    echo "    • Scavenger API - REST API for event ingestion"
    echo "    • Scavenger Recorder - Batch recorder worker"
    echo "    Requirements: PostgreSQL, Redis"
    echo ""

    echo -e "${GREEN}[2] simulator${NC} - SECS/GEM Equipment Simulator"
    echo "    • HSMS/SECS-II protocol simulator"
    echo "    • Test equipment scenarios"
    echo "    Requirements: PostgreSQL, Redis"
    echo ""

    echo -e "${GREEN}[3] rag${NC} - AI/RAG Engine"
    echo "    • LangGraph + LightRAG orchestration"
    echo "    • Document Q&A and semantic search"
    echo "    Requirements: PostgreSQL, Redis, ANTHROPIC_API_KEY"
    echo ""

    echo -e "${GREEN}[4] ollama${NC} - Local LLM Server"
    echo "    • Run local models (DeepSeek, Qwen, Llama)"
    echo "    • No API keys required"
    echo "    Requirements: 8GB+ RAM, GPU recommended"
    echo ""

    echo -e "${GREEN}[5] monitoring${NC} - Observability Stack"
    echo "    • Prometheus - Metrics collection"
    echo "    • Grafana - Dashboards and visualization"
    echo "    • Exporters - Node, PostgreSQL, Redis, cAdvisor"
    echo "    Requirements: None"
    echo ""

    echo -e "${GREEN}[6] gateway${NC} - Nginx Reverse Proxy + SSL"
    echo "    • Nginx reverse proxy"
    echo "    • Let's Encrypt SSL with Certbot"
    echo "    Requirements: CERTBOT_EMAIL, CERTBOT_DOMAIN"
    echo ""

    echo -e "${GREEN}[7] backup${NC} - Automated Backup Service"
    echo "    • PostgreSQL, Redis, and volume backups"
    echo "    • Configurable retention"
    echo "    Requirements: None"
    echo ""
}

# Select profiles interactively
select_profiles() {
    log_step "Select Profiles to Enable"

    echo "Enter profile numbers separated by spaces (e.g., 1 5 6)"
    echo "Or type 'all' for all profiles, 'custom' to enter manually"
    echo ""
    read -p "$(echo -e ${CYAN}Selection:${NC} )" selection

    local profiles=""

    if [ "$selection" = "all" ]; then
        profiles="scavenger,simulator,rag,ollama,monitoring,gateway,backup"
    elif [ "$selection" = "custom" ]; then
        read -p "$(echo -e ${CYAN}Enter profiles (comma-separated):${NC} )" profiles
    else
        # Parse numbers
        for num in $selection; do
            case $num in
                1) profiles="${profiles},scavenger" ;;
                2) profiles="${profiles},simulator" ;;
                3) profiles="${profiles},rag" ;;
                4) profiles="${profiles},ollama" ;;
                5) profiles="${profiles},monitoring" ;;
                6) profiles="${profiles},gateway" ;;
                7) profiles="${profiles},backup" ;;
                *) log_warning "Unknown profile number: $num" ;;
            esac
        done
        # Remove leading comma
        profiles="${profiles#,}"
    fi

    if [ -z "$profiles" ]; then
        log_warning "No profiles selected. Using core services only."
    else
        log_success "Selected profiles: $profiles"
    fi

    echo "$profiles"
}

# Validate profile requirements
validate_profiles() {
    local profiles="$1"
    local valid=true

    log_step "Validating profile requirements..."

    # Check RAG profile requirements
    if [[ "$profiles" == *"rag"* ]]; then
        if ! grep -q "^ANTHROPIC_API_KEY=sk-" "$ENV_FILE" 2>/dev/null; then
            log_warning "RAG profile requires ANTHROPIC_API_KEY"
            valid=false
        else
            log_success "RAG profile: ANTHROPIC_API_KEY configured"
        fi
    fi

    # Check gateway profile requirements
    if [[ "$profiles" == *"gateway"* ]]; then
        if grep -q "^CERTBOT_EMAIL=admin@example.com" "$ENV_FILE" 2>/dev/null; then
            log_warning "Gateway profile requires valid CERTBOT_EMAIL"
            valid=false
        else
            log_success "Gateway profile: CERTBOT_EMAIL configured"
        fi

        if grep -q "^CERTBOT_DOMAIN=example.com" "$ENV_FILE" 2>/dev/null; then
            log_warning "Gateway profile requires valid CERTBOT_DOMAIN"
            valid=false
        else
            log_success "Gateway profile: CERTBOT_DOMAIN configured"
        fi
    fi

    # Check for default passwords
    if grep -q "CHANGE_ME" "$ENV_FILE" 2>/dev/null; then
        log_error "Default passwords detected in $ENV_FILE"
        echo "Please update POSTGRES_PASSWORD and GRAFANA_ADMIN_PASSWORD"
        valid=false
    fi

    if [ "$valid" = false ]; then
        echo ""
        read -p "$(echo -e ${YELLOW}Continue anyway? [y/N]:${NC} )" -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Generate SSL certificates if needed
setup_ssl() {
    local profiles="$1"

    if [[ "$profiles" == *"gateway"* ]]; then
        log_step "Setting up SSL certificates..."

        if [ ! -f "nginx/ssl/cert.pem" ] || [ ! -f "nginx/ssl/key.pem" ]; then
            log_info "Generating self-signed SSL certificates for development..."

            mkdir -p nginx/ssl
            openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
                -keyout nginx/ssl/key.pem \
                -out nginx/ssl/cert.pem \
                -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" \
                &> /dev/null

            log_success "Self-signed certificates generated"
            log_warning "For production, use Let's Encrypt with Certbot"
        else
            log_success "SSL certificates already exist"
        fi
    fi
}

# Start services
start_services() {
    local profiles="$1"

    log_step "Starting Mix-GEM Stack"

    # Build command
    local cmd="docker-compose -f $COMPOSE_FILE"

    if [ -n "$profiles" ]; then
        export COMPOSE_PROFILES="$profiles"
        log_info "Enabled profiles: $profiles"
    else
        log_info "Starting core services only"
    fi

    echo ""
    read -p "$(echo -e ${CYAN}Start services? [Y/n]:${NC} )" -n 1 -r
    echo

    if [[ $REPLY =~ ^[Nn]$ ]]; then
        log_warning "Startup cancelled"
        exit 0
    fi

    log_info "Pulling latest images..."
    $cmd pull 2>&1 | grep -v "Pulling from" || true

    log_info "Starting services..."
    $cmd up -d

    log_success "Services started!"
}

# Show service status
show_status() {
    log_step "Service Status"

    docker-compose -f "$COMPOSE_FILE" ps

    echo ""
    log_info "View logs: docker-compose -f $COMPOSE_FILE logs -f"
    log_info "Stop services: docker-compose -f $COMPOSE_FILE down"
}

# Show access URLs
show_urls() {
    local profiles="$1"

    log_step "Access URLs"

    echo -e "${BOLD}Core Services:${NC}"
    echo "  • PostgreSQL: localhost:5432"
    echo "  • Redis: localhost:6379"
    echo ""

    if [[ "$profiles" == *"scavenger"* ]]; then
        echo -e "${BOLD}Scavenger:${NC}"
        echo "  • API: http://localhost:8000"
        echo "  • Docs: http://localhost:8000/docs"
        echo ""
    fi

    if [[ "$profiles" == *"simulator"* ]]; then
        echo -e "${BOLD}Simulator:${NC}"
        echo "  • HSMS Passive: localhost:5000"
        echo "  • HSMS Active: localhost:5001"
        echo ""
    fi

    if [[ "$profiles" == *"rag"* ]]; then
        echo -e "${BOLD}RAG Engine:${NC}"
        echo "  • API: http://localhost:8001"
        echo "  • Docs: http://localhost:8001/docs"
        echo ""
    fi

    if [[ "$profiles" == *"ollama"* ]]; then
        echo -e "${BOLD}Ollama:${NC}"
        echo "  • API: http://localhost:11434"
        echo ""
    fi

    if [[ "$profiles" == *"monitoring"* ]]; then
        echo -e "${BOLD}Monitoring:${NC}"
        echo "  • Prometheus: http://localhost:9090"
        echo "  • Grafana: http://localhost:3001 (admin/\$GRAFANA_ADMIN_PASSWORD)"
        echo ""
    fi

    if [[ "$profiles" == *"gateway"* ]]; then
        echo -e "${BOLD}Gateway:${NC}"
        echo "  • HTTP: http://localhost"
        echo "  • HTTPS: https://localhost"
        echo ""
    fi
}

# Main function
main() {
    print_banner

    # Check prerequisites
    check_prerequisites

    # Check environment
    check_environment

    # Show available profiles
    show_profiles

    # Select profiles
    profiles=$(select_profiles)

    # Validate requirements
    validate_profiles "$profiles"

    # Setup SSL if needed
    setup_ssl "$profiles"

    # Start services
    start_services "$profiles"

    # Show status
    show_status

    # Show access URLs
    show_urls "$profiles"

    echo ""
    log_success "Mix-GEM Stack is ready!"
    echo ""
}

# Run main
main
