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

  test("keeps flowcharts as code when the parser drops ids or labels", () => {
    for (const edge of ["A --&#x3E; 노드[끝]", "A ~~~ B"]) {
      const figure = highlighted("flowchart LR", edge)
      expect(renderMermaidDiagrams(figure)).toBe(figure)
    }
    const labelled = highlighted("flowchart LR", "A[시작] --&#x3E; B", "B --&#x3E;|확인| C{통과?}", "C -- 예 --&#x3E; D")
    expect(renderMermaidDiagrams(labelled)).toStartWith('<figure class="mermaid-diagram">')
  })

  test("keeps flowcharts with unparseable unspaced edges as code", () => {
    for (const edge of ["B2 -.옆 엑셀로 우회.-&#x3E; B2", "A --라벨--&#x3E; B", "A ==강조==&#x3E; B", "A--&#x3E;B", "A-.-&#x3E;B", "가--&#x3E;나", "E[x]--&#x3E;F"]) {
      const figure = highlighted("graph LR", edge)
      expect(renderMermaidDiagrams(figure)).toBe(figure)
    }
    const spaced = highlighted("graph LR", 'A -. "우회" .-&#x3E; B', "C[--flag] --&#x3E; D", "E ==&#x3E; F")
    expect(renderMermaidDiagrams(spaced)).toStartWith('<figure class="mermaid-diagram">')
  })

  test("keeps a sequence diagram as code when a note would be dropped", () => {
    const leadingNote = highlighted("sequenceDiagram", "Note over A,B: 1. 준비", "A->>B: 요청", "Note over A,B: 2. 처리")
    const laterNoteOnly = highlighted("sequenceDiagram", "A->>B: 요청", "Note over A,B: 2. 처리")

    expect(renderMermaidDiagrams(leadingNote)).toBe(leadingNote)
    expect(renderMermaidDiagrams(laterNoteOnly)).toContain("2. 처리")
    expect(renderMermaidDiagrams(laterNoteOnly)).toStartWith('<figure class="mermaid-diagram">')
  })

  test("leaves diagram types and statements without build-time checks as code", () => {
    const figures = [
      highlighted("pie title Share", '"a" : 1'),
      highlighted("classDiagram", "Animal &#x3C;|-- Duck"),
      highlighted("stateDiagram-v2", "state fork_state &#x3C;&#x3C;fork&#x3E;&#x3E;", "[*] --&#x3E; fork_state"),
      highlighted("erDiagram", "p[Person] {", "string name", "}"),
      highlighted("sequenceDiagram", "A-&#x3E;&#x3E;B: 요청", "activate B", "B--&#x3E;&#x3E;A: 응답"),
      highlighted("graph LR", "A:::x --&#x3E; B:::y", "classDef x,y fill:#f00"),
      highlighted("graph LR", "A[one]", "B[two]", "A ----&#x3E; B"),
      highlighted("graph LR", "A[/input/] --&#x3E; B"),
      highlighted("graph LR", "A --&#x3E;|라벨| B", "linkStyle 0 color:red"),
      highlighted("graph LR", "A --&#x3E; B", "style A,B stroke-dasharray:4 3"),
      highlighted("graph LR", "A &#x26; B --&#x3E; C"),
      highlighted("sequenceDiagram", "A-xB: lost"),
      highlighted("sequenceDiagram", "A--xB: lost"),
      highlighted("graph LR; A ~~~ B"),
      highlighted("graph LR", "A", "B", "A--&#x3E;B"),
      highlighted("graph LR", 'A["`**굵게**`"] --&#x3E; B'),
      highlighted("sequenceDiagram", 'participant API as "Public API"', "API-&#x3E;&#x3E;API: 호출"),
      highlighted("graph LR", "A[노드 끝] --&#x3E; 노드[끝]"),
      highlighted("graph LR", "A --&#x3E; B", "classDef default font-weight:bold"),
      highlighted("graph LR", "A --&#x3E; B", "classDef default fill:#f00"),
      highlighted("graph LR", "A --&#x3E; B", "classDef hot fill:#f00", "class A hot;"),
      highlighted("graph LR", "A:::warning-node --&#x3E; B", "classDef warning-node fill:#f00"),
      highlighted("sequenceDiagram", "A-&#x3E;&#x3E;B: I #9829; you!"),
    ]

    for (const figure of figures) expect(renderMermaidDiagrams(figure)).toBe(figure)
  })

  test("renders verified sequence statements at build time", () => {
    const html = renderMermaidDiagrams(
      highlighted("sequenceDiagram", "participant C as 클라이언트", "C-&#x3E;&#x3E;+API: 요청", "API--&#x3E;&#x3E;-C: 응답", "Note over C,API: 완료")
    )

    expect(html).toContain('aria-roledescription="sequence"')
    expect(html).toContain("클라이언트")
  })
})
