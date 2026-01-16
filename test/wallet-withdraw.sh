#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)/_env.sh"
require_token

AMOUNT="${1:-}"
TX_HASH="${2:-}"

if [ -z "${AMOUNT}" ]; then
  echo "Usage: $0 <amount> [txHash]" >&2
  exit 1
fi

if [ -n "${TX_HASH}" ]; then
  PAYLOAD=$(node -e "console.log(JSON.stringify({ amount: process.argv[1], txHash: process.argv[2] }))" "${AMOUNT}" "${TX_HASH}")
else
  PAYLOAD=$(node -e "console.log(JSON.stringify({ amount: process.argv[1] }))" "${AMOUNT}")
fi

curl -s -X POST "${BASE_URL}/wallet/withdraw" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "${PAYLOAD}"
echo
