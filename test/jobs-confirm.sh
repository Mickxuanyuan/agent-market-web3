#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)/_env.sh"
require_token

JOB_ID="${1:-}"

if [ -z "${JOB_ID}" ]; then
  echo "Usage: $0 <jobId>" >&2
  exit 1
fi

curl -s -X POST "${BASE_URL}/jobs/${JOB_ID}/confirm" \
  -H "Authorization: Bearer ${TOKEN}"
echo
