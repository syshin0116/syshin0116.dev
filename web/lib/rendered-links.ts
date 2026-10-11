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

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

/**
 * Obsidian reads `#tag` as a tag only after whitespace or at a line start, so `ssh#x`,
 * `(#E1` and the escaped `\#tag` are not tags even though nuartz links them.
 */
function isTagInMarkdown(tag: string, markdown: string): boolean {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return new RegExp(`(?:^|\\s)#${escaped}(?![\\p{L}\\p{N}_/-])`, "u").test(markdown)
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

      if (justClosed) {
        // The hash was part of the previous link's text: put it back inside, along with
        // the rest of an autolinked URL that nuartz pushed out after the tag.
        output.pop()
        const fragmentAt = justClosed.href.indexOf(text)
        const rest = fragmentAt < 0 ? "" : justClosed.href.slice(fragmentAt + text.length)
        const restored = rest && html.startsWith(rest, cursor) ? rest : ""
        cursor += restored.length
        output.push(text + restored, justClosed.close)
        continue
      }
      // Per occurrence: the rendered text right before the hash must end a word boundary.
      // The markdown check then rules out `\#tag`, which renders the same as a real tag.
      const before = output.at(-1) ?? ""
      if (!/(?:^|\s|>)$/.test(before) || !isTagInMarkdown(tag, context.markdown)) {
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
