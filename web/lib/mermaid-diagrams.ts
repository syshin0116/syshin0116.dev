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

// Shrink a wide diagram to the column, but not below this share of its size;
// past that the figure scrolls so labels stay readable on mobile.
const MIN_DIAGRAM_SCALE = 0.75

/**
 * Inline SVG `<style>` and ids are document-global. beautiful-mermaid emits
 * bare `svg {}` / `text {}` / `.mono {}` rules, Google Fonts imports, and fixed
 * marker ids, so scope the rules to this diagram, use the site fonts, and
 * prefix the ids.
 */
function isolateSvg(svg: string, id: string, diagramType: string): string {
  const ids = new Set(Array.from(svg.matchAll(/\sid="([^"]+)"/g), (match) => match[1]))
  const width = Number(svg.match(/<svg [^>]*?\bwidth="([\d.]+)"/)?.[1] ?? 0)
  let isolated = svg
    .replace(/^\s*@import url\([^)]*\);\n/gm, "")
    .replace(/^(\s*)text \{[^}]*\}/m, `$1#${id} text { font-family: var(--font-sans); }`)
    .replace(/^(\s*)\.mono \{[^}]*\}/m, `$1#${id} .mono { font-family: ui-monospace, monospace; }`)
    .replace(
      /(<svg [^>]*?style=")/,
      `$1width:clamp(${(width * MIN_DIAGRAM_SCALE).toFixed(1)}px,100%,${width}px);height:auto;`
    )
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

// Node style properties beautiful-mermaid draws, plus the dash pattern
// applied below. Anything else would be dropped without an error.
const SUPPORTED_NODE_STYLES = new Set(["fill", "stroke", "stroke-width", "color", "stroke-dasharray"])

function styleProperties(declaration: string): Map<string, string> {
  return new Map(
    declaration
      .replace(/;\s*$/, "")
      .split(",")
      .map((property) => property.split(":").map((part) => part.trim()) as [string, string])
      .filter(([name, value]) => name && value)
  )
}

/**
 * Resolve `style` and `classDef` declarations per node, rejecting properties
 * the renderer would silently ignore.
 */
function nodeStyles(source: string): Map<string, Map<string, string>> {
  const classes = new Map<string, Map<string, string>>()
  const styles = new Map<string, Map<string, string>>()
  const assign = (node: string, properties: Map<string, string> | undefined) => {
    if (!properties) return
    styles.set(node, new Map([...(styles.get(node) ?? []), ...properties]))
  }

  for (const [, names, declaration] of source.matchAll(/^\s*classDef\s+(\S+)\s+(.+)$/gm)) {
    for (const name of names.split(",")) classes.set(name, styleProperties(declaration))
  }
  for (const [, nodes, name] of source.matchAll(/^\s*class\s+(\S+)\s+(\S+?);?\s*$/gm)) {
    for (const node of nodes.split(",")) assign(node, classes.get(name))
  }
  for (const [, node, name] of source.matchAll(/([\w-]+)(?:\[[^\]\n]*\]|\([^)\n]*\)|\{[^}\n]*\})?:::([\w-]+)/g)) {
    assign(node, classes.get(name))
  }
  for (const [, node, declaration] of source.matchAll(/^\s*style\s+(\S+)\s+(.+)$/gm)) {
    assign(node, styleProperties(declaration))
  }

  for (const [node, properties] of styles) {
    for (const name of properties.keys()) {
      if (!SUPPORTED_NODE_STYLES.has(name)) throw new Error(`unsupported style ${name} on ${node}`)
    }
  }
  return styles
}

function applyDashedBorders(svg: string, styles: Map<string, Map<string, string>>): string {
  let dashed = svg
  for (const [node, properties] of styles) {
    const pattern = properties.get("stroke-dasharray")
    if (!pattern || !/^[\d.\s]+$/.test(pattern)) continue
    dashed = dashed.replace(
      new RegExp(`(<g class="node" data-id="${node.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*>\\s*<(?:rect|polygon|path|circle|ellipse)\\b)`),
      `$1 stroke-dasharray="${pattern}"`
    )
  }
  return dashed
}

/**
 * The flowchart edge parser requires spaces around inline labels, so `A -.label.-> B`,
 * `A --label--> B`, and `A ==label==> B` drop the edge and its target without
 * an error. Label text is removed first so `--flag` inside a node is ignored.
 */
function assertEdgeLabelsSpaced(source: string): void {
  const structure = source
    .replace(/%%.*$/gm, "")
    .replace(/"[^"\n]*"|\[[^\]\n]*\]|\([^)\n]*\)|\{[^}\n]*\}|\|[^|\n]*\|/g, "")
  const compact = structure.match(/(?:--|==)[^\s>=|-]\S*|-\.[^\s.-]\S*/)
  if (compact) throw new Error(`unspaced edge label: ${compact[0]}`)
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
      const type = diagramType(source)
      if (type === "flowchart-v2") assertEdgeLabelsSpaced(source)
      const styles = type === "flowchart-v2" ? nodeStyles(source) : new Map()
      const rendered = applyDashedBorders(renderMermaidSVG(source, DIAGRAM_COLORS), styles)
      if (rendered.includes('viewBox="0 0 0 0"')) throw new Error("rendered an empty diagram")
      assertNotesRendered(source, rendered)
      const svg = isolateSvg(rendered, id, type)
      return `<figure class="mermaid-diagram">${svg}</figure>`
    } catch (error) {
      console.warn(`mermaid: kept ${id} as code for the client renderer:`, (error as Error).message)
      return figure
    }
  })
}
