import { describe, expect, test } from "bun:test"
import fs from "node:fs"
import path from "node:path"

const FONTS_DIR = import.meta.dir
const WEB_DIR = path.join(FONTS_DIR, "..", "..")
const SOURCE_DIRS = ["app", "components", "contexts", "lib"]

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(full)
    return /\.(tsx?|jsx?|mjs)$/.test(entry.name) ? [full] : []
  })
}

describe("vendored fonts", () => {
  test("no module fetches fonts from Google at build time", () => {
    const offenders = SOURCE_DIRS.flatMap((dir) => sourceFiles(path.join(WEB_DIR, dir)))
      .filter((file) => /from\s+["']next\/font\/google["']/.test(fs.readFileSync(file, "utf8")))
      .map((file) => path.relative(WEB_DIR, file))
    expect(offenders).toEqual([])
  })

  test("every slice in index.ts is vendored with its license, and nothing else is", () => {
    const index = fs.readFileSync(path.join(FONTS_DIR, "index.ts"), "utf8")
    const referenced = new Set([...index.matchAll(/"\.\/([^"]+\.woff2)"/g)].map(([, file]) => file))
    const familyDirs = fs
      .readdirSync(FONTS_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
    const vendored = familyDirs.flatMap((dir) =>
      fs.readdirSync(path.join(FONTS_DIR, dir)).filter((f) => f.endsWith(".woff2")).map((f) => `${dir}/${f}`),
    )

    expect([...referenced].sort()).toEqual(vendored.sort())
    for (const dir of familyDirs) {
      expect(fs.readFileSync(path.join(FONTS_DIR, dir, "OFL.txt"), "utf8")).toContain("SIL OPEN FONT LICENSE")
    }
  })
})
