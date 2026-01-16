#!/usr/bin/env bash
set -euo pipefail

SCRIPT_PATH="${BASH_SOURCE[0]:-$0}"
SCRIPT_DIR="$(cd "$(dirname "${SCRIPT_PATH}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../.env"

BASE_URL="${BASE_URL:-}"
TOKEN="${TOKEN:-${JWT_TOKEN:-}}"

if [ -f "${ENV_FILE}" ]; then
  if [ -z "${BASE_URL}" ]; then
    BASE_URL="$(node -e "require('dotenv').config({ path: '${ENV_FILE}' }); process.stdout.write(process.env.BASE_URL || '')")"
  fi
  if [ -z "${TOKEN}" ]; then
    TOKEN="$(node -e "require('dotenv').config({ path: '${ENV_FILE}' }); process.stdout.write(process.env.JWT_TOKEN || process.env.TOKEN || '')")"
  fi
fi

if [ -z "${BASE_URL}" ]; then
  BASE_URL="http://localhost:3000"
fi

require_token() {
  if [ -z "${TOKEN}" ]; then
    echo "Missing TOKEN (set TOKEN env var or JWT_TOKEN in .env)" >&2
    exit 1
  fi
}
