import { applyContentImageOverrides } from "./content-image-overrides"

const BLOG_HOSTS = new Set(["syshin0116.dev", "www.syshin0116.dev", "syshin0116.vercel.app"])

export function resolveChatImage(src: string, paths: readonly string[]): string | null {
  const source = applyContentImageOverrides(src)
  let pathname = source
  if (/^https?:\/\//i.test(source)) {
    let url: URL
    try { url = new URL(source) } catch { return null }
    if (url.username || url.password) return null
    if (!BLOG_HOSTS.has(url.hostname)) return url.protocol === "https:" ? source : null
    pathname = url.pathname
  } else if (/^[a-z][a-z\d+.-]*:|^\/\//i.test(source)) return null
  try { pathname = decodeURIComponent(pathname) } catch { return null }
  if (pathname.split(/[\\/]/).some((part) => part === ".." || part.startsWith("."))) return null
  if (pathname.startsWith("/images/")) return pathname
  const relative = pathname.replace(/^\/(?:blog\/api\/content|content)\//, "").replace(/^\//, "")
  const exact = paths.find((path) => path === relative)
  const matches = exact ? [exact] : paths.filter((path) => path.endsWith(`/${relative}`))
  if (matches.length !== 1) return null
  return `/content/${matches[0].split("/").map(encodeURIComponent).join("/")}`
}
