#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)/_env.sh"
require_token

curl -s "${BASE_URL}/wallet/balance" \
  -H "Authorization: Bearer ${TOKEN}"
echo
