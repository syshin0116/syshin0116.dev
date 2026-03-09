"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/theme-toggle";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import UserMenu from "@/components/auth/UserMenu";

// Removed projects dropdown - too many projects (12+) to display in dropdown

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  const handleHomeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    // If already on home page, reset the chat by adding reset parameter
    if (pathname === '/') {
      router.push('/?reset=true');
    } else {
      router.push('/');
    }
  };

  return (
    <section className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4">
      {/* Desktop Menu */}
      <div className="container mx-auto hidden px-4 sm:px-6 lg:px-8 lg:block">
        <nav className="flex items-center relative">
          {/* Logo - Left */}
          <div className="flex-1">
            <Link href="/" onClick={handleHomeClick} className="flex items-center gap-2">
              <Image
                src="/logo.png"
                width={32}
                height={32}
                className="max-h-8 w-auto"
                alt="logo"
              />
              <span className="text-lg font-semibold tracking-tighter">
                Syshin0116
              </span>
            </Link>
          </div>

          {/* Centered Menu */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    asChild
                    className={navigationMenuTriggerStyle()}
                  >
                    <Link href="/" onClick={handleHomeClick}>Home</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    asChild
                    className={navigationMenuTriggerStyle()}
                  >
                    <Link href="/blog">Blog</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    asChild
                    className={navigationMenuTriggerStyle()}
                  >
                    <Link href="/projects">Projects</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    asChild
                    className={navigationMenuTriggerStyle()}
                  >
                    <Link href="/about">About</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right side */}
          <div className="flex-1 flex justify-end items-center gap-2">
            {pathname.startsWith("/blog") && (
              <button
                onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }))}
                className="hidden sm:flex items-center gap-1 rounded-md border bg-muted px-3 py-1.5 text-sm text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors select-none"
              >
                <Search className="h-3.5 w-3.5 mr-1" />
                Search
                <kbd className="ml-2 text-xs opacity-60">⌘K</kbd>
              </button>
            )}
            <Button
              asChild
              variant="ghost"
              size="icon"
            >
              <Link href="https://github.com/syshin0116" target="_blank" rel="noopener noreferrer">
                <FaGithub className="h-5 w-5" />
              </Link>
            </Button>
            <ThemeToggle />
            {!loading && (
              user ? (
                <UserMenu />
              ) : (
                <Button
                  asChild
                  size="sm"
                  className="bg-black text-white hover:bg-black/90 dark:bg-black dark:text-white dark:hover:bg-black/90"
                >
                  <Link href="/login">Login</Link>
                </Button>
              )
            )}
          </div>
        </nav>

      </div>

      {/* Mobile Menu */}
      <div className="block px-6 lg:hidden">
          <div className="flex w-full items-center justify-between">
            {/* Logo */}
            <Link href="/" onClick={handleHomeClick} className="flex items-center gap-2">
              <Image
                src="/logo.png"
                width={32}
                height={32}
                className="max-h-8 w-auto"
                alt="logo"
              />
            </Link>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" suppressHydrationWarning>
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="top" className="px-0 pt-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Navigation</SheetTitle>
                </SheetHeader>
                {/* Logo row — same px as navbar to align visually */}
                <div className="flex items-center px-4 sm:px-6 py-4">
                  <Link href="/" onClick={handleHomeClick} className="flex items-center gap-2">
                    <Image
                      src="/logo.png"
                      width={32}
                      height={32}
                      className="max-h-8 w-auto"
                      alt="logo"
                    />
                    <span className="text-lg font-semibold tracking-tighter">
                      Syshin0116
                    </span>
                  </Link>
                </div>

                <div className="flex flex-col gap-4 px-4 pb-6">
                  {/* Nav Links */}
                  <nav className="flex flex-col gap-1">
                    {[
                      { href: "/", label: "Home", onClick: handleHomeClick },
                      { href: "/blog", label: "Blog" },
                      { href: "/projects", label: "Projects" },
                      { href: "/about", label: "About" },
                    ].map(({ href, label, onClick }) => {
                      const isActive =
                        href === "/"
                          ? pathname === "/"
                          : pathname.startsWith(href);
                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={onClick}
                          className={`rounded-md px-3 py-2 text-base transition-colors ${
                            isActive
                              ? "font-semibold text-foreground bg-accent"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                          }`}
                        >
                          {label}
                        </Link>
                      );
                    })}
                  </nav>

                  <Separator />

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button asChild variant="ghost" size="icon">
                      <Link href="https://github.com/syshin0116" target="_blank" rel="noopener noreferrer">
                        <FaGithub className="h-5 w-5" />
                      </Link>
                    </Button>
                    <ThemeToggle />
                    {pathname.startsWith("/blog") && (
                      <button
                        onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }))}
                        className="flex items-center gap-1 rounded-md border bg-muted px-3 py-1.5 text-sm text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors select-none"
                      >
                        <Search className="h-3.5 w-3.5 mr-1" />
                        Search
                      </button>
                    )}
                  </div>

                  {/* Login / User */}
                  <div className="flex flex-col gap-3">
                    {!loading && (
                      user ? (
                        <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                          <UserMenu />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0]}
                            </span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                          </div>
                        </div>
                      ) : (
                        <Button
                          asChild
                          className="bg-black text-white hover:bg-black/90 dark:bg-black dark:text-white dark:hover:bg-black/90"
                        >
                          <Link href="/login">Login</Link>
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
    </section>
  );
}

// Removed ListItem component - no longer needed
