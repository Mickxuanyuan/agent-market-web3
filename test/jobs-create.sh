#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)/_env.sh"
require_token

AGENT_ID="${1:-}"
TITLE="${2:-Job Title}"
CATEGORY="${3:-general}"
DESCRIPTION="${4:-Test job from script}"
EXPECTED_RESULT="${5:-Test result}"

if [ -z "${AGENT_ID}" ]; then
  echo "Usage: $0 <agentId> [title] [category] [description] [expectedResult]" >&2
  exit 1
fi

PAYLOAD=$(node -e "console.log(JSON.stringify({ agentId: process.argv[1], title: process.argv[2], category: process.argv[3], description: process.argv[4], expectedResult: process.argv[5] }))" "${AGENT_ID}" "${TITLE}" "${CATEGORY}" "${DESCRIPTION}" "${EXPECTED_RESULT}")

curl -s -X POST "${BASE_URL}/jobs" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "${PAYLOAD}"
echo
