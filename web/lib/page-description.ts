import { decodeHTML } from "entities"

const MAX_LENGTH = 160

function excerpt(html: string): string {
  for (const match of html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)) {
    const text = decodeHTML(match[1].replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim()
    if (text) {
      return text.length <= MAX_LENGTH ? text : `${text.slice(0, MAX_LENGTH - 1).trimEnd()}…`
    }
  }
  return ""
}

/**
 * Search snippets and link previews need a description; most study notes have
 * neither `description` nor `summary`, so fall back to the first paragraph.
 */
export function pageDescription(frontmatter: Record<string, unknown>, html: string): string {
  for (const key of ["description", "summary"]) {
    const value = frontmatter[key]
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return excerpt(html)
}
