"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";
import { FaGithub } from "react-icons/fa";

import ExternalLinkIcon from "@/components/ui/external-link-icon";
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

// Removed projects dropdown - too many projects (12+) to display in dropdown

export default function Navbar() {
  return (
    <section className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop Menu */}
        <nav className="hidden items-center lg:flex relative">
          {/* Logo - Left */}
          <div className="flex-1">
            <Link href="/" className="flex items-center gap-2">
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
                    <Link href="/">Home</Link>
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
                    <Link 
                      href="https://syshin0116.github.io" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5"
                    >
                      <span>Blog</span>
                      <ExternalLinkIcon size={14} className="opacity-70" />
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right side Login */}
          <div className="flex-1 flex justify-end items-center gap-2">
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
            <Button
              asChild
              size="sm"
              className="bg-black text-white hover:bg-black/90 dark:bg-black dark:text-white dark:hover:bg-black/90"
            >
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </nav>

        {/* Mobile Menu */}
        <div className="block lg:hidden">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
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
                <Button variant="outline" size="icon">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>
                    <Link href="/" className="flex items-center gap-2">
                      <Image
                        src="/logo.png"
                        width={32}
                        height={32}
                        className="max-h-8 w-auto"
                        alt="logo"
                      />
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-6 p-4">
                  <Link href="/" className="text-md font-semibold">
                    Home
                  </Link>
                  <Link href="/projects" className="text-md font-semibold">
                    Projects
                  </Link>
                  <Link 
                    href="https://syshin0116.github.io" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-md font-semibold inline-flex items-center gap-2"
                  >
                    <span>Blog</span>
                    <ExternalLinkIcon size={16} className="opacity-70" />
                  </Link>

                  <div className="flex flex-col gap-3">
                    <Button
                      asChild
                      className="bg-black text-white hover:bg-black/90 dark:bg-black dark:text-white dark:hover:bg-black/90"
                    >
                      <Link href="/login">Login</Link>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </section>
  );
}

// Removed ListItem component - no longer needed
