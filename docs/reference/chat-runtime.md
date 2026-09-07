# Chat runtime

The blog is the known corpus for comparing retrieval methods. Search tools and
method identities belong to that evaluation surface. A vector store is a separate
retrieval-method addition, not a prerequisite for this runtime migration.

## Execution

- Aegra owns threads, checkpoints, runs, cancellation, and Agent Protocol v2 delivery.
  Its current streaming implementation consumes LangGraph v3 events. Framework event
  version 3 and wire protocol version 2 are different version numbers.
- Deep Agents declares read-only specialists. The official
  `CodeInterpreterMiddleware(subagents=True)` exposes JavaScript `task(...)`; the model
  chooses subquestions and search methods at runtime and can await independent tasks
  with `Promise.all`. Simple lookups can call a search tool directly.
- Compiled specialists preserve the repository's state isolation and shared run budget.
  Both direct `task` calls and interpreter-dispatched tasks reserve from that same
  budget. Explicit offline evaluation flags keep interpreter and subagent arms separate.
- assistant-ui's `useStreamRuntime` from `@assistant-ui/react-langchain` owns message
  assembly, loading, run submission, stop, and resume through `@langchain/react`.
  `AegraThreadAdapter` only supplies thread-list metadata operations.
- Inspection uses the official channel hook and `ThreadStream.onEvent` for nested
  progress. There is no application SSE transport, message assembler, run polling loop,
  submit nonce, or cancellation credential snapshot.

Exact framework pins live in [agent/pyproject.toml](../../agent/pyproject.toml),
[web/package.json](../../web/package.json), and their lockfiles. The reviewed upstream
schemas and generated bindings live in
[agent-protocol.lock.json](../../protocol/agent-protocol.lock.json).

## Public boundary

The authenticated SDK client retains identity validation, one bounded token refresh,
and the existing origin restriction. Guest requests retain ownership checks, input
limits, read-only tools, and the shared spend reservation.

Guest stream subscriptions use Aegra's `EventStreamRequest` schema, including native
`values`, `checkpoints`, replay cursors, and namespace filters. The outgoing public
projection exposes root answer messages and reviewed progress. It strips private graph
state, reasoning, arbitrary tool arguments/results, and unreviewed custom events.
Checkpoint tasks preserve only matching, sanitized root interrupt identities.

Aegra can emit a nested copy of a root interrupt before suppressing its duplicate.
The guest projection publishes a schema-valid copy at the public root; a resume still
has to match the authoritative root checkpoint id. Unreviewed nested payloads are
ignored. The UI sends an explicit interrupt id on retries through the official API.

## UI and evaluation detail

The chat shows the query, search method, elapsed time, and linked sources. Fingerprints,
implementation ids, corpus revisions, and truncation bookkeeping stay in inspection
contracts and evaluation records. They identify which experiment produced a result;
they do not help a visitor read an answer.

Conversation editing, forks, regeneration, and deletion stay unavailable until the
server supports their required persistence semantics. No controls for configuring
specialist inventories or orchestration graphs are added.

## References

- [Deep Agents dynamic subagents](https://docs.langchain.com/oss/python/deepagents/dynamic-subagents)
- [Aegra streaming](https://docs.aegra.dev/guides/streaming)
- [assistant-ui LangChain runtime](https://www.assistant-ui.com/docs/runtimes/langchain)
