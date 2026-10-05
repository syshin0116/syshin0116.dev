import { renderMermaidSVG } from "beautiful-mermaid"
import { decodeHTML, escapeText } from "entities"

// rehype-pretty-code escapes `<` inside code, so `</code></pre></figure>` can
// only be the end of the block that started the match.
const MERMAID_FIGURE =
  /<figure data-rehype-pretty-code-figure="">\s*<pre[^>]*data-language="mermaid"[^>]*>\s*<code[^>]*>([\s\S]*?)<\/code>\s*<\/pre>\s*<\/figure>/g

// Colors are CSS variables so the diagram follows the site's light/dark theme
// without a second render.
const DIAGRAM_COLORS = {
  bg: "var(--background)",
  fg: "var(--foreground)",
  transparent: true,
}

function mermaidSource(highlightedCode: string): string {
  return decodeHTML(highlightedCode.replace(/<[^>]+>/g, ""))
}

function relativeLuminance(hex: string): number | null {
  let digits = hex.slice(1)
  if (digits.length === 3) digits = digits.replace(/./g, "$&$&")
  if (!/^[0-9a-f]{6}$/i.test(digits)) return null
  const [r, g, b] = [0, 2, 4].map((offset) => {
    const channel = parseInt(digits.slice(offset, offset + 2), 16) / 255
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * A node filled by `style`/`classDef` keeps the author's color in both site
 * themes, but its label follows the theme foreground. Pick the label color
 * from the fill instead, or a light fill becomes unreadable in dark mode.
 */
function keepStyledLabelsReadable(svg: string): string {
  return svg.replace(/<g class="node"[\s\S]*?<\/g>/g, (node) => {
    const fill = node.match(/<(?:rect|polygon|path|circle|ellipse)\b[^>]*\sfill="(#[0-9a-fA-F]{3,6})"/)?.[1]
    const luminance = fill ? relativeLuminance(fill) : null
    if (luminance === null) return node
    const label = luminance > 0.18 ? "#18181b" : "#fafafa"
    return node.replaceAll('fill="var(--_text)"', `fill="${label}"`)
  })
}

// Matches the `aria-roledescription` the client Mermaid renderer sets.
const DIAGRAM_TYPES: Record<string, string> = {
  graph: "flowchart-v2",
  flowchart: "flowchart-v2",
  sequenceDiagram: "sequence",
  stateDiagram: "stateDiagram",
  "stateDiagram-v2": "stateDiagram",
  classDiagram: "class",
  erDiagram: "er",
  "xychart-beta": "xychart",
}

function diagramType(source: string): string {
  const keyword = source.trim().split(/\s+/, 1)[0] ?? ""
  return DIAGRAM_TYPES[keyword] ?? "diagram"
}

/**
 * Inline SVG `<style>` and ids are document-global. beautiful-mermaid emits
 * bare `svg {}` / `text {}` rules, a Google Fonts import, and fixed marker ids,
 * so scope the rules to this diagram, use the site font, and prefix the ids.
 */
function isolateSvg(svg: string, id: string, diagramType: string): string {
  const ids = new Set(Array.from(svg.matchAll(/\sid="([^"]+)"/g), (match) => match[1]))
  let isolated = svg
    .replace(/^\s*@import url\([^)]*\);\n/m, "")
    .replace(/^(\s*)text \{[^}]*\}/m, `$1#${id} text { font-family: var(--font-sans); }`)
    // The optional overrides share names with the site's shadcn tokens
    // (--accent, --muted, --border); reset them so the fg/bg derivations apply.
    .replace(
      /^(\s*)svg \{/m,
      `$1#${id} {\n    --line: initial; --accent: initial; --muted: initial; --surface: initial; --border: initial;`
    )
    .replace("<svg ", `<svg id="${id}" role="graphics-document document" aria-roledescription="${diagramType}" `)
    // The flowchart start marker's polygon is already reversed, so
    // auto-start-reverse flips it back into the line and `<-->` loses its
    // start head. Class diagram markers are drawn unreversed and keep it.
    // https://github.com/lukilabs/beautiful-mermaid/issues/133
    .replace(/(<marker id="arrowhead-start[^"]*"[^>]*?)orient="auto-start-reverse"/g, '$1orient="auto"')

  isolated = keepStyledLabelsReadable(isolated)

  for (const original of ids) {
    isolated = isolated
      .replaceAll(`id="${original}"`, `id="${id}-${original}"`)
      .replaceAll(`url(#${original})`, `url(#${id}-${original})`)
  }
  return isolated
}

/**
 * Notes placed before the first sequence message are dropped without an
 * error, which would publish a diagram missing part of the post.
 * https://github.com/lukilabs/beautiful-mermaid/issues/53
 */
function assertNotesRendered(source: string, svg: string): void {
  for (const [, text] of source.matchAll(/^\s*Note\s+(?:left of|right of|over)\s+[^:\n]+:\s*(.+)$/gim)) {
    if (!svg.includes(escapeText(text.trim()))) throw new Error(`note dropped: ${text.trim()}`)
  }
}

/**
 * Replace highlighted Mermaid code blocks with build-time SVG. A block that
 * beautiful-mermaid cannot render faithfully stays as code, and the client
 * renderer draws it with the full Mermaid library instead.
 */
export function renderMermaidDiagrams(html: string): string {
  let index = 0
  return html.replace(MERMAID_FIGURE, (figure, code: string) => {
    const source = mermaidSource(code)
    const id = `mermaid-diagram-${index++}`
    try {
      const rendered = renderMermaidSVG(source, DIAGRAM_COLORS)
      assertNotesRendered(source, rendered)
      const svg = isolateSvg(rendered, id, diagramType(source))
      return `<figure class="mermaid-diagram">${svg}</figure>`
    } catch (error) {
      console.warn(`mermaid: kept ${id} as code for the client renderer:`, (error as Error).message)
      return figure
    }
  })
}
