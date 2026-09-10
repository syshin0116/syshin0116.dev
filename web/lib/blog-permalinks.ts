import registry from "@/data/blog-permalinks.json"

export type PermalinkEntry = { source: string; aliases?: string[] }
export type PermalinkRegistry = Record<string, PermalinkEntry>

export function createPermalinks(entries: PermalinkRegistry) {
  const byPath = new Map<string, string>()
  const bySlug = new Map(Object.entries(entries))
  const reserved = new Set(["api", "tags", "page", "graph", "index", "feed", "rss", "sitemap"])
  for (const [slug, entry] of bySlug) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || reserved.has(slug)) {
      throw new Error(`Invalid or reserved blog permalink: ${slug}`)
    }
    for (const source of [entry.source, ...(entry.aliases ?? [])]) {
      if (!source || reserved.has(source.split("/")[0]) || source.split("/").some(part => !part || part === "." || part === "..")) {
        throw new Error(`Invalid blog source path: ${source}`)
      }
      if (byPath.has(source) || (bySlug.has(source) && source !== slug)) {
        throw new Error(`Conflicting blog path: ${source}`)
      }
      byPath.set(source, slug)
    }
  }
  const originalSource = (source: string) => {
    const entry = bySlug.get(byPath.get(source) ?? source)
    return entry?.aliases?.[0] ?? entry?.source ?? source
  }
  return {
    publicSlug: (source: string) => byPath.get(source) ?? source,
    sourceSlug: (slug: string) => bySlug.get(slug)?.source ?? bySlug.get(byPath.get(slug) ?? "")?.source ?? slug,
    originalPath: (source: string) => `/blog/${originalSource(source).split("/").map(encodeURIComponent).join("/")}`,
    discussionTerm: (source: string) => new URL(`/blog/${originalSource(source)}`, "https://syshin0116.vercel.app").pathname.slice(1).replace(/\.\w+$/, ""),
    validateSources(sources: string[], aliases: Record<string, string> = {}) {
      const occupied = new Map<string, string>()
      for (const source of sources) {
        if (!byPath.has(source)) throw new Error(`Missing blog permalink: ${source}`)
        if (bySlug.get(byPath.get(source)!)?.source !== source) throw new Error(`Alias still exists as a source: ${source}`)
        occupied.set(source, source)
        const parts = source.split("/")
        for (let i = 1; i < parts.length; i++) occupied.set(parts.slice(0, i).join("/"), "folder")
      }
      for (const [alias, source] of Object.entries(aliases)) occupied.set(alias, source)
      for (const [slug, entry] of bySlug) {
        for (const route of [slug, ...(entry.aliases ?? [])]) {
          const owner = occupied.get(route)
          if (owner && owner !== entry.source) throw new Error(`Conflicting blog route: ${route}`)
        }
      }
    },
  }
}

export const permalinks = createPermalinks(registry)
export function blogPath(source: string): string {
  return `/blog/${permalinks.publicSlug(source).split("/").map(encodeURIComponent).join("/")}`
}
