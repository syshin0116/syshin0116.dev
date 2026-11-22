import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { SITE_URL } from "@/lib/site";

const skills = [
  {
    name: "portfolio-overview",
    type: "resource",
    description:
      "Overview of syshin0116.dev: blog, wiki, projects, and the RAG evaluation chat agent. Available as llms.txt for LLM consumption.",
    url: `${SITE_URL}/llms.txt`,
  },
  {
    name: "project-browser",
    type: "resource",
    description:
      "Browse detailed information about AI/ML projects including RAG systems, LangGraph agents, and computer vision applications.",
    url: `${SITE_URL}/projects`,
  },
  {
    name: "blog-content",
    type: "resource",
    description:
      "Technical blog posts on AI, machine learning, RAG, LangChain, and software development.",
    url: `${SITE_URL}/blog`,
  },
  {
    name: "api-catalog",
    type: "discovery",
    description: "RFC 9727 API catalog for automated API discovery.",
    url: `${SITE_URL}/.well-known/api-catalog`,
  },
];

export function GET() {
  const index = {
    $schema:
      "https://raw.githubusercontent.com/cloudflare/agent-skills-discovery-rfc/main/schemas/index.schema.json",
    skills: skills.map((skill) => ({
      ...skill,
      sha256: createHash("sha256")
        .update(JSON.stringify(skill))
        .digest("hex"),
    })),
  };

  return NextResponse.json(index, {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
