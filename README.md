# kendo3

`kendo3` is a Bun monorepo that hosts the refactored RSSHub server in `apps/server` and a separate web console in `apps/web`.

## Local development

1. Run `bun install`.
2. Copy `apps/server/.env.example` to `apps/server/.env` if you need custom local settings.
3. Start the full local stack with `bun run dev`.

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
- `bun run smoke:bun`

The web app is a separate frontend build intended to be served by `nginx` or another static host in production. The backend does not read frontend build artifacts as a static directory.

## Docker

- Build and verify the image with `bun run docker:test`.
- Run the local stack with `docker compose up --build`.

Only Bun local runtime and Docker deployment are supported in this repo. Edge, Vercel, Fly, npm package publishing, and docs build flows are intentionally removed.
