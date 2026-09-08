"use client"

import { useEffect, useRef, useState } from "react"
import { Focus, Glasses, LoaderCircle, ScanLine } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { GraphData } from "@/lib/graph"

export type GraphMode = "2d" | "3d" | "vr" | "ar"

export function GraphSpatial({ mode, data, selected, onSelect, onExit }: {
  mode: Exclude<GraphMode, "2d">
  data: GraphData
  selected?: string
  onSelect: (id: string) => void
  onExit: () => void
}) {
  const frame = useRef<HTMLIFrameElement>(null)
  const [started, setStarted] = useState(mode === "3d")
  const [ready, setReady] = useState(false)
  const [error, setError] = useState("")
  const [attempt, setAttempt] = useState(0)
  const current = useRef({ data, selected, onSelect, onExit })
  current.current = { data, selected, onSelect, onExit }

  useEffect(() => {
    if (!started) return
    setReady(false)
    setError("")
    const timer = setTimeout(() => setError("그래프를 시작하지 못했습니다. 다시 시도하거나 2D로 돌아가 주세요."), 30000)
    const receive = (event: MessageEvent) => {
      if (event.origin !== location.origin || event.source !== frame.current?.contentWindow || !event.data) return
      if (event.data.type === "graph-ready") {
        clearTimeout(timer)
        setReady(true)
      } else if (event.data.type === "graph-select" && current.current.data.nodes.some(node => node.id === event.data.id)) {
        current.current.onSelect(event.data.id)
      } else if (event.data.type === "graph-error") {
        clearTimeout(timer)
        setError(typeof event.data.message === "string" ? event.data.message : "그래프를 시작하지 못했습니다.")
      } else if (event.data.type === "graph-exit") current.current.onExit()
    }
    window.addEventListener("message", receive)
    return () => { clearTimeout(timer); window.removeEventListener("message", receive) }
  }, [started, attempt])

  useEffect(() => {
    if (ready) frame.current?.contentWindow?.postMessage({ type: "graph-data", data, selected: current.current.selected }, location.origin)
  }, [data, ready])
  useEffect(() => {
    if (ready) frame.current?.contentWindow?.postMessage({ type: "graph-selection", id: selected }, location.origin)
  }, [selected, ready])

  return <div className="relative min-w-0 bg-slate-950 text-slate-100 h-[38dvh] min-h-64 sm:h-[58dvh] sm:min-h-96">
    {!started ? <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      {mode === "ar" ? <ScanLine className="size-8 text-teal-300" /> : <Glasses className="size-8 text-teal-300" />}
      <h3 className="text-lg font-semibold">{mode === "ar" ? "카메라로 그래프 보기" : "VR로 그래프 탐색"}</h3>
      <p className="max-w-sm text-xs leading-relaxed text-slate-300">{mode === "ar" ? "카메라를 허용한 뒤 다른 화면이나 종이에 표시한 Hiro 마커를 비춰 주세요." : "먼저 공간 그래프를 미리 볼 수 있습니다. 지원 기기에서는 화면 안의 헤드셋 버튼으로 VR에 들어갑니다."}</p>
      {mode === "ar" && <a href="/graph-marker/hiro.jpg" target="_blank" rel="noopener noreferrer" className="text-xs text-teal-300 underline underline-offset-4">Hiro 마커 열기 ↗</a>}
      <Button onClick={() => setStarted(true)} className="bg-teal-300 text-teal-950 hover:bg-teal-200">{mode === "ar" ? "AR 카메라 시작" : "VR 미리보기 시작"}</Button>
    </div> : <>
      {!error && <iframe key={attempt} ref={frame} src={`/graph-viewer/index.html?mode=${mode}`} title={`${mode.toUpperCase()} 그래프`} allow={mode === "ar" ? "camera; fullscreen" : mode === "vr" ? "xr-spatial-tracking; fullscreen" : "fullscreen"} className="h-full w-full border-0" />}
      {!ready && !error && <div role="status" className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 bg-slate-950"><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />{mode.toUpperCase()} 그래프 불러오는 중…</div>}
      {error && <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center text-sm"><p>{error}</p><Button variant="secondary" onClick={() => { setError(""); setReady(false); setAttempt(value => value + 1) }}>다시 시도</Button><Button variant="secondary" onClick={onExit}>2D로 돌아가기</Button></div>}
      {ready && !error && <div className="absolute right-3 top-3 flex items-center gap-2 rounded-lg bg-slate-950/90 p-1 text-xs">
        {mode === "3d" ? <Button size="sm" variant="ghost" className="h-7 text-xs hover:bg-slate-800 hover:text-white" onClick={() => frame.current?.contentWindow?.postMessage({ type: "graph-fit" }, location.origin)}><Focus className="mr-1 size-3" />화면에 맞추기</Button> : <Button size="sm" variant="ghost" className="h-7 text-xs hover:bg-slate-800 hover:text-white" onClick={onExit}>{mode === "ar" ? "카메라 종료" : "VR 종료"}</Button>}
      </div>}
    </>}
  </div>
}
