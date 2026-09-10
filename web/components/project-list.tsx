import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ProjectTimeline } from "@/data/projects";

interface ProjectListProps {
  projects: ProjectTimeline[];
}

function ProjectCard({ project }: { project: ProjectTimeline }) {
  return (
    <li className="py-5">
      <Link
        href={`/projects/${project.id}`}
        className="group block rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-medium leading-7 group-hover:underline underline-offset-4">
            {project.title}
          </h3>
          <ArrowUpRight aria-hidden="true" className="mt-1.5 size-4 shrink-0 text-muted-foreground" />
        </div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {project.company && `${project.company} · `}{project.period}
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground line-clamp-2">
          {project.description}
        </p>
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs leading-5 text-muted-foreground">
        {project.tags.slice(0, 3).map(tag => <span key={tag}>{tag}</span>)}
        {project.github && (
          <a href={project.github} target="_blank" rel="noopener noreferrer" aria-label={`${project.title} GitHub (새 탭)`} className="py-1 underline underline-offset-4 hover:text-foreground">
            GitHub
          </a>
        )}
        {project.demo && (
          <a href={project.demo} target="_blank" rel="noopener noreferrer" aria-label={`${project.title} 데모 (새 탭)`} className="py-1 underline underline-offset-4 hover:text-foreground">
            데모
          </a>
        )}
      </div>
    </li>
  );
}

export default function ProjectList({ projects }: ProjectListProps) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-10 text-2xl font-semibold tracking-tight">프로젝트</h1>
      <div className="grid gap-10 md:grid-cols-2 md:gap-16">
        {[
          { category: "company", title: "업무" },
          { category: "personal", title: "개인" },
        ].map(({ category, title }) => (
          <section key={category} aria-label={`${title} 프로젝트`}>
            <h2 className="border-b pb-3 text-sm font-semibold">{title}</h2>
            <ul className="divide-y divide-border/60">
              {projects.filter(project => project.category === category).map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
