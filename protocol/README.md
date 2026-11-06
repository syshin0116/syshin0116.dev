# Agent Protocol v2 contract

This directory pins the streaming contract used by the RAG restack. The lock
points to an immutable upstream commit, and the generated Python and TypeScript
bindings are byte-for-byte copies of that release.

## Provenance

- Agent Protocol: `langchain-ai/agent-protocol`
  `langchain-protocol==0.0.20`,
  commit `1061307cfc978139f40d648241d54aa5c65ddda5`
- Aegra runtime: `ibbybuilds/aegra` `v0.11.0`,
  commit `392a5457b25754cdc828f14b0053abdefe8b6766`
- Canonical schema: upstream `streaming/protocol.cddl`
- Fixture wire profile: the official generated snake_case bindings

The exact OpenAPI, CDDL, upstream package manifest, pnpm lock/workspace,
Python fixup, generated bindings, and Aegra implementation hashes are in
[`agent-protocol.lock.json`](agent-protocol.lock.json). The generator runtime
is also fixed to Node 24.19.0, Corepack 0.35.0, pnpm 10.33.0, Python 3.12,
`cddl` 0.20.1, `cddl2py` 0.2.2, and `cddl2ts` 0.9.1. A future protocol bump
must update the lock, regenerate both bindings from that revision, update the
fixtures, and rerun the complete P0 compatibility gate.

## Reproducible codegen gate

Code generation has an explicit network boundary. `prepare` downloads only
the files named by the exact upstream commit, verifies each digest, and runs a
frozen pnpm install with lifecycle scripts disabled. `verify` performs no
downloads: it validates CDDL, regenerates both bindings repeatedly, and
requires three-way byte equality between regenerated, upstream-committed, and
repo-vendored files.

```bash
protocol_codegen_workspace="$(mktemp -d)"
uv run --no-project --python 3.12 python scripts/verify_protocol_codegen.py prepare \
  --workspace "$protocol_codegen_workspace"
uv run --no-project --python 3.12 python scripts/verify_protocol_codegen.py verify \
  --workspace "$protocol_codegen_workspace" \
  --repeat 5
```

The pnpm integrity lock fixes package bytes and `--ignore-scripts` prevents
install lifecycle execution. The `cddl`, `cddl2py`, and `cddl2ts` binaries are
still third-party executable code; exact pins do not prove maintainer intent.
Permanent byte comparison is also the cross-platform determinism gate rather
than an assumption based on one development machine.

## Offline gate

The fixture validator never fetches the network:

```bash
python scripts/protocol_contract.py
python -m unittest discover -s protocol/tests -v
python scripts/smoke.py
```

The TypeScript side uses an isolated TypeScript 5.9.3 lock rather than the web
application dependency tree. It converts all committed JSON records to
`as const satisfies` literals against the real generated binding, compiles
them, then replays event shape coverage and the Aegra `value` to `payload`
translation at runtime. Generated fixture source and JavaScript output live
only under the runner's temporary directory.

Fixtures cover content-block assembly, tool and run lifecycles, nested
namespaces, sequence replay after disconnect, HITL commands, structured errors,
the retrieval-only `syshin.rag.inspection.v1` custom event, and the Aegra
dialect translation. The inspection fixture is the backend producer's
canonical full schema for later TypeScript consumers. It declares
`delivery: "live-run-only"` and deliberately has no replay expectation because
the in-memory custom-event broker is not a durable journal. The translation
fixture stores both the raw
Aegra wire event and the expected normalized generated-binding event, so the
dialect is never silently presented as upstream-conforming. In addition to
generated-binding validation, the local validator checks ordering, command
correlation, non-interleaved content blocks, and replay deduplication.

## Explicit live gate

No server is contacted unless `--base-url` is present:

```bash
python scripts/smoke.py \
  --base-url http://127.0.0.1:8000 \
  --assistant-id agent \
  --profile aegra
```

Pass `--token-env AGENT_PROTOCOL_TOKEN` when authentication is enabled. The live
gate creates one client-generated thread, runs two Korean turns, deliberately
disconnects during a content delta, reconnects with `since`, requires a tool
lifecycle, reloads the thread, and verifies a structured command error.
`--require-hitl` and `--require-nested` promote those capabilities from fixture
gates to live requirements.

Process restart, trusted identity injection, and store namespace isolation need
runtime orchestration and credentials; they belong to the Aegra runtime/security
PR rather than this transport-only contract.

## Aegra 0.11.0 gaps

Aegra's SSE endpoint is
`POST /threads/{thread_id}/stream/events`; the locked upstream OpenAPI endpoint
is `POST /threads/{thread_id}/stream`. This is why the smoke profile is explicit.
Aegra also lacks the upstream WebSocket endpoint and implements only
`run.start` and `input.respond` from the command catalogue.
The `input.respond` implementation forwards the `update` and `goto` fields added
by Agent Protocol 0.0.18, but no live fixture covers them, so they stay unadvertised.

One payload difference is more serious: the generated
`InputRequestedData` binding requires `payload`, while Aegra emits `value` to
match the stock LangGraph SDK. `normalize_aegra_event()` is the one permitted
translation boundary and rewrites only that verified field before official
binding validation. The raw/normalized fixture pair fails if the translation
expands or drifts. A live HITL run remains a compatibility gate, not an assumed
success.

The JavaScript SDK has a second, browser-side gap. Aegra answers commands with
`applied_through_seq: 0`, so `@langchain/langgraph-sdk` 1.12.7 and later place the
interrupt replay cutoff from root `lifecycle` events, which they expect to be named
`synth:<run_id>:...`. Aegra names them `<run_id>:running:<n>`,
`<run_id>_event_<n>:<i>`, and `<run_id>:status-end:<i>`. `withAegraRunBoundaries()`
in `web/components/assistant/runtime/aegra-run-boundary.ts` renames only those root
events. Remove it once Aegra emits a name the SDK reads.
