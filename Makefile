.PHONY: help dev-up dev-down dev-restart dev-logs dev-ps dev-clean dev-build prod-up prod-down

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m # No Color

# Variables
DEV_COMPOSE := docker-compose.dev.yml
DEV_ENV := .env.dev
PROD_COMPOSE := equipment-monitor/docker-compose.prod.yml
PROD_ENV := equipment-monitor/.env

help: ## Show this help message
	@echo "$(BLUE)Mix-GEM Development Commands$(NC)"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Development targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "Quick Start:"
	@echo "  make dev-up          # Start all dev services"
	@echo "  make dev-logs        # View logs"
	@echo "  make dev-down        # Stop all services"
	@echo ""

dev-up: ## Start all development services
	@echo "$(BLUE)Starting Mix-GEM Development Stack...$(NC)"
	docker-compose -f $(DEV_COMPOSE) --env-file $(DEV_ENV) up -d
	@echo "$(GREEN)✓ Services started$(NC)"
	@make dev-urls

dev-up-fg: ## Start all development services in foreground
	@echo "$(BLUE)Starting Mix-GEM Development Stack (foreground)...$(NC)"
	docker-compose -f $(DEV_COMPOSE) --env-file $(DEV_ENV) up

dev-down: ## Stop all development services
	@echo "$(BLUE)Stopping Mix-GEM Development Stack...$(NC)"
	docker-compose -f $(DEV_COMPOSE) --env-file $(DEV_ENV) down
	@echo "$(GREEN)✓ Services stopped$(NC)"

dev-restart: ## Restart all development services
	@echo "$(BLUE)Restarting Mix-GEM Development Stack...$(NC)"
	@make dev-down
	@make dev-up

dev-logs: ## Show development logs (tail -f)
	docker-compose -f $(DEV_COMPOSE) --env-file $(DEV_ENV) logs -f

dev-ps: ## Show running development services
	docker-compose -f $(DEV_COMPOSE) --env-file $(DEV_ENV) ps

dev-build: ## Rebuild development images
	@echo "$(BLUE)Rebuilding development images...$(NC)"
	docker-compose -f $(DEV_COMPOSE) --env-file $(DEV_ENV) build
	@echo "$(GREEN)✓ Build complete$(NC)"

dev-clean: ## Remove all development containers and volumes
	@echo "$(YELLOW)⚠️  This will remove ALL containers, volumes, and data!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		echo "$(BLUE)Cleaning up...$(NC)"; \
		docker-compose -f $(DEV_COMPOSE) --env-file $(DEV_ENV) down -v --remove-orphans; \
		echo "$(GREEN)✓ Cleanup complete$(NC)"; \
	else \
		echo "$(YELLOW)Cleanup cancelled$(NC)"; \
	fi

dev-pull: ## Pull latest images
	@echo "$(BLUE)Pulling latest images...$(NC)"
	docker-compose -f $(DEV_COMPOSE) --env-file $(DEV_ENV) pull
	@echo "$(GREEN)✓ Pull complete$(NC)"

dev-urls: ## Display service URLs
	@echo ""
	@echo "$(GREEN)=== Mix-GEM Development Services ===$(NC)"
	@echo ""
	@echo "$(BLUE)Main Applications:$(NC)"
	@echo "  Scavenger API     : http://localhost:8000/docs"
	@echo "  RAG Engine        : http://localhost:8001/docs"
	@echo ""
	@echo "$(BLUE)Development Tools:$(NC)"
	@echo "  pgAdmin           : http://localhost:5050 (admin@mixgem.dev / admin)"
	@echo "  Redis Commander   : http://localhost:8081"
	@echo ""
	@echo "$(BLUE)Monitoring:$(NC)"
	@echo "  Grafana           : http://localhost:3001 (admin / admin)"
	@echo "  Prometheus        : http://localhost:9090"
	@echo "  cAdvisor          : http://localhost:8080"
	@echo ""

# Service-specific commands
dev-logs-api: ## Show Scavenger API logs
	docker-compose -f $(DEV_COMPOSE) --env-file $(DEV_ENV) logs -f scavenger-api

dev-logs-rag: ## Show RAG Engine logs
	docker-compose -f $(DEV_COMPOSE) --env-file $(DEV_ENV) logs -f rag-engine

dev-logs-postgres: ## Show PostgreSQL logs
	docker-compose -f $(DEV_COMPOSE) --env-file $(DEV_ENV) logs -f postgres

dev-logs-redis: ## Show Redis logs
	docker-compose -f $(DEV_COMPOSE) --env-file $(DEV_ENV) logs -f redis

# Database commands
db-shell: ## Open PostgreSQL shell
	docker exec -it mixgem_dev_postgres psql -U mixgem -d mixgem_dev

db-backup: ## Backup PostgreSQL database
	@echo "$(BLUE)Backing up database...$(NC)"
	docker exec mixgem_dev_postgres pg_dump -U mixgem mixgem_dev > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)✓ Backup complete$(NC)"

redis-cli: ## Open Redis CLI
	docker exec -it mixgem_dev_redis redis-cli

# Ollama commands
ollama-pull-llama: ## Pull Llama 3.2 3B model
	docker exec mixgem_dev_ollama ollama pull llama3.2:3b

ollama-pull-embed: ## Pull embedding model
	docker exec mixgem_dev_ollama ollama pull nomic-embed-text

ollama-list: ## List Ollama models
	docker exec mixgem_dev_ollama ollama list

# Health checks
health: ## Check service health
	@echo "$(BLUE)Checking service health...$(NC)"
	@echo ""
	@echo "PostgreSQL:"
	@docker exec mixgem_dev_postgres pg_isready -U mixgem || echo "$(YELLOW)⚠️  PostgreSQL not ready$(NC)"
	@echo ""
	@echo "Redis:"
	@docker exec mixgem_dev_redis redis-cli PING || echo "$(YELLOW)⚠️  Redis not ready$(NC)"
	@echo ""
	@echo "Ollama:"
	@curl -s http://localhost:11434/api/tags > /dev/null && echo "PONG" || echo "$(YELLOW)⚠️  Ollama not ready$(NC)"
	@echo ""

# Production commands (if needed)
prod-up: ## Start production services
	@echo "$(BLUE)Starting Mix-GEM Production Stack...$(NC)"
	docker-compose -f $(PROD_COMPOSE) --env-file $(PROD_ENV) up -d
	@echo "$(GREEN)✓ Production services started$(NC)"

prod-down: ## Stop production services
	@echo "$(BLUE)Stopping Mix-GEM Production Stack...$(NC)"
	docker-compose -f $(PROD_COMPOSE) --env-file $(PROD_ENV) down
	@echo "$(GREEN)✓ Production services stopped$(NC)"

# Utility commands
prune: ## Prune Docker system (removes unused data)
	@echo "$(YELLOW)⚠️  This will remove unused Docker data$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker system prune -a; \
	else \
		echo "$(YELLOW)Prune cancelled$(NC)"; \
	fi

check-docker: ## Check if Docker is running
	@docker info > /dev/null 2>&1 && echo "$(GREEN)✓ Docker is running$(NC)" || (echo "$(YELLOW)⚠️  Docker is not running$(NC)"; exit 1)
