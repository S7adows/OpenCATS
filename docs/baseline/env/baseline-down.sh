#!/usr/bin/env bash
# OpenCATS Phase 0.5 baseline — ENVIRONMENT-ONLY tear-down. Removes the containers and the
# database volume of a baseline started by baseline-up.sh. The runtime copy in <work-dir>/app
# is left on disk (delete it yourself if you no longer need it).
# usage: docs/baseline/env/baseline-down.sh <work-dir>
set -euo pipefail
WORK=$(cd "${1:?usage: baseline-down.sh <work-dir>}" && pwd)
ENV_DIR=$(cd "$(dirname "$0")" && pwd)
export OPENCATS_APP_DIR="$WORK/app" OPENCATS_LOG_DIR="$WORK/logs"
docker compose -p "${OPENCATS_BASELINE_PROJECT:-opencats-baseline}" -f "$ENV_DIR/docker-compose.yml" down -v
