ARG BUN_VERSION=1.3.9

FROM oven/bun:${BUN_VERSION} AS deps

WORKDIR /app

COPY package.json bun.lock ./
COPY apps/server/package.json ./apps/server/package.json
COPY apps/server/patches ./apps/server/patches

RUN bun install --frozen-lockfile

FROM deps AS build

COPY apps/server ./apps/server

RUN cd apps/server && bun run build

FROM oven/bun:${BUN_VERSION}-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV TZ=Asia/Shanghai

COPY --from=build /app/package.json /app/bun.lock ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/server ./apps/server

WORKDIR /app/apps/server

EXPOSE 1200

CMD ["bun", "run", "start"]
