#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$ROOT_DIR/apps/server"
PORT="${PORT:-12120}"

cd "$APP_DIR"

NODE_ENV=production PORT="$PORT" bun dist/index.mjs >/tmp/kendo3-smoke.log 2>&1 &
SERVER_PID=$!

cleanup() {
    kill "$SERVER_PID" >/dev/null 2>&1 || true
    wait "$SERVER_PID" >/dev/null 2>&1 || true
}

trap cleanup EXIT

for _ in {1..30}; do
    if curl -fsS "http://127.0.0.1:${PORT}/healthz" >/dev/null 2>&1; then
        exit 0
    fi
    sleep 1
done

cat /tmp/kendo3-smoke.log >&2 || true
exit 1
