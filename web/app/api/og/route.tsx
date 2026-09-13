import { ImageResponse } from "next/og"

/**
 * Per-post share card. Next forbids a metadata image route under a catch-all
 * segment, so post pages point `openGraph.images` at this endpoint instead.
 */
export const dynamic = "force-static"

const SIZE = { width: 1200, height: 630 }
const MAX_TITLE_LENGTH = 120

export function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("title") ?? ""
  const title = raw.slice(0, MAX_TITLE_LENGTH) || "Syshin0116 Dev"

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#09090b",
          padding: "80px 100px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: title.length > 40 ? "60px" : "76px",
            fontWeight: 800,
            color: "#ffffff",
            lineHeight: 1.25,
            letterSpacing: "-2px",
          }}
        >
          {title}
        </div>
        <div style={{ display: "flex", fontSize: "32px", color: "#a1a1aa" }}>
          syshin0116.dev
        </div>
      </div>
    ),
    { ...SIZE }
  )
}
