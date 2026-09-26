import { describe, expect, test } from "bun:test"
import fs from "node:fs/promises"
import path from "node:path"

import { readGeneratedJson } from "./page"

const PAGES_DIR = path.join(process.cwd(), ".generated", "pages")

describe("readGeneratedJson", () => {
  test("reads a real generated page", async () => {
    const found: string[] = []
    const walk = async (dir: string, prefix: string) => {
      for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
        if (found.length) return
        const next = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          await walk(next, `${prefix}${entry.name}/`)
        } else if (entry.name.endsWith(".json")) {
          found.push(`${prefix}${entry.name.replace(/\.json$/, "")}`)
          return
        }
      }
    }
    await walk(PAGES_DIR, "")
    expect(found).not.toBeEmpty()
    expect(await readGeneratedJson("pages", found[0])).not.toBeNull()
  })

  test("refuses a slug that escapes the generated directory", async () => {
    // The sibling file exists, so a missing guard would return its contents.
    expect(await fs.readFile(path.join(process.cwd(), ".generated", "notes-list.json"), "utf-8")).toBeTruthy()

    for (const slug of ["../notes-list", "../../package", "a/../../notes-list"]) {
      expect(await readGeneratedJson("pages", slug)).toBeNull()
    }
  })

  test("returns null for an unknown slug inside the directory", async () => {
    expect(await readGeneratedJson("pages", "no-such-page-xyz")).toBeNull()
  })
})
