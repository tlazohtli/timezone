# syntax=docker/dockerfile:1
FROM oven/bun:1.4.2 AS base

WORKDIR /app

FROM base AS dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM dependencies AS typecheck
COPY tsconfig.json ./
COPY src ./src
RUN bun run typecheck

FROM base AS production-dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM base AS runtime
ENV NODE_ENV=production

COPY --from=production-dependencies --chown=bun:bun /app/node_modules ./node_modules
COPY --from=typecheck --chown=bun:bun /app/src ./src

USER bun
CMD ["bun", "run", "src/index.ts"]
