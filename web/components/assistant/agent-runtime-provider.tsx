"use client"

import {
  AssistantRuntimeProvider,
  type RemoteThreadListAdapter,
} from "@assistant-ui/react"
import { useLangChainError, useLangChainStream, useStreamRuntime } from "@assistant-ui/react-langchain"
import { Client } from "@langchain/langgraph-sdk"
import { useChannelEffect } from "@langchain/react"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import type { AgentTokenIntent } from "@/lib/agent-token-intent"
import {
  DEFAULT_AGENT_MODEL,
  normalizeAgentModel,
  type AgentModel,
} from "@/lib/agent-model"

import {
  InspectionProjector,
  type AgentActivity,
} from "./runtime/inspection"
import { AgentTokenBroker } from "./runtime/token-broker"
import { normalizeAgentApiUrl } from "./runtime/agent-config"
import { warmAgent } from "./runtime/agent-warmup"
import {
  reduceAgentError,
  type AgentErrorRoutingState,
} from "./runtime/error-state"
import { AegraThreadAdapter } from "./runtime/thread-adapter"


const MAX_VISIBLE_ACTIVITIES = 24
type InspectionAvailability = "waiting" | "live" | "past-unavailable"

type AgentRuntimeUiState = AgentErrorRoutingState & {
  activities: readonly AgentActivity[]
  activeThreadId?: string
  inspectionAvailability: InspectionAvailability
  dismissTurnError: () => void
  retryConnection: () => void
  modelSelection: boolean
  selectedModel: AgentModel
  setSelectedModel: (model: AgentModel) => void
}

const AgentRuntimeUiContext = createContext<AgentRuntimeUiState | null>(null)

export function useAgentRuntimeUi(): AgentRuntimeUiState {
  const context = useContext(AgentRuntimeUiContext)
  if (!context) {
    throw new Error("useAgentRuntimeUi must be used inside AgentRuntimeProvider")
  }
  return context
}

interface AgentRuntimeProviderProps {
  identity: string
  initialToken?: string
  onAuthenticationExpired?: () => void
  tokenIntent?: AgentTokenIntent
  modelSelection?: boolean
  children: React.ReactNode
}

function resolveAgentConfig():
  | { apiUrl: string; assistantId: string }
  | { error: string } {
  const parsed = normalizeAgentApiUrl(process.env.NEXT_PUBLIC_AGENT_API_URL)
  if ("error" in parsed) return parsed
  return {
    apiUrl: parsed.apiUrl,
    assistantId:
      process.env.NEXT_PUBLIC_AGENT_ASSISTANT_ID?.trim() || "agent",
  }
}

function ConfiguredAgentRuntimeProvider({
  identity,
  initialToken,
  onAuthenticationExpired,
  tokenIntent,
  modelSelection = false,
  apiUrl,
  assistantId,
  children,
}: AgentRuntimeProviderProps & { apiUrl: string; assistantId: string }) {
  const [activities, setActivities] = useState<AgentActivity[]>([])
  const [activeThreadId, setActiveThreadId] = useState<string>()
  const [inspectionAvailability, setInspectionAvailability] =
    useState<InspectionAvailability>("waiting")
  const [connectionAttempt, setConnectionAttempt] = useState(0)
  const [selectedModel, setSelectedModelState] =
    useState<AgentModel>(DEFAULT_AGENT_MODEL)
  const setSelectedModel = useCallback((model: AgentModel) => {
    const normalized = normalizeAgentModel(model)
    setSelectedModelState(normalized)
  }, [])
  const [errorRouting, setErrorRouting] = useState<AgentErrorRoutingState>({
    connectionStatus: "connecting",
  })
  const tokenBroker = useMemo(() => new AgentTokenBroker(identity, {
    agentOrigin: apiUrl,
    initialToken,
    onAuthenticationExpired,
    tokenIntent,
  }), [apiUrl, identity, initialToken, onAuthenticationExpired, tokenIntent])
  const client = useMemo(() => new Client({
    apiUrl,
    apiKey: null,
    streamProtocol: "v2",
    onRequest: (url, init) => tokenBroker.onRequest(url, init),
    callerOptions: { fetch: tokenBroker.fetchWithAuthRetry as typeof fetch, maxRetries: 0 },
  }), [apiUrl, tokenBroker])
  const threadAdapter = useMemo<RemoteThreadListAdapter>(
    () => new AegraThreadAdapter(client, { assistantId }),
    [assistantId, client]
  )
  const handleActivity = useCallback((activity: AgentActivity) => {
    setInspectionAvailability("live")
    setActivities((current) => [
      ...current.filter((item) => item.id !== activity.id).slice(-(MAX_VISIBLE_ACTIVITIES - 1)),
      activity,
    ])
  }, [])
  const handleRuntimeError = useCallback((error: unknown) => {
    setErrorRouting((current) => reduceAgentError(current, error, "turn"))
  }, [])
  const dismissTurnError = useCallback(() => {
    setErrorRouting((current) => ({
      ...current,
      turnError: undefined,
    }))
  }, [])
  const retryConnection = useCallback(() => {
    tokenBroker.clear()
    setErrorRouting({
      connectionStatus: "connecting",
    })
    setConnectionAttempt((attempt) => attempt + 1)
  }, [tokenBroker])
  const runtime = useStreamRuntime({
    client,
    assistantId,
    unstable_threadListAdapter: threadAdapter,
    onCreated: () => {
      setActivities([])
      setInspectionAvailability("waiting")
      dismissTurnError()
    },
    onThreadIdChange: (threadId) => {
      setActiveThreadId(threadId)
      setActivities([])
      setInspectionAvailability(threadId ? "past-unavailable" : "waiting")
      dismissTurnError()
    },
  })

  useEffect(() => {
    const controller = new AbortController()
    setErrorRouting({
      connectionStatus: "connecting",
    })
    // A minted credential only proves Vercel answered. The badge claims the
    // agent is reachable, so wait for the agent itself before saying so.
    void Promise.all([
      tokenBroker.get(controller.signal),
      warmAgent({ apiUrl, signal: controller.signal }).then((ready) => {
        if (!ready) throw new Error("Agent readiness probe did not succeed")
      }),
    ])
      .then(() =>
        setErrorRouting({
          connectionStatus: "ready",
        })
      )
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setErrorRouting((current) =>
          reduceAgentError(
            current,
            error instanceof Error
              ? error
              : new Error("Agent authentication preparation failed"),
            "connection"
          )
        )
      })
    return () => {
      controller.abort()
    }
  }, [apiUrl, connectionAttempt, tokenBroker])

  const context = useMemo<AgentRuntimeUiState>(
    () => ({
      ...errorRouting,
      activities,
      activeThreadId,
      inspectionAvailability,
      dismissTurnError,
      retryConnection,
      modelSelection,
      selectedModel,
      setSelectedModel,
    }),
    [
      activeThreadId,
      activities,
      dismissTurnError,
      errorRouting,
      inspectionAvailability,
      retryConnection,
      selectedModel,
      setSelectedModel,
      modelSelection,
    ]
  )

  return (
    <AgentRuntimeUiContext.Provider value={context}>
      <AssistantRuntimeProvider runtime={runtime}>
        <RuntimeEvents key={activeThreadId} onActivity={handleActivity} onError={handleRuntimeError} />
        {children}
      </AssistantRuntimeProvider>
    </AgentRuntimeUiContext.Provider>
  )
}

function RuntimeEvents({ onActivity, onError }: {
  onActivity: (activity: AgentActivity) => void
  onError: (error: unknown) => void
}) {
  const stream = useLangChainStream()
  const error = useLangChainError()
  useEffect(() => { if (error) onError(error) }, [error, onError])
  return stream ? <>
    <StreamEvents stream={stream} onActivity={onActivity} />
  </> : null
}

function StreamEvents({ stream, onActivity }: {
  stream: NonNullable<ReturnType<typeof useLangChainStream>>
  onActivity: (activity: AgentActivity) => void
}) {
  const projector = useRef(new InspectionProjector())
  const handleEvent = useCallback((event: import("@langchain/protocol").Event) => {
    const activity = event.method === "lifecycle"
      ? projector.current.consumeLifecycle(event)
      : event.method === "tools"
        ? projector.current.consumeTool(event)
        : event.method === "custom"
          ? projector.current.consumeCustom(event)
          : undefined
    if (activity) onActivity(activity)
  }, [onActivity])
  useChannelEffect(stream, ["lifecycle", "tools", "custom"], {
    replay: true,
    onEvent: handleEvent,
  })
  useEffect(() => stream.getThread()?.onEvent((event) => {
    if (event.params.namespace.length > 0) handleEvent(event)
  }), [stream, handleEvent])
  return null
}

export function AgentRuntimeProvider({
  identity,
  initialToken,
  onAuthenticationExpired,
  tokenIntent,
  modelSelection,
  children,
}: AgentRuntimeProviderProps) {
  const config = resolveAgentConfig()
  if ("error" in config) {
    return (
      <section className="flex min-h-[70svh] items-center justify-center px-6">
        <div
          role="alert"
          className="max-w-md rounded-2xl border bg-card p-6 text-center shadow-sm"
        >
          <p className="font-medium">AI 실험실을 열 수 없습니다.</p>
          <p className="mt-2 text-sm text-muted-foreground">{config.error}</p>
        </div>
      </section>
    )
  }

  return (
    <ConfiguredAgentRuntimeProvider
      identity={identity}
      initialToken={initialToken}
      onAuthenticationExpired={onAuthenticationExpired}
      tokenIntent={tokenIntent}
      modelSelection={modelSelection}
      apiUrl={config.apiUrl}
      assistantId={config.assistantId}
    >
      {children}
    </ConfiguredAgentRuntimeProvider>
  )
}

export const agentRuntimeProviderTesting = {
  resolveAgentConfig,
}
