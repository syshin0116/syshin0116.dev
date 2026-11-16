import { projects } from "@/data/projects"
import { buildLlmsTxt } from "@/lib/llms-txt"
import { SITE_URL } from "@/lib/site"

export const dynamic = "force-static"

export function GET() {
  return new Response(buildLlmsTxt(projects, SITE_URL), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
