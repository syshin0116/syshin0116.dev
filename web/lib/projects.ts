import type { Project } from "@/data/projects"

/** "2026.03 ~ 진행 중" -> "2026.03" */
export function projectStart(project: Pick<Project, "period">): string {
  return project.period.split(" ~ ")[0]
}

export function isOngoing(project: Pick<Project, "period">): boolean {
  return project.period.includes("진행 중")
}

/** Newest start first; the list page and previous/next navigation share this order. */
export function sortByStart<T extends Pick<Project, "period">>(projects: readonly T[]): T[] {
  return [...projects].sort((a, b) => projectStart(b).localeCompare(projectStart(a)))
}

export function adjacentProjects<T extends Pick<Project, "id" | "period">>(
  projects: readonly T[],
  id: string,
): { previous?: T; next?: T } {
  const ordered = sortByStart(projects)
  const index = ordered.findIndex((project) => project.id === id)
  if (index === -1) return {}
  return { previous: ordered[index - 1], next: ordered[index + 1] }
}

export interface SeriesPost {
  slug: string
  title: string
  date?: string | null
}

/** Published posts directly inside the project's content folder, in file-name order. */
export function seriesPosts<T extends SeriesPost>(folder: string | undefined, notes: readonly T[]): T[] {
  if (!folder) return []
  const prefix = `${folder}/`
  return notes
    .filter((note) => note.slug.startsWith(prefix) && !note.slug.slice(prefix.length).includes("/"))
    .sort((a, b) => a.slug.localeCompare(b.slug))
}
