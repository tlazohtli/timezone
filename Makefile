# --- CONFIGURATION ---
ifneq (,$(wildcard ./.env))
include .env
export $(shell sed -n 's/^\([A-Za-z_][A-Za-z0-9_]*\)=.*/\1/p' .env)

# A checkout with local secrets keeps its ignored data beside the repository.
# Hosts without .env continue to use Compose's /etc and /var defaults.
TIMEZONE_ENV_FILE ?= .env
TIMEZONE_DATA_DIR ?= ./data
export TIMEZONE_ENV_FILE TIMEZONE_DATA_DIR
endif


.PHONY: dev deploy logs stop commands

# Run the bot locally with source watching. Requires an ignored .env file.
dev:
	mkdir -p data
	TIMEZONE_ENV_FILE=.env TIMEZONE_DATA_DIR=./data docker compose -f compose.yaml -f compose.dev.yaml up --build

# Build (if needed) and run the bot. This is the only command needed to deploy.
deploy:
	docker compose up -d --build

# Stop and remove the bot container without deleting the host data directory.
stop:
	docker compose down

# Follow the bot's recent output.
logs:
	docker compose logs --follow --tail=100

# Register Discord slash commands in a one-off container.
commands:
	@echo "📝 Registering Discord slash commands..."
	docker compose run --rm bot bun run src/utils/deploy-commands.ts
