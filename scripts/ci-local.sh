#!/usr/bin/env bash
set -euo pipefail

# Local replica of the GitHub Actions CI flow:
# build -> deploy backend -> k6 smoke -> deploy FE -> Playwright UI + API tests

WORKERS="${WORKERS:-4}"
BASE_URL="${BASE_URL:-http://localhost:8080}"
SERVICE_API_KEY="${SERVICE_API_KEY:-service-secret}"

cleanup() {
  echo "\n[ci-local] Collecting docker logs..."
  mkdir -p test-results
  docker compose logs --no-color > test-results/compose-logs.txt || true
  echo "[ci-local] Tearing down containers..."
  docker compose down -v || true
}
trap cleanup EXIT

echo "[ci-local] Building images..."
docker compose build --pull

echo "[ci-local] Deploying backend (adapters + api)..."
docker compose up -d adapter-a adapter-b api

echo "[ci-local] Waiting for API to be healthy at ${BASE_URL}/healthz ..."
for i in {1..60}; do
  if curl -fsS "${BASE_URL}/healthz" >/dev/null; then
    echo "[ci-local] API healthy"
    break
  fi
  sleep 2
  if [[ "$i" == "60" ]]; then
    echo "[ci-local] ERROR: API not healthy" >&2
    exit 1
  fi
done

echo "[ci-local] Running k6 smoke..."
docker run --rm --network host \
  -e BASE_URL="${BASE_URL}" \
  -e SERVICE_API_KEY="${SERVICE_API_KEY}" \
  -v "${PWD}/tests/perf":/scripts grafana/k6 \
  run /scripts/k6-smoke.js

# "Deploy" frontend (static UIs are served by API). Restart API to ensure latest static are served.
echo "[ci-local] Deploying frontend (static UIs via API restart)..."
docker compose restart api

# Wait for API health again after restart
echo "[ci-local] Waiting for API to be healthy after restart..."
for i in {1..30}; do
  if curl -fsS "${BASE_URL}/healthz" >/dev/null; then
    echo "[ci-local] API healthy after restart"
    break
  fi
  sleep 1
  [[ "$i" == "30" ]] && { echo "[ci-local] ERROR: API not healthy after restart" >&2; exit 1; }
done

# Retry reachability checks for UI and Demo to avoid transient resets
echo "[ci-local] Verifying /ui and /demo availability..."
for path in "/ui/" "/demo/"; do
  ok=0
  for i in {1..20}; do
    if curl -fsS "${BASE_URL}${path}" | head -n 1 >/dev/null; then ok=1; break; fi
    sleep 1
  done
  if [[ "$ok" -ne 1 ]]; then
    echo "[ci-local] ERROR: ${path} not reachable" >&2
    exit 1
  fi
done

# Run Playwright tests via Makefile
set +e

echo "[ci-local] Running UI tests..."
BASE_URL="${BASE_URL}" make test-ui WORKERS="${WORKERS}"
UI_STATUS=$?

echo "[ci-local] Running API tests..."
BASE_URL="${BASE_URL}" make test-api-only WORKERS="${WORKERS}"
API_STATUS=$?

set -e

if [[ $UI_STATUS -ne 0 || $API_STATUS -ne 0 ]]; then
  echo "[ci-local] One or more test suites failed (ui=$UI_STATUS api=$API_STATUS)" >&2
  exit 1
fi

echo "[ci-local] All suites passed. Artifacts in playwright-report/ and test-results/"
