# --- CONFIGURATION ---
ifneq (,$(wildcard ./.env))
include .env
export $(shell sed -n 's/^\([A-Za-z_][A-Za-z0-9_]*\)=.*/\1/p' .env)
endif

.PHONY: all clean build docker.build docker.up docker.down docker.logs deploy deploy.commands

all: docker.up

# --- BOT CONTAINER ---

clean:
	rm -rf dist

build: docker.build

docker.build:
	docker compose build

docker.up:
	docker compose up -d --build

docker.down:
	docker compose down

docker.logs:
	docker compose logs --follow --tail=100

deploy: docker.up

deploy.commands:
	@echo "📝 Registering Discord slash commands..."
	docker compose run --rm bot bun run src/utils/deploy-commands.ts
