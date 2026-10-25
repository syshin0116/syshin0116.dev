export function tagPath(tag: string): string {
  return tag.split("/").map(encodeURIComponent).join("/")
}

function tagSpellingKey(tag: string): string {
  return tag.toLowerCase().replace(/[\s_.-]/g, "")
}

// Tags that differed only in case or punctuation (`RAG`, `Machine Learning`) were
// merged into one spelling; their old URLs resolve to the surviving tag. Returns
// undefined when no tag or more than one tag shares the spelling.
export function mergedTagTarget(tag: string, existingTags: Iterable<string>): string | undefined {
  const key = tagSpellingKey(tag)
  let target: string | undefined
  for (const candidate of existingTags) {
    if (candidate === tag || tagSpellingKey(candidate) !== key) continue
    if (target !== undefined) return undefined
    target = candidate
  }
  return target
}
