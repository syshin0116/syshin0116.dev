import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/site";

export function GET() {
  const catalog = {
    linkset: [
      {
        anchor: `${SITE_URL}/`,
        "service-doc": [
          {
            href: `${SITE_URL}/llms.txt`,
            type: "text/plain",
          },
        ],
      },
      {
        anchor: `${SITE_URL}/blog/api/content/`,
        "service-desc": [
          {
            href: `${SITE_URL}/blog/api/content/`,
            type: "application/json",
          },
        ],
        "service-doc": [
          {
            href: `${SITE_URL}/llms.txt`,
            type: "text/plain",
          },
        ],
      },
    ],
  };

  return NextResponse.json(catalog, {
    headers: {
      "Content-Type": "application/linkset+json",
    },
  });
}
