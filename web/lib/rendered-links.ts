import path from "node:path"
import { marked, type Token } from "marked"
import { tagPath } from "./tag"

export interface RenderedLinkContext {
  /** Source path of the rendered note, without `.md` (e.g. `AI/Some Post`). */
  from: string
  /** Raw markdown of the note, used to tell real `#tags` from hashes nuartz mistook for tags. */
  markdown: string
  /** Exact content-root note lookup; returns the note's source slug. */
  resolveNotePath(contentPath: string): string | undefined
  /** Public href for a note source slug. */
  notePath(source: string): string
  /** Whether a publishable media file exists at this content-root path. */
  isPublishedMedia(contentPath: string): boolean
}

export interface RewrittenLinks {
  html: string
  /** Inline tags still rendered as tag links, in document order. */
  inlineTags: string[]
}

interface OpenLink {
  close: string
  href: string
}

const TOKEN = /<(\/?)(a|img)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/gi
// nuartz 0.3.0 renders each inline tag as an empty duplicate anchor followed by the real one.
const NUARTZ_TAG = /<a href="\/tags\/[^"]*" class="tag" data-tag="([^"]*)">(#[^<]*)?<\/a>/y
// nuartz stops a tag at a non-ASCII letter or `/`; Obsidian keeps going (`#adsp중요`, `#a/b`).
const TAG_CONTINUATION = /^(?:[\p{L}\p{N}_-]|\/(?=[\p{L}\p{N}_-]))+/u
const ATTRIBUTE = (name: string) => new RegExp(`(\\s${name}=")([^"]*)(")`, "i")
const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#|\/blog\/|\/api\/|\/_next\/)/i

function decodeAttribute(value: string): string {
  return value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'")
}

function encodeAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;")
}

const NAMED_ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\u00a0" }

function decodeEntity(entity: string): string {
  const name = entity.slice(1, -1)
  if (name.startsWith("#x") || name.startsWith("#X")) return String.fromCodePoint(parseInt(name.slice(2), 16))
  if (name.startsWith("#")) return String.fromCodePoint(Number(name.slice(1)))
  return NAMED_ENTITIES[name] ?? entity
}

/**
 * End index of the HTML starting at `start` whose visible text is `markdown` with its
 * inline formatting markers removed, including the closing tags of elements it opened,
 * or -1 when the HTML does not continue with that text.
 */
function renderedTextEnd(html: string, start: number, markdown: string): number {
  const expected = markdown.replace(/[*_~`]|==/g, "")
  if (!expected) return -1
  let index = start
  let matched = 0
  let depth = 0
  while (matched < expected.length && index < html.length) {
    if (html[index] === "<") {
      const end = html.indexOf(">", index)
      if (end < 0) return -1
      depth += html[index + 1] === "/" ? -1 : 1
      if (depth < 0) return -1
      index = end + 1
      continue
    }
    const entity = /^&(?:#x[0-9a-f]+|#\d+|[a-z]+);/i.exec(html.slice(index, index + 12))?.[0]
    const character = entity ? decodeEntity(entity) : html[index]
    if (character !== expected[matched]) return -1
    matched += 1
    index += entity?.length ?? 1
  }
  while (depth > 0 && html.startsWith("</", index)) {
    index = html.indexOf(">", index) + 1
    depth -= 1
  }
  return matched === expected.length && depth === 0 ? index : -1
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

// What nuartz turns into a tag anchor (ASCII start) plus the continuation it misses.
const MARKDOWN_HASH = /#[a-zA-Z][a-zA-Z0-9_-]*(?:[\p{L}\p{N}_-]|\/(?=[\p{L}\p{N}_-]))*/gu
// Source nuartz never renders as text: frontmatter and Obsidian comments.
const NOT_RENDERED = /^---\n[\s\S]*?\n---|%%[\s\S]*?%%/g
// A wikilink displays only its alias, so the target never reaches the tag plugin.
const WIKILINK_TARGET = /\[\[[^\]|]*\|?/g
const MARKDOWN_LINK = /\[((?:[^[\]]|\[[^\]]*\])*)\]\(\s*<?([^)\s>]*)/g
// Stand-ins that are neither whitespace nor tag characters.
const ESCAPED_HASH = "\u0001#"
const NOT_TEXT = "\u0002"
const BLOCK_TOKENS = new Set(["paragraph", "heading", "blockquote", "list_item", "br"])

/** The text nodes nuartz scans for tags, in document order, with block boundaries as newlines. */
function renderedText(tokens: Token[], out: string[] = []): string[] {
  for (const token of tokens) {
    if (token.type === "code" || token.type === "codespan" || token.type === "html" || token.type === "image") {
      out.push(NOT_TEXT)
    } else if (token.type === "escape") {
      out.push(token.text === "#" ? ESCAPED_HASH : token.text)
    } else if (token.type === "table") {
      for (const cell of [...token.header, ...token.rows.flat()]) renderedText(cell.tokens, out).push("\n")
    } else if (token.type === "list") {
      for (const item of token.items) renderedText(item.tokens, out).push("\n")
    } else if ("tokens" in token && token.tokens) {
      if (BLOCK_TOKENS.has(token.type)) out.push("\n")
      renderedText(token.tokens, out)
      if (BLOCK_TOKENS.has(token.type)) out.push("\n")
    } else if (token.type === "text") {
      out.push(token.text)
    } else if (BLOCK_TOKENS.has(token.type) || token.type === "space") {
      out.push("\n")
    }
  }
  return out
}

/**
 * Whether each `#tag` occurrence nuartz will link, in document order, is a tag by
 * Obsidian's rules: after whitespace or at a line start, and not escaped as `\#tag`.
 * So `ssh#x`, `(#E1` and `\#python` stay text even if the same tag appears elsewhere.
 */
function tagOccurrences(markdown: string): Map<string, boolean[]> {
  const source = markdown.replace(NOT_RENDERED, "")
  const text = renderedText(marked.lexer(source, { gfm: true })).join("").replace(WIKILINK_TARGET, NOT_TEXT)
  const occurrences = new Map<string, boolean[]>()
  for (const match of text.matchAll(MARKDOWN_HASH)) {
    const tag = match[0].slice(1)
    const valid = match.index === 0 || /\s/.test(text[match.index - 1])
    occurrences.set(tag, [...(occurrences.get(tag) ?? []), valid])
  }
  return occurrences
}

/** Labels written for each markdown link destination, to restore text nuartz split off. */
function linkLabels(markdown: string): Map<string, string[]> {
  const labels = new Map<string, string[]>()
  for (const [, label, destination] of markdown.matchAll(MARKDOWN_LINK)) {
    const key = safeDecode(destination)
    labels.set(key, [...(labels.get(key) ?? []), label])
  }
  return labels
}

/**
 * Point a markdown link or image written against the content tree at its published
 * location. Note links (`../AI/Post.md`, `/Dev/Post`) go to the note's permalink and
 * media files go to the content API; anything else is returned unchanged.
 */
function rewriteContentUrl(url: string, context: RenderedLinkContext, kind: "a" | "img"): string {
  if (EXTERNAL.test(url)) return url
  const match = /^([^?#]*)([?#].*)?$/.exec(url)
  const pathname = safeDecode(match?.[1] ?? "")
  const suffix = match?.[2] ?? ""
  if (!pathname) return url

  const contentPath = pathname.startsWith("/")
    ? path.posix.normalize(pathname.slice(1))
    : path.posix.join(path.posix.dirname(context.from), pathname)
  if (contentPath.startsWith("..")) return url

  if (kind === "a") {
    const note = context.resolveNotePath(contentPath.replace(/\.md$/i, ""))
    if (note) return context.notePath(note) + suffix
  }
  if (context.isPublishedMedia(contentPath)) {
    return `/blog/api/content/${contentPath.split("/").map(encodeURIComponent).join("/")}${suffix}`
  }
  return url
}

/**
 * Post-process nuartz HTML so every internal link it emits points at a page that exists:
 * - inline `#tag` links move under `/blog/tags/`; a hash nuartz split out of a link's
 *   text (URL fragments such as `https://host/#home`) goes back into that link, and a
 *   hash Obsidian would not read as a tag becomes text
 * - unresolved wikilinks become plain text, as Obsidian shows them, instead of 404 links
 * - markdown links to notes and media in the content tree resolve to their public URLs
 */
export function rewriteRenderedLinks(html: string, context: RenderedLinkContext): RewrittenLinks {
  const inlineTags: string[] = []
  const occurrences = tagOccurrences(context.markdown)
  const labels = linkLabels(context.markdown)
  const output: string[] = []
  const open: OpenLink[] = []
  // The link whose closing markup is the last thing in `output`.
  let justClosed: OpenLink | undefined
  let cursor = 0

  for (;;) {
    TOKEN.lastIndex = cursor
    const token = TOKEN.exec(html)
    if (!token) break
    const [raw, closing, rawName, attributes] = token
    if (token.index > cursor) {
      output.push(html.slice(cursor, token.index))
      justClosed = undefined
    }
    cursor = token.index + raw.length

    NUARTZ_TAG.lastIndex = token.index
    const nuartzTag = closing ? null : NUARTZ_TAG.exec(html)
    if (nuartzTag) {
      cursor = token.index + nuartzTag[0].length
      if (!nuartzTag[2]) continue
      const continuation = TAG_CONTINUATION.exec(html.slice(cursor))?.[0] ?? ""
      cursor += continuation.length
      const tag = decodeAttribute(nuartzTag[1]) + continuation
      const text = `#${tag}`

      const occurrence = occurrences.get(tag)?.shift()

      // A hash right after a link whose URL or label contains it was part of that link's
      // text: put it back inside, with the rest of the text nuartz pushed out after it.
      const linkText = justClosed
        ? [justClosed.href, ...(labels.get(safeDecode(justClosed.href)) ?? [])].filter(candidate => candidate.includes(text))
        : []
      if (justClosed && linkText.length) {
        output.pop()
        const restored = linkText.flatMap(candidate => {
          const end = renderedTextEnd(html, cursor, candidate.slice(candidate.indexOf(text) + text.length))
          return end > cursor ? [html.slice(cursor, end)] : []
        })[0] ?? ""
        cursor += restored.length
        output.push(text + restored, justClosed.close)
        continue
      }
      const atWordStart = !justClosed && /(?:^|\s|>)$/.test(output.at(-1) ?? "")
      if (!atWordStart || occurrence === false) {
        output.push(text)
        continue
      }
      inlineTags.push(tag)
      output.push(`<a href="${encodeAttribute(`/blog/tags/${tagPath(tag)}`)}" class="tag" data-tag="${encodeAttribute(tag)}">${text}</a>`)
      continue
    }

    justClosed = undefined
    if (rawName.toLowerCase() === "img") {
      output.push(raw.replace(ATTRIBUTE("src"), (_, before, value, after) =>
        before + encodeAttribute(rewriteContentUrl(decodeAttribute(value), context, "img")) + after))
      continue
    }

    if (closing) {
      const element = open.pop()
      output.push(element?.close ?? raw)
      justClosed = element
      continue
    }

    const href = decodeAttribute(ATTRIBUTE("href").exec(attributes)?.[2] ?? "")
    const classes = new Set((ATTRIBUTE("class").exec(attributes)?.[2] ?? "").split(/\s+/))
    if (classes.has("wikilink") && classes.has("broken")) {
      output.push(`<span${attributes.replace(ATTRIBUTE("href"), "")}>`)
      open.push({ close: "</span>", href })
      continue
    }

    output.push(raw.replace(ATTRIBUTE("href"), (_, before, value, after) =>
      before + encodeAttribute(rewriteContentUrl(decodeAttribute(value), context, "a")) + after))
    open.push({ close: "</a>", href })
  }
  output.push(html.slice(cursor))

  return { html: output.join(""), inlineTags: [...new Set(inlineTags)] }
}
