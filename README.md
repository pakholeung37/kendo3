# kendo3

`kendo3` is a Bun monorepo for a small RSS ingestion backend and a separate operator console.

## Stack

- `apps/server`: Bun, Hono, SQLite, Drizzle
- `apps/web`: React, Vite, TanStack Query, React Router

## Quick Start

```bash
bun install
bun run dev
```

- Web: `http://localhost:5173`
- API: `http://127.0.0.1:1200`
- Health check: `GET /healthz`

The server reads `apps/server/.env`. Default local DB path is `apps/server/data/kendo3.sqlite` when run via `bun run dev:server`.

## Workspace

- `apps/server/src/app.ts`: HTTP API
- `apps/server/src/services/`: polling, fetch, normalization
- `apps/server/src/db/`: schema, init, one-shot migrations
- `apps/web/src/routes/`: `feed`, `sources`, `runs`

## Commands

```bash
bun run dev
bun run dev:server
bun run dev:web

bun run build
bun run lint
bun run typecheck
bun run test

bun run smoke:bun
bun run docker:test
docker compose up --build
```

## Data Notes

- `sources`: source registry and poll state
- `feed_items`: normalized feed entries
- `source_runs`: fetch history
- `source.id`: readable slug; legacy UUID-like ids are migrated on boot
- Time fields are stored as Unix epoch milliseconds
- `feed_items.published_at` uses upstream publish time when parseable, otherwise fetch time
