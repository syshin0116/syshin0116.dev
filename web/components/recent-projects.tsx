import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { projectsTimeline } from "@/data/projects";

export function RecentProjects() {
  const recent = projectsTimeline.slice(0, 3);

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold">프로젝트</h2>
        <Link
          href="/projects"
          aria-label="최근 프로젝트 전체 보기"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          전체 보기 <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
      <ul className="divide-y divide-border/60">
        {recent.map((project) => (
          <li key={project.id}>
            <Link href={`/projects/${project.id}`} className="group block rounded-sm py-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{project.period}</p>
                <h3 className="font-medium text-sm leading-6 group-hover:underline underline-offset-4 line-clamp-2">
                  {project.title}
                </h3>
                <p className="text-sm leading-6 text-muted-foreground line-clamp-2">
                  {project.description}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
