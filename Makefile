# --- CONFIGURATION ---
ifneq (,$(wildcard ./.env))
include .env
export $(shell sed -n 's/^\([A-Za-z_][A-Za-z0-9_]*\)=.*/\1/p' .env)
endif

.PHONY: all clean build docker.build docker.up docker.down docker.logs deploy deploy.commands infra.synth infra.deploy infra.diff infra.destroy

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
	bun run deploy-commands

# --- CDK INFRASTRUCTURE ---

infra.synth:
	@echo "🔍 Synthesizing CDK stack..."
	bun run cdk:synth

infra.deploy:
	@echo "🏗️  Deploying infrastructure..."
	bun run cdk:deploy

infra.diff:
	@echo "📊 Showing infrastructure changes..."
	bun run cdk:diff

infra.destroy:
	@echo "⚠️  WARNING: This will destroy all infrastructure!"
	@echo "Press Ctrl+C to cancel, or wait 5 seconds to continue..."
	@sleep 5
	bun run cdk:destroy
