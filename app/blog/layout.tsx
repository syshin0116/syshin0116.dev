import "katex/dist/katex.min.css"
import { getAllMarkdownFiles, buildFileTree, buildSearchIndex } from "nuartz"
import { NavSidebar } from "@/components/blog/nav-sidebar"
import { MobileNav } from "@/components/blog/mobile-nav"
import { CommandPaletteDynamic } from "@/components/blog/command-palette-dynamic"
import { Navbar } from "@/components/navbar"
import { CONTENT_DIR } from "@/lib/content"

export default async function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const files = await getAllMarkdownFiles(CONTENT_DIR)
  const tree = buildFileTree(files)
  const searchEntries = buildSearchIndex(files)

  return (
    <>
      <Navbar />

      <div
        className="flex flex-1 mx-auto w-full max-w-[1440px]"
        style={{ "--sidebar-width": "16rem", "--toc-width": "14rem" } as React.CSSProperties}
      >
        {/* Mobile file-tree toggle */}
        <div className="lg:hidden fixed bottom-4 left-4 z-30">
          <MobileNav tree={tree} />
        </div>

        {/* Left sidebar — lg+ only */}
        <aside className="hidden lg:block w-[var(--sidebar-width)] shrink-0 sticky top-[73px] self-start h-[calc(100vh-73px)] overflow-y-auto border-r">
          <div className="pl-6 pr-4 pt-4 pb-6">
            <NavSidebar tree={tree} />
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1">
          {children}
        </main>
      </div>

      <CommandPaletteDynamic entries={searchEntries} />
    </>
  )
}
