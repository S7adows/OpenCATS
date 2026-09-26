#!/usr/bin/env bash
# OpenCATS Phase 0.5 baseline — ENVIRONMENT-ONLY bring-up script. Not part of the application.
#
# Builds an isolated runtime copy of the COMMITTED tree (git HEAD) in <work-dir>/app, installs
# the PHP dependencies pinned in composer.lock, starts PHP 7.2 + nginx + MariaDB 10.7, and seeds
# an empty database exactly the way the web installer's "empty database" path does.
# The git working tree is never mounted or modified. config.php is used as committed.
#
# usage: docs/baseline/env/baseline-up.sh <work-dir> [host-port]
# optional env:
#   OPENCATS_BASELINE_PROJECT  compose project name (default: opencats-baseline)
#   COMPOSER_DOCKER_ARGS       extra `docker run` args for the Composer step (e.g. proxy settings)
#   COMPOSER_FLAGS             Composer install flags (default: --prefer-dist)
set -euo pipefail

WORK=${1:?usage: baseline-up.sh <work-dir> [host-port]}
PORT=${2:-8080}
PROJECT=${OPENCATS_BASELINE_PROJECT:-opencats-baseline}
ENV_DIR=$(cd "$(dirname "$0")" && pwd)
REPO=$(git -C "$ENV_DIR" rev-parse --show-toplevel)

mkdir -p "$WORK"
WORK=$(cd "$WORK" && pwd)
APP="$WORK/app"
LOGS="$WORK/logs"
if [ -e "$APP" ]; then echo "error: $APP already exists (run baseline-down.sh or use another work dir)" >&2; exit 1; fi
mkdir -p "$APP" "$LOGS/php"
chmod 777 "$LOGS/php"

echo "== 1/5 runtime copy of git HEAD -> $APP"
git -C "$REPO" archive HEAD | tar -x -C "$APP"
git -C "$REPO" rev-parse HEAD > "$WORK/SOURCE_COMMIT"

echo "== 2/5 composer install --no-dev from composer.lock (PHP 7.2 image, Composer 1.8.4)"
# shellcheck disable=SC2086
docker run --rm ${COMPOSER_DOCKER_ARGS:-} -v "$APP":/app -w /app opencats/php-base:7.2-fpm-alpine \
  composer install --no-dev --no-progress ${COMPOSER_FLAGS:---prefer-dist}

echo "== 3/5 environment-only files in the runtime copy"
touch "$APP/INSTALL_BLOCK"                    # installer gate (the installer itself creates this file)
chmod 777 "$APP/attachments" "$APP/temp" "$APP/upload"   # writable data dirs; config.php stays read-only

echo "== 4/5 start containers (project $PROJECT, port $PORT)"
export OPENCATS_APP_DIR="$APP" OPENCATS_LOG_DIR="$LOGS" OPENCATS_PORT="$PORT"
DC="docker compose -p $PROJECT -f $ENV_DIR/docker-compose.yml"
$DC up -d
echo -n "waiting for MariaDB (final server on port 3306)"
for _ in $(seq 1 90); do
  if $DC logs db 2>/dev/null | grep -q "port: 3306" && \
     $DC exec -T db mysql -ucats -ppassword cats_dev -e 'SELECT 1' >/dev/null 2>&1; then echo " ok"; break; fi
  echo -n "."; sleep 2
done

echo "== 5/5 seed: empty install -> schema migrations (first request) -> finalize"
$DC exec -T -w /var/www/public php php /baseline-env/seed_install.php empty
curl -s -o "$LOGS/first-request.html" -w "first request (runs pending schema migrations): HTTP %{http_code}\n" "http://localhost:$PORT/index.php"
$DC exec -T -w /var/www/public php php /baseline-env/seed_install.php finalize

echo
echo "OpenCATS baseline is running: http://localhost:$PORT/   login: admin / admin"
echo "source commit: $(cat "$WORK/SOURCE_COMMIT")"
echo "PHP error log: $LOGS/php/php_errors.log   stop: docs/baseline/env/baseline-down.sh $WORK"
