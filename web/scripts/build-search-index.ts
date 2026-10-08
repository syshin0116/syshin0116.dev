import { cp, mkdir, readdir, rm } from "node:fs/promises"
import { join, relative, resolve, sep } from "node:path"

// Next.js 16.3.8+ with a deployment adapter (Vercel sets NEXT_ADAPTER_PATH)
// writes prerendered pages to `.next/server/route-cache/<kind>/<sha256>/$/<path>.html`
// instead of `.next/server/app/<path>.html`. Pagefind derives result URLs from
// file paths, so the route-cache layout is staged back into the app layout.
const webRoot = resolve(import.meta.dir, "..")
const serverDir = join(webRoot, ".next", "server")
const routeCacheDir = join(serverDir, "route-cache")
const stagedSiteDir = join(webRoot, ".next", "search-site")

async function htmlFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true }).catch(() => [])
  return entries
    .filter(entry => entry.isFile() && entry.name.endsWith(".html"))
    .map(entry => join(entry.parentPath, entry.name))
}

export function routeCachePagePath(file: string, root: string): string | undefined {
  const parts = relative(root, file).split(sep)
  // <kind>/<sha256>/$/<path...>.html
  if (parts.length < 4 || parts[2] !== "$") return undefined
  return parts.slice(3).join("/")
}

async function resolveSiteDir(): Promise<string> {
  const routeCacheHtml = await htmlFiles(routeCacheDir)
  if (routeCacheHtml.length === 0) return join(serverDir, "app")

  await rm(stagedSiteDir, { recursive: true, force: true })
  const seen = new Set<string>()
  for (const file of routeCacheHtml) {
    const pagePath = routeCachePagePath(file, routeCacheDir)
    if (!pagePath) throw new Error(`unexpected route-cache file: ${relative(webRoot, file)}`)
    if (seen.has(pagePath)) throw new Error(`duplicate route-cache page: ${pagePath}`)
    seen.add(pagePath)
    const target = join(stagedSiteDir, pagePath)
    await mkdir(join(target, ".."), { recursive: true })
    await cp(file, target)
  }
  return stagedSiteDir
}

async function main(): Promise<void> {
  const siteDir = await resolveSiteDir()
  const pageCount = (await htmlFiles(siteDir)).length
  if (pageCount === 0) throw new Error(`no prerendered HTML found under ${relative(webRoot, serverDir)}`)
  console.log(`search index: ${pageCount} pages from ${relative(webRoot, siteDir)}`)
  const result = Bun.spawnSync({
    cmd: [join(webRoot, "node_modules", ".bin", "pagefind"), "--site", siteDir, "--output-path", join(webRoot, "public", "pagefind")],
    cwd: webRoot,
    stdout: "inherit",
    stderr: "inherit",
  })
  if (result.exitCode !== 0) process.exit(result.exitCode ?? 1)
}

if (import.meta.main) {
  await main()
}
