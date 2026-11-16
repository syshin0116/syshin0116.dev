import type { Project } from "@/data/projects"

// Builds /llms.txt (https://llmstxt.org) from the same records the site renders,
// so the agent-facing summary cannot drift from /projects.

function projectLine(project: Project, siteUrl: string): string {
  return `- [${project.title}](${siteUrl}/projects/${project.id}): ${project.subtitle} (${project.period})`
}

export function buildLlmsTxt(projects: readonly Project[], siteUrl: string): string {
  const company = projects.filter((project) => project.category === "company")
  const personal = projects.filter((project) => project.category === "personal")

  return [
    "# syshin0116.dev",
    "",
    "> syshin0116의 블로그와 포트폴리오. AI 에이전트와 RAG를 다루는 글, 글에서 추린 위키, 프로젝트 기록, 블로그를 말뭉치로 쓰는 RAG 검색 방식 평가용 채팅 에이전트가 있습니다.",
    "",
    "블로그 원문은 고치지 않는 자료로 두고, 위키는 원문을 인용해 정리한 지식 층입니다. 채팅 에이전트의 목적은 여러 검색 방식을 구현하고 비교하는 것이며, 블로그 질문에 답하는 것은 부수 효과입니다.",
    "",
    "## Site",
    "",
    `- [Home](${siteUrl}/): 소개와 채팅 에이전트`,
    `- [Blog](${siteUrl}/blog): AI, 개발, 도구, 스터디, 프로젝트 글`,
    `- [Wiki](${siteUrl}/blog/wiki): 블로그 글을 출처로 인용해 정리한 위키, 성숙도(seedling, budding, evergreen)별 목록`,
    `- [Projects](${siteUrl}/projects): 회사와 개인 프로젝트 목록`,
    `- [About](${siteUrl}/about): 소개`,
    `- [RSS](${siteUrl}/feed.xml): 새 글 피드`,
    "",
    "## Company projects",
    "",
    ...company.map((project) => projectLine(project, siteUrl)),
    "",
    "## Personal projects",
    "",
    ...personal.map((project) => projectLine(project, siteUrl)),
    "",
    "## Optional",
    "",
    "- [GitHub](https://github.com/syshin0116): 소스 코드",
    `- [Sitemap](${siteUrl}/sitemap.xml): 전체 페이지 목록`,
    "",
  ].join("\n")
}
