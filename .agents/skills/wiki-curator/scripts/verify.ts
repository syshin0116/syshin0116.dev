#!/usr/bin/env bun
/**
 * Single verification gate for content/wiki/.
 *
 * Every page:
 *   - wikilinks resolve (basename match)
 *   - required frontmatter fields present
 *   - no legacy `coverage` field
 *   - body has no `## Summary` section and no `> [!summary]` callout
 *   - body has the mandatory sections (`## Key Claims`, `## Footnotes`)
 *   - every source is a valid HTTPS URL or an existing repo-local file
 *   - summary length 1-500 chars, tags non-empty
 *   - `status`, `confidence`, `reviewed` hold allowed values when present
 *
 * Pages that declare `status` follow the v2 contract and must also pass:
 *   - `confidence` present; `type` and `author` absent
 *   - `evergreen` pages carry a `reviewed` date
 *   - every footnote reference is defined
 *   - every cited quote is 15+ chars, contains letters, and appears in the
 *     cited source (inside the cited heading section when one is given)
 *   - no hand-written related-pages section, no empty section
 *   - `## 생각의 변천` (when present) cites its sources
 *
 * Pages without `status` are legacy: the v2-only rules are reported as
 * warnings until the content migration (PR 2) moves every page to v2 and sets
 * ALLOW_LEGACY_PAGES to false. `--strict` applies that future gate now.
 *
 * Run via:
 *   bun .claude/skills/wiki-curator/scripts/verify.ts [--root <repo>] [--strict]
 *
 * Exit 0 = no failures (warnings allowed). Exit 1 = at least one failure.
 * scripts/verify-wiki.py must stay behaviorally equivalent (same output).
 */
import fs from "node:fs/promises"
import path from "node:path"

const args = process.argv.slice(2)
const rootArg = args.indexOf("--root")
const ROOT = rootArg !== -1 && args[rootArg + 1] ? path.resolve(args[rootArg + 1]) : process.cwd()
const WIKI_ROOT = path.join(ROOT, "content", "wiki")

// Rollout switch: PR 2 (content migration) sets this to false.
const ALLOW_LEGACY_PAGES = true
const STRICT = args.includes("--strict") || !ALLOW_LEGACY_PAGES

const REQUIRED_FRONTMATTER = ["title", "tags", "sources", "summary", "created", "updated", "draft"]
const V2_REQUIRED_FRONTMATTER = ["status", "confidence"]
const RETIRED_FRONTMATTER = ["type", "author"]
const FORBIDDEN_FRONTMATTER = ["coverage"]
const MANDATORY_SECTIONS = ["## Key Claims", "## Footnotes"]
const STATUS_VALUES = ["seedling", "budding", "evergreen"]
const CONFIDENCE_VALUES = ["low", "medium", "high"]
const RELATED_SECTION_TITLES = ["connections", "related", "related pages", "see also", "관련 페이지", "관련 문서"]
const CHANGE_SECTION_TITLE = "생각의 변천"
const QUOTE_MIN_CHARS = 15
const SUMMARY_MIN = 1
const SUMMARY_MAX = 500
const SKIP_FILES = new Set(["index.md", "log.md"])

const WIKILINK_RE = /\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/g
const FOOTNOTE_DEF_RE = /^\[\^([^\]]+)\]:[ \t]*(.*)$/
const FOOTNOTE_REF_RE = /\[\^([^\]]+)\](?!:)/g
const QUOTE_RE = /"([^"\n]*)"|“([^”\n]*)”/g
const INLINE_CODE_RE = /`[^`\n]*`/g
const HEADING_RE = /^(#{1,6})[ \t]+(.+?)(?:[ \t]+#+)?[ \t]*$/
const FENCE_RE = /^[ \t]*(`{3,}|~{3,})(.*)$/
// Link markup reduced to its visible text: embeds vanish, wikilinks show their alias (else the page,
// else the heading), Markdown links show their label. One level of nested brackets or parentheses is allowed.
const EMBED_RE = /!\[\[[^\]\n]*\]\]/g
const WIKILINK_TEXT_RE = /\[\[([^\]|\n]*)(?:\|([^\]\n]*))?\]\]/g
const LINK_RE = /!?\[((?:[^[\]\n]|\[[^[\]\n]*\])*)\](?:\((?:[^()\n]|\([^()\n]*\))*\)|\[[^\]\n]*\])/g
const SPACE_RE = /[ \t\n\r\f\v  -   　]+/g

interface Finding {
  check: string
  file: string
  detail: string
}

const failures: Finding[] = []
const warnings: Finding[] = []

async function* walk(dir: string): AsyncGenerator<string> {
  let entries: { name: string; isDirectory(): boolean }[]
  try {
    entries = (await fs.readdir(dir, { withFileTypes: true })) as any
  } catch {
    return
  }
  entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name.startsWith(".")) continue
      yield* walk(full)
    } else if (entry.name.endsWith(".md")) {
      yield full
    }
  }
}

function splitFrontmatter(raw: string): { fm: string; body: string } | null {
  if (!raw.startsWith("---\n")) return null
  const end = raw.indexOf("\n---\n", 4)
  if (end === -1) return null
  return { fm: raw.slice(4, end), body: raw.slice(end + 5) }
}

function fmHasField(fm: string, key: string): boolean {
  return new RegExp(`^${key}:`, "m").test(fm)
}

function fmGetScalar(fm: string, key: string): string | null {
  const lines = fm.split("\n")
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(new RegExp(`^${key}:\\s*(.*)$`))
    if (!m) continue
    const inline = m[1].trim()
    if (inline === "|" || inline === ">" || inline === "|-" || inline === ">-") {
      const collected: string[] = []
      let j = i + 1
      while (j < lines.length && (/^\s+/.test(lines[j]) || lines[j] === "")) {
        if (lines[j] !== "") collected.push(lines[j].trim())
        j++
      }
      return collected.join(inline.startsWith(">") ? " " : "\n").trim()
    }
    let v = inline
    if (v.length >= 2 && v[0] === v[v.length - 1] && (v[0] === '"' || v[0] === "'")) {
      v = v.slice(1, -1)
    }
    return v
  }
  return null
}

function fmGetSources(fm: string): string[] {
  const lines = fm.split("\n")
  const out: string[] = []
  let inside = false
  for (const line of lines) {
    if (/^sources:/.test(line)) {
      inside = true
      continue
    }
    if (inside) {
      const m = line.match(/^\s+-\s+(.*)$/)
      if (m) {
        out.push(m[1].trim().replace(/^["']|["']$/g, ""))
      } else if (/^\S/.test(line)) {
        break
      }
    }
  }
  return out
}

function fmHasNonEmptyTags(fm: string): boolean {
  const lines = fm.split("\n")
  let inside = false
  for (const line of lines) {
    if (/^tags:/.test(line)) {
      inside = true
      continue
    }
    if (inside) {
      if (/^\s+-\s+\S/.test(line)) return true
      if (/^\S/.test(line)) return false
    }
  }
  return false
}

function isValidDate(value: string): boolean {
  const m = value.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})$/)
  if (!m) return false
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const date = new Date(0)
  date.setUTCFullYear(y, mo - 1, d)
  return y >= 1 && date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d
}

function validateHttpsSource(source: string): string | null {
  try {
    if (!/^https:\/\/[^/?#]+(?:[/?#]|$)/i.test(source) || /[\s\\]/.test(source)) {
      return "is not a valid HTTPS URL"
    }

    const url = new URL(source)
    if (url.protocol !== "https:" || url.hostname === "") {
      return "must be an absolute HTTPS URL"
    }

    if (!url.hostname.includes(":")) {
      const hostname = url.hostname.replace(/\.$/, "")
      const validHostname = hostname.length > 0 && hostname.length <= 253 && hostname
        .split(".")
        .every((label) => /^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/i.test(label))
      if (!validHostname) return "is not a valid HTTPS URL"
    }
    return null
  } catch {
    return "is not a valid HTTPS URL"
  }
}

async function validateLocalSource(source: string): Promise<string | null> {
  if (path.isAbsolute(source)) return "must be a repository-relative path"

  const resolved = path.resolve(ROOT, source)
  const relative = path.relative(ROOT, resolved)
  if (relative === "" || relative.startsWith(`..${path.sep}`) || relative === ".." || path.isAbsolute(relative)) {
    return "must stay inside the repository"
  }

  try {
    const stat = await fs.stat(resolved)
    return stat.isFile() ? null : "does not point to a file"
  } catch {
    return "does not exist"
  }
}

/** Every line with its 1-based number; `prose` is false inside fenced code and on fence lines. */
function scanLines(text: string): { line: string; number: number; prose: boolean }[] {
  // A fence closes only on the same character, at least as long as the opener, with nothing after it.
  let fence: string | null = null
  return text.split("\n").map((line, index) => {
    const m = line.match(FENCE_RE)
    if (m) {
      if (fence === null) fence = m[1]
      else if (m[1][0] === fence[0] && m[1].length >= fence.length && m[2].trim() === "") fence = null
      return { line, number: index + 1, prose: false }
    }
    return { line, number: index + 1, prose: fence === null }
  })
}

/** The line with inline code spans blanked out, so literal syntax in code is not read as a reference. */
function maskCode(line: string): string {
  return line.replace(INLINE_CODE_RE, (m) => " ".repeat(m.length))
}

function proseLines(text: string): { line: string; number: number }[] {
  return scanLines(text).filter((l) => l.prose)
}

/** Text used to compare a quote with its source: markup and spacing removed. */
function normalizeForMatch(text: string): string {
  const unquoted = text
    .normalize("NFC")
    .split("\n")
    .map((line) => line.replace(/^[ \t]*(?:>[ \t]?)+/, ""))
    .join("\n")
    .replace(/[“”„]/g, '"')
    .replace(/[‘’]/g, "'")
  return visibleText(unquoted)
    .replace(/[*_`]/g, "")
    .replace(SPACE_RE, " ")
    .trim()
}

function visibleText(text: string): string {
  return text
    .replace(EMBED_RE, "")
    .replace(WIKILINK_TEXT_RE, (_m, target: string, alias: string | undefined) => {
      if (alias !== undefined) return alias
      const [page, ...heading] = target.split("#")
      return page.trim() !== "" ? page : heading.join("#")
    })
    .replace(LINK_RE, "$1")
}

function normalizeQuote(text: string): string {
  return normalizeForMatch(text).replace(/^[.…]+/, "").replace(/[.,;:!?。、…]+$/, "").trim()
}

function headingKey(text: string): string {
  return Array.from(visibleText(text).normalize("NFC").toLowerCase())
    .filter((ch) => /[\p{L}\p{N}]/u.test(ch))
    .join("")
}

type FootnoteTarget =
  | { kind: "local"; file: string; anchor: string | null }
  | { kind: "https" }
  | { kind: "none" }

function footnoteTarget(definition: string): FootnoteTarget {
  let target = definition.trim()
  const link = target.match(/^\[[^\]]*\]\(\s*(?:<([^>]*)>|([^)\s]+))/)
  if (link) target = (link[1] ?? link[2]).trim()
  if (/https:\/\//i.test(target)) return { kind: "https" }
  if (/^[a-z][a-z\d+.-]*:/i.test(target)) return { kind: "none" }
  const m = target.match(/^(.+?\.md)(?:#(.*))?$/)
  if (!m) return { kind: "none" }
  const anchor = m[2] === undefined ? null : m[2].split("#").pop()!.trim()
  return { kind: "local", file: m[1], anchor: anchor === "" ? null : anchor }
}

/** The cited heading's section: its heading line through the next heading of the same or higher level. */
function headingSection(raw: string, anchor: string): string | null {
  const split = splitFrontmatter(raw)
  const text = split ? split.body : raw
  const wanted = headingKey(anchor)
  const lines = proseLines(text)
  for (let i = 0; i < lines.length; i++) {
    const h = lines[i].line.match(HEADING_RE)
    if (!h || headingKey(h[2]) !== wanted) continue
    const level = h[1].length
    const all = text.split("\n")
    let endNumber = all.length + 1
    for (let j = i + 1; j < lines.length; j++) {
      const next = lines[j].line.match(HEADING_RE)
      if (next && next[1].length <= level) {
        endNumber = lines[j].number
        break
      }
    }
    return all.slice(lines[i].number - 1, endNumber - 1).join("\n")
  }
  return null
}

const sourceCache = new Map<string, string | null>()

async function readSource(file: string): Promise<string | null> {
  if (!sourceCache.has(file)) {
    try {
      sourceCache.set(file, await fs.readFile(path.resolve(ROOT, file), "utf8"))
    } catch {
      sourceCache.set(file, null)
    }
  }
  return sourceCache.get(file)!
}

/** Rules every page must meet under the v2 contract (warnings on legacy pages). */
async function v2Findings(body: string, offset: number): Promise<{ check: string; detail: string }[]> {
  const found: { check: string; detail: string }[] = []
  const lines = proseLines(body).map(({ line, number }) => ({ line, number: number + offset }))

  const definitions = new Map<string, string>()
  for (const { line } of lines) {
    const m = line.match(FOOTNOTE_DEF_RE)
    if (m && !definitions.has(m[1])) definitions.set(m[1], m[2])
  }

  // Sections: related-pages sections, empty sections, the change section.
  const all = scanLines(body)
  const headings: { level: number; title: string; index: number }[] = []
  all.forEach(({ line, prose }, index) => {
    const h = prose ? line.match(HEADING_RE) : null
    if (h) headings.push({ level: h[1].length, title: h[2], index })
  })
  for (let k = 0; k < headings.length; k++) {
    const { level, title, index } = headings[k]
    let end = all.length
    for (let n = k + 1; n < headings.length; n++) {
      if (headings[n].level <= level) {
        end = headings[n].index
        break
      }
    }
    const next = k + 1 < headings.length ? headings[k + 1].index : all.length
    const heading = `${"#".repeat(level)} ${title}`
    if (level === 2 && RELATED_SECTION_TITLES.includes(title.toLowerCase())) {
      found.push({ check: "section-related", detail: `\`${heading}\` - link inline in the body; backlinks are rendered automatically` })
    }
    if (next === end && all.slice(index + 1, end).every((l) => l.line.trim() === "")) {
      found.push({ check: "section-empty", detail: `\`${heading}\` has no content - omit sections that would be empty` })
    }
    if (level === 2 && title === CHANGE_SECTION_TITLE) {
      const cites = all
        .slice(index + 1, end)
        .some((l) => l.prose && !FOOTNOTE_DEF_RE.test(l.line) && /\[\^[^\]]+\](?!:)/.test(maskCode(l.line)))
      if (!cites) {
        found.push({ check: "section-change-uncited", detail: `\`${heading}\` must cite the sources that show the change` })
      }
    }
  }

  // Footnote references and cited quotes.
  const undefinedRefs = new Set<string>()
  for (const { line, number } of lines) {
    if (FOOTNOTE_DEF_RE.test(line)) continue

    const masked = maskCode(line)
    for (const ref of masked.matchAll(FOOTNOTE_REF_RE)) {
      if (!definitions.has(ref[1]) && !undefinedRefs.has(ref[1])) {
        undefinedRefs.add(ref[1])
        found.push({ check: "footnote-undefined", detail: `line ${number}: [^${ref[1]}] has no definition` })
      }
    }

    const codeRanges = [...line.matchAll(INLINE_CODE_RE)].map((m) => [m.index!, m.index! + m[0].length])
    for (const q of line.matchAll(QUOTE_RE)) {
      const start = q.index!
      if (codeRanges.some(([s, e]) => start >= s && start < e)) continue
      FOOTNOTE_REF_RE.lastIndex = start + q[0].length
      const ref = FOOTNOTE_REF_RE.exec(masked)
      FOOTNOTE_REF_RE.lastIndex = 0
      if (!ref) continue

      const quote = normalizeQuote(q[1] ?? q[2])
      const shown = Array.from(quote).length > 40 ? `${Array.from(quote).slice(0, 40).join("")}...` : quote
      if (!/\p{L}/u.test(quote)) {
        found.push({ check: "quote-not-text", detail: `line ${number}: "${shown}" has no letters; numbers alone cannot be verified` })
        continue
      }
      if (Array.from(quote).length < QUOTE_MIN_CHARS) {
        found.push({ check: "quote-too-short", detail: `line ${number}: "${shown}" is under ${QUOTE_MIN_CHARS} chars; quote a longer span or drop the quote marks` })
        continue
      }
      const definition = definitions.get(ref[1])
      if (definition === undefined) continue

      const target = footnoteTarget(definition)
      if (target.kind === "https") continue
      if (target.kind === "none") {
        found.push({ check: "quote-source-unresolved", detail: `line ${number}: [^${ref[1]}] names no repo-local file or HTTPS URL` })
        continue
      }
      const problem = await validateLocalSource(target.file)
      const raw = problem ? null : await readSource(target.file)
      if (problem || raw === null) {
        found.push({ check: "quote-source-missing", detail: `line ${number}: [^${ref[1]}] ${target.file} ${problem ?? "cannot be read"}` })
        continue
      }
      let scope = raw
      if (target.anchor !== null) {
        const section = headingSection(raw, target.anchor)
        if (section === null) {
          found.push({ check: "quote-anchor-missing", detail: `line ${number}: ${target.file} has no heading #${target.anchor}` })
          continue
        }
        scope = section
      }
      if (!normalizeForMatch(scope).includes(quote)) {
        const where = target.anchor === null ? target.file : `${target.file}#${target.anchor}`
        found.push({ check: "quote-not-in-source", detail: `line ${number}: "${shown}" not found in ${where}` })
      }
    }
  }
  return found
}

async function collectSlugs(): Promise<Set<string>> {
  const slugs = new Set<string>()
  for await (const file of walk(WIKI_ROOT)) {
    slugs.add(path.basename(file, ".md"))
  }
  return slugs
}

function printGroups(items: Finding[]) {
  const byCheck = new Map<string, Finding[]>()
  for (const f of items) {
    if (!byCheck.has(f.check)) byCheck.set(f.check, [])
    byCheck.get(f.check)!.push(f)
  }
  for (const check of [...byCheck.keys()].sort()) {
    const group = byCheck.get(check)!
    console.log(`### ${check} (${group.length})`)
    for (const f of group) {
      console.log(`  ${f.file}: ${f.detail}`)
    }
    console.log("")
  }
}

async function main() {
  const slugs = await collectSlugs()
  let pageCount = 0

  for await (const file of walk(WIKI_ROOT)) {
    const rel = path.relative(ROOT, file).split(path.sep).join("/")
    if (SKIP_FILES.has(path.basename(file))) continue

    const raw = await fs.readFile(file, "utf8")
    const split = splitFrontmatter(raw)
    if (!split) {
      failures.push({ check: "frontmatter", file: rel, detail: "no frontmatter block" })
      continue
    }
    const { fm, body } = split
    const offset = fm.split("\n").length + 2
    pageCount++
    const isV2 = fmHasField(fm, "status")

    for (const key of REQUIRED_FRONTMATTER) {
      if (!fmHasField(fm, key)) {
        failures.push({ check: "frontmatter-missing", file: rel, detail: `missing required field: ${key}` })
      }
    }

    for (const key of FORBIDDEN_FRONTMATTER) {
      if (fmHasField(fm, key)) {
        failures.push({ check: "frontmatter-legacy", file: rel, detail: `legacy field present: ${key}` })
      }
    }

    // Growth stage, confidence, and review date hold allowed values when present.
    const status = fmGetScalar(fm, "status")
    if (status !== null && !STATUS_VALUES.includes(status)) {
      failures.push({ check: "frontmatter-value", file: rel, detail: `status must be one of ${STATUS_VALUES.join(", ")} (got "${status}")` })
    }
    const confidence = fmGetScalar(fm, "confidence")
    if (confidence !== null && !CONFIDENCE_VALUES.includes(confidence)) {
      failures.push({ check: "frontmatter-value", file: rel, detail: `confidence must be one of ${CONFIDENCE_VALUES.join(", ")} (got "${confidence}")` })
    }
    const reviewedRaw = fmGetScalar(fm, "reviewed")
    const reviewed = reviewedRaw === null || ["", "null", "~"].includes(reviewedRaw) ? null : reviewedRaw
    if (reviewed !== null && !isValidDate(reviewed)) {
      failures.push({ check: "frontmatter-value", file: rel, detail: `reviewed must be a YYYY-MM-DD date or null (got "${reviewed}")` })
    }

    if (isV2 || STRICT) {
      for (const key of V2_REQUIRED_FRONTMATTER) {
        if (!fmHasField(fm, key)) {
          failures.push({ check: "frontmatter-missing", file: rel, detail: `missing required field: ${key}` })
        }
      }
      for (const key of RETIRED_FRONTMATTER) {
        if (fmHasField(fm, key)) {
          failures.push({ check: "frontmatter-retired", file: rel, detail: `retired field present: ${key}` })
        }
      }
      if (status === "evergreen" && reviewed === null) {
        failures.push({ check: "frontmatter-value", file: rel, detail: "evergreen pages need a reviewed date" })
      }
    } else {
      warnings.push({ check: "legacy-shape", file: rel, detail: "no status; migrate to the v2 contract (status, confidence, no type/author)" })
    }

    if (/^##\s+Summary\b/m.test(body)) {
      failures.push({ check: "body-summary-section", file: rel, detail: "body contains `## Summary` - summary belongs in frontmatter" })
    }

    if (/^\s*>\s*\[!summary\]/im.test(body)) {
      failures.push({ check: "body-callout-summary", file: rel, detail: "body contains legacy `> [!summary]` callout - move to frontmatter" })
    }

    for (const section of MANDATORY_SECTIONS) {
      if (!new RegExp(`^${section.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "m").test(body)) {
        failures.push({ check: "missing-section", file: rel, detail: `missing mandatory section: ${section}` })
      }
    }

    const sources = fmGetSources(fm)
    if (sources.length === 0) {
      failures.push({ check: "sources-empty", file: rel, detail: "sources frontmatter is empty" })
    }
    for (const src of sources) {
      if (/^https:\/\//i.test(src)) {
        const detail = validateHttpsSource(src)
        if (detail) failures.push({ check: "source-invalid", file: rel, detail: `${src} ${detail}` })
        continue
      }

      if (/^[a-z][a-z\d+.-]*:/i.test(src)) {
        failures.push({ check: "source-invalid", file: rel, detail: `${src} uses an unsupported URL scheme; only HTTPS is allowed` })
        continue
      }

      const detail = await validateLocalSource(src)
      if (detail) failures.push({ check: "source-invalid", file: rel, detail: `${src} ${detail}` })
    }

    const summary = fmGetScalar(fm, "summary")
    if (summary !== null) {
      const summaryLength = Array.from(summary).length
      if (summaryLength < SUMMARY_MIN) {
        failures.push({ check: "summary-empty", file: rel, detail: "summary is empty" })
      } else if (summaryLength > SUMMARY_MAX) {
        failures.push({ check: "summary-too-long", file: rel, detail: `summary is ${summaryLength} chars (max ${SUMMARY_MAX})` })
      }
    }

    if (!fmHasNonEmptyTags(fm)) {
      failures.push({ check: "tags-empty", file: rel, detail: "tags frontmatter is empty" })
    }

    const lines = body.split("\n")
    for (let i = 0; i < lines.length; i++) {
      for (const m of lines[i].matchAll(WIKILINK_RE)) {
        const target = m[1].trim()
        if (!slugs.has(target)) {
          failures.push({ check: "wikilink-broken", file: rel, detail: `line ${i + 1 + offset}: [[${target}]] does not resolve` })
        }
      }
    }

    for (const f of await v2Findings(body, offset)) {
      ;(isV2 || STRICT ? failures : warnings).push({ ...f, file: rel })
    }
  }

  if (failures.length === 0) {
    console.log(`OK - ${pageCount} pages, all checks pass.`)
  } else {
    console.log(`FAIL - ${failures.length} issue(s) across ${pageCount} pages:`)
    console.log("")
    printGroups(failures)
  }
  if (warnings.length > 0) {
    console.log(`WARN - ${warnings.length} warning(s) on legacy pages; they fail once the content migration lands (preview: --strict):`)
    console.log("")
    printGroups(warnings)
  }
  process.exit(failures.length === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(2)
})
