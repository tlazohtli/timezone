# Timezone Discord Bot

A Discord bot for coordinating across timezones.

## Features

### 🕐 Time Commands
Help your Discord community coordinate across timezones:
- **`/time set location`** - Set your timezone by location name (e.g., "Tokyo", "New York")
- **`/time get user`** - Check what time it is for any user
- **`/time get location`** - Check current time in any location
- **`/time all`** - View everyone's local times grouped by timezone
- **Auto-mention replies** - Bot automatically responds with time when users are mentioned (2-hour cooldown)

## Quick Start

### For New Deployments

See **[CDK_SETUP.md](CDK_SETUP.md)** for complete infrastructure deployment guide.

### For Development

```bash
# Install dependencies
bun install

# Build TypeScript
bun run build

# Run locally (requires values in .env)
bun run dev

# Deploy to production
make deploy
```

## Available Commands

### Makefile Commands

```bash
# Container
make build              # Build the ARM64 Bun image and type-check the source
make deploy             # Start or update the bot container
make docker.down        # Stop the bot container
make docker.logs        # Follow bot logs
make clean              # Remove legacy compiled files

make deploy.commands    # Register slash commands with Discord

# Infrastructure (AWS CDK)
make infra.synth        # Generate CloudFormation template
make infra.deploy       # Deploy infrastructure to AWS
make infra.diff         # Preview infrastructure changes
make infra.destroy      # Destroy infrastructure (with safety delay)
```

### Bun Scripts

```bash
bun run build           # Type-check TypeScript
bun run dev             # Run the bot with Bun and reload on changes
bun run start           # Run the bot with Bun

# CDK commands
bun run cdk:synth       # Synthesize CloudFormation
bun run cdk:deploy      # Deploy infrastructure
bun run cdk:diff        # Show changes
bun run cdk:destroy     # Destroy stack
```

## Project Structure

```
timezone/
├── src/
│   ├── time/
│   │   ├── commands/         # Time slash command handlers
│   │   └── services/         # Timezone and geocoding services
│   └── index.ts              # Bot entry point
├── infra/
│   └── lib/timezone-stack.ts # AWS CDK infrastructure definition
├── dist/                     # Compiled JavaScript (gitignored)
└── CDK_SETUP.md              # Infrastructure deployment guide
```

## Infrastructure Overview

The bot runs on AWS with a cost-optimized setup:

- **EC2 t4g.micro** (ARM64 Graviton) - Runs the bot 24/7
- **DynamoDB** (on-demand) - `xiuh-time` stores user timezone preferences
- **IAM Role** - Scoped permissions for DynamoDB read/write
- **Security Group** - SSH access for deployment

**Cost**: Free for first 12 months, then ~$6-8/month

See [CDK_SETUP.md](CDK_SETUP.md) for detailed infrastructure setup and deployment.

## Migrating timezone data off AWS

Timezone preferences are stored locally in `data/timezones.json` by default. Before retiring DynamoDB, manually export the records from `xiuh-time` and create the local file in this format:

```json
{
  "version": 1,
  "users": {
    "DISCORD_USER_ID": {
      "timezone": "Asia/Tokyo",
      "display_location": "Tokyo, Japan"
    }
  }
}
```

Set `TIMEZONE_DATA_FILE` to an absolute path such as `/var/lib/timezone/timezones.json` in production. This file contains Discord user IDs and location preferences, is intentionally gitignored, and needs an off-device backup. Copy it to the Pi with owner-only permissions before starting the bot.

## Runtime configuration

Copy `.env.example` to `.env` and provide the required values. `DISCORD_TOKEN` is required to run the bot; `GOOGLE_API_KEY` is required for `/time set location`; and `DISCORD_CLIENT_ID` is required only when registering slash commands. `PUBLIC_KEY` is retained from the previous deployment but is not used by this Gateway-based bot. Never commit `.env`.

## Raspberry Pi Docker deployment

Install Docker Engine and the Compose plugin on 64-bit Raspberry Pi OS. On the Pi, clone this repository and create the host-only configuration and data directories:

```bash
sudo install -d -m 700 /etc/timezone-bot /var/lib/timezone
sudo install -m 600 /path/to/env /etc/timezone-bot/env
sudo install -m 600 /path/to/timezones.json /var/lib/timezone/timezones.json
sudo chown -R 1000:1000 /var/lib/timezone
```

`/etc/timezone-bot/env` must contain the same runtime values as `.env`; `/var/lib/timezone/timezones.json` is the migrated local data file. Neither is included in the image. Start the container with `make deploy`, then inspect it with `make docker.logs`.

For a local Docker run with the repository's ignored configuration and data, override the host paths:

```bash
TIMEZONE_ENV_FILE=.env TIMEZONE_DATA_DIR=./data docker compose up --build
```

## Monitoring & Debugging

### Check Bot Status

```bash
# SSH into EC2 instance
ssh -i ~/.ssh/xiuh-bot-key.pem ec2-user@YOUR_EC2_IP

# Check service status
sudo systemctl status xiuh-bot

# View live logs
sudo journalctl -u xiuh-bot -f

# Restart bot
sudo systemctl restart xiuh-bot
```

### Check AWS Resources

```bash
# List DynamoDB tables
aws dynamodb list-tables

# Check CloudFormation stack
aws cloudformation describe-stacks --stack-name XiuhStack
```

## Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Discord.js v14 (optimized caching)
- **Cloud**: AWS (EC2 and DynamoDB)
- **Infrastructure**: AWS CDK
- **APIs**: Google Geocoding & Timezone APIs (optional)
