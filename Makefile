# WebRTC Object Detection Demo - Makefile
# Provides convenient commands for development and deployment

.PHONY: help start install dev docker-build docker-up docker-down clean test

help: ## Show this help message
	@echo "WebRTC Object Detection Demo - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Quick Start:"
	@echo "  make start     - Start the demo locally"
	@echo "  make docker-up - Start with Docker"

start: ## Start the demo locally (auto-detects OS)
	@echo "🚀 Starting WebRTC Object Detection Demo..."
	@if [ "$(OS)" = "Windows_NT" ]; then \
		if command -v powershell >/dev/null 2>&1; then \
			powershell -ExecutionPolicy Bypass -File start.ps1; \
		else \
			start.bat; \
		fi \
	else \
		if [ "$(shell uname)" = "Darwin" ] || [ "$(shell uname)" = "Linux" ]; then \
			chmod +x start.sh && ./start.sh; \
		else \
			echo "Unsupported operating system. Please use start.bat or start.ps1 on Windows."; \
		fi \
	fi

install: ## Install dependencies
	@echo "📦 Installing dependencies..."
	npm install

dev: ## Start in development mode with nodemon
	@echo "🔧 Starting in development mode..."
	npm run dev

docker-build: ## Build Docker image
	@echo "🐳 Building Docker image..."
	docker-compose build

docker-up: ## Start with Docker
	@echo "🐳 Starting with Docker..."
	docker-compose up

docker-down: ## Stop Docker containers
	@echo "🐳 Stopping Docker containers..."
	docker-compose down

clean: ## Clean up generated files
	@echo "🧹 Cleaning up..."
	rm -rf node_modules
	rm -rf *.log
	rm -rf metrics.json
	rm -rf frame_detections.json

test: ## Run tests (if available)
	@echo "🧪 Running tests..."
	@if [ -f "package.json" ] && grep -q "\"test\":" package.json; then \
		npm test; \
	else \
		echo "No tests configured"; \
	fi

# Platform-specific shortcuts
linux: ## Start on Linux/macOS
	chmod +x start.sh && ./start.sh

windows: ## Start on Windows
	start.bat

powershell: ## Start on Windows with PowerShell
	powershell -ExecutionPolicy Bypass -File start.ps1

# Development helpers
logs: ## Show application logs
	@echo "📋 Application logs:"
	@if [ -f "logs/app.log" ]; then \
		tail -f logs/app.log; \
	else \
		echo "No log file found"; \
	fi

status: ## Check system status
	@echo "📊 System Status:"
	@echo "Node.js: $(shell node --version 2>/dev/null || echo 'Not installed')"
	@echo "npm: $(shell npm --version 2>/dev/null || echo 'Not installed')"
	@echo "Docker: $(shell docker --version 2>/dev/null || echo 'Not installed')"
	@echo "Port 3000: $(shell lsof -i :3000 >/dev/null 2>&1 && echo 'In use' || echo 'Available')"
