#!/usr/bin/env bash
# OpenCATS preview environment — ENVIRONMENT-ONLY control script. Not part of the application.
#
#   preview.sh up     <work-dir> [--tunnel]   build runtime copy of git HEAD, start, seed demo data
#   preview.sh reset  <work-dir>              wipe + reseed the demo database and uploads (keeps URL and passwords)
#   preview.sh tunnel <work-dir>              (re)start the public HTTPS tunnel and record its URL
#   preview.sh status <work-dir>              containers + local health (never prints secrets)
#   preview.sh down   <work-dir>              stop everything and delete the database volume
#
# Secrets (demo/admin passwords, public URL) are written to <work-dir>/secrets/ (mode 600) and are
# never printed. The application runs unmodified; see docs/baseline/PREVIEW_ENVIRONMENT.md.
#
# Optional environment:
#   PREVIEW_PORT (8090)  PREVIEW_PROJECT (opencats-preview)  PREVIEW_GATEWAY_IMAGE (nginx:1.27-alpine)
#   PREVIEW_DEMO_USERNAME (demo.recruiter)  PREVIEW_DEMO_PASSWORD / PREVIEW_ADMIN_PASSWORD (random if unset)
#   PREVIEW_TUNNEL_TOKEN + PREVIEW_PUBLIC_URL   use a named Cloudflare tunnel (stable URL) instead of a quick tunnel
#   PREVIEW_NODE_PATH    node_modules dir that contains playwright (default: global npm root)
#   COMPOSER_DOCKER_ARGS / COMPOSER_FLAGS / COMPOSER_AUTH   passed to the Composer step
set -euo pipefail

CMD=${1:?usage: preview.sh up|reset|tunnel|status|down <work-dir> [--tunnel]}
WORK_ARG=${2:?usage: preview.sh $CMD <work-dir>}
OPT=${3:-}

HERE=$(cd "$(dirname "$0")" && pwd)
REPO=$(git -C "$HERE" rev-parse --show-toplevel)
mkdir -p "$WORK_ARG"
WORK=$(cd "$WORK_ARG" && pwd)
APP="$WORK/app"; LOGS="$WORK/logs"; SECRETS="$WORK/secrets"

export PREVIEW_PROJECT=${PREVIEW_PROJECT:-opencats-preview}
export PREVIEW_PORT=${PREVIEW_PORT:-8090}
export PREVIEW_APP_DIR="$APP" PREVIEW_LOG_DIR="$LOGS"
export PREVIEW_GATEWAY_IMAGE=${PREVIEW_GATEWAY_IMAGE:-nginx:1.27-alpine}
if [ -n "${PREVIEW_TUNNEL_TOKEN:-}" ]; then
  export PREVIEW_TUNNEL_COMMAND="tunnel --no-autoupdate run"
fi
DC="docker compose -f $HERE/docker-compose.preview.yml"
BASE="http://127.0.0.1:$PREVIEW_PORT"
NODE_PATH=${PREVIEW_NODE_PATH:-$(npm root -g 2>/dev/null || true)}

log() { echo "[preview] $*"; }

randpw() {  # 4 groups of 4 unambiguous characters, e.g. Kq7m-R2vT-x9Pb-Hn4c
  local s; s=$(LC_ALL=C tr -dc 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789' < /dev/urandom | head -c 16)
  echo "${s:0:4}-${s:4:4}-${s:8:4}-${s:12:4}"
}

load_credentials() {
  if [ ! -f "$SECRETS/credentials.env" ]; then
    umask 077
    {
      echo "PREVIEW_DEMO_USERNAME=${PREVIEW_DEMO_USERNAME:-demo.recruiter}"
      echo "PREVIEW_DEMO_PASSWORD=${PREVIEW_DEMO_PASSWORD:-$(randpw)}"
      echo "PREVIEW_ADMIN_PASSWORD=${PREVIEW_ADMIN_PASSWORD:-$(randpw)}"
    } > "$SECRETS/credentials.env"
  fi
  # shellcheck disable=SC1091
  set -a; . "$SECRETS/credentials.env"; set +a
}

wait_db() {
  for _ in $(seq 1 90); do
    if $DC logs db 2>/dev/null | grep -q "port: 3306" && \
       $DC exec -T db mysql -ucats -ppassword cats_dev -e 'SELECT 1' >/dev/null 2>&1; then return 0; fi
    sleep 2
  done
  echo "MariaDB did not become ready" >&2; return 1
}

seed() {
  log "database: empty install (installer SQL) -> schema migrations -> finalize"
  $DC exec -T -w /var/www/public php php /baseline-env/seed_install.php empty
  local code; code=$(curl -s -o "$LOGS/first-request.html" -w '%{http_code}' "$BASE/index.php")
  log "first request (runs pending schema migrations): HTTP $code"
  $DC exec -T -w /var/www/public php php /baseline-env/seed_install.php finalize
  # Rotate the built-in admin password before anything else, so admin/admin is never valid on a
  # preview (not even while a public tunnel is up during a reset).
  log "rotating the built-in admin password"
  $DC exec -T db mysql -uroot -p"${PREVIEW_DB_ROOT_PASSWORD:-root}" cats_dev \
    -e "UPDATE user SET password = MD5('${PREVIEW_ADMIN_PASSWORD}') WHERE user_name = 'admin'" 2>/dev/null
  log "demo data: created through the application UI (fictional records only)"
  PREVIEW_BASE_URL="$BASE" NODE_PATH="$NODE_PATH" node "$HERE/demo-seed.js" > "$LOGS/demo-seed.log" 2>&1 \
    || { tail -40 "$LOGS/demo-seed.log" >&2; return 1; }
  tail -3 "$LOGS/demo-seed.log"
}

start_tunnel() {
  $DC --profile tunnel up -d cloudflared >/dev/null
  if [ -n "${PREVIEW_TUNNEL_TOKEN:-}" ]; then
    : "${PREVIEW_PUBLIC_URL:?PREVIEW_PUBLIC_URL is required with PREVIEW_TUNNEL_TOKEN}"
    (umask 077; echo "$PREVIEW_PUBLIC_URL" > "$SECRETS/preview-url")
  else
    local url=""
    for _ in $(seq 1 60); do
      url=$($DC logs cloudflared 2>/dev/null | grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' | tail -1 || true)
      [ -n "$url" ] && break; sleep 2
    done
    [ -n "$url" ] || { echo "tunnel URL not found (see: $DC logs cloudflared)" >&2; return 1; }
    (umask 077; echo "$url" > "$SECRETS/preview-url")
  fi
  log "public tunnel is up (URL stored in $SECRETS/preview-url)"
}

case "$CMD" in
  up)
    if [ -e "$APP" ]; then echo "error: $APP exists — use 'reset', or 'down' and remove $WORK" >&2; exit 1; fi
    mkdir -p "$APP" "$LOGS/php" "$SECRETS"; chmod 777 "$LOGS/php"; chmod 700 "$SECRETS"
    log "runtime copy of git HEAD $(git -C "$REPO" rev-parse --short HEAD) (application files only)"
    git -C "$REPO" archive HEAD | tar -x -C "$APP"
    git -C "$REPO" rev-parse HEAD > "$WORK/SOURCE_COMMIT"
    # Same exclusions as the upstream release archive, plus docs/: none of it is application code.
    rm -rf "$APP/.github" "$APP/docker" "$APP/test" "$APP/ci" "$APP/docs"
    log "composer install --no-dev from composer.lock (PHP 7.2 image)"
    # shellcheck disable=SC2086
    docker run --rm ${COMPOSER_DOCKER_ARGS:-} ${COMPOSER_AUTH:+-e COMPOSER_AUTH} -v "$APP":/app -w /app \
      opencats/php-base:7.2-fpm-alpine composer install --no-dev --no-progress ${COMPOSER_FLAGS:---prefer-dist} \
      > "$LOGS/composer.log" 2>&1 || { tail -20 "$LOGS/composer.log" >&2; exit 1; }
    touch "$APP/INSTALL_BLOCK"
    chmod 777 "$APP/attachments" "$APP/temp" "$APP/upload"
    load_credentials
    log "starting containers (project $PREVIEW_PROJECT, gateway on 127.0.0.1:$PREVIEW_PORT)"
    $DC up -d php web db gateway >/dev/null 2>&1
    wait_db
    seed
    if [ "$OPT" = "--tunnel" ]; then start_tunnel; fi
    log "ready: local gateway $BASE — credentials in $SECRETS/credentials.env"
    ;;
  reset)
    load_credentials
    log "resetting demo database and uploaded files"
    find "$APP/attachments" -mindepth 1 -maxdepth 1 -type d -exec rm -rf {} +
    find "$APP/upload" -mindepth 1 -maxdepth 1 -type d -exec rm -rf {} +
    $DC exec -T db mysql -uroot -p"${PREVIEW_DB_ROOT_PASSWORD:-root}" \
      -e "DROP DATABASE cats_dev; CREATE DATABASE cats_dev; GRANT ALL ON cats_dev.* TO 'cats'@'%';" 2>/dev/null
    $DC restart php >/dev/null 2>&1   # drop PHP sessions that point at deleted rows
    seed
    log "reset complete (same URL, same credentials)"
    ;;
  tunnel)
    load_credentials; start_tunnel ;;
  status)
    $DC ps
    echo "local health: $(curl -s -o /dev/null -w '%{http_code}' "$BASE/index.php")"
    [ -f "$SECRETS/preview-url" ] && echo "public URL recorded in $SECRETS/preview-url" || echo "no public URL recorded"
    ;;
  down)
    $DC --profile tunnel down -v
    ;;
  *) echo "unknown command $CMD" >&2; exit 2 ;;
esac
