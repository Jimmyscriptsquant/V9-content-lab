#!/usr/bin/env bash
# Start V9 Content Lab locally (MongoDB + Next.js)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$HOME/.local/mongo/bin:$PATH"

mkdir -p "$HOME/.local/mongo/data" "$HOME/.local/mongo/log"

if ! pgrep -x mongod >/dev/null; then
  echo "Starting MongoDB..."
  mongod --dbpath "$HOME/.local/mongo/data" \
    --bind_ip 127.0.0.1 --port 27017 \
    --logpath "$HOME/.local/mongo/log/mongod.log" --fork
else
  echo "MongoDB already running"
fi

cd "$ROOT"
if [ ! -f .env.local ]; then
  echo "Missing .env.local — copy .env.example and set MONGODB_URI + DEV_LOGIN_PASSWORD"
  exit 1
fi

echo "Starting Next.js on http://localhost:3000"
echo "Dev login: any email + password from DEV_LOGIN_PASSWORD in .env.local"
exec npm run dev
