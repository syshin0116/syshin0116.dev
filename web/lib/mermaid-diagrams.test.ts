import { describe, expect, test } from "bun:test"

import { renderMermaidDiagrams } from "./mermaid-diagrams"

// Shape emitted by rehype-pretty-code for a ```mermaid fence.
function highlighted(...lines: string[]): string {
  const code = lines
    .map((line) => `<span data-line=""><span style="--shiki-light:#24292E">${line}</span></span>`)
    .join("\n")
  return (
    '<figure data-rehype-pretty-code-figure=""><pre tabindex="0" data-language="mermaid" data-theme="github-light github-dark">' +
    `<code data-language="mermaid" data-theme="github-light github-dark" style="display: grid;">${code}</code></pre></figure>`
  )
}

describe("renderMermaidDiagrams", () => {
  test("replaces a highlighted block with a theme-following SVG", () => {
    const html = renderMermaidDiagrams(
      `<p>before</p>${highlighted("graph LR", "  A[질문] --&#x3E; B[답변]")}<p>after</p>`
    )

    expect(html).toStartWith('<p>before</p><figure class="mermaid-diagram"><svg id="mermaid-diagram-0"')
    expect(html).toEndWith("</svg></figure><p>after</p>")
    expect(html).toContain("질문")
    expect(html).toContain("--bg:var(--background);--fg:var(--foreground)")
    expect(html).not.toContain("data-language")
    expect(html).toContain('role="graphics-document document" aria-roledescription="flowchart-v2"')
  })

  test("shrinks a wide diagram only down to a readable scale", () => {
    const html = renderMermaidDiagrams(highlighted("graph LR", "A --> B"))
    const width = Number(html.match(/<svg [^>]*?width="([\d.]+)"/)![1])

    expect(html).toContain(`style="width:clamp(${(width * 0.75).toFixed(1)}px,100%,${width}px);height:auto;`)
  })

  test("keeps diagram styles and ids from leaking into the page", () => {
    const html = renderMermaidDiagrams(highlighted("graph LR", "A --> B") + highlighted("graph LR", "C --> D"))

    expect(html).not.toContain("@import")
    expect(html).not.toMatch(/^\s*(svg|text) \{/m)
    expect(html).toContain("#mermaid-diagram-0 text { font-family: var(--font-sans); }")
    expect(html).toContain("--accent: initial;")
    expect(html).toContain('id="mermaid-diagram-0-arrowhead"')
    expect(html).toContain('marker-end="url(#mermaid-diagram-1-arrowhead)"')
    expect(html).not.toContain('id="arrowhead"')
  })

  test("labels nodes with author fills by contrast, not by site theme", () => {
    const html = renderMermaidDiagrams(
      highlighted("graph LR", "A[light] --> B[dark]", "style A fill:#d4f1f9", "style B fill:#222")
    )

    expect(html).toMatch(/data-label="light"[\s\S]*?fill="#18181b"[^>]*>light</)
    expect(html).toMatch(/data-label="dark"[\s\S]*?fill="#fafafa"[^>]*>dark</)
  })

  test("points both heads of a bidirectional edge outward", () => {
    const html = renderMermaidDiagrams(highlighted("graph LR", "A &#x3C;--&#x3E; B"))

    expect(html).toContain('marker-start="url(#mermaid-diagram-0-arrowhead-start)"')
    expect(html).not.toContain("auto-start-reverse")
  })

  test("keeps class diagram markers pointing at the source side", () => {
    const html = renderMermaidDiagrams(highlighted("classDiagram", "Animal &#x3C;|-- Duck"))

    expect(html).toContain('aria-roledescription="class"')
    expect(html).toContain('marker-start="url(#mermaid-diagram-0-cls-inherit)"')
    expect(html).toMatch(/<marker id="mermaid-diagram-0-cls-inherit"[^>]*orient="auto-start-reverse"/)
    expect(html).not.toContain("@import")
    expect(html).not.toMatch(/^\s*\.mono \{/m)
  })

  test("draws classDef dash patterns and falls back on other unsupported styles", () => {
    const dashed = renderMermaidDiagrams(
      highlighted("graph LR", "A[도구]:::sw --&#x3E; B", "classDef sw fill:#eee,stroke:#999,stroke-dasharray:4 3;")
    )
    expect(dashed).toMatch(/data-id="A"[^>]*>\s*<rect stroke-dasharray="4 3"/)
    expect(dashed).not.toMatch(/data-id="B"[^>]*>\s*<rect stroke-dasharray/)

    for (const style of ["style A font-weight:bold", "style A fill:white"]) {
      const figure = highlighted("graph LR", "A --&#x3E; B", style)
      expect(renderMermaidDiagrams(figure)).toBe(figure)
    }
  })

  test("keeps flowcharts with unparseable unspaced edges as code", () => {
    for (const edge of ["B2 -.옆 엑셀로 우회.-&#x3E; B2", "A --라벨--&#x3E; B", "A ==강조==&#x3E; B", "A--&#x3E;B", "A-.-&#x3E;B", "가--&#x3E;나"]) {
      const figure = highlighted("graph LR", edge)
      expect(renderMermaidDiagrams(figure)).toBe(figure)
    }
    const spaced = highlighted("graph LR", 'A -. "우회" .-&#x3E; B', "C[--flag] --&#x3E; D", "E[x]--&#x3E;F", "G==&#x3E;H")
    expect(renderMermaidDiagrams(spaced)).toStartWith('<figure class="mermaid-diagram">')
  })

  test("keeps a sequence diagram as code when a note would be dropped", () => {
    const leadingNote = highlighted("sequenceDiagram", "Note over A,B: 1. 준비", "A->>B: 요청", "Note over A,B: 2. 처리")
    const laterNoteOnly = highlighted("sequenceDiagram", "A->>B: 요청", "Note over A,B: 2. 처리")

    expect(renderMermaidDiagrams(leadingNote)).toBe(leadingNote)
    expect(renderMermaidDiagrams(laterNoteOnly)).toContain("2. 처리")
    expect(renderMermaidDiagrams(laterNoteOnly)).toStartWith('<figure class="mermaid-diagram">')
  })

  test("leaves unsupported diagrams as code for the client renderer", () => {
    const figure = highlighted("pie title Share", '"a" : 1')

    expect(renderMermaidDiagrams(figure)).toBe(figure)
  })
})
