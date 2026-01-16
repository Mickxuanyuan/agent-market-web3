#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)/_env.sh"
require_token

JOB_ID="${1:-}"
RESULT_TEXT="${2:-Result text}"
RESULT_META_JSON="${3:-}"

if [ -z "${JOB_ID}" ]; then
  echo "Usage: $0 <jobId> [resultText] [resultMetaJson]" >&2
  exit 1
fi

if [ -n "${RESULT_META_JSON}" ]; then
  PAYLOAD=$(node -e "console.log(JSON.stringify({ resultText: process.argv[1], resultMetaJson: JSON.parse(process.argv[2]) }))" "${RESULT_TEXT}" "${RESULT_META_JSON}")
else
  PAYLOAD=$(node -e "console.log(JSON.stringify({ resultText: process.argv[1] }))" "${RESULT_TEXT}")
fi

curl -s -X POST "${BASE_URL}/jobs/${JOB_ID}/submit-result" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "${PAYLOAD}"
echo
