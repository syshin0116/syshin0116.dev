#!/usr/bin/env bash
# Deploy origin/main to the home-server agent when its ci/check is green.
# Idempotent: exits early when the running image already matches origin/main.
# Usage: deploy.sh [--force]   (--force skips the ci/check gate, for manual recovery only)
set -euo pipefail
export PATH=/opt/homebrew/bin:/usr/local/bin:$PATH

REPO_DIR=${REPO_DIR:-$HOME/srv/syshin0116.dev}
STATE_DIR=${STATE_DIR:-$HOME/srv/agent}
GITHUB_REPO=syshin0116/syshin0116.dev
FORCE=${1:-}

log() { printf '%s %s\n' "$(date -u +%FT%TZ)" "$*"; }

# Wrapped in main so bash parses the whole body before the self-refresh below.
main() {
  cd "$REPO_DIR"
  git fetch -q origin main
  sha=$(git rev-parse origin/main)
  short=${sha:0:7}

  if [[ -f "$STATE_DIR/deployed-sha" && "$(cat "$STATE_DIR/deployed-sha")" == "$sha" && -z "$FORCE" ]]; then
    exit 0
  fi

  if [[ "$FORCE" != "--force" ]]; then
    conclusion=$(curl -fsS "https://api.github.com/repos/$GITHUB_REPO/commits/$sha/check-runs?check_name=ci/check" \
      | python3 -c 'import json,sys; runs=json.load(sys.stdin)["check_runs"]; print(runs[0]["conclusion"] if runs else "missing")')
    if [[ "$conclusion" != "success" ]]; then
      log "skip $short: ci/check is $conclusion"
      exit 0
    fi
  fi

  log "deploy $short"
  git checkout -q --detach "$sha"
  docker build -q --build-arg "VCS_REF=$sha" -t "syshin0116-agent:$short" . >/dev/null

  compose() {
    AGENT_IMAGE_TAG=$short docker compose --project-directory "$STATE_DIR" \
      -f "$REPO_DIR/infra/home-server/compose.yaml" --env-file "$STATE_DIR/.env" "$@"
  }

  compose up -d --wait postgres
  compose run --rm migrate
  compose up -d --wait agent maintenance

  port=$(grep -E '^AGENT_PORT=' "$STATE_DIR/.env" | cut -d= -f2)
  base="http://127.0.0.1:${port:-18080}"
  curl -fsS "$base/live" >/dev/null
  curl -fsS "$base/ready" >/dev/null
  status=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$base/threads" -H 'content-type: application/json' -d '{}')
  if [[ "$status" != "401" ]]; then
    log "smoke failed: unauthenticated POST /threads returned $status"
    exit 1
  fi

  echo "$sha" > "$STATE_DIR/deployed-sha"
  # The launchd job runs the copy in STATE_DIR; refresh it from the deployed revision.
  install -m 755 "$REPO_DIR/infra/home-server/deploy.sh" "$STATE_DIR/deploy.sh"
  # Keep the three newest images so a rollback is one `AGENT_IMAGE_TAG=<old> compose up` away.
  docker image ls syshin0116-agent --format '{{.Tag}}' | tail -n +4 \
    | xargs -r -I{} docker image rm "syshin0116-agent:{}" >/dev/null 2>&1 || true
  log "deployed $short"
}

main "$@"
exit
