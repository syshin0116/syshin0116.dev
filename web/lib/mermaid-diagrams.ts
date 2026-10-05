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

// Diagram types rendered at build time, with the `aria-roledescription` the
// client Mermaid renderer sets. beautiful-mermaid also draws state, class, ER,
// and XY charts, but silently skips syntax in each (forks, aliases, ...); only
// the types the blog uses and these checks cover are rendered here.
const DIAGRAM_TYPES: Record<string, string> = {
  graph: "flowchart-v2",
  flowchart: "flowchart-v2",
  sequenceDiagram: "sequence",
}

function diagramType(source: string): string {
  const keyword = source.trim().split(/\s+/, 1)[0] ?? ""
  const type = DIAGRAM_TYPES[keyword]
  if (!type) throw new Error(`not rendered at build time: ${keyword}`)
  return type
}

// Shrink a wide diagram to the column, but not below this share of its size;
// past that the figure scrolls so labels stay readable on mobile.
const MIN_DIAGRAM_SCALE = 0.75

/**
 * Inline SVG `<style>` and ids are document-global. beautiful-mermaid emits
 * bare `svg {}` / `text {}` rules, Google Fonts imports, and fixed marker ids,
 * so scope the rules to this diagram, use the site font, and prefix the ids.
 */
function isolateSvg(svg: string, id: string, diagramType: string): string {
  const ids = new Set(Array.from(svg.matchAll(/\sid="([^"]+)"/g), (match) => match[1]))
  const width = Number(svg.match(/<svg [^>]*?\bwidth="([\d.]+)"/)?.[1] ?? 0)
  let isolated = svg
    .replace(/^\s*@import url\([^)]*\);\n/gm, "")
    .replace(/^(\s*)text \{[^}]*\}/m, `$1#${id} text { font-family: var(--font-sans); }`)
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
    // start head.
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

const WORD = /[\p{L}\p{N}_]+/gu
const FLOWCHART_DIRECTIVE = /^\s*(?:classDef|class|style|linkStyle|click|direction|end)\b/

/**
 * The flowchart parser stops at syntax it does not know (Unicode ids, `~~~`,
 * unspaced connectors, ...) and still returns a diagram without the rest of
 * the line. Every word of the source's ids and labels must therefore show up
 * in the SVG's text or node ids, or the block is left for the client renderer.
 */
function assertFlowchartTextRendered(source: string, svg: string): void {
  const rendered = new Set(
    Array.from(svg.matchAll(/data-(?:id|label)="([^"]*)"|>([^<]+)</g), (match) =>
      decodeHTML(match[1] ?? match[2]).match(WORD) ?? []
    ).flat()
  )
  const [, ...body] = source.replace(/%%.*$/gm, "").trim().split("\n")
  for (const line of body) {
    if (FLOWCHART_DIRECTIVE.test(line)) continue
    const text = line.replace(/:::[\w-]+/g, "").replace(/<br\s*\/?>/gi, " ").replace(/^\s*subgraph\b/, "")
    for (const word of text.match(WORD) ?? []) {
      if (!rendered.has(word)) throw new Error(`dropped text: ${word}`)
    }
  }
}

// Sequence statements whose rendering is verified; anything else (activate,
// loop, alt, rect, autonumber, box, `-x` lost messages drawn as plain arrows,
// ...) is left for the client renderer.
const SEQUENCE_STATEMENT =
  /^\s*(?:(?:participant|actor)\s+[^\s"]+(?:\s+as\s+[^"]+)?|[^\s:]+?\s*(?:-->>|->>|-->|->|--\)|-\))[+-]?\s*[^\s:]+\s*:.*|Note\s+(?:left of|right of|over)\s+[^:]+:.*)$/

function assertSequenceStatementsSupported(source: string): void {
  const [header, ...body] = source.replace(/%%.*$/gm, "").trim().split("\n")
  if (header.trim() !== "sequenceDiagram") throw new Error(`unverified sequence header: ${header}`)
  for (const line of body) {
    if (line.trim() && (UNRENDERED_TEXT.test(line) || !SEQUENCE_STATEMENT.test(line))) throw new Error(`unverified sequence statement: ${line.trim()}`)
  }
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
 * Resolve `style` and `classDef` (applied with `:::`) declarations per node, rejecting properties
 * the renderer would silently ignore.
 */
function assertStyleSupported(properties: Map<string, string>, target: string): void {
  for (const name of properties.keys()) {
    if (!SUPPORTED_NODE_STYLES.has(name)) throw new Error(`unsupported style ${name} on ${target}`)
  }
  // Label contrast is computed from hex fills only.
  const fill = properties.get("fill")
  if (fill && relativeLuminance(fill) === null) throw new Error(`non-hex fill ${fill} on ${target}`)
}

function nodeStyles(source: string): Map<string, Map<string, string>> {
  const classes = new Map<string, Map<string, string>>()
  const styles = new Map<string, Map<string, string>>()
  const assign = (node: string, properties: Map<string, string> | undefined) => {
    if (!properties) return
    styles.set(node, new Map([...(styles.get(node) ?? []), ...properties]))
  }

  for (const [, name, declaration] of source.matchAll(/^\s*classDef\s+(\S+)\s+(.+)$/gm)) {
    // The parser reads one class name and drops `classDef a,b ...` entirely.
    if (name.includes(",")) throw new Error(`multi-name classDef ${name}`)
    // Checked per declaration: `default` applies without any assignment.
    const properties = styleProperties(declaration)
    assertStyleSupported(properties, `classDef ${name}`)
    classes.set(name, properties)
  }
  for (const [, node, name] of source.matchAll(/([\w-]+)(?:\[[^\]\n]*\]|\([^)\n]*\)|\{[^}\n]*\})?:::([\w-]+)/g)) {
    assign(node, classes.get(name))
  }
  for (const [, node, declaration] of source.matchAll(/^\s*style\s+(\S+)\s+(.+)$/gm)) {
    const properties = styleProperties(declaration)
    assertStyleSupported(properties, node)
    assign(node, properties)
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

// Markdown strings (backticks) and entity codes (`#9829;`) are printed
// literally by the renderer.
const UNRENDERED_TEXT = /`|#\w+;/

// Flowchart syntax whose rendering is verified; anything else (`&` chains,
// extended `---->` links, `[/ /]` shapes, linkStyle, click, ...) is left for
// the client renderer because the parser skips it without an error. Links
// need surrounding spaces: `A-->B` reads as node `A--`.
// The parser matches ids with ASCII `\w` and drops a Unicode-id node.
const FLOWCHART_ID = String.raw`[A-Za-z0-9_]+(?:-[A-Za-z0-9_]+)*`
const FLOWCHART_NODE = String.raw`${FLOWCHART_ID}(?:\[\([^)\]]*\)\]|\[(?![/\\(])[^\]]*\]|\{(?!\{)[^}]*\}|\((?!\()[^)]*\))?`
const FLOWCHART_LINK = String.raw`(?:<-->|-->|---|-\.->|==>|-- [^-|]+? -->|-\. [^|]+? \.->|== [^=|]+? ==>)(?:\|[^|]*\|)?`
const FLOWCHART_STATEMENT = new RegExp(
  String.raw`^\s*(?:${FLOWCHART_NODE}(?:\s+${FLOWCHART_LINK}\s+${FLOWCHART_NODE})*` +
    String.raw`|subgraph\s+(?:${FLOWCHART_ID}(?:\[[^\]]*\])?|"[^"]*")|end|direction\s+(?:TB|TD|BT|LR|RL)` +
    String.raw`|classDef\s+(?!default\s)\w+\s+\S.*|style\s+${FLOWCHART_ID}\s+\S.*)\s*$`,
  "u"
)

function assertFlowchartStatementsSupported(source: string): void {
  const [header, ...body] = source.replace(/%%.*$/gm, "").trim().split("\n")
  if (!/^(?:graph|flowchart)(?:\s+(?:TB|TD|BT|LR|RL))?\s*$/.test(header)) {
    throw new Error(`unverified flowchart header: ${header}`)
  }
  for (const line of body) {
    const statement = line.replace(/:::\w+/g, "")
    if (statement.trim() && (UNRENDERED_TEXT.test(statement) || !FLOWCHART_STATEMENT.test(statement))) {
      throw new Error(`unverified flowchart statement: ${line.trim()}`)
    }
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
      const type = diagramType(source)
      if (type === "flowchart-v2") assertFlowchartStatementsSupported(source)
      if (type === "sequence") assertSequenceStatementsSupported(source)
      const styles = type === "flowchart-v2" ? nodeStyles(source) : new Map()
      const rendered = applyDashedBorders(renderMermaidSVG(source, DIAGRAM_COLORS), styles)
      if (rendered.includes('viewBox="0 0 0 0"')) throw new Error("rendered an empty diagram")
      if (type === "flowchart-v2") assertFlowchartTextRendered(source, rendered)
      assertNotesRendered(source, rendered)
      const svg = isolateSvg(rendered, id, type)
      return `<figure class="mermaid-diagram">${svg}</figure>`
    } catch (error) {
      console.warn(`mermaid: kept ${id} as code for the client renderer:`, (error as Error).message)
      return figure
    }
  })
}
