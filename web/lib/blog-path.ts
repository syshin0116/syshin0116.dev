import { permalinks } from "./blog-permalinks"

export function getBlogSlug(pathname: string): string {
  const encodedSlug = pathname.replace(/^\/blog\/?/, "")

  try {
    return permalinks.sourceSlug(decodeURIComponent(encodedSlug))
  } catch {
    return encodedSlug
  }
}
