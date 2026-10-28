#!/usr/bin/env bash
# Run the locally-runnable half of Application CI before a push.
#
# CI is the authority; this only catches the failures that do not need Postgres,
# Docker, or a GitHub runner, so that a red build is not the first time anyone
# finds out. It reuses the same change detection CI uses, so a push that touches
# nothing testable stays fast.
#
# Usage: scripts/preflight.sh [remote-ref]
set -uo pipefail

cd "$(git rev-parse --show-toplevel)" || exit 1

log() { printf '\n\033[1m== %s\033[0m\n' "$1" >&2; }
fail() { printf '\033[31mpreflight: %s\033[0m\n' "$1" >&2; exit 1; }

# The browser suite binds a fixed fixture port, so two concurrent runs in different
# worktrees would fail each other on the port rather than on the code. Only that
# suite takes the machine-wide lock, and a second run waits for it instead of
# failing. A killed run must not lock later pushes out, so the holder's PID decides
# whether the lock is live or leftover.
lock="${TMPDIR:-/tmp}/syshin0116-preflight-browser.lock"
lock_wait_seconds=600
acquire_browser_lock() {
  local waited=0 holder
  until mkdir "$lock" 2>/dev/null; do
    holder="$(cat "$lock/pid" 2>/dev/null || true)"
    if [[ -z "$holder" ]] || ! kill -0 "$holder" 2>/dev/null; then
      rm -rf "$lock"
      continue
    fi
    (( waited == 0 )) && echo "preflight: waiting for the browser-suite lock (pid $holder)" >&2
    (( waited >= lock_wait_seconds )) && fail "browser-suite lock still held after ${lock_wait_seconds}s (pid $holder)"
    sleep 2
    (( waited += 2 ))
  done
  echo "$$" >"$lock/pid"
}
release_browser_lock() { rm -rf "$lock"; }

# What is about to be pushed. An unpushed branch is compared against main.
head="$(git rev-parse HEAD)"
if base="$(git rev-parse --verify --quiet "@{upstream}")"; then
  :
elif base="$(git rev-parse --verify --quiet origin/main)"; then
  :
else
  fail "cannot resolve a base commit to diff against"
fi
merge_base="$(git merge-base "$base" "$head")" || fail "cannot resolve a merge base"
if [[ "$merge_base" == "$head" ]]; then
  echo "preflight: nothing to push" >&2
  exit 0
fi

changed="$(git diff --no-renames --name-only "$merge_base" "$head")"
touches() { grep -qE "$1" <<<"$changed"; }

web=false
agent=false
queryset=false
touches '^web/' && web=true
touches '^(agent/|eval/|scripts/|Dockerfile|aegra\.json|pyproject\.toml|uv\.lock)' && agent=true
# The known-item query-set is pinned to the content tree, so a content-only push
# goes stale there; ci/eval would be the first to say so otherwise.
touches '^(content/|agent/|eval/|scripts/build_index\.py|uv\.lock)' && queryset=true

if [[ "$web" == false && "$agent" == false && "$queryset" == false ]]; then
  echo "preflight: no web, agent, or content paths changed" >&2
  exit 0
fi

if [[ "$web" == true ]]; then
  log "web: unit tests, lint, types, browser journey"
  ( cd web && bun run test ) || fail "web unit tests failed"
  ( cd web && bun run lint ) || fail "web lint failed"
  ( cd web && bunx tsc --noEmit --incremental false ) || fail "web type check failed"
  acquire_browser_lock
  trap release_browser_lock EXIT
  ( cd web && bun run test:browser ) || fail "web browser tests failed"
  release_browser_lock
  trap - EXIT
fi

if [[ "$agent" == true ]]; then
  log "agent: format, lint, tests"
  ruff_targets=(agent/src agent/tests scripts/build_index.py scripts/ci_changed_components.py
    scripts/upstream_version_audit.py scripts/verify_repository_governance.py
    scripts/verify_vercel_production.py scripts/tests)
  uv run --frozen --package syshin0116-dev-agent ruff check "${ruff_targets[@]}" \
    || fail "ruff check failed"
  uv run --frozen --package syshin0116-dev-agent ruff format --check "${ruff_targets[@]}" \
    || fail "ruff format check failed"

  pytest_log="$(mktemp)"
  trap 'rm -f "$pytest_log"' EXIT
  uv run --frozen --package syshin0116-dev-agent --all-extras \
    pytest -q agent/tests/unit_tests 2>&1 | tee "$pytest_log"
  status="${PIPESTATUS[0]}"
  if [[ "$status" -ne 0 ]]; then
    # content/ is an Obsidian vault here, so .obsidian/ and .DS_Store make the
    # corpus builder's exact filesystem-tree check disagree with the committed
    # tree. That is a local-checkout artifact; CI runs on a clean tree. Let it
    # through only when every failure is that one, so real breakage still blocks.
    # The drift surfaces as fixture-setup ERRORs, and tests sharing that fixture
    # print the cause once, so compare kinds rather than counts: any FAILED line
    # is a real assertion and still blocks.
    drift_errors="$(grep -cE '^ERROR ' "$pytest_log")"
    real_failures="$(grep -cE '^FAILED ' "$pytest_log")"
    drift_cause="$(grep -cE 'content tree contains dirty or untracked entries|content filesystem bytes/modes differ|content tree changed during the build' "$pytest_log")"
    if [[ "$drift_cause" -gt 0 && "$real_failures" -eq 0 && "$drift_errors" -gt 0 ]]; then
      printf '\033[33mpreflight: ignoring %s corpus-tree error(s) caused by untracked files under content/\033[0m\n' \
        "$drift_errors" >&2
    else
      fail "agent tests failed"
    fi
  fi
fi

if [[ "$queryset" == true ]]; then
  log "eval: known-item query-set matches HEAD:content"
  # It builds from the committed tree, so untracked vault files do not matter here.
  uv run --frozen --package syshin0116-dev-eval blogeval generate-known-item --check >/dev/null \
    || fail "known-item query-set is stale; run the command printed above and commit it"
fi

log "preflight passed"
