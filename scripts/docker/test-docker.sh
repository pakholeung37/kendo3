#!/usr/bin/env bash

set -euo pipefail

IMAGE_TAG="${IMAGE_TAG:-kendo3-rsshub:test}"
CONTAINER_NAME="kendo3-rsshub-test"

docker build -t "$IMAGE_TAG" .

cleanup() {
    docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
}

trap cleanup EXIT

docker run -d --name "$CONTAINER_NAME" -p 1200:1200 "$IMAGE_TAG" >/dev/null

for _ in {1..30}; do
    if curl -fsS "http://127.0.0.1:1200/healthz" >/dev/null 2>&1; then
        exit 0
    fi
    sleep 2
done

docker logs "$CONTAINER_NAME" >&2 || true
exit 1
