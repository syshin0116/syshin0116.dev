import path from "node:path"
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

function escapeText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;")
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
// Markdown nuartz never scans for tags: frontmatter, code, comments, link destinations,
// HTML tags, and wikilink targets (only an alias is displayed).
const NOT_SCANNED = /^---\n[\s\S]*?\n---|```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`|%%[\s\S]*?%%|\]\([^)]*\)|<[^>\n]*>|\[\[[^\]|]*\|?/g
const MARKDOWN_LINK = /\[((?:[^[\]]|\[[^\]]*\])*)\]\(\s*<?([^)\s>]*)/g

/**
 * Whether each `#tag` occurrence nuartz will link, in document order, is a tag by
 * Obsidian's rules: after whitespace or at a line start, and not escaped as `\#tag`.
 * So `ssh#x`, `(#E1` and `\#python` stay text even if the same tag appears elsewhere.
 */
function tagOccurrences(markdown: string): Map<string, boolean[]> {
  const scanned = markdown.replace(NOT_SCANNED, match => " ".repeat(match.length))
  const occurrences = new Map<string, boolean[]>()
  for (const match of scanned.matchAll(MARKDOWN_HASH)) {
    const tag = match[0].slice(1)
    const valid = match.index === 0 || /\s/.test(scanned[match.index - 1])
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

      if (justClosed) {
        // The hash was part of the previous link's text: put it back inside, with the rest
        // of that text (an autolinked URL or the markdown label) nuartz pushed out after it.
        output.pop()
        const linkText = [justClosed.href, ...(labels.get(safeDecode(justClosed.href)) ?? [])]
        const restored = linkText.flatMap(candidate => {
          const at = candidate.indexOf(text)
          const rest = at < 0 ? "" : escapeText(candidate.slice(at + text.length))
          return rest && html.startsWith(rest, cursor) ? [rest] : []
        })[0] ?? ""
        cursor += restored.length
        output.push(text + restored, justClosed.close)
        continue
      }
      const atWordStart = /(?:^|\s|>)$/.test(output.at(-1) ?? "")
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
