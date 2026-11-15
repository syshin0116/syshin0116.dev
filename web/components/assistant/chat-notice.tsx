"use client"

import { CircleAlert, Clock3, WifiOff } from "lucide-react"
import { useEffect, useState, type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import type { AgentErrorPresentation } from "./runtime/error-state"

function remainingSeconds(retryAt: number | undefined): number {
  return retryAt === undefined
    ? 0
    : Math.max(0, Math.ceil((retryAt - Date.now()) / 1_000))
}

/** Seconds until `retryAt`, ticking once per second and stopping at zero. */
export function useRetryCountdown(retryAt: number | undefined): number {
  const [seconds, setSeconds] = useState(() => remainingSeconds(retryAt))
  useEffect(() => {
    setSeconds(remainingSeconds(retryAt))
    if (retryAt === undefined) return
    const timer = setInterval(() => {
      const next = remainingSeconds(retryAt)
      setSeconds(next)
      if (next === 0) clearInterval(timer)
    }, 1_000)
    return () => clearInterval(timer)
  }, [retryAt])
  return seconds
}

const LIMIT_KINDS = new Set<AgentErrorPresentation["kind"]>([
  "offline",
  "rate-limit",
  "daily-budget",
  "thread-limit",
  "queue-too-long",
])

/**
 * One inline failure: what happened, what to do, and at most one recovery
 * action. Announced through a live region; it never moves focus.
 */
export function ChatNotice({
  notice,
  id,
  className,
  action,
}: {
  notice: AgentErrorPresentation
  id?: string
  className?: string
  /** The recovery control; a function receives the countdown state. */
  action?: ReactNode | ((countdown: number) => ReactNode)
}) {
  const countdown = useRetryCountdown(notice.retryAt)
  const limit = LIMIT_KINDS.has(notice.kind)
  const Icon =
    notice.kind === "offline" || notice.kind === "network"
      ? WifiOff
      : notice.kind === "rate-limit" || notice.kind === "daily-budget"
        ? Clock3
        : CircleAlert
  const control = typeof action === "function" ? action(countdown) : action
  return (
    <div
      id={id}
      role={notice.kind === "offline" ? "status" : "alert"}
      data-kind={notice.kind}
      className={cn(
        "flex flex-col gap-3 rounded-xl border px-4 py-3 text-sm sm:flex-row sm:items-center",
        limit
          ? "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100"
          : "border-destructive/30 bg-destructive/5 text-foreground",
        className
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <Icon
          aria-hidden="true"
          className={cn(
            "mt-0.5 size-4 shrink-0",
            limit ? "text-amber-700 dark:text-amber-300" : "text-destructive"
          )}
        />
        <p className="min-w-0 break-keep leading-6">
          <span className="font-medium">{notice.title}</span>{" "}
          <span className="text-[13px] opacity-80">{notice.body}</span>
        </p>
      </div>
      {control ? <div className="flex shrink-0 justify-end">{control}</div> : null}
    </div>
  )
}

/** The shared recovery button, disabled while a known Retry-After runs. */
export function ChatNoticeButton({
  countdown = 0,
  label,
  onClick,
}: {
  countdown?: number
  label: string
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={countdown > 0}
      onClick={onClick}
      className="bg-background/80"
    >
      {countdown > 0 ? `${countdown}초 후 ${label}` : label}
    </Button>
  )
}
