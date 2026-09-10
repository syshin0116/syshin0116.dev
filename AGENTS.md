# syshin0116.dev - AI Working Guide

`AGENTS.md` is the canonical instruction file. `CLAUDE.md` links to it for Claude Code and Anthropic Routines.

## What this repo is

Personal blog for syshin0116 at https://syshin0116.dev (also deployed at https://syshin0116.vercel.app), used as a testbed for two things:

1. **The LLM Wiki pattern.**
   - Existing posts under `content/AI/`, `content/Dev/`, `content/Tools/`, etc. are **immutable source material**.
   - A curated knowledge layer is built at `content/wiki/`.
2. **RAG retrieval-method evaluation.** `agent/` exists to implement and compare many
   retrieval methods; the blog is the corpus because the owner knows it best and it is
   already preprocessed. **Answering blog questions well is a side effect, not the goal.**
   Read [`docs/adr/0008`](docs/adr/0008-chatbot-is-a-rag-evaluation-testbed.md) **before
   proposing any simplification of the retrieval layer** - arguments from "the corpus is
   only 336 files" are correct for a product and backwards here. The method catalogue is
   [`docs/reference/retrieval-methods.md`](docs/reference/retrieval-methods.md).

## Repo layout

```
content/
├── AI/, Dev/, Events/, Others/, Projects/, Study/, Tools/   ← source posts (immutable)
└── wiki/                                                     ← curated knowledge layer
agent/    Python RAG agent - the retrieval-method testbed (branch + PR, see rule 2)
web/      Next.js + Nuartz frontend, incl. the chat UI (branch + PR, see rule 2)
.agents/skills/   shared skill definitions - see each SKILL.md frontmatter for when to use
```

## Hard rules

1. **Never modify source posts.** Source-post `.md` files under `content/`, outside `content/wiki/`, are read-only. Repository instructions and system documentation under `docs/` may be updated through PRs. If something looks wrong in a post, surface it to the user - do not edit.
2. **Changes to `web/`, `agent/`, and build/deploy config go through a branch and a PR** - never a direct commit to `main`, and never merge on red CI. See [`docs/adr/0003`](docs/adr/0003-agent-code-changes-via-pr.md).
3. **All `content/wiki/` work goes through skills.** Don't write to `content/wiki/` ad-hoc - use the relevant skill, which carries the full contract.
4. **Never commit build artifacts.** `.next/`, `node_modules/`, `.generated/`, etc.
5. **Propose a decision record when a decision lands.** When a structural or hard-to-reverse choice is made (content taxonomy, wiki contract, frontmatter schema, skill contract, a new dependency, deploy surface), propose a one-line entry for [`DECISIONS.md`](DECISIONS.md) yourself - do not wait to be asked. Promote an entry to a full ADR in `docs/adr/` only once it proves durable. Before changing an established pattern, read `DECISIONS.md` first.

## Worktrees

- Before editing, run `git fetch origin main` and create a dedicated task branch and worktree from the freshly fetched `origin/main`. Never branch from an unrelated task branch or an unchecked local `main`. If `origin` or network access is unavailable, inspect the provided checkout, record its verified local base commit and the fetch limitation, and use that base without resetting the checkout. Fetch and reconcile with `origin/main` before final integration when access is available.
- If the user requests updating local `main`, fast-forward it only after confirming it has no local-only commits or work in progress. Do not switch or reset another active worktree.
- Use one worktree per task. Reuse the task's existing worktree for follow-ups; do not create duplicate branches for the same change. A client-provided worktree is sufficient after checking its base and status.
- Keep the primary checkout and unrelated changes untouched. Stop only for a conflict that requires an owner decision; do not stash, discard, or commit someone else's work.
- Before starting a local server, check existing processes and ports. Record the worktree, revision, port, and process you start. Isolate ports and any mutable test data; stop only your own processes.
- Remove manually created worktrees after merge or abandonment, once all changes are preserved. Keep worktrees needed for active review.

## Verification

Use the existing commands and workflows; do not copy another project's Make targets or assume hooks are installed. Run checks appropriate to the changed behavior before pushing and report unavailable checks explicitly.

| Changed area | Verification source |
| --- | --- |
| `web/` | `web/package.json` and `ci/web` in `.github/workflows/ci.yml`: prebuild, tests, lint, typecheck, build, and browser journeys for the affected UI |
| `agent/` | `ci/agent` and `ci/native-apv2` in `.github/workflows/ci.yml`; include database and protocol checks when their contracts change |
| `eval/` | `ci/eval` in `.github/workflows/ci.yml`; preserve retrieval-method breadth and reproducibility |
| Infrastructure and delivery | `ci/infra`, the relevant delivery workflow, and its runbook; static checks do not authorize deployment |
| `content/wiki/` | The wiki skill and `wiki/verify` |
| Instructions and docs | Check links and commands against the repository, run `git diff --check`, and keep `CLAUDE.md` as a relative symlink to `AGENTS.md` |

For UI changes, use `bc-ui-verification` when it is available in the session skill catalog. Otherwise use the existing `web/package.json` browser commands (`bun run test:browser` for chat and `bun run test:site` for site routes, from `web/`) and their Playwright configuration. Retain evidence for affected desktop/mobile states. A local quick check is not a production or merge verification. New behavior needs meaningful regression coverage; prose and styling-only changes do not need tests that merely repeat their implementation.

## Kaneo

- Use `https://kaneo.local`, with MCP endpoint `https://kaneo.local/api/mcp`. Do not copy the competition project's cloud endpoint, workspace, project IDs, or `FIN` prefix.
- Default workspace: `syshin0116` (`ZQYlQlH6msK68Hh0DowBkKYAKVPQxilz`). Resolve this repository's project by its verified repository mapping before writing; never select by a similar name or invent an ID.
- Discover `kaneo-task` in the session skill catalog or repository `.agents/skills/` first. On the owner's machine, the shared fallback is `~/Documents/github/personal/.agents/skills/kaneo-task/SKILL.md`. Use the available skill to create or strengthen tasks and ADRs, checking for an existing task first. If no copy is available, continue repository work, report the missing skill, and leave Kaneo writes pending; never invent its workflow or call undocumented endpoints.
- Track implementation with a linked task. On starting work, move it to the project's confirmed in-progress state and assign only a verified authorized identity. On opening a PR, move its covered tasks to in-review; mark them done only after the work is merged and required validation is complete.
- Keep durable repository decisions in `DECISIONS.md` and `docs/adr/` under the existing contract. Link a consequential decision's Kaneo discussion to that record instead of creating competing sources of truth.
- If MCP or authentication is unavailable, report the blocker and leave task writes pending. Do not bypass it with undocumented API calls or claim a task was registered.

## Commits and pull requests

- Use concise commit and PR titles such as `fix(web): 사이드바 현재 글 표시 정리`. Include the confirmed Kaneo task identifier when one exists; never fabricate a task number.
- Fill `.github/pull_request_template.md` in Korean with the final behavior, actual validation, and material limitations. Link all covered Kaneo tasks. Use `Closes #<n>` only for a verified GitHub issue; do not assume Kaneo mirroring or branch-name automation exists here.
- Update affected system documentation in the same PR, following this repository's existing frontmatter conventions.
- Read review comments and address or explicitly explain each finding before merge. If automated review is running, wait for its result; a reaction alone does not prove all checks passed.
- Fetch the latest `origin/main` before final integration, resolve any conflicts, and rerun affected checks after changes. Never rewrite another contributor's branch history or merge with required checks failing or pending.
- Before merging, require `ci/check`, `protocol/compat`, and `wiki/verify` on the candidate revision. Use the repository's configured merge method; do not import another project's rebase-only policy.
- After merge, verify the covered Kaneo task states. Do not assume automatic completion. Never add AI attribution or session links to commits, PRs, or documentation.
