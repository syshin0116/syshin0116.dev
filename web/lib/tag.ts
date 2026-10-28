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

export interface TagSpelling {
  tag: string
  files: string[]
}

// Spellings that share a key but name different things, so each keeps its page.
const DISTINCT_TAG_SPELLINGS: readonly (readonly string[])[] = [
  ["ReAct", "react"], // the agent pattern and the React library
]

// Each tag becomes its own tag page, so two spellings that `mergedTagTarget`
// treats as one tag would split it. Returns every group of such spellings.
export function findTagSpellingVariants(filesByTag: Map<string, string[]>): TagSpelling[][] {
  const groups = new Map<string, TagSpelling[]>()
  for (const [tag, files] of filesByTag) {
    const key = tagSpellingKey(tag)
    groups.set(key, [...(groups.get(key) ?? []), { tag, files }])
  }
  return [...groups.values()].filter(
    group =>
      group.length > 1 &&
      !DISTINCT_TAG_SPELLINGS.some(distinct => group.every(({ tag }) => distinct.includes(tag))),
  )
}
