import type { ForceGraph3DInstance, LinkObject } from "3d-force-graph"
import type { ForceGraphVRInstance } from "3d-force-graph-vr"
import type { ForceGraphARInstance } from "3d-force-graph-ar"
import { graphNeighbors, type GraphData, type GraphNode } from "../lib/graph"

type SpatialNode = GraphNode & { x?: number; y?: number; z?: number }
type SpatialLink = LinkObject<SpatialNode>
type Viewer = ForceGraph3DInstance<SpatialNode> | ForceGraphVRInstance<SpatialNode> | ForceGraphARInstance<SpatialNode>
const mode = new URLSearchParams(location.search).get("mode")
const container = document.getElementById("graph")!
const label = document.getElementById("label")!
const error = document.getElementById("error")!
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)")
let viewer: Viewer | undefined
let data: GraphData = { nodes: [], links: [] }
let selected: string | undefined
let destroyed = false
let selectedLabel: import("three").Sprite | undefined
const labelCanvas = document.createElement("canvas")
labelCanvas.width = 1024
labelCanvas.height = 128
const send = (type: string, payload = {}) => parent.postMessage({ type, ...payload }, location.origin)
const fail = (message: string) => { error.textContent = message; error.hidden = false; send("graph-error", { message }) }
const endpoint = (value: SpatialLink["source"]) => typeof value === "object" && value ? value.id : value

function highlight() {
  const neighbors = graphNeighbors(data, selected)
  if (selected) neighbors.add(selected)
  viewer?.nodeColor(node => node.id === selected ? "#5eead4" : neighbors.has(node.id) ? "#99f6e4" : node.type === "tag" ? "#fbbf24" : "#64748b")
  viewer?.linkColor((link: SpatialLink) => endpoint(link.source) === selected || endpoint(link.target) === selected ? "#5eead4" : "#334155")
  label.textContent = data.nodes.find(node => node.id === selected)?.title ?? ""
  if (selectedLabel) {
    const context = labelCanvas.getContext("2d")!
    context.clearRect(0, 0, 1024, 128)
    context.fillStyle = "#0b1220"
    context.fillRect(0, 0, 1024, 128)
    context.font = "40px sans-serif"
    context.fillStyle = "#e2e8f0"
    context.textAlign = "center"
    context.fillText(label.textContent, 512, 78, 980)
    selectedLabel.material.map!.needsUpdate = true
    const THREE = (window as unknown as { AFRAME: { THREE: typeof import("three") } }).AFRAME.THREE
    viewer?.nodeThreeObjectExtend(true).nodeThreeObject((node: SpatialNode) => node.id === selected ? selectedLabel! : new THREE.Object3D())
  }
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script")
    script.src = src
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("공간 그래프를 불러오지 못했습니다. 다시 시도해 주세요."))
    document.head.append(script)
  })
}

async function start() {
  if (mode !== "3d" && mode !== "vr" && mode !== "ar") throw new Error("지원하지 않는 그래프 보기입니다.")
  document.body.dataset.mode = mode
  if (mode !== "3d") {
    if (!isSecureContext) throw new Error("VR과 AR은 HTTPS 연결이 필요합니다.")
    await loadScript("./aframe.js")
    if (mode === "ar") {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("이 브라우저에서는 AR 카메라를 사용할 수 없습니다.")
      await loadScript("./ar.js")
    }
  }
  if (destroyed) return
  if (mode === "3d") {
    const { default: ForceGraph } = await import("3d-force-graph")
    if (destroyed) return
    viewer = (new ForceGraph(container, { controlType: "orbit", rendererConfig: { antialias: true } }) as unknown as ForceGraph3DInstance<SpatialNode>)
      .backgroundColor("#0b1220").showNavInfo(false).nodeLabel(node => {
        const span = document.createElement("span"); span.textContent = node.title; return span
      })
  } else if (mode === "vr") {
    const { default: ForceGraph } = await import("3d-force-graph-vr")
    if (destroyed) return
    viewer = (new ForceGraph(container) as unknown as ForceGraphVRInstance<SpatialNode>).backgroundColor("#0b1220").showNavInfo(false).nodeLabel(() => "")
  } else {
    const { default: ForceGraph } = await import("3d-force-graph-ar")
    if (destroyed) return
    viewer = (new ForceGraph(container, { markerAttrs: { type: "pattern", url: "../graph-marker/patt.hiro" } }) as unknown as ForceGraphARInstance<SpatialNode>).glScale(300)
    document.querySelector("a-scene")?.setAttribute("arjs", "sourceType: webcam; debugUIEnabled: false; cameraParametersUrl: ../graph-marker/camera_para.dat; maxDetectionRate: 30;")
    label.textContent = "카메라로 Hiro 마커를 비춰 주세요."
  }
  if (destroyed) { viewer._destructor(); return }
  if (mode !== "3d") {
    // A-Frame's default bitmap font omits Korean glyphs; one canvas label follows the selected node.
    const THREE = (window as unknown as { AFRAME: { THREE: typeof import("three") } }).AFRAME.THREE
    selectedLabel = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(labelCanvas), depthTest: false }))
    selectedLabel.scale.set(100, 12.5, 1)
    selectedLabel.position.y = 14
  }
  viewer.width(innerWidth).height(innerHeight).nodeRelSize(4).nodeResolution(8).linkOpacity(0.55)
    .cooldownTicks(reducedMotion.matches ? 0 : 120).warmupTicks(reducedMotion.matches ? 120 : 0)
    .onNodeClick(node => { selected = node.id; highlight(); send("graph-select", { id: node.id }) })
    .onNodeHover(node => { label.textContent = node?.title ?? data.nodes.find(item => item.id === selected)?.title ?? "" })
  send("graph-ready")
}

window.addEventListener("message", event => {
  if (event.origin !== location.origin || event.source !== parent || !viewer || !event.data) return
  const message = event.data
  if (message.type === "graph-data" && Array.isArray(message.data?.nodes) && Array.isArray(message.data?.links)) {
    data = message.data
    selected = typeof message.selected === "string" ? message.selected : undefined
    // The library mutates coordinates and edge endpoints; retain the original graph for selection.
    if (mode === "3d") {
      const scene = viewer as ForceGraph3DInstance<SpatialNode>
      let fitted = false
      scene.onEngineStop(() => {
        if (fitted) return
        fitted = true
        // Engine-stop fires before the final node positions reach the rendered objects.
        requestAnimationFrame(() => {
          if (destroyed) return
          scene.zoomToFit(reducedMotion.matches ? 0 : 400, 45)
          container.dataset.fitted = "true"
        })
      })
    }
    viewer.graphData(structuredClone(data))
    highlight()
  } else if (message.type === "graph-selection") {
    selected = typeof message.id === "string" ? message.id : undefined
    highlight()
  } else if (message.type === "graph-fit" && mode === "3d") {
    ;(viewer as unknown as ForceGraph3DInstance<SpatialNode>).zoomToFit(reducedMotion.matches ? 0 : 300, 45)
  }
})
window.addEventListener("resize", () => viewer?.width(innerWidth).height(innerHeight))
window.addEventListener("camera-error", () => fail("카메라에 연결하지 못했습니다. 브라우저의 카메라 권한을 확인해 주세요."))
window.addEventListener("keydown", event => { if (event.key === "Escape") send("graph-exit") })
window.addEventListener("pagehide", () => {
  destroyed = true
  document.querySelectorAll("video").forEach(video => { if (video.srcObject instanceof MediaStream) video.srcObject.getTracks().forEach(track => track.stop()) })
  selectedLabel?.material.map?.dispose()
  selectedLabel?.material.dispose()
  viewer?._destructor()
})
void start().catch(reason => fail(reason instanceof Error ? reason.message : "공간 그래프를 시작하지 못했습니다."))
