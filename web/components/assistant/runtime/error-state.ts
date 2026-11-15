import { AgentAuthenticationError } from "./token-broker"

export type AgentErrorPhase = "connection" | "turn"
export type AgentAudience = "guest" | "signed-in"
export type AgentErrorAction =
  | "sign-in"
  | "reload"
  | "retry-connection"
  | "retry-turn"
  | "none"

export type AgentErrorKind =
  | "authentication"
  | "permission"
  | "conflict"
  | "rate-limit"
  | "daily-budget"
  | "thread-limit"
  | "server"
  | "network"
  | "offline"
  | "lifecycle"
  | "queue-too-long"
  | "send-failed"
  | "unknown"

/**
 * The single shape every chat failure is rendered from. `title` says what
 * happened, `body` what the reader can do. Backend bodies, stack traces,
 * tokens, and routes never reach these strings.
 */
export interface AgentErrorPresentation {
  channel: "connection" | "turn"
  kind: AgentErrorKind
  title: string
  body: string
  /** `title` and `body` joined, for plain-text consumers. */
  message: string
  action: AgentErrorAction
  actionLabel?: string
  /** Epoch ms before which a retry is known to be rejected again. */
  retryAt?: number
  /** Epoch ms when a daily budget resets. */
  resetsAt?: number
}

export interface AgentErrorContext {
  audience?: AgentAudience
  /** Epoch ms; injected so copy that depends on the clock stays testable. */
  now?: number
}

export interface AgentErrorRoutingState {
  connectionStatus: "connecting" | "ready" | "error"
  connectionError?: AgentErrorPresentation
  turnError?: AgentErrorPresentation
}

export class AgentLifecycleError extends Error {
  constructor() {
    super("Agent lifecycle failed")
    this.name = "AgentLifecycleError"
  }
}

/**
 * The turn ended before any answer reached the reader, without a lifecycle
 * failure to blame. The run itself may well have succeeded on the server, so
 * the copy asks for a retry rather than reporting an agent fault.
 */
export class AgentTurnAbandonedError extends Error {
  constructor() {
    super("Agent turn ended without delivering a response")
    this.name = "AgentTurnAbandonedError"
  }
}

export class SanitizedAgentError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = "SanitizedAgentError"
    this.status = status
    this.stack = undefined
  }
}

/** Machine-readable rejection codes the agent returns in a JSON `error` field. */
export const AGENT_REJECTION_CODES = [
  "rate_limited",
  "daily_budget_exhausted",
  "thread_limit_exceeded",
  "service_unavailable",
] as const
export type AgentRejectionCode = (typeof AGENT_REJECTION_CODES)[number]

const MAX_RETRY_AFTER_SECONDS = 2 * 24 * 60 * 60
const KST_TIME_ZONE = "Asia/Seoul"

function allowlistedStatus(value: unknown): number | undefined {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    (value === 401 ||
      value === 403 ||
      value === 409 ||
      value === 429 ||
      (value >= 500 && value <= 599))
    ? value
    : undefined
}

function statusFromUnknown(error: unknown): number | undefined {
  if (error instanceof AgentAuthenticationError && error.status) {
    return allowlistedStatus(error.status)
  }
  if (error && typeof error === "object") {
    if ("status" in error) {
      const status = allowlistedStatus(error.status)
      if (status !== undefined) return status
    }
    if (
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "status" in error.response
    ) {
      const status = allowlistedStatus(error.response.status)
      if (status !== undefined) return status
    }
  }
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : ""
  const match = /\b(401|403|409|429|5\d\d)\b/.exec(message)
  return match ? Number(match[1]) : undefined
}

function codeFromUnknown(error: unknown): AgentRejectionCode | undefined {
  if (!error || typeof error !== "object" || !("code" in error)) return undefined
  const code = error.code
  return (AGENT_REJECTION_CODES as readonly unknown[]).includes(code)
    ? (code as AgentRejectionCode)
    : undefined
}

function retryAfterFromUnknown(error: unknown): number | undefined {
  if (!error || typeof error !== "object" || !("retryAfterSeconds" in error)) {
    return undefined
  }
  const value = error.retryAfterSeconds
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= MAX_RETRY_AFTER_SECONDS
    ? Math.ceil(value)
    : undefined
}

/**
 * Parses an HTTP `Retry-After` header (delta-seconds or HTTP-date) into
 * seconds from `now`. Out-of-range or malformed values are dropped.
 */
export function parseRetryAfter(
  value: string | null | undefined,
  now: number
): number | undefined {
  const trimmed = value?.trim()
  if (!trimmed) return undefined
  if (/^\d+$/.test(trimmed)) {
    const seconds = Number(trimmed)
    return seconds <= MAX_RETRY_AFTER_SECONDS ? seconds : undefined
  }
  // HTTP-date only (e.g. "Mon, 16 Nov 2026 06:01:00 GMT"); Date.parse is too lenient alone.
  if (!/^[A-Za-z]{3}, \d{2} [A-Za-z]{3} \d{4} \d{2}:\d{2}:\d{2} GMT$/.test(trimmed)) return undefined
  const date = Date.parse(trimmed)
  if (Number.isNaN(date)) return undefined
  const seconds = Math.max(0, Math.ceil((date - now) / 1_000))
  return seconds <= MAX_RETRY_AFTER_SECONDS ? seconds : undefined
}

function isNetworkFailure(error: unknown): boolean {
  if (
    error &&
    typeof error === "object" &&
    "name" in error &&
    error.name === "AnonymousBootstrapError" &&
    "kind" in error
  ) {
    return error.kind === "network"
  }
  if (!(error instanceof Error)) return false
  return (
    error.name === "TypeError" ||
    /failed to fetch|network(?:error| request)?|load failed/i.test(error.message)
  )
}

function nextUtcMidnight(now: number): number {
  const date = new Date(now)
  return Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() + 1
  )
}

function kstDay(epochMs: number): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: KST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(epochMs)
}

/** "내일(한국 시간 오전 9시)" style label for when a budget resets. */
export function formatBudgetReset(resetsAt: number, now: number): string {
  const time = new Intl.DateTimeFormat("ko-KR", {
    timeZone: KST_TIME_ZONE,
    hour: "numeric",
    ...(new Date(resetsAt).getUTCMinutes() === 0 ? {} : { minute: "2-digit" }),
  }).format(resetsAt)
  const today = kstDay(now)
  const resetDay = kstDay(resetsAt)
  const tomorrow = kstDay(now + 24 * 60 * 60 * 1_000)
  const day =
    resetDay === today
      ? "오늘"
      : resetDay === tomorrow
        ? "내일"
        : new Intl.DateTimeFormat("ko-KR", {
            timeZone: KST_TIME_ZONE,
            month: "long",
            day: "numeric",
          }).format(resetsAt)
  return `${day}(한국 시간 ${time})`
}

function presentation(
  value: Omit<AgentErrorPresentation, "message">
): AgentErrorPresentation {
  return { ...value, message: `${value.title} ${value.body}` }
}

const RETRY_TURN = { action: "retry-turn", actionLabel: "다시 시도" } as const
const RETRY_CONNECTION = {
  action: "retry-connection",
  actionLabel: "다시 연결",
} as const

/**
 * Maps raw SDK/protocol failures to bounded Korean UI copy and an explicit
 * recovery channel. This is the only place chat failure copy is written.
 */
export function classifyAgentError(
  error: unknown,
  phase: AgentErrorPhase = "turn",
  context: AgentErrorContext = {}
): AgentErrorPresentation {
  const audience = context.audience ?? "signed-in"
  const now = context.now ?? Date.now()
  const status = statusFromUnknown(error)
  const code = codeFromUnknown(error)
  const retryAfter = retryAfterFromUnknown(error)
  const retryAt =
    retryAfter !== undefined && retryAfter > 0
      ? now + retryAfter * 1_000
      : undefined

  if (status === 401) {
    return audience === "guest"
      ? presentation({
          channel: "connection",
          kind: "authentication",
          title: "공개 체험 세션이 만료됐어요.",
          body: "새로고침하면 새 체험 세션으로 이어갈 수 있어요.",
          action: "reload",
          actionLabel: "새로고침",
        })
      : presentation({
          channel: "connection",
          kind: "authentication",
          title: "로그인 세션이 만료됐어요.",
          body: "다시 로그인하면 대화를 이어갈 수 있어요.",
          action: "sign-in",
          actionLabel: "다시 로그인",
        })
  }
  if (status === 403) {
    return audience === "guest"
      ? presentation({
          channel: "connection",
          kind: "permission",
          title: "공개 체험을 이어갈 수 없어요.",
          body: "브라우저 확인을 통과하지 못했거나 공개 체험이 잠시 꺼져 있어요. 새로고침하거나 로그인해 주세요.",
          action: "reload",
          actionLabel: "새로고침",
        })
      : presentation({
          channel: "connection",
          kind: "permission",
          title: "이 계정으로는 AI 실험실을 쓸 수 없어요.",
          body: "권한이 있는 계정으로 다시 로그인해 주세요.",
          action: "sign-in",
          actionLabel: "다른 계정으로 로그인",
        })
  }
  if (status === 429 && code === "daily_budget_exhausted") {
    const resetsAt =
      retryAfter !== undefined ? now + retryAfter * 1_000 : nextUtcMidnight(now)
    const reset = formatBudgetReset(resetsAt, now)
    return presentation({
      channel: "turn",
      kind: "daily-budget",
      title:
        audience === "guest"
          ? "오늘 공개 체험 한도를 모두 썼어요."
          : "오늘 사용 한도를 모두 썼어요.",
      body:
        audience === "guest"
          ? `방문자 모두가 함께 쓰는 하루 무료 사용량이 소진됐어요. ${reset} 다시 이용할 수 있어요.`
          : `${reset} 다시 이용할 수 있어요.`,
      action: "none",
      resetsAt,
    })
  }
  if (status === 429 && code === "thread_limit_exceeded") {
    return presentation({
      channel: "turn",
      kind: "thread-limit",
      title: "새 대화를 더 만들 수 없어요.",
      body: "저장할 수 있는 대화 수가 가득 찼어요. 기존 대화에서 이어서 질문해 주세요.",
      action: "none",
    })
  }
  if (
    phase === "connection" &&
    (status === 409 ||
      status === 429 ||
      (status !== undefined && status >= 500 && status <= 599))
  ) {
    return presentation({
      channel: "connection",
      kind: status === 409 ? "conflict" : status === 429 ? "rate-limit" : "server",
      title:
        status === 429
          ? "연결 요청이 잠시 많아요."
          : status === 409
            ? "연결 요청이 겹쳤어요."
            : "AI 서버에 연결하지 못했어요.",
      body: "잠시 후 다시 연결해 주세요.",
      ...RETRY_CONNECTION,
      retryAt,
    })
  }
  if (status === 409) {
    return presentation({
      channel: "turn",
      kind: "conflict",
      title: "이 대화에서 다른 응답이 진행 중이에요.",
      body: "응답이 끝난 뒤 다시 시도해 주세요.",
      ...RETRY_TURN,
    })
  }
  if (status === 429) {
    return presentation({
      channel: "turn",
      kind: "rate-limit",
      title: "요청이 잠시 많아요.",
      body: "보낸 메시지는 그대로 있어요. 잠시 후 다시 시도해 주세요.",
      ...RETRY_TURN,
      retryAt,
    })
  }
  if (status !== undefined && status >= 500 && status <= 599) {
    return presentation({
      channel: "turn",
      kind: "server",
      title: "AI 서버가 잠시 응답하지 않아요.",
      body: "잠시 후 다시 시도해 주세요.",
      ...RETRY_TURN,
      retryAt,
    })
  }
  if (isNetworkFailure(error)) {
    return phase === "connection"
      ? presentation({
          channel: "connection",
          kind: "network",
          title: "네트워크에 연결하지 못했어요.",
          body: "연결을 확인한 뒤 다시 연결해 주세요.",
          ...RETRY_CONNECTION,
        })
      : presentation({
          channel: "turn",
          kind: "network",
          title: "응답을 받는 중 연결이 끊겼어요.",
          body: "네트워크를 확인한 뒤 다시 시도해 주세요.",
          ...RETRY_TURN,
        })
  }
  if (error instanceof AgentTurnAbandonedError) {
    return presentation({
      channel: "turn",
      kind: "lifecycle",
      title: "응답을 받지 못했어요.",
      body: "같은 대화에서 다시 시도해 주세요.",
      ...RETRY_TURN,
    })
  }
  if (phase === "connection") {
    return presentation({
      channel: "connection",
      kind: "unknown",
      title: "AI 연결을 준비하지 못했어요.",
      body: "잠시 후 다시 연결해 주세요.",
      ...RETRY_CONNECTION,
    })
  }
  return presentation({
    channel: "turn",
    kind: error instanceof AgentLifecycleError ? "lifecycle" : "unknown",
    title: "응답을 끝까지 만들지 못했어요.",
    body: "같은 대화에서 다시 시도해 주세요.",
    ...RETRY_TURN,
  })
}

/** Client-side failures that never reach the agent, in the same shape. */
export function describeLocalFailure(
  kind: "offline" | "queue-too-long" | "send-failed"
): AgentErrorPresentation {
  switch (kind) {
    case "offline":
      return presentation({
        channel: "connection",
        kind,
        title: "인터넷 연결이 끊겼어요.",
        body: "작성한 메시지는 연결되면 보낼 수 있어요.",
        action: "none",
      })
    case "queue-too-long":
      return presentation({
        channel: "turn",
        kind,
        title: "대기 메시지가 너무 길어요.",
        body: "일부를 삭제한 뒤 다시 시도해 주세요.",
        ...RETRY_TURN,
      })
    case "send-failed":
      return presentation({
        channel: "turn",
        kind,
        title: "메시지를 보내지 못했어요.",
        body: "대기 중인 메시지는 그대로 있어요.",
        ...RETRY_TURN,
      })
  }
}

export interface ChatNoticeInput {
  online: boolean
  connectionStatus: AgentErrorRoutingState["connectionStatus"]
  connectionError?: AgentErrorPresentation
  turnError?: AgentErrorPresentation
  /** The failed answer already shows `turnError` inline. */
  turnErrorShownOnMessage?: boolean
  dispatchError?: AgentErrorPresentation
}

/**
 * Picks the one failure the composer shows. Offline and connection failures
 * block every send, so they win; a turn failure attached to its answer is not
 * repeated next to the composer.
 */
export function selectChatNotice(
  input: ChatNoticeInput
): AgentErrorPresentation | undefined {
  if (!input.online) return describeLocalFailure("offline")
  if (input.connectionStatus === "error" && input.connectionError) {
    return input.connectionError
  }
  if (input.connectionStatus !== "ready") return undefined
  if (input.turnError && !input.turnErrorShownOnMessage) return input.turnError
  return input.dispatchError
}

/**
 * Creates the only error shape allowed to cross from SDK/Aegra internals into
 * assistant-ui. Status is retained for recovery routing; response bodies,
 * URLs, stack messages, database details, and bearer material are discarded.
 */
export function sanitizeAgentError(
  error: unknown,
  phase: AgentErrorPhase = "turn"
): SanitizedAgentError {
  const presentation = classifyAgentError(error, phase)
  return new SanitizedAgentError(
    presentation.message,
    statusFromUnknown(error)
  )
}

export function reduceAgentError(
  state: AgentErrorRoutingState,
  error: unknown,
  phase: AgentErrorPhase,
  context: AgentErrorContext = {}
): AgentErrorRoutingState {
  const presentation = classifyAgentError(error, phase, context)
  if (presentation.channel === "connection") {
    return {
      connectionStatus: "error",
      connectionError: presentation,
      turnError: state.turnError,
    }
  }
  return {
    ...state,
    turnError: presentation,
  }
}

export function humanizeAgentError(error: unknown): string {
  return classifyAgentError(error).message
}

export const errorStateTesting = {
  isNetworkFailure,
  statusFromUnknown,
}
