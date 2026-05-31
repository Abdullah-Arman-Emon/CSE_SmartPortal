#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

# Build the frontend with the same-origin /api backend path
# and ensure the latest backend/nginx services are up.

docker compose build --no-cache frontend backend

docker compose up -d

docker compose ps

docker compose logs -f nginx backend frontend
