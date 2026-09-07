---
title: "ADR-0005: Rebuild the chat UI on assistant-ui with an Agent Protocol v2 transport"
description: >
  Replace chat-section.tsx and the vendored prompt-kit layer with assistant-ui's native
  LangGraph runtime over the official Agent Protocol v2 ThreadStream SDK.
when_to_read: >
  Before changing the chat frontend, picking an assistant-ui adapter, or wondering
  why the branch picker always shows 1/1.
tags: [adr, web, chat, assistant-ui, prompt-kit, langgraph, aegra]
status: accepted
date: "2026-07-26"
deciders: ["@syshin0116"]
supersedes:
superseded_by:
updated: "2026-08-15"
owners: ["@syshin0116"]
refs: [../research/aegra-native-stack.md, ../plans/rag-restack.md, 0004-adopt-aegra.md]
template: adr
---

# ADR-0005: Rebuild the chat UI on assistant-ui with an Agent Protocol v2 transport

> **Current runtime amendment (2026-08-15):** the original adoption pins were
> `@assistant-ui/react` 0.15.0 and `@assistant-ui/react-langgraph` 0.14.15. The current
> tested pins are 0.15.13 and 0.14.23. The thin `chat-section.tsx` identity boundary
> remains; the vendored prompt-kit and custom transport are gone.

> **status: accepted.** An earlier draft the same day proposed repairing the existing UI
> and deferring assistant-ui. It was `proposed` so the owner could decide; the owner chose
> assistant-ui, and to be as native to it as possible. That draft also recommended the
> **wrong adapter** - see the decision below.

## Context

The chat is `web/components/chat-section.tsx` (1,054 LOC) over a ~1,769-LOC vendored
prompt-kit layer, driving `@langchain/react` `useStream`. Roughly 893 LOC of the vendored
layer is already dead (`loader.tsx` 499 with 1 of 12 variants used; `source.tsx` 130 and
`blog-search-result.tsx` 134 with zero importers).

The originally stated reason for moving - "assistant-ui has LangGraph compatibility" - does
not survive contact with the code: `@langchain/react` *is* LangChain's own React
integration. The features that feel broken are broken because `chat-section.tsx:72-85`
casts a v0.2-era API onto a v1 hook.

But the backend is now becoming Aegra ([ADR-0004](0004-adopt-aegra.md)), and the owner's
constraint is to be native to Aegra, LangGraph, and assistant-ui together. That changes the
comparison: the question is no longer "repair or replace" but "which client is native to an
Agent Protocol server".

Three findings de-risked this substantially:

- `@assistant-ui/react-langgraph` exposes `useLangGraphRuntime({ stream, load, ... })`, so
  assistant-ui can own the UI/runtime while the application supplies an official
  thread-centric Agent Protocol v2 stream callback. The legacy
  `unstable_createLangGraphStream` helper is not required.
- `@langchain/langgraph-sdk` 1.9.28 has the required native pieces:
  `Client.threads.stream`, `ThreadStream.submitRun/respondInput`, `MessageAssembler`, and
  a dedicated lifecycle watcher connection.
- Aegra's AP v2 stream filter is security-relevant. Client-side projection is too late if
  open LangGraph `values` or nested messages already crossed the browser network boundary.

## Considered options

| Option | Pros | Cons |
|---|---|---|
| A. `useLangGraphRuntime` + official SDK `ThreadStream` | Native assistant-ui runtime and official AP v2 client/assembler; no hand-written SSE parser | A small, security-sensitive SDK-event-to-runtime projection remains local |
| B. `unstable_createLangGraphStream` | Small adapter surface | Calls legacy `runs.stream`; does not exercise the latest AP v2 thread-centric protocol |
| C. `@assistant-ui/react-langchain` | Wraps the existing `useStream` | **Wrong tool.** It targets LangChain.js runnables, not an Agent Protocol server |
| D. Repair `@langchain/react` v1 drift, keep prompt-kit | ~200 LOC in one file | Keeps a 1,769-LOC vendored layer; no native AP v2 UI contract or thread list |

## Decision

As of 2026-09-07, use `@assistant-ui/react-langchain`'s official
`useStreamRuntime` over `@langchain/react` and the SDK's Agent Protocol v2 client.
This supersedes the earlier `useLangGraphRuntime` stream/load callbacks, local message
assembler, run-correlation polling, and cancellation snapshots.

The native runtime owns subscriptions, replay, loading, stop, and interrupt resume.
The public server projection accepts Aegra's standard subscription schema and protects
private state in the response. Search inspection uses native event hooks. See
[Chat runtime](../reference/chat-runtime.md) for current boundaries and compatibility
handling. Version manifests and locks are authoritative; earlier version comparisons
below describe the original adoption.

Run cancellation, thread metadata, history, and state use the official SDK clients. Edit,
Regenerate, branch mutation, and delete remain visibly unavailable where Aegra cannot
perform them with the required atomicity; this implementation does not add a custom REST
facade to imitate missing AP v2 commands.

The server-side public-wire prerequisites for WEB-B are implemented and active in
Production. Preview remains closed. The boundary is intentionally guest-only: a signed
owner can still inspect complete checkpoints and native events, while a canonical
`anon:<uuid4>` subject receives only the public projection. UI sanitization remains
defense in depth rather than the network boundary.

The PostgreSQL integration's `rawPrivateStateObserved=false` assertion proves that the
current fixture sentinel does not appear on either AP v2 SSE connection. It is a regression
proof for this state-channel leak, not a claim that every future input payload is safe or
that provider chain-of-thought cannot reach the browser.

**Not `@assistant-ui/react-langchain`.** An earlier draft recommended it on the basis that
it wraps `useStream`; that reasoning applied to keeping the old backend, and the package is
for LangChain.js runnables rather than an Agent Protocol server.

Keep `chat-section.tsx` as the thin auth and identity boundary, and delete the vendored
prompt-kit layer. Keep `web/lib/agent-auth.ts` unchanged - it is the only place that knows
the Auth.js session, and it becomes the anonymous-identity minter too.

Exact pins, no `^`.

## Consequences

**Positive**

- The bespoke prompt-kit and custom SSE/Agent Protocol transport are deleted.
- A thread list and thread persistence across reload.
- AP v2 content blocks are assembled by the official `MessageAssembler`.
- Root-only stream filters prevent open graph state and nested transcript text from
  traversing the primary browser SSE connection.
- HITL, cancellation, error routing, identity disposal, Korean IME, citations, responsive
  layout, reduced motion, and focus restoration are fixture- or browser-testable seams.

**Trade-offs**

- **Branch switching, Edit, Regenerate, and delete are disabled**, not emulated over a
  partially compatible mutation surface.
- Three `unstable_` assistant-ui options remain in the Production runtime integration.
- The application still owns a bounded AP v2-to-assistant-ui projection until an upstream
  adapter exists.
- Guest state/history and both SSE connections are a deliberately smaller wire contract
  than the owner protocol surface; a future Aegra event variant fails closed until
  reviewed.
- `unstable_threadListAdapter` means metadata must be stamped in `initialize()`.

**Follow-ups**

- [ ] Retain a deployed signed-in owner journey with model selection and two Korean turns.
- [x] **Verify the Korean IME guard in a real browser**, do not assume it. The native
      composer guards Enter with both `e.nativeEvent.isComposing` and a `compositionRef`,
      but this is the single highest-risk regression for a Korean-language chat.
- [x] Keep `remark-breaks` in the markdown pipeline - the agent's Korean prose relies on
      single-newline line breaks - and memoize components at module scope for streaming.
- [x] `load()` must read `state.interrupts` first: Aegra returns interrupts as a top-level
      field (`models/threads.py:127`), so the quickstart's `state.tasks[0].interrupts` is
      the wrong read here.
- [x] Async `onRequest` token hook with a 60s margin. Capturing the token once at mount
      401s mid-conversation.
- [x] Pin the SDK/protocol dependencies and replay committed plus actual Aegra AP v2
      fixtures, including an isolated PostgreSQL 17 integration.
- [x] Add a public-safe state/history projection, force the SDK input watcher to the root,
      and suppress/redact reasoning plus unsafe tool/input payloads before guest response
      bytes leave the server.

## Revisit when

- `@assistant-ui/react-langgraph` ships branch support - the one capability being given up.
- The `unstable_` APIs stabilise or break; either is a reason to re-read this.
- assistant-ui appears on Aegra's integration list, or vice versa - it would mean someone
  else is carrying the compatibility risk.
- assistant-ui ships a stable native Agent Protocol v2 transport, at which point delete the
  local reducer after fixture parity passes.

## Changelog

- 2026-07-26: created as `proposed` recommending repair-and-defer with the
  `react-langchain` adapter; replaced the same day with this `accepted` decision, which
  also corrects the adapter choice to `react-langgraph`.
- 2026-07-26: amended the production transport from the legacy react-langgraph stream
  adapter to typed Agent Protocol v2 thread streaming after “latest Agent Protocol” became
  an explicit project requirement.
- 2026-07-28: replaced the proposed hand-written AP v2 transport with native
  `useLangGraphRuntime` over the official SDK `ThreadStream`/`MessageAssembler`, constrained
  the content pump to root-only channels, and recorded the owner-only WEB-A boundary.
- 2026-07-28: added the guest-only server public-wire projection for every allowlisted
  thread/run/command/state/history JSON response and complete AP v2 SSE frame, forced the
  SDK watcher to root depth zero, and closed the reasoning plus raw entity/tool/input/error
  network blockers without changing owner traffic.
- 2026-08-15: updated the tested assistant-ui pins and recorded Production WEB-B as live
  while keeping Preview closed and signed-in Production verification open.
