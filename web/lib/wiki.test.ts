import { describe, expect, test } from "bun:test"
import { wikiCitationsBySource, wikiHub, type WikiNote } from "./wiki"

const post = (slug: string, frontmatter: Record<string, unknown> = {}): WikiNote => ({
  slug,
  sourcePath: `content/${slug}.md`,
  frontmatter,
})

const wiki = (name: string, frontmatter: Record<string, unknown>): WikiNote =>
  post(`wiki/${name}`, { title: name, summary: `${name} 요약`, ...frontmatter })

describe("wikiCitationsBySource", () => {
  test("lists the wiki pages whose sources name a post, sorted by title", () => {
    const notes = [
      post("Tools/Docker/2023-05-08-Docker와 VM 차이"),
      wiki("docker", { sources: ["content/Tools/Docker/2023-05-08-Docker와 VM 차이.md", "https://docs.docker.com/"] }),
      wiki("devops", { sources: ["content/Tools/Docker/2023-05-08-Docker와 VM 차이.md#VM"] }),
    ]
    expect(wikiCitationsBySource(notes).get("Tools/Docker/2023-05-08-Docker와 VM 차이")).toEqual([
      { slug: "wiki/devops", title: "devops", summary: "devops 요약" },
      { slug: "wiki/docker", title: "docker", summary: "docker 요약" },
    ])
  })

  test("matches decomposed Hangul paths and skips URLs, missing files, drafts, and wiki-to-wiki sources", () => {
    const notes = [
      post("AI/검색"),
      wiki("search", { sources: ["content/AI/검색.md".normalize("NFD"), "content/AI/없는글.md", "content/wiki/other.md"] }),
      wiki("other", { sources: ["content/AI/검색.md"], draft: true }),
      post("wiki/index", { sources: ["content/AI/검색.md"] }),
    ]
    const citations = wikiCitationsBySource(notes)
    expect(citations.get("AI/검색")?.map(entry => entry.slug)).toEqual(["wiki/search"])
    expect([...citations.keys()]).toEqual(["AI/검색"])
  })

  test("cites a post once per wiki page even when listed twice", () => {
    const notes = [post("AI/a"), wiki("x", { sources: ["content/AI/a.md", "content/AI/a.md#h"] })]
    expect(wikiCitationsBySource(notes).get("AI/a")).toHaveLength(1)
  })
})

describe("wikiHub", () => {
  test("groups by status from evergreen to seedling and puts unknown statuses last", () => {
    const notes = [
      wiki("b-seed", { status: "seedling", sources: ["content/AI/a.md"] }),
      wiki("a-seed", { status: "seedling", sources: [] }),
      wiki("bud", { status: "budding" }),
      wiki("legacy", {}),
      wiki("typo", { status: "evergren" }),
      wiki("hidden", { status: "evergreen", draft: true }),
      post("wiki/log", { status: "evergreen" }),
      post("AI/a", { status: "evergreen" }),
    ]
    const groups = wikiHub(notes)
    expect(groups.map(group => group.status)).toEqual(["budding", "seedling", null])
    expect(groups[1].pages.map(page => page.title)).toEqual(["a-seed", "b-seed"])
    expect(groups[1].pages[1]).toEqual({ slug: "wiki/b-seed", title: "b-seed", summary: "b-seed 요약", sourceCount: 1 })
    expect(groups[2].pages.map(page => page.title)).toEqual(["legacy", "typo"])
  })
})
