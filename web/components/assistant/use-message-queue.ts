"use client"

import { useAui, useAuiEvent, useAuiState } from "@assistant-ui/react"
import { useLangChainError, useLangChainInterrupts } from "@assistant-ui/react-langchain"
import { useCallback, useEffect, useRef, useState } from "react"
import type { AgentModel } from "@/lib/agent-model"

export const MAX_COMPOSER_CODE_UNITS = 8_000
export const MAX_COMPOSER_UTF8_BYTES = 16_000
const encoder = new TextEncoder()
export function messageFits(text: string): boolean {
  return text.length <= MAX_COMPOSER_CODE_UNITS &&
    encoder.encode(text).byteLength <= MAX_COMPOSER_UTF8_BYTES
}

type PendingMessage = { id: string; text: string }
type Batch = { items: PendingMessage[]; paused: boolean }
const EMPTY_BATCH: Batch = { items: [], paused: false }

export function useMessageQueue({ ready, model, onSend }: { ready: boolean; model?: AgentModel; onSend: () => void }) {
  const aui = useAui()
  const threadId = useAuiState((s) => s.threadListItem.id)
  const running = useAuiState((s) => s.thread.isRunning)
  const error = useLangChainError()
  const interrupts = useLangChainInterrupts()
  const [acknowledgedError, setAcknowledgedError] = useState<unknown>()
  const blockedByError = Boolean(error && error !== acknowledgedError)
  const [batches, setBatches] = useState<Record<string, Batch>>({})
  const batchesRef = useRef(batches)
  const updateBatch = useCallback((id: string, update: (batch: Batch) => Batch) => {
    const next = { ...batchesRef.current, [id]: update(batchesRef.current[id] ?? EMPTY_BATCH) }
    batchesRef.current = next
    setBatches(next)
  }, [])
  const [dispatchError, setDispatchError] = useState<{ threadId: string; message: string }>()
  const dispatching = useRef(new Set<string>())
  const sent = useRef(new Map<string, { items: PendingMessage[]; previousIds: Set<string> }>())
  const batch = batches[threadId] ?? EMPTY_BATCH

  useAuiEvent({ scope: "*", event: "thread.runStart" }, ({ threadId }) => {
    dispatching.current.delete(threadId)
  })
  useAuiEvent({ scope: "*", event: "thread.runEnd" }, ({ threadId }) => {
    dispatching.current.delete(threadId)
    updateBatch(threadId, (batch) => ({ ...batch }))
  })

  useEffect(() => {
    if (running || error) dispatching.current.delete(threadId)
  }, [error, running, threadId, updateBatch])

  useEffect(() => {
    if (!blockedByError) return
    const timer = setTimeout(() => {
      const latest = sent.current.get(threadId)
      if (!latest) return
      sent.current.delete(threadId)
      const text = latest.items.map((item) => item.text).join("\n\n")
      const delivered = aui.thread().getState().messages.some((message) =>
        message.role === "user" && !latest.previousIds.has(message.id) &&
        message.content.some((part) => part.type === "text" && part.text === text))
      updateBatch(threadId, (current) => ({
        paused: true,
        items: delivered ? current.items : [...latest.items, ...current.items],
      }))
    }, 0)
    return () => clearTimeout(timer)
  }, [aui, blockedByError, threadId, updateBatch])

  useEffect(() => {
    if (!ready || running || blockedByError || interrupts.length || batch.paused || !batch.items.length) return
    // Allow rapid Enter presses and terminal error/interrupt state to settle.
    const timer = setTimeout(() => {
      if (dispatching.current.has(threadId)) return
      if (!messageFits(batch.items.map((item) => item.text).join("\n\n"))) {
        setDispatchError({ threadId, message: "대기 메시지가 너무 깁니다. 일부를 삭제한 뒤 다시 보내 주세요." })
        updateBatch(threadId, (current) => ({ ...current, paused: true }))
        return
      }
      dispatching.current.add(threadId)
      sent.current.set(threadId, { items: batch.items, previousIds: new Set(aui.thread().getState().messages.map((message) => message.id)) })
      onSend()
      aui.thread().append({
        role: "user",
        content: [{ type: "text", text: batch.items.map((item) => item.text).join("\n\n") }],
        runConfig: model ? { custom: { model } } : {},
      })
      updateBatch(threadId, (current) => ({
        ...current,
        items: current.items.filter((item) => !batch.items.includes(item)),
      }))
      void aui.threads().item({ id: threadId }).initialize().catch(() => {
        dispatching.current.delete(threadId)
        setDispatchError({ threadId, message: "메시지를 보내지 못했습니다. 대기열에서 다시 보내 주세요." })
        sent.current.delete(threadId)
        updateBatch(threadId, (current) => ({ paused: true, items: [...batch.items.filter((item) => !current.items.some((queued) => queued.id === item.id)), ...current.items] }))
      })
    }, 150)
    return () => clearTimeout(timer)
  }, [aui, batch, blockedByError, interrupts.length, model, onSend, ready, running, threadId, updateBatch])

  return {
    items: batch.items,
    paused: batch.paused || blockedByError,
    dispatchError: dispatchError?.threadId === threadId ? dispatchError.message : undefined,
    enqueue(text: string) {
      const normalized = text.trim()
      if (!normalized) return true
      if (!messageFits([...(batchesRef.current[threadId]?.items ?? []).map((item) => item.text), normalized].join("\n\n"))) return false
      setDispatchError(undefined)
      setAcknowledgedError(error)
      updateBatch(threadId, (current) => ({
        paused: false,
        items: [...current.items, { id: crypto.randomUUID(), text: normalized }],
      }))
      return true
    },
    remove(id: string) {
      updateBatch(threadId, (current) => ({ ...current, items: current.items.filter((item) => item.id !== id) }))
    },
    pause() {
      updateBatch(threadId, (current) => ({ ...current, paused: true }))
    },
    resume() {
      setDispatchError(undefined)
      setAcknowledgedError(error)
      updateBatch(threadId, (current) => ({ ...current, paused: false }))
    },
  }
}
