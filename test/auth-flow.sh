#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
PRIVATE_KEY="${TEST_PRIVATE_KEY:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../.env"

if [[ -f "${ENV_FILE}" ]]; then
  PRIVATE_KEY="$(node -e "require('dotenv').config({ path: '${ENV_FILE}' }); process.stdout.write(process.env.TEST_PRIVATE_KEY || '')")"
fi

if [[ -z "${PRIVATE_KEY}" ]]; then
  echo "Missing TEST_PRIVATE_KEY env var" >&2
  exit 1
fi

ADDRESS=$(node -e "const { privateKeyToAccount } = require('viem/accounts'); console.log(privateKeyToAccount('${PRIVATE_KEY}').address);" )
echo "Address: ${ADDRESS}"

NONCE_JSON=$(curl -s "${BASE_URL}/auth/nonce?address=${ADDRESS}")
MESSAGE=$(node -e "const msg = JSON.parse(process.argv[1]).message; process.stdout.write(msg);" "${NONCE_JSON}")
echo "Message:"
echo "${MESSAGE}"

SIGNATURE=$(TEST_PRIVATE_KEY="${PRIVATE_KEY}" SIGN_MESSAGE="${MESSAGE}" node -r ts-node/register "${SCRIPT_DIR}/sign.ts")
echo "Signature: ${SIGNATURE}"

VERIFY_PAYLOAD=$(node -e "const payload = { message: process.argv[1], signature: process.argv[2] }; console.log(JSON.stringify(payload));" "${MESSAGE}" "${SIGNATURE}")

echo "Verify response:"
curl -s -X POST "${BASE_URL}/auth/verify" \
  -H "Content-Type: application/json" \
  -d "${VERIFY_PAYLOAD}"
echo
