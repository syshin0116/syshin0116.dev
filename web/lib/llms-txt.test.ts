import { describe, expect, test } from "bun:test"

import { projectById, projects } from "@/data/projects"
import { buildLlmsTxt } from "@/lib/llms-txt"

const SITE = "https://example.test"

describe("buildLlmsTxt", () => {
  const body = buildLlmsTxt(projects, SITE)

  test("starts with the llms.txt H1 and blockquote summary", () => {
    const lines = body.split("\n")
    expect(lines[0]).toBe("# syshin0116.dev")
    expect(lines[2].startsWith("> ")).toBe(true)
  })

  test("links only to projects that exist", () => {
    const linked = [...body.matchAll(/\/projects\/([^)\s]+)\)/g)].map((match) => match[1])
    expect(linked.length).toBe(projects.length)
    for (const id of linked) expect(projectById[id]).toBeDefined()
  })

  test("lists every project once", () => {
    for (const project of projects) {
      expect(body.split(`${SITE}/projects/${project.id})`).length - 1).toBe(1)
    }
  })
})
