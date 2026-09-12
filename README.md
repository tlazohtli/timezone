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
make deploy             # Build (if needed), then start or update the bot
make logs               # Follow bot logs
make stop               # Stop the bot without deleting timezone data
make commands           # Register Discord slash commands
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

Create an ignored `.env` file with the required values. `DISCORD_TOKEN` is required to run the bot; `GOOGLE_API_KEY` is required for `/time set location`; and `DISCORD_CLIENT_ID` is required only when registering slash commands. Never commit `.env`.

## Raspberry Pi Docker deployment

This project assumes Docker Engine and the `docker compose` plugin are already installed on the Pi. Host-level Docker setup is maintained separately in the `wildberry` project.

Create the application directories and copy the host-only configuration and migrated data:

```bash
sudo install -d -o "$USER" -g "$USER" -m 700 /etc/timezone-bot /var/lib/timezone
sudo install -m 600 -o "$USER" -g "$USER" /path/to/env /etc/timezone-bot/env
sudo install -m 600 -o 1000 -g 1000 /path/to/timezones.json /var/lib/timezone/timezones.json
```

`/etc/timezone-bot/env` must contain the runtime values; `/var/lib/timezone/timezones.json` is the migrated local data file. Both paths are host-only and excluded from the image. Start the container with `make deploy`, then inspect it with `make logs`.

For a local Docker run with the repository's ignored configuration and data, override the host paths:

```bash
TIMEZONE_ENV_FILE=.env TIMEZONE_DATA_DIR=./data docker compose up --build
```

## Monitoring & Debugging

### Check Bot Status

```bash
# View live container logs
make logs

# Restart after a configuration or image change
make deploy

# Stop the bot
make stop
```

## Technology Stack

- **Runtime**: Bun with TypeScript
- **Framework**: Discord.js v14 (optimized caching)
- **Deployment**: Docker Compose on Raspberry Pi
- **Storage**: Local JSON on persistent host storage
- **APIs**: Google Geocoding & Timezone APIs (optional)
