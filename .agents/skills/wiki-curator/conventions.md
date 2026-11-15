# wiki-curator: Conventions

Frontmatter, tags, naming, organization, and link rules for `content/wiki/`.

These are invariants (what must be present), not taxonomies (how to categorize). Categorization emerges from observing the actual content.

## What earns a page

A page exists for a concept a reader would look up: a tool, technique, pattern, or idea that someone would search for by name. Not a per-post summary, not a date, not an event log. One source is enough to start a page; the page grows as more sources arrive.

Source count is a default, not a gate. A page backed by one or two sources starts as `status: seedling`; nothing blocks it for having few sources.

## Wiki page frontmatter

```yaml
---
title: "Page title"
tags:
  - <free-form, see below>
sources:
  - content/AI/2026-04-19-LLM-Text-to-SQL.md
summary: "1-3 sentence rich summary. Single source for callout rendering, search snippets, OG meta, RSS."
status: seedling
confidence: medium
reviewed: null
created: YYYY-MM-DD
updated: YYYY-MM-DD
draft: false
---
```

| Field | Rule |
|-------|------|
| `title` | Korean or English. Short and search-friendly. Kebab-case version becomes the filename. |
| `tags` | 5-10 per page, drawn from multiple dimensions (domain, language, technique, concept, meta). Reuse existing vocabulary first; new tags are OK when nothing fits. |
| `sources` | Required. Every source that contributed to this page. Use an existing repo-relative file path or an absolute HTTPS URL. Append on update; never remove unless the source is deleted. |
| `summary` | Required. 1-3 sentences. The single canonical summary used for callout rendering, index.md descriptions, search snippets. No `## Summary` section in body. |
| `status` | Required. Growth stage: `seedling`, `budding`, or `evergreen` (see below). |
| `confidence` | Required. How well the cited sources back the page's claims: `low`, `medium`, or `high` (see below). |
| `reviewed` | Optional. `YYYY-MM-DD` of the last time a human compared the page against its sources, or `null`. Agents never set it. Required for `evergreen`. |
| `created` | First write. Never change. |
| `updated` | Bump on every edit. |
| `draft` | Default `false`. `true` only when content is incomplete or under review. |

Retired fields: `type` and `author` are no longer part of the contract. Synthesis pages are identified by `synthesis_query`, not `type`. `coverage` stays forbidden; source count is derived in `index.md` rendering.

### Growth stages (`status`)

| Stage | Meaning | Typical shape |
|-------|---------|---------------|
| `seedling` | Started from one or two sources. Claims are extracted, structure is provisional. | 1-2 sources, a few Key Claims |
| `budding` | Several sources woven together; the page has its own structure and inline links. | 3+ sources, or one deep source fully worked |
| `evergreen` | Stable. A human has checked it against the sources. | `reviewed` date set |

Ingest creates pages as `seedling` and may move a page to `budding` when it adds sources and restructures it. Only a human moves a page to `evergreen`, by setting `reviewed`. The verifier rejects `evergreen` without a `reviewed` date.

### Confidence

| Value | Meaning |
|-------|---------|
| `high` | Claims are directly extracted and the sources agree. |
| `medium` | Some claims rest on a single source or are marked `[inferred]`. |
| `low` | Sources are thin, outdated, or disagree (see `## Contradictions`). |

Confidence is about evidence, status is about the page's maturity. A seedling can be `high` (one clear source), an evergreen can be `medium`.

### Rollout (contract v2)

A page that declares `status` follows this contract and the verifier enforces all of it. A page without `status` is a legacy page: `type` and `author` are still allowed and the v2-only rules are reported as warnings, not failures. The content migration converts every page and then sets `ALLOW_LEGACY_PAGES` to false in both verifiers, after which a page without `status` fails. Preview that state with `--strict`.

## Page organization

The wiki uses **three complementary mechanisms** for organizing pages:

| Mechanism | Role |
|-----------|------|
| **Folders** | Primary home. Where a reader would first look for the page in a file tree. |
| **Wikilinks** | Conceptual connections across folders. Bidirectional graph of related pages. |
| **Tags** | Facets / cross-cutting metadata. Independent of folder location. |

Folders are **not exclusive partitions**. A page may legitimately belong to several categories - pick the strongest fit as its home, and let tags + wikilinks carry the rest. A page that "could go anywhere" is rare; usually one category is more natural than the others.

**Operational split:**
- ingest writes every new page to `content/wiki/<slug>.md` at root. It does not pick folders.
- [migrate](./migrate.md) decides folder structure based on the whole wiki.

**Slugs stay stable.** Folder moves don't break wikilinks (resolution is by basename); slug renames do - backlinks must be updated in the same operation.

## Page structure

````markdown
Opening prose that defines the concept in a sentence or two, linking related
pages inline where the sentence discusses them: [[zettelkasten]] style notes...

## Key Claims

- Bullets. Each claim cites its source via footnote.
- Paraphrase faithfully; do not embellish.[^1]
- A verbatim quote goes in double quotes: "the exact words from the source, 15 characters or more"[^2]

## Examples / Code

```python
# from content/AI/2026-04-19-LLM-Text-to-SQL.md
def example(): ...
```

## 생각의 변천

Only when the author's position changed over time. Each step cites its source.

- 2023: X was the default choice.[^1]
- 2026: replaced by Y after the migration.[^2]

## Contradictions

Optional. When sources disagree, list both with attribution. Do not resolve.

## Footnotes

[^1]: content/AI/2026-04-19-LLM-Text-to-SQL.md
[^2]: content/Tools/2024-07-29-Zettelkasten.md#Permanent Notes
````

| Section | Rule |
|---------|------|
| `## Key Claims` | Mandatory. Every claim carries a footnote. |
| `## Footnotes` | Mandatory. Every `[^id]` used in the body is defined here. |
| `## 생각의 변천` | Only when the position actually changed across sources or over time. Must cite the sources that show the change. Never add it empty or as a placeholder. |
| `## Contradictions`, `## Examples / Code` | Optional. |
| Related pages | None. Do not write `## Connections`, `## Related`, `## See also`, or `## 관련 페이지`. Link inline in the body; the web page renders backlinks automatically. |

Any section that would be empty is omitted; the verifier rejects empty headings on v2 pages.

`## Key Claims` and `## Footnotes` stay mandatory at every growth stage: a one-source seedling still states its claims and cites them, and the quote check resolves quotes through the footnotes.

The Summary content lives in **frontmatter `summary:`** - the web template renders it as a callout above the body. Don't repeat it as a `## Summary` section.

## Quotes and citations

Double quotes (`"..."` or `“...”`) in prose mean a verbatim span from a source. A quote followed on the same line by a footnote reference is checked by the verifier against the footnote's target:

- The quote must be at least 15 characters (after trimming trailing punctuation) and contain letters. A number alone, such as "2024" or "68.5k", is not a verifiable quote; state numbers as paraphrase with a footnote.
- For a repo-local footnote (`[^1]: content/Tools/x.md`), the quote must appear in that file. Comparison ignores emphasis (`*`, `_`, backticks), link markup, blockquote markers, and whitespace differences; it does not ignore wording.
- For a heading anchor (`[^1]: content/Tools/x.md#Heading Text`), the quote must appear inside that heading's section (up to the next heading of the same or higher level). The anchor matches the heading text or its slug, ignoring case and punctuation (`#Permanent Notes` and `#permanent-notes` both work). With nested anchors (`#A#B`), the last heading is used.
- HTTPS footnotes are not fetched; only the length and letter rules apply.
- One contiguous span per quote. For an elision, use two quotes.
- Terms, titles, and short phrases are not quotes: write them plainly, in italics, or in `code`.

Quotes inside code spans or fenced code blocks, and quotes with no footnote after them on the line, are not checked.

## Tags

No prefixes. 5–10 per page, sampled from multiple dimensions:

| Dimension | Examples |
|-----------|----------|
| Domain | `AI`, `Backend`, `frontend`, `data`, `devops` |
| Language/framework | `python`, `Rust`, `typescript`, `Nextjs` |
| Technique | `BM25`, `edit-distance`, `prompt-engineering`, `Caching`, `vector-search` |
| Concept | `knowledge-graph`, `zettelkasten`, `retrieval` |
| Meta | `CLI`, `library`, `Pattern`, `Experiment`, `comparison` |

Wiki pages and source posts share one set of tag pages, so a tag that differs from a post tag only in case or in spaces, `-`, `_`, `.` splits that page (`web/lib/tag.ts` compares tags this way). Reuse the post's exact spelling, then the wiki's; write a brand-new tag lowercase and hyphenated. `bun run prebuild` (in `web/`, run by `ci/web` for any `content/` change) fails on such a split and lists each spelling with its files; spellings that name different things, such as `ReAct` and `react`, are listed in `web/lib/tag.ts`.

```bash
# See current tags + frequency across posts and wiki (block-style lists only;
# about 16 posts use inline `tags: [a, b]` and are not counted)
find content -name '*.md' -exec awk '
  FNR==1 {fm=0; t=0}
  /^---$/ {fm++; next}
  fm==1 && /^tags:/ {t=1; next}
  fm==1 && t && /^ +- / {sub(/^ +- /, ""); print; next}
  {t=0}' {} + | sort | uniq -c | sort -rn
```

Tag drift (parallel synonyms like `note-taking` vs `notes`) is the [migrate](./migrate.md) operation's problem to consolidate. Day-to-day, prefer the most common existing form.

## Filename rules

- Lowercase + hyphens.
- Korean OK (URL-safe via Vercel).
- No date prefix (the `created` frontmatter holds that).
- Matches `title` slugified.

| Title | Filename |
|-------|----------|
| "Zettelkasten Method" | `zettelkasten.md` |
| "PDF 파서 비교" | `pdf-파서-비교.md` |
| "LLM Text-to-SQL Patterns" | `llm-text-to-sql-patterns.md` |

If folders are introduced, append the folder: `concepts/zettelkasten.md`. The slug used in `[[wikilinks]]` is still just `zettelkasten` - Nuartz/Obsidian resolve by filename regardless of folder.

## sources vs wikilinks

| | Where | Targets | Purpose |
|---|---|---|---|
| `sources:` | frontmatter | repo-relative files or absolute HTTPS URLs | Provenance |
| `[[wikilink]]` | body | wiki page slugs (`[[zettelkasten]]`) | Conceptual connection |

- `[[wikilinks]]` only point to `content/wiki/` pages. Never wikilink to a source post.
- Repo-local sources must exist and stay inside the repository. HTTPS sources must be syntactically valid; the verify gate does not fetch them.
- Targets must exist or be created in the same operation.
- Verify with the script (LLMs hallucinate links):
  ```bash
  bun .claude/skills/wiki-curator/scripts/verify.ts
  ```
- Links go inline, in a sentence that already discusses the linked concept. There is no hand-written related-pages section; backlinks are rendered by the web page.
- Zero links is valid output. Don't pad.

## log.md

Every operation appends one line:

```
## [YYYY-MM-DD HH:MM UTC] <operation> | <summary>
```

Use `date -u +'%Y-%m-%d %H:%M UTC'` to generate the timestamp.

Examples:
```
## [2026-04-25 04:30 UTC] ingest | 5 posts → 3 new pages, 2 page updates
## [2026-04-25 09:00 UTC] lint | 0 broken links, 1 contradiction surfaced in zettelkasten.md
## [2026-04-26 02:00 UTC] reflect | added 7 cross-links across 4 pages
## [2026-05-01 12:00 UTC] migrate | introduced concepts/ folder, moved 8 pages, consolidated 3 tags
```

Append-only. Never edit past entries.

## index.md

Single-file catalog at `content/wiki/index.md`. Auto-generated by `bun .claude/skills/wiki-curator/scripts/rebuild-index.ts` - every ingest and migrate runs the script. Never hand-edit; never have an LLM regenerate the table token-by-token.

Format:

```markdown
# Wiki Index

## All pages

| Page | Summary | Type | Tags | Sources | Updated |
|------|---------|------|------|---------|---------|
| [[zettelkasten]] | Note-linking system focused on connection over collection. | concept | pkm, note-taking, zettelkasten | 5 | 2026-04-25 |
| [[clidex]] | Rust CLI for tool discovery with BM25-based search. | tool | cli, rust, ai, bm25 | 2 | 2026-04-25 |

## Sources catalog

| Source | Wiki pages |
|--------|------------|
| content/AI/2026-04-19-LLM-Text-to-SQL.md | [[text-to-sql]], [[llm-prompting]] |
```

This is the **L1 cache for the LLM** - every ingest reads it first to find candidate pages without reading every wiki file.

## Provenance tags (optional, for ambiguous claims)

When a claim is not directly stated but inferred, mark it inline:

```markdown
- LLM-based wikis prevent context rot[^1]
- This pattern likely scales beyond 1000 pages [inferred]
- Performance characteristics at scale [ambiguous - sources disagree]
```

Three tiers: implicit (no tag = directly extracted), `[inferred]`, `[ambiguous]`. Use sparingly - most claims should be directly extracted.
