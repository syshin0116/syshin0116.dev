"use client"

import { blogPath } from "@/lib/blog-permalinks"

import { useState, useRef, useEffect, useId } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { getBlogSlug } from "@/lib/blog-path"
import type { FileTreeNode } from "nuartz"

interface NavSidebarProps {
  tree: FileTreeNode[]
}

export function NavSidebar({ tree }: NavSidebarProps) {
  const pathname = usePathname()
  const currentSlug = getBlogSlug(pathname)

  return (
    <nav aria-label="블로그 탐색" className="space-y-0.5 text-sm">
      <Link
        href="/blog"
        aria-current={pathname === "/blog" ? "page" : undefined}
        className={cn(
          "flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted",
          pathname === "/blog"
            ? "bg-muted font-semibold text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <span className="min-w-0 flex-1 truncate">전체 글</span>
      </Link>
      <div className="mt-2 space-y-0.5">
        {tree.map((node) => (
          <NavNode key={node.path} node={node} currentSlug={currentSlug} depth={0} />
        ))}
      </div>
    </nav>
  )
}

function Collapse({ id, open, children }: { id: string; open: boolean; children: React.ReactNode }) {
  return <div id={id} hidden={!open} inert={!open}>{children}</div>
}

function NavNode({
  node,
  currentSlug,
  depth,
}: {
  node: FileTreeNode
  currentSlug: string
  depth: number
}) {
  const isActive = node.type === "file" && currentSlug === node.path
  const isAncestor = node.type === "folder" && (currentSlug === node.path || currentSlug.startsWith(node.path + "/"))
  const [open, setOpen] = useState(isAncestor)
  const reactId = useId().replaceAll(":", "")
  const childrenId = `blog-tree-children-${reactId}`
  const indent = depth * 12
  const activeRef = useRef<HTMLAnchorElement>(null)
  useEffect(() => { if (isAncestor) setOpen(true) }, [isAncestor])
  useEffect(() => { if (isActive) activeRef.current?.scrollIntoView({ block: "nearest" }) }, [isActive])

  if (node.type === "folder") {
    return (
      <div>
        <div
          className="flex w-full items-center gap-1 transition-colors"
          style={{ paddingLeft: `${indent}px` }}
        >
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls={childrenId}
            aria-label={`${node.name} ${open ? "접기" : "펼치기"}`}
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring cursor-pointer"
          >
            <ChevronRight
              aria-hidden="true"
              className={cn(
                "h-3 w-3 shrink-0 transition-transform duration-200",
                open && "rotate-90"
              )}
            />
          </button>
          <Link
            href={blogPath(node.path)}
            className={cn(
              "flex-1 min-w-0 py-1.5 text-xs font-semibold uppercase tracking-wider truncate",
              isAncestor
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {node.name}
          </Link>
        </div>

        <Collapse id={childrenId} open={open}>
          {node.children && (
            <div className="space-y-0.5">
              {node.children.map((child) => (
                <NavNode
                  key={child.path}
                  node={child}
                  currentSlug={currentSlug}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </Collapse>
      </div>
    )
  }

  return (
    <Link
      ref={activeRef}
      href={blogPath(node.path)}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-2 rounded-md py-1.5 pr-2 transition-colors hover:bg-muted",
        isActive
          ? "bg-muted font-semibold text-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
      style={{ paddingLeft: `${32 + indent}px` }}
      title={node.name}
    >
      <span className="min-w-0 flex-1 truncate">{node.name}</span>
    </Link>
  )
}
