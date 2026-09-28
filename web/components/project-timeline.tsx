import Link from "next/link";
import { Building2, ChevronRight, Code } from "lucide-react";
import type { ProjectTimeline as Project } from "@/data/projects";

interface ProjectTimelineProps {
  projects: Project[];
}

// "2026.03 ~ 진행 중" -> "2026.03"
const startOf = (project: Project) => project.period.split(" ~ ")[0];
const isOngoing = (project: Project) => project.period.includes("진행 중");

function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="group relative rounded-lg border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/40">
      <Link
        href={`/projects/${project.id}`}
        className="block rounded-sm after:absolute after:inset-0 after:rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold leading-6">{project.title}</h3>
          <ChevronRight
            aria-hidden="true"
            className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
          />
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          <span className="md:sr-only">{project.category === "company" ? "업무" : "개인"} · </span>
          {project.company && `${project.company} · `}{project.period}
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground line-clamp-2">
          {project.description}
        </p>
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        {project.tags.slice(0, 3).map(tag => (
          <span key={tag} className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">
            {tag}
          </span>
        ))}
        {project.github && (
          <a href={project.github} target="_blank" rel="noopener noreferrer" aria-label={`${project.title} GitHub (새 탭)`} className="relative z-10 ml-1 py-1 underline underline-offset-4 hover:text-foreground">
            GitHub
          </a>
        )}
        {project.demo && (
          <a href={project.demo} target="_blank" rel="noopener noreferrer" aria-label={`${project.title} 데모 (새 탭)`} className="relative z-10 ml-1 py-1 underline underline-offset-4 hover:text-foreground">
            데모
          </a>
        )}
      </div>
    </article>
  );
}

function TimelineNode({ project }: { project: Project }) {
  const Icon = project.category === "company" ? Building2 : Code;
  return (
    <span
      className={`flex size-8 items-center justify-center rounded-full border bg-background ${isOngoing(project) ? "border-primary text-primary ring-4 ring-primary/10" : "text-muted-foreground"}`}
    >
      <Icon aria-hidden="true" className="size-4" />
    </span>
  );
}

export default function ProjectTimelineView({ projects }: ProjectTimelineProps) {
  const sorted = [...projects].sort((a, b) => startOf(b).localeCompare(startOf(a)));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">프로젝트</h1>
      <p className="mt-2 text-sm text-muted-foreground">업무와 개인 프로젝트를 시작 시점 순으로 정리했습니다.</p>

      <div className="relative mt-10">
        <div aria-hidden="true" className="absolute inset-y-0 left-4 w-px bg-border md:left-1/2" />

        <div aria-hidden="true" className="mb-6 hidden grid-cols-[1fr_48px_1fr] md:grid">
          <p className="flex items-center justify-end gap-2 pr-8 text-sm font-semibold">
            <Building2 className="size-4 text-primary" /> 업무
          </p>
          <span />
          <p className="flex items-center gap-2 pl-8 text-sm font-semibold">
            <Code className="size-4 text-primary" /> 개인
          </p>
        </div>

        <ol className="relative space-y-6">
          {sorted.map((project, index) => {
            const isCompany = project.category === "company";
            const year = startOf(project).slice(0, 4);
            const showYear = index === 0 || startOf(sorted[index - 1]).slice(0, 4) !== year;

            return (
              <li key={project.id}>
                {showYear && (
                  <p className="relative mb-6 flex md:justify-center">
                    <span className="rounded-full border bg-background px-2.5 py-0.5 text-xs font-semibold tabular-nums">
                      {year}
                    </span>
                  </p>
                )}
                <div className="relative grid grid-cols-[32px_1fr] gap-x-4 md:grid-cols-[1fr_48px_1fr] md:gap-x-0">
                  <div className="relative z-10 col-start-1 row-start-1 flex justify-center pt-1 md:col-start-2">
                    <TimelineNode project={project} />
                  </div>
                  <div className={`col-start-2 row-start-1 ${isCompany ? "md:col-start-1 md:pr-8" : "md:col-start-3 md:pl-8"}`}>
                    <ProjectCard project={project} />
                  </div>
                  <span
                    aria-hidden="true"
                    className={`hidden row-start-1 pt-2.5 text-xs tabular-nums text-muted-foreground md:block ${isCompany ? "md:col-start-3 md:pl-8" : "md:col-start-1 md:pr-8 md:text-right"}`}
                  >
                    {startOf(project)}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
