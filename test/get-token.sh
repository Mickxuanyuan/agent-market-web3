#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
PRIVATE_KEY="${TEST_PRIVATE_KEY:-}"
SCRIPT_PATH="${BASH_SOURCE[0]:-$0}"
SCRIPT_DIR="$(cd "$(dirname "${SCRIPT_PATH}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../.env"

if [ -f "${ENV_FILE}" ]; then
  PRIVATE_KEY="$(node -e "require('dotenv').config({ path: '${ENV_FILE}' }); process.stdout.write(process.env.TEST_PRIVATE_KEY || '')")"
fi

if [ -z "${PRIVATE_KEY}" ]; then
  echo "Missing TEST_PRIVATE_KEY env var" >&2
  exit 1
fi

ADDRESS=$(node -e "const { privateKeyToAccount } = require('viem/accounts'); console.log(privateKeyToAccount('${PRIVATE_KEY}').address);" )

NONCE_JSON=$(curl -s "${BASE_URL}/auth/nonce?address=${ADDRESS}")
if [ -z "${NONCE_JSON}" ]; then
  echo "Empty response from /auth/nonce" >&2
  exit 1
fi
MESSAGE=$(node -e "const msg = JSON.parse(process.argv[1]).message; process.stdout.write(msg);" "${NONCE_JSON}")
SIGNATURE=$(TEST_PRIVATE_KEY="${PRIVATE_KEY}" SIGN_MESSAGE="${MESSAGE}" node -r ts-node/register "${SCRIPT_DIR}/sign.ts")

VERIFY_PAYLOAD=$(node -e "const payload = { message: process.argv[1], signature: process.argv[2] }; console.log(JSON.stringify(payload));" "${MESSAGE}" "${SIGNATURE}")
VERIFY_JSON=$(curl -s -X POST "${BASE_URL}/auth/verify" \
  -H "Content-Type: application/json" \
  -d "${VERIFY_PAYLOAD}")
if [ -z "${VERIFY_JSON}" ]; then
  echo "Empty response from /auth/verify" >&2
  exit 1
fi
TOKEN=$(echo "${VERIFY_JSON}" | node -e "const data = JSON.parse(require('fs').readFileSync(0,'utf8')); process.stdout.write(data.token || '');")

if [ -z "${TOKEN}" ]; then
  echo "Failed to get token. Response: ${VERIFY_JSON}" >&2
  exit 1
fi

if [ -f "${ENV_FILE}" ]; then
  if rg -q "^JWT_TOKEN=" "${ENV_FILE}"; then
    perl -0777 -i -pe "s/^JWT_TOKEN=.*/JWT_TOKEN=${TOKEN}/m" "${ENV_FILE}"
  else
    printf "\nJWT_TOKEN=%s\n" "${TOKEN}" >> "${ENV_FILE}"
  fi
fi

echo "TOKEN=${TOKEN}"
