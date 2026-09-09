#!/usr/bin/env bash
set -euo pipefail

export CI=true

if [[ ! -f package-lock.json ]]; then
  echo "package-lock.json is required for deterministic post-merge setup" >&2
  exit 1
fi

npm ci --include=dev --no-audit --no-fund
npm run build