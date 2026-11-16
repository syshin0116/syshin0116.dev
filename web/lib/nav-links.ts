export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/blog/wiki", label: "Wiki" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
] as const

function matches(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

/** The most specific nav link for a path, so a wiki page marks Wiki rather than Blog. */
export function activeNavHref(pathname: string): string | undefined {
  return NAV_LINKS.map(link => link.href)
    .filter(href => matches(pathname, href))
    .sort((a, b) => b.length - a.length)[0]
}
