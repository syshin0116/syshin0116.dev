import { describe, expect, test } from "bun:test"
import notesList from "@/.generated/notes-list.json"
import { projectById, projects, TECH_STACK_LABELS } from "@/data/projects"
import { adjacentProjects, isOngoing, seriesPosts, sortByStart } from "./projects"

describe("project records", () => {
  test("ids are unique and resolve through the lookup", () => {
    expect(new Set(projects.map((project) => project.id)).size).toBe(projects.length)
    for (const project of projects) expect(projectById[project.id]).toBe(project)
  })

  test("every tech stack category has a human label", () => {
    for (const project of projects) {
      for (const category of Object.keys(project.techStack)) {
        expect(Object.hasOwn(TECH_STACK_LABELS, category)).toBe(true)
      }
    }
  })

  test("a related series folder lists at least one published post", () => {
    for (const project of projects.filter((project) => project.blogSeries)) {
      expect(seriesPosts(project.blogSeries, notesList).length).toBeGreaterThan(0)
    }
  })
})

describe("project ordering", () => {
  const sample = [
    { id: "old", period: "2023.10 ~ 2023.12" },
    { id: "new", period: "2026.06 ~ 진행 중" },
    { id: "mid", period: "2025.02.24 ~ 2025.04.03" },
  ]

  test("sorts by start, newest first", () => {
    expect(sortByStart(sample).map((project) => project.id)).toEqual(["new", "mid", "old"])
  })

  test("previous and next follow the list order and stop at the ends", () => {
    expect(adjacentProjects(sample, "mid")).toEqual({ previous: sample[1], next: sample[0] })
    expect(adjacentProjects(sample, "new").previous).toBeUndefined()
    expect(adjacentProjects(sample, "old").next).toBeUndefined()
    expect(adjacentProjects(sample, "missing")).toEqual({})
  })

  test("status comes from the period end", () => {
    expect(isOngoing(sample[1])).toBe(true)
    expect(isOngoing(sample[0])).toBe(false)
  })
})

describe("series posts", () => {
  const notes = [
    { slug: "Projects/Nuartz/02-B", title: "B" },
    { slug: "Projects/Nuartz/00-A", title: "A" },
    { slug: "Projects/Nuartz-Other/01", title: "other folder" },
    { slug: "Projects/Nuartz/deep/01", title: "nested" },
  ]

  test("keeps direct children of the folder in file-name order", () => {
    expect(seriesPosts("Projects/Nuartz", notes).map((note) => note.title)).toEqual(["A", "B"])
  })

  test("returns nothing without a folder", () => {
    expect(seriesPosts(undefined, notes)).toEqual([])
  })
})
