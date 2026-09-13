import { NextResponse } from "next/server";

export function GET() {
  const catalog = {
    linkset: [
      {
        anchor: "https://syshin0116.dev/",
        "service-doc": [
          {
            href: "https://syshin0116.dev/llms.txt",
            type: "text/plain",
          },
        ],
      },
      {
        anchor: "https://syshin0116.dev/blog/api/content/",
        "service-desc": [
          {
            href: "https://syshin0116.dev/blog/api/content/",
            type: "application/json",
          },
        ],
        "service-doc": [
          {
            href: "https://syshin0116.dev/llms.txt",
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
