# kendo3

`kendo3` is a Bun monorepo that hosts the refactored RSSHub server in `apps/server`.

## Local development

1. Run `bun install`.
2. Copy `apps/server/.env.example` to `apps/server/.env` if you need custom local settings.
3. Start the server with `bun run dev`.

Useful commands:

- `bun run build`
- `bun run lint`
- `bun run format`
- `bun run start`
- `bun run test`
- `bun run smoke:bun`

## Docker

- Build and verify the image with `bun run docker:test`.
- Run the local stack with `docker compose up --build`.

Only Bun local runtime and Docker deployment are supported in this repo. Edge, Vercel, Fly, npm package publishing, and docs build flows are intentionally removed.
