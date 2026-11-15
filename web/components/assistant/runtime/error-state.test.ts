import { describe, expect, test } from "bun:test"

import {
  AgentLifecycleError,
  describeLocalFailure,
  formatBudgetReset,
  parseRetryAfter,
  selectChatNotice,
  AgentTurnAbandonedError,
  classifyAgentError,
  humanizeAgentError,
  reduceAgentError,
  sanitizeAgentError,
  type AgentErrorRoutingState,
} from "./error-state"
import { AgentAuthenticationError } from "./token-broker"

describe("classifyAgentError", () => {
  test.each([
    [
      new AgentAuthenticationError("raw auth detail", 401),
      "connection",
      "authentication",
      "다시 로그인",
    ],
    [
      Object.assign(new Error("conflict"), { status: 409 }),
      "turn",
      "conflict",
      "다시 시도",
    ],
    [
      { response: { status: 429 }, secret: "do-not-render" },
      "turn",
      "rate-limit",
      "다시 시도",
    ],
    [
      new Error("Protocol request failed: 503 — db password"),
      "turn",
      "server",
      "다시 시도",
    ],
    [
      new AgentLifecycleError(),
      "turn",
      "lifecycle",
      "다시 시도",
    ],
  ] as const)(
    "maps failures to a safe Korean channel and action",
    (error, channel, kind, actionLabel) => {
      const presentation = classifyAgentError(error)
      expect(presentation).toMatchObject({ channel, kind, actionLabel })
      expect(JSON.stringify(presentation)).not.toContain("db password")
      expect(JSON.stringify(presentation)).not.toContain("do-not-render")
    }
  )

  test("separates connection-time and turn-time network failures", () => {
    expect(
      classifyAgentError(new TypeError("Failed to fetch"), "connection")
    ).toMatchObject({
      channel: "connection",
      kind: "network",
      action: "retry-connection",
      actionLabel: "다시 연결",
    })
    expect(
      classifyAgentError(new TypeError("Failed to fetch"), "turn")
    ).toMatchObject({
      channel: "turn",
      kind: "network",
      action: "retry-turn",
      actionLabel: "다시 시도",
    })
  })

  test("routes connection-time server responses to reconnect, not turn retry", () => {
    expect(
      classifyAgentError(
        Object.assign(new Error("upstream secret"), { status: 503 }),
        "connection"
      )
    ).toEqual({
      channel: "connection",
      kind: "server",
      title: "AI 서버에 연결하지 못했어요.",
      body: "잠시 후 다시 연결해 주세요.",
      message: "AI 서버에 연결하지 못했어요. 잠시 후 다시 연결해 주세요.",
      action: "retry-connection",
      actionLabel: "다시 연결",
      retryAt: undefined,
    })
  })

  test("keeps a ready connection usable when a recoverable turn fails", () => {
    const ready: AgentErrorRoutingState = {
      connectionStatus: "ready",
    }
    const next = reduceAgentError(
      ready,
      Object.assign(new Error("busy"), { status: 409 }),
      "turn"
    )
    expect(next.connectionStatus).toBe("ready")
    expect(next.connectionError).toBeUndefined()
    expect(next.turnError).toMatchObject({
      kind: "conflict",
      channel: "turn",
    })
  })

  test("moves fatal authentication failures to the connection channel", () => {
    const next = reduceAgentError(
      { connectionStatus: "ready" },
      new AgentAuthenticationError("secret", 401),
      "turn"
    )
    expect(next).toMatchObject({
      connectionStatus: "error",
      connectionError: {
        kind: "authentication",
        channel: "connection",
      },
    })
  })

  test("retains the compatibility humanizer without exposing internals", () => {
    expect(humanizeAgentError(new Error("postgres://secret"))).toBe(
      "응답을 끝까지 만들지 못했어요. 같은 대화에서 다시 시도해 주세요."
    )
  })

  test("sanitizes raw SDK, auth, URL, and backend response details before rethrow", () => {
    const raw = Object.assign(
      new Error(
        "503 postgres://owner:secret@db.internal Authorization: Bearer token"
      ),
      { status: 503, response: { body: "private backend body" } }
    )
    const safe = sanitizeAgentError(raw)

    expect(safe.status).toBe(503)
    expect(safe.message).toBe(
      "AI 서버가 잠시 응답하지 않아요. 잠시 후 다시 시도해 주세요."
    )
    expect(JSON.stringify(safe)).not.toContain("secret")
    expect(JSON.stringify(safe)).not.toContain("Bearer")
    expect(JSON.stringify(safe)).not.toContain("private backend body")
  })

  test("drops stacks and rejects unallowlisted status fields at the UI boundary", () => {
    const sentinel = "ultra-secret-sentinel"
    const raw = Object.assign(new Error(sentinel), {
      status: 418,
      response: { status: 418, body: sentinel },
      stack: `Error: ${sentinel}\n at postgres://${sentinel}`,
    })
    const safe = sanitizeAgentError(raw)

    expect(safe.status).toBeUndefined()
    expect(safe.stack).toBeUndefined()
    expect(JSON.stringify(safe)).not.toContain(sentinel)
    expect(Object.values(safe)).not.toContain(sentinel)
  })
})

describe("abandoned turn", () => {
  test("asks for a retry instead of ending in silence", () => {
    const presentation = classifyAgentError(new AgentTurnAbandonedError())
    expect(presentation.channel).toBe("turn")
    expect(presentation.action).toBe("retry-turn")
    expect(presentation.message).toContain("응답을 받지 못했어요")
  })
})

// 2026-11-16 15:00 KST (06:00 UTC) and 2026-11-17 03:00 KST (2026-11-16 18:00 UTC).
const KST_AFTERNOON = Date.UTC(2026, 10, 16, 6)
const KST_EARLY_MORNING = Date.UTC(2026, 10, 16, 18)

function rejected(status: number, code?: string, retryAfterSeconds?: number) {
  return Object.assign(new Error(`Run request rejected: HTTP ${status}`), {
    status,
    ...(code ? { code } : {}),
    ...(retryAfterSeconds !== undefined ? { retryAfterSeconds } : {}),
  })
}

describe("daily budget", () => {
  test("tells a signed-in reader when the budget resets in KST", () => {
    const untilMidnightUtc = 18 * 60 * 60
    const presentation = classifyAgentError(
      rejected(429, "daily_budget_exhausted", untilMidnightUtc),
      "turn",
      { audience: "signed-in", now: KST_AFTERNOON }
    )
    expect(presentation).toMatchObject({
      kind: "daily-budget",
      channel: "turn",
      action: "none",
      title: "오늘 사용 한도를 모두 썼어요.",
      body: "내일(한국 시간 오전 9시) 다시 이용할 수 있어요.",
      resetsAt: Date.UTC(2026, 10, 17),
    })
  })

  test("says the shared guest quota is used up, without pushing sign-in", () => {
    const presentation = classifyAgentError(
      rejected(429, "daily_budget_exhausted"),
      "turn",
      { audience: "guest", now: KST_AFTERNOON }
    )
    expect(presentation.title).toBe("오늘 공개 체험 한도를 모두 썼어요.")
    expect(presentation.body).toContain("함께 쓰는 하루 무료 사용량")
    expect(presentation.body).toContain("내일(한국 시간 오전 9시)")
    expect(presentation.message).not.toContain("로그인")
    // Without a readable Retry-After the reset falls back to the next UTC midnight.
    expect(presentation.resetsAt).toBe(Date.UTC(2026, 10, 17))
  })

  test("says today when the reset is later the same KST morning", () => {
    expect(formatBudgetReset(Date.UTC(2026, 10, 17), KST_EARLY_MORNING)).toBe(
      "오늘(한국 시간 오전 9시)"
    )
  })

  test("is distinct from a short rate limit, which offers a timed retry", () => {
    const presentation = classifyAgentError(rejected(429, "rate_limited", 12), "turn", {
      now: KST_AFTERNOON,
    })
    expect(presentation).toMatchObject({
      kind: "rate-limit",
      action: "retry-turn",
      retryAt: KST_AFTERNOON + 12_000,
    })
  })
})

describe("rejection codes", () => {
  test("maps the guest thread cap and an unavailable service with Retry-After", () => {
    expect(classifyAgentError(rejected(429, "thread_limit_exceeded"))).toMatchObject({
      kind: "thread-limit",
      action: "none",
    })
    expect(
      classifyAgentError(rejected(503, "service_unavailable", 60), "turn", { now: 0 })
    ).toMatchObject({ kind: "server", action: "retry-turn", retryAt: 60_000 })
  })

  test("ignores unknown codes and out-of-range Retry-After values", () => {
    const presentation = classifyAgentError(
      Object.assign(new Error("x"), { status: 429, code: "secret", retryAfterSeconds: 10 ** 9 })
    )
    expect(presentation.kind).toBe("rate-limit")
    expect(presentation.retryAt).toBeUndefined()
  })

  test("gives guests a refresh instead of a sign-in for expired or refused sessions", () => {
    expect(
      classifyAgentError(new AgentAuthenticationError("x", 401), "turn", { audience: "guest" })
    ).toMatchObject({ kind: "authentication", action: "reload", actionLabel: "새로고침" })
    expect(
      classifyAgentError(new AgentAuthenticationError("x", 403), "connection", { audience: "guest" })
    ).toMatchObject({ kind: "permission", action: "reload" })
    expect(
      classifyAgentError(new AgentAuthenticationError("x", 401))
    ).toMatchObject({ action: "sign-in", actionLabel: "다시 로그인" })
  })

  test("treats a network bootstrap failure as a network problem", () => {
    const bootstrap = Object.assign(new Error("Anonymous chat bootstrap failed"), {
      name: "AnonymousBootstrapError",
      kind: "network",
    })
    expect(classifyAgentError(bootstrap, "connection", { audience: "guest" }).kind).toBe("network")
  })
})

describe("parseRetryAfter", () => {
  test.each([
    ["30", 30],
    [" 0 ", 0],
    ["Mon, 16 Nov 2026 06:01:00 GMT", 60],
    ["-1", undefined],
    ["soon", undefined],
    ["999999999", undefined],
    [null, undefined],
  ] as const)("%p -> %p", (value, expected) => {
    expect(parseRetryAfter(value, KST_AFTERNOON)).toBe(expected)
  })
})

describe("selectChatNotice", () => {
  const authentication = classifyAgentError(new AgentAuthenticationError("x", 401))
  const turn = classifyAgentError(rejected(503))
  const sendFailed = describeLocalFailure("send-failed")

  test("shows exactly one state, most blocking first", () => {
    expect(
      selectChatNotice({
        online: false,
        connectionStatus: "error",
        connectionError: authentication,
        turnError: turn,
        dispatchError: sendFailed,
      })?.kind
    ).toBe("offline")
    expect(
      selectChatNotice({
        online: true,
        connectionStatus: "error",
        connectionError: authentication,
        turnError: turn,
        dispatchError: sendFailed,
      })
    ).toBe(authentication)
    expect(
      selectChatNotice({
        online: true,
        connectionStatus: "ready",
        turnError: turn,
        dispatchError: sendFailed,
      })
    ).toBe(turn)
    expect(
      selectChatNotice({ online: true, connectionStatus: "ready", dispatchError: sendFailed })
    ).toBe(sendFailed)
  })

  test("does not repeat a failure that its answer already shows", () => {
    expect(
      selectChatNotice({
        online: true,
        connectionStatus: "ready",
        turnError: turn,
        turnErrorShownOnMessage: true,
      })
    ).toBeUndefined()
  })

  test("stays quiet while connecting", () => {
    expect(
      selectChatNotice({ online: true, connectionStatus: "connecting", turnError: turn })
    ).toBeUndefined()
  })
})
