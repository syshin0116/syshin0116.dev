import path from "node:path"
import { createNoteResolver, normalizeNotePath } from "nuartz"

interface ResolvableNote {
  slug: string
  frontmatter: { title?: unknown; aliases?: unknown }
}

const DATE_PREFIX = /^\d{4}-\d{2}-\d{2}-/

function uniqueIndex(entries: [string, string][]): Map<string, string | undefined> {
  const index = new Map<string, string | undefined>()
  for (const [key, slug] of entries) {
    if (!key) continue
    index.set(key, index.has(key) && index.get(key) !== slug ? undefined : slug)
  }
  return index
}

/**
 * Resolves wikilink targets the way nuartz does, then falls back to two forms the
 * source posts use but Obsidian's filename lookup no longer matches:
 * - the filename without its `YYYY-MM-DD-` prefix (posts were renamed after linking)
 * - the frontmatter title (several posts link by title)
 * Ambiguous fallbacks stay unresolved.
 */
export function createLinkResolver(files: ResolvableNote[]) {
  const resolveNote = createNoteResolver(files as Parameters<typeof createNoteResolver>[0])
  const exact = new Map(files.map(file => [normalizeNotePath(file.slug), file.slug]))
  const undated = uniqueIndex(files.map(file => [
    normalizeNotePath(path.posix.basename(file.slug).replace(DATE_PREFIX, "")),
    file.slug,
  ]))
  const titles = uniqueIndex(files.flatMap(file =>
    typeof file.frontmatter.title === "string" ? [[normalizeNotePath(file.frontmatter.title), file.slug] as [string, string]] : []))

  function resolve(target: string, from?: string): string | undefined {
    const direct = resolveNote(target, from)
    if (direct || !target || target.startsWith(".")) return direct
    const key = normalizeNotePath(target.split("#")[0])
    return undated.get(key) ?? titles.get(key)
  }

  /** Content-root path lookup with no basename, alias, or title fallback. */
  function resolvePath(contentPath: string): string | undefined {
    return exact.get(normalizeNotePath(contentPath))
  }

  return { resolve, resolvePath }
}
