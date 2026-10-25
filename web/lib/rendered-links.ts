import path from "node:path"

export interface RenderedLinkContext {
  /** Source path of the rendered note, without `.md` (e.g. `AI/Some Post`). */
  from: string
  /** Exact content-root note lookup; returns the note's source slug. */
  resolveNotePath(contentPath: string): string | undefined
  /** Public href for a note source slug. */
  notePath(source: string): string
  /** Whether a publishable media file exists at this content-root path. */
  isPublishedMedia(contentPath: string): boolean
}

const TOKEN = /<(\/?)(a|img)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/gi
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
 * - unresolved wikilinks become plain text, as Obsidian shows them, instead of 404 links
 * - markdown links to notes and media in the content tree resolve to their public URLs
 */
export function rewriteRenderedLinks(html: string, context: RenderedLinkContext): string {
  // Closing markup for each open `<a>`, since broken wikilinks close as `</span>`.
  const open: string[] = []
  return html.replace(TOKEN, (raw, closing: string, name: string, attributes: string) => {
    if (name.toLowerCase() === "img") {
      return raw.replace(ATTRIBUTE("src"), (_, before, value, after) =>
        before + encodeAttribute(rewriteContentUrl(decodeAttribute(value), context, "img")) + after)
    }
    if (closing) return open.pop() ?? raw

    const classes = new Set((ATTRIBUTE("class").exec(attributes)?.[2] ?? "").split(/\s+/))
    if (classes.has("wikilink") && classes.has("broken")) {
      open.push("</span>")
      return `<span${attributes.replace(ATTRIBUTE("href"), "")}>`
    }
    open.push("</a>")
    return raw.replace(ATTRIBUTE("href"), (_, before, value, after) =>
      before + encodeAttribute(rewriteContentUrl(decodeAttribute(value), context, "a")) + after)
  })
}
