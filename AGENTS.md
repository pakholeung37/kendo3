# AGENTS

Repository notes for coding agents and maintainers.

## Scope

- Bun workspace root: `kendo3`
- Backend: `apps/server`
- Frontend: `apps/web`

## Primary Files

- `apps/server/src/index.ts`: server bootstrap
- `apps/server/src/app.ts`: API routes and serialization
- `apps/server/src/services/`: poller, runner, RSS adapter
- `apps/server/src/db/init.ts`: schema init and startup migrations
- `apps/server/src/lib/text.ts`: source id normalization helpers
- `apps/web/src/router.tsx`: route map
- `apps/web/src/routes/`: UI surfaces

## Repo Invariants

- `source.id` is a readable slug. New code should use the existing helpers, not UUID/hash ids.
- Source deletion is soft delete via `deleted_at`.
- Active source endpoints are unique only among non-deleted rows.
- Feed ordering is `publishedAt DESC, fetchedAt DESC, id DESC`.
- `publishedAt` is upstream publish time when parseable; otherwise it falls back to fetch time.
- Stored time values are Unix epoch milliseconds.

## Local Defaults

- Server env file: `apps/server/.env`
- Default server DB path: `./data/kendo3.sqlite` relative to `apps/server`
- Web dev server: `http://localhost:5173`
- API dev server: `http://127.0.0.1:1200`

## Commands

```bash
bun install
bun run dev
bun run dev:server
bun run dev:web
bun run build
bun run lint
bun run typecheck
bun run test
```

## Verification

- Server changes: `cd apps/server && bun run vitest && bun run typecheck && bun run lint`
- Web changes: `cd apps/web && bun run typecheck`
- Runtime smoke: `bun run smoke:bun`

## Avoid

- Do not edit committed runtime artifacts unless the task explicitly targets them: `dist/`, `coverage/`, `apps/server/data/`
