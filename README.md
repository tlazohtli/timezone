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

make deploy.commands    # Register slash commands with Discord in a one-off container
```

### Bun Scripts

```bash
bun run build           # Type-check TypeScript
bun run dev             # Run the bot with Bun and reload on changes
bun run start           # Run the bot with Bun
```

## Project Structure

```
timezone/
├── src/
│   ├── time/
│   │   ├── commands/         # Time slash command handlers
│   │   └── services/         # Timezone and geocoding services
│   └── index.ts              # Bot entry point
├── Dockerfile                # Bun runtime container image
├── compose.yaml              # Raspberry Pi service definition
└── data/                     # Local timezone data (gitignored)
```

## Deployment overview

The bot runs as an ARM64 Bun container on the Raspberry Pi:

- **Docker Compose** keeps the runtime and dependencies isolated.
- **Local JSON** stores user timezone preferences on the Pi's persistent storage.
- **Host-only environment file** supplies Discord and Google API credentials.

## Timezone data

Timezone preferences are stored locally in `data/timezones.json` by default, using this format:

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

Copy `.env.example` to `.env` and provide the required values. `DISCORD_TOKEN` is required to run the bot; `GOOGLE_API_KEY` is required for `/time set location`; and `DISCORD_CLIENT_ID` is required only when registering slash commands. Never commit `.env`.

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
# View live container logs
make docker.logs

# Restart after a configuration or image change
make deploy

# Stop the bot
make docker.down
```

## Technology Stack

- **Runtime**: Bun with TypeScript
- **Framework**: Discord.js v14 (optimized caching)
- **Deployment**: Docker Compose on Raspberry Pi
- **Storage**: Local JSON on persistent host storage
- **APIs**: Google Geocoding & Timezone APIs (optional)
