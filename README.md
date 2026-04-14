# kendo3

`kendo3` is a Bun monorepo that hosts the refactored RSSHub server in `apps/server` and a separate web console in `apps/web`.

## Local development

1. Run `bun install`.
2. Start the full local stack with `bun run dev`.

Local defaults:

- Web: `http://localhost:5173`
- Server: `http://localhost:1200`

Useful development commands:

- `bun run dev`
- `bun run dev:server`
- `bun run dev:web`

Useful commands:

- `bun run build`
- `bun run lint`
- `bun run format`
- `bun run start`
- `bun run test`

## Docker

- Build and verify the image with `bun run docker:test`.
- Run the local stack with `docker compose up --build`.
