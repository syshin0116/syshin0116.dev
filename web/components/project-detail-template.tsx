import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, ExternalLink, FileText, Package } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TECH_STACK_LABELS, type Project, type TechStackCategory } from "@/data/projects";
import { blogPath } from "@/lib/blog-permalinks";
import { isOngoing, type SeriesPost } from "@/lib/projects";

interface ProjectDetailTemplateProps {
  project: Project;
  seriesPosts: SeriesPost[];
  previous?: Pick<Project, "id" | "title">;
  next?: Pick<Project, "id" | "title">;
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-t pt-8">
      <h2 id={id} className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-5 space-y-8">{children}</div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5 text-sm leading-6 text-muted-foreground marker:text-border">
      {items.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}
    </ul>
  );
}

function TitledLists({ title, groups }: { title: string; groups: { title: string; details: string[] }[] }) {
  return (
    <div>
      <h3 className="text-base font-semibold">{title}</h3>
      <div className="mt-4 grid gap-6 md:grid-cols-2">
        {groups.map((group) => (
          <div key={group.title}>
            <h4 className="text-sm font-medium">{group.title}</h4>
            <div className="mt-2"><BulletList items={group.details} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectLinks({ project }: { project: Project }) {
  const external = { target: "_blank", rel: "noopener noreferrer" } as const;
  if (!project.github && !project.demo && !project.package && !project.blogPost) return null;
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {project.github && (
        <Button asChild variant="outline" size="sm">
          <a href={project.github} {...external} aria-label={`${project.title} GitHub (새 탭)`}>
            <FaGithub aria-hidden="true" /> GitHub
          </a>
        </Button>
      )}
      {project.demo && (
        <Button asChild variant="outline" size="sm">
          <a href={project.demo} {...external} aria-label={`${project.title} 데모 (새 탭)`}>
            <ExternalLink aria-hidden="true" /> 데모
          </a>
        </Button>
      )}
      {project.package && (
        <Button asChild variant="outline" size="sm">
          <a href={project.package.url} {...external} aria-label={`${project.package.name} ${project.package.registry} 패키지 (새 탭)`}>
            <Package aria-hidden="true" /> {project.package.registry}
          </a>
        </Button>
      )}
      {project.blogPost && (
        <Button asChild variant="outline" size="sm">
          <Link href={project.blogPost}>
            <FileText aria-hidden="true" /> 소개 글
          </Link>
        </Button>
      )}
    </div>
  );
}

export default function ProjectDetailTemplate({ project, seriesPosts, previous, next }: ProjectDetailTemplateProps) {
  const ongoing = isOngoing(project);
  const facts: { label: string; value: ReactNode }[] = [
    {
      label: "기간",
      value: (
        <>
          <span className="tabular-nums">{project.period}</span>
          <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{project.duration}</span>
        </>
      ),
    },
    { label: "역할", value: project.role },
    { label: "팀", value: project.team },
    {
      label: "상태",
      value: (
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className={`size-2 rounded-full ${ongoing ? "bg-primary" : "bg-muted-foreground/50"}`} />
          {ongoing ? "진행 중" : "완료"}
        </span>
      ),
    },
  ];
  const stack = Object.entries(project.techStack) as [TechStackCategory, string[]][];
  const hasWork = Boolean(
    project.architectureEvolution || project.keyResponsibilities || project.keyFeatures ||
    project.highlights || project.challenges || project.learnings,
  );

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-10">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 rounded-sm text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        <ArrowLeft aria-hidden="true" className="size-4" /> 프로젝트 목록
      </Link>

      <header className="mt-6">
        <p className="text-sm text-muted-foreground">
          {project.category === "company" ? "업무" : "개인"}
          {project.company && ` · ${project.company}`}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-balance break-keep md:text-3xl">{project.title}</h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground break-keep md:text-lg">{project.subtitle}</p>
        <ProjectLinks project={project} />
      </header>

      <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border md:grid-cols-4">
        {facts.map((fact) => (
          <div key={fact.label} className="bg-background p-4">
            <dt className="text-xs text-muted-foreground">{fact.label}</dt>
            <dd className="mt-1 text-sm font-medium leading-6 break-keep">{fact.value}</dd>
          </div>
        ))}
      </dl>

      {project.metrics && (
        <section aria-label="핵심 지표" className="mt-8">
          <dl className={`grid gap-6 ${project.metrics.length > 2 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
            {project.metrics.map((metric) => (
              <div key={metric.metric} className="border-l-2 border-primary pl-4">
                <dt className="text-sm text-muted-foreground">{metric.metric}</dt>
                <dd className="mt-1">
                  <span className="block text-3xl font-semibold tracking-tight tabular-nums">{metric.after}</span>
                  {(metric.before || metric.improvement) && (
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                      {metric.before && `${metric.before}에서`}
                      {metric.before && metric.improvement && " · "}
                      {metric.improvement}
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {project.demoImage && (
        <figure className="mt-8 overflow-hidden rounded-lg border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={project.demoImage.url} alt={project.demoImage.alt} className="h-auto w-full" />
        </figure>
      )}

      <div className="mt-10 space-y-10">
        <Section id="background" title="배경">
          <p className="text-base leading-7 break-keep">{project.description}</p>
          {project.businessGoals && (
            <dl className="grid gap-6 md:grid-cols-2">
              {project.businessGoals.map((goal) => (
                <div key={goal.title}>
                  <dt className="text-sm font-medium">{goal.title}</dt>
                  <dd className="mt-2 text-sm leading-6 text-muted-foreground">
                    {goal.description && <p>{goal.description}</p>}
                    {goal.items && <div className="mt-2"><BulletList items={goal.items} /></div>}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </Section>

        {hasWork && (
          <Section id="work" title="한 일">
            {project.architectureEvolution && (
              <div>
                <h3 className="text-base font-semibold">아키텍처 변화</h3>
                <ol className="mt-4 space-y-6 border-l pl-5">
                  {project.architectureEvolution.map((step) => (
                    <li key={step.version}>
                      <h4 className="text-sm font-medium">{step.version}: {step.title}</h4>
                      <dl className="mt-2 space-y-3">
                        {([["문제", step.problems], ["결정", step.changes], ["결과", step.results]] as const).map(
                          ([label, items]) => items && (
                            <div key={label}>
                              <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
                              <dd className="mt-1"><BulletList items={[...items]} /></dd>
                            </div>
                          ),
                        )}
                      </dl>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {project.keyResponsibilities && <TitledLists title="담당 업무" groups={project.keyResponsibilities} />}
            {project.keyFeatures && <TitledLists title="주요 기능" groups={project.keyFeatures} />}
            {project.challenges && (
              <div>
                <h3 className="text-base font-semibold">문제와 해결</h3>
                <dl className="mt-4 space-y-4">
                  {project.challenges.map((challenge) => (
                    <div key={challenge.title}>
                      <dt className="text-sm font-medium">{challenge.title}</dt>
                      <dd className="mt-1 text-sm leading-6 text-muted-foreground break-keep">{challenge.description}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
            {project.highlights && (
              <div>
                <h3 className="text-base font-semibold">결과</h3>
                <div className="mt-3"><BulletList items={project.highlights} /></div>
              </div>
            )}
            {project.learnings && (
              <div>
                <h3 className="text-base font-semibold">배운 점</h3>
                <div className="mt-3"><BulletList items={project.learnings} /></div>
              </div>
            )}
          </Section>
        )}

        <Section id="stack" title="기술 스택">
          <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {stack.map(([category, items]) => (
              <div key={category}>
                <dt className="text-sm font-medium">{TECH_STACK_LABELS[category]}</dt>
                <dd className="mt-2 flex flex-wrap gap-1.5">
                  {items.map((item) => (
                    <Badge key={item} variant="secondary" className="font-normal [overflow-wrap:anywhere]">{item}</Badge>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </Section>

        {seriesPosts.length > 0 && (
          <Section id="series" title="관련 글">
            <ol className="divide-y rounded-lg border">
              {seriesPosts.map((post) => (
                <li key={post.slug}>
                  <Link
                    href={blogPath(post.slug)}
                    className="flex items-baseline justify-between gap-4 px-4 py-3 text-sm hover:bg-accent/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                  >
                    <span className="break-keep">{post.title}</span>
                    {post.date && <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{post.date.slice(0, 10)}</span>}
                  </Link>
                </li>
              ))}
            </ol>
          </Section>
        )}
      </div>

      {(previous || next) && (
        <nav aria-label="다른 프로젝트" className="mt-12 grid gap-3 border-t pt-8 sm:grid-cols-2">
          {previous ? (
            <Link
              href={`/projects/${previous.id}`}
              className="group rounded-lg border p-4 hover:bg-accent/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <ArrowLeft aria-hidden="true" className="size-3.5" /> 더 최근 프로젝트
              </span>
              <span className="mt-1 block text-sm font-medium break-keep">{previous.title}</span>
            </Link>
          ) : <span aria-hidden="true" className="hidden sm:block" />}
          {next && (
            <Link
              href={`/projects/${next.id}`}
              className="group rounded-lg border p-4 text-right hover:bg-accent/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                이전 프로젝트 <ArrowRight aria-hidden="true" className="size-3.5" />
              </span>
              <span className="mt-1 block text-sm font-medium break-keep">{next.title}</span>
            </Link>
          )}
        </nav>
      )}
    </main>
  );
}
