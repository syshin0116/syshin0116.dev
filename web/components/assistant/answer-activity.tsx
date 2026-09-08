"use client"

import { useAuiState } from "@assistant-ui/react"
import {
  useLangChainStream,
  useLangChainSubagents,
  useLangChainToolCalls,
  type SubagentDiscoverySnapshot,
} from "@assistant-ui/react-langchain"
import { useToolCalls, type AssembledToolCall } from "@langchain/react"
import { Check, CircleAlert, GitBranch, LoaderCircle, ToolCase } from "lucide-react"
import { useAgentRuntimeUi } from "./agent-runtime-provider"
import { toolArgumentSummary, toolResultText } from "./runtime/tool-arguments"

function Status({ status }: { status: string }) {
  if (status === "running") return <LoaderCircle aria-label="실행 중" className="size-3.5 shrink-0 animate-spin motion-reduce:animate-none" />
  if (status === "error") return <CircleAlert aria-label="실패" className="size-3.5 shrink-0 text-destructive" />
  if (status !== "complete" && status !== "finished") return <span>{status === "interrupted" ? "입력 대기" : "대기"}</span>
  return <Check aria-label="완료" className="size-3.5 shrink-0" />
}

function LiveTool({ tool }: { tool: AssembledToolCall }) {
  const summary = toolArgumentSummary(JSON.stringify(tool.input))
  const result = toolResultText(tool.output)
  return <details className="rounded-lg bg-muted/40 text-xs">
    <summary className="flex cursor-pointer items-center gap-2 px-3 py-2">
      <ToolCase className="size-3.5 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{tool.name}</span>
      <Status status={tool.status} />
    </summary>
    <div className="space-y-2 border-t border-border/50 px-3 py-2">
      {summary ? <p className="break-words">{summary}</p> : null}
      {result ? <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words text-[11px]">{result}</pre> : null}
      {tool.status === "error" ? <p>도구 실행을 완료하지 못했습니다.</p> : null}
    </div>
  </details>
}

function SubagentTools({ stream, subagent }: {
  stream: NonNullable<ReturnType<typeof useLangChainStream>>
  subagent: SubagentDiscoverySnapshot
}) {
  const tools = useToolCalls(stream, subagent)
  return <div className="space-y-1 px-3 pb-3">{tools.map((tool) => <LiveTool key={tool.id} tool={tool} />)}</div>
}

export function AnswerActivity() {
  const running = useAuiState((s) => s.thread.isRunning)
  const content = useAuiState((s) => s.message.content)
  const hasText = content.some((part) => part.type === "text" && part.text.trim().length > 0)
  const tools = useLangChainToolCalls()
  const subagents = useLangChainSubagents()
  const stream = useLangChainStream()
  const { activities } = useAgentRuntimeUi()
  const renderedToolIds = new Set(content.filter((part) => part.type === "tool-call").map((part) => part.toolCallId))
  const currentToolIds = new Set(activities.filter((activity) => activity.kind === "tool").map((activity) => activity.toolCallId))
  const currentSubagents = Array.from(subagents.values()).filter((subagent) => currentToolIds.has(subagent.id) || renderedToolIds.has(subagent.id))
  const extraTools = tools.filter((tool) => currentToolIds.has(tool.id) && !renderedToolIds.has(tool.id) && !subagents.has(tool.id) &&
    !currentSubagents.some((subagent) => subagent.namespace.every((part, index) => tool.namespace[index] === part)))
  const nested = activities.filter((activity) => activity.kind === "nested" &&
    !currentSubagents.some((subagent) => subagent.namespace.join("/") === activity.namespace.join("/")))
  if ((!running || hasText) && !extraTools.length && !currentSubagents.length && !nested.length) return null
  return <div aria-label="답변 실행 상태" className="mb-4 space-y-2 text-muted-foreground">
    {extraTools.map((tool) => <LiveTool key={tool.id} tool={tool} />)}
    {currentSubagents.map((subagent) => <details key={subagent.id} open={subagent.status === "running"} className="rounded-xl border border-border/60 text-xs">
      <summary className="flex cursor-pointer items-center gap-2 px-3 py-2.5">
        <GitBranch className="size-3.5" />
        <span className="min-w-0 flex-1 truncate">서브에이전트 · {subagent.name}</span>
        <Status status={subagent.status} />
      </summary>
      {subagent.taskInput ? <p className="px-3 pb-2 leading-5">{subagent.taskInput}</p> : null}
      {stream ? <SubagentTools stream={stream} subagent={subagent} /> : null}
    </details>)}
    {nested.map((activity) => <div key={activity.id} className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs">
      <GitBranch className="size-3.5" />
      <span className="min-w-0 flex-1 truncate">{activity.kind === "nested" ? activity.name : activity.label}</span>
      <Status status={activity.status === "completed" ? "complete" : activity.status === "failed" ? "error" : activity.status} />
    </div>)}
    {running && !hasText ? <div role="status" aria-label="답변 작성 중" className="flex w-52 max-w-full flex-col gap-2.5 py-3">
      <span className="answer-shimmer h-2 w-full rounded-full" />
      <span className="answer-shimmer h-2 w-2/3 rounded-full [animation-delay:160ms]" />
    </div> : null}

  </div>
}
