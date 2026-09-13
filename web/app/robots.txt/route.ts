import { SITE_URL } from "@/lib/site"
export function GET() {
  const body = `User-agent: *
Allow: /
Disallow: /login
Disallow: /api/

Sitemap: ${SITE_URL}/sitemap.xml

# Content Signals (https://contentsignals.org/)
Content-Signal: ai-train=disallow, search=allow, ai-input=allow
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain" },
  });
}
