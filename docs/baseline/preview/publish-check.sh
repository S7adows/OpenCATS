#!/usr/bin/env bash
# OpenCATS preview — ENVIRONMENT-ONLY. Publishes the preview result as a GitHub check run
# ("OpenCATS Preview") on the deployed commit.
#   * output.summary: verification table + commit + expiry (no secrets)
#   * output.text:    URL and credentials, encrypted with docs/baseline/preview/recipient.pub.pem
#                     (RSA-4096, OAEP-SHA256). Only the holder of the matching private key can
#                     read them; workflow logs and artifacts never contain them.
# usage: publish-check.sh <work-dir> <verify-dir> <expires-iso8601>
# env:   GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_SHA, GITHUB_SERVER_URL, GITHUB_RUN_ID
set -euo pipefail
WORK=$1; VERIFY=$2; EXPIRES=$3
HERE=$(cd "$(dirname "$0")" && pwd)

ok=false; [ -f "$VERIFY/results.json" ] && ok=$(jq -r '.ok' "$VERIFY/results.json")
url=""; [ -f "$WORK/secrets/preview-url" ] && url=$(cat "$WORK/secrets/preview-url")
# shellcheck disable=SC1091
[ -f "$WORK/secrets/credentials.env" ] && { set -a; . "$WORK/secrets/credentials.env"; set +a; }

payload=$(jq -cn --arg url "$url" --arg u "${PREVIEW_DEMO_USERNAME:-}" --arg p "${PREVIEW_DEMO_PASSWORD:-}" \
  --arg a "${PREVIEW_ADMIN_PASSWORD:-}" --arg c "${GITHUB_SHA:0:7}" --arg e "$EXPIRES" \
  '{url:$url,user:$u,pass:$p,admin:$a,commit:$c,expires:$e}')
cipher=$(printf '%s' "$payload" | openssl pkeyutl -encrypt -pubin -inkey "$HERE/recipient.pub.pem" \
  -pkeyopt rsa_padding_mode:oaep -pkeyopt rsa_oaep_md:sha256 | base64 -w0)

run_url="$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID"
if [ "$ok" = "true" ]; then conclusion=success; title="Preview online and verified — until $EXPIRES"
else conclusion=failure; title="Preview verification failed — see summary"; fi
summary="**Commit:** \`${GITHUB_SHA:0:7}\` · **Online until:** $EXPIRES · **Run:** $run_url

The preview URL and the demo credentials are delivered privately (encrypted below); they are not in logs or artifacts.

$( [ -f "$VERIFY/summary.md" ] && cat "$VERIFY/summary.md" || echo '_verification did not produce a summary_' )"
text="ENCRYPTED-ACCESS-DETAILS v1 (RSA-OAEP-SHA256, key docs/baseline/preview/recipient.pub.pem)
$cipher"

body=$(jq -n --arg name "OpenCATS Preview" --arg sha "$GITHUB_SHA" --arg c "$conclusion" --arg t "$title" \
  --arg s "$summary" --arg x "$text" --arg d "$run_url" \
  '{name:$name, head_sha:$sha, status:"completed", conclusion:$c, details_url:$d, output:{title:$t, summary:$s, text:$x}}')
if [ -n "${PUBLISH_DRY_RUN:-}" ]; then echo "$body"; exit 0; fi
printf '%s' "$body" | curl -sS -f -X POST -H "Authorization: Bearer $GITHUB_TOKEN" -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/$GITHUB_REPOSITORY/check-runs" -d @- > /dev/null
echo "check run published: $conclusion"
