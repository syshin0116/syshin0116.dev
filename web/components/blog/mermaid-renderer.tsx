"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

export function MermaidRenderer() {
  const pathname = usePathname()
  useEffect(() => {
    let cancelled = false
    const replacements: { original: HTMLElement; container: HTMLElement }[] = []
    async function render() {
      const blocks = document.querySelectorAll('code.language-mermaid, code[data-language="mermaid"]')
      if (!blocks.length) return
      const mermaid = (await import("mermaid")).default
      if (cancelled) return
      mermaid.initialize({
        startOnLoad: false,
        // Only diagrams the build-time renderer skipped reach here; neutral keeps
        // them close to its grayscale look.
        theme: document.documentElement.classList.contains("dark") ? "dark" : "neutral",
        // Mermaid 12 defaults to the ELK layout and the neo look, which ignore
        // subgraph `direction` and collide self-loop labels in our posts, and
        // narrows flowchart labels (wrap at 120px, 120px minimum width). These
        // keep the Mermaid 11 rendering.
        layout: "dagre",
        look: "classic",
        flowchart: { wrappingWidth: 200, minNodeWidth: 0 },
        securityLevel: "strict",
      })
      for (const block of Array.from(blocks)) {
        const pre = block.parentElement
        if (!pre) continue
        const definition = block.textContent ?? ""
        try {
          const id = `mermaid-${Math.random().toString(36).slice(2)}`
          const { svg } = await mermaid.render(id, definition)
          if (cancelled || !pre.isConnected) return
          const container = document.createElement("div")
          container.className = "mermaid-diagram my-4 overflow-x-auto"
          container.innerHTML = svg
          const original = pre.closest<HTMLElement>("[data-rehype-pretty-code-figure]") ?? pre
          replacements.push({ original, container })
          original.replaceWith(container)
        } catch (e) {
          console.error("Mermaid render error:", e)
        }
      }
    }
    render()
    return () => { cancelled = true; replacements.forEach(({ original, container }) => container.replaceWith(original)) }
  }, [pathname])
  return null
}
