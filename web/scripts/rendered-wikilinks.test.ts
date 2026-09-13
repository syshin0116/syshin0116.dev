import { describe, expect, test } from "bun:test"
import fs from "node:fs/promises"
import path from "node:path"

const PAGES_DIR = path.join(process.cwd(), ".generated", "pages")

/**
 * Wikilinks resolve against `knownSlugs` after the baseUrl prefix is stripped, so a
 * baseUrl mismatch marks every link broken while the hrefs stay correct. Only the
 * rendered output shows that, which is why this asserts on `.generated` rather than
 * on the resolver.
 */
async function readRenderedHtml(): Promise<string[]> {
  const html: string[] = []
  const walk = async (dir: string) => {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        await walk(full)
      } else if (entry.name.endsWith(".json")) {
        const page = JSON.parse(await fs.readFile(full, "utf-8")) as { html?: string }
        if (page.html) html.push(page.html)
      }
    }
  }
  await walk(PAGES_DIR)
  return html
}

describe("rendered wikilinks", () => {
  test("most wikilinks resolve to a known page", async () => {
    const pages = await readRenderedHtml()
    expect(pages.length).toBeGreaterThan(0)

    let total = 0
    let broken = 0
    for (const html of pages) {
      total += (html.match(/class="wikilink(?: broken)?"/g) ?? []).length
      broken += (html.match(/class="wikilink broken"/g) ?? []).length
    }

    expect(total).toBeGreaterThan(0)
    // Some source posts genuinely link to notes that were never written. Those are
    // tracked separately; this guards against a systemic resolution failure.
    expect(broken / total).toBeLessThan(0.25)
  })
})
