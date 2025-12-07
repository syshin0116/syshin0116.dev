"use client";

import * as React from "react";
import Link from "next/link";
import { Book, Menu, Sunset, Trees } from "lucide-react";
import { FaGithub } from "react-icons/fa";

import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/theme-toggle";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const projects: { title: string; href: string; description: string; icon: React.ReactNode }[] = [
  {
    title: "SK PharmaAIX MR Assistant",
    href: "/projects#sk-pharmaaix",
    description: "제약 영업 지원 AI 챗봇 (AI 파트 리드)",
    icon: <Book className="size-5 shrink-0" />,
  },
  {
    title: "한국자동차연구원 AI 에이전트",
    href: "/projects#katech-ai-agent",
    description: "자동차 분야 특화 AI Agent (풀스택 개발 & PL)",
    icon: <Trees className="size-5 shrink-0" />,
  },
  {
    title: "View All Projects",
    href: "/projects",
    description: "모든 프로젝트 보기",
    icon: <Sunset className="size-5 shrink-0" />,
  },
];

export default function Navbar() {
  return (
    <section className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop Menu */}
        <nav className="hidden items-center lg:flex relative">
          {/* Logo - Left */}
          <div className="flex-1">
            <Link href="/" className="flex items-center gap-2">
              <img
                src="/logo.png"
                className="max-h-8"
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
                  <NavigationMenuTrigger>Projects</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4">
                      {projects.map((project) => (
                        <ListItem
                          key={project.title}
                          title={project.title}
                          href={project.href}
                          icon={project.icon}
                        >
                          {project.description}
                        </ListItem>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    asChild
                    className={navigationMenuTriggerStyle()}
                  >
                    <Link href="/blog">Blog</Link>
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
              <img
                src="/logo.png"
                className="max-h-8"
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
                      <img
                        src="/logo.png"
                        className="max-h-8"
                        alt="logo"
                      />
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-6 p-4">
                  <Link href="/" className="text-md font-semibold">
                    Home
                  </Link>
                  <Accordion
                    type="single"
                    collapsible
                    className="flex w-full flex-col gap-4"
                  >
                    <AccordionItem value="projects" className="border-b-0">
                      <AccordionTrigger className="text-md py-0 font-semibold hover:no-underline">
                        Projects
                      </AccordionTrigger>
                      <AccordionContent className="mt-2">
                        {projects.map((project) => (
                          <Link
                            key={project.title}
                            href={project.href}
                            className="hover:bg-muted hover:text-accent-foreground flex select-none flex-row gap-4 rounded-md p-3 leading-none no-underline outline-none transition-colors"
                          >
                            <div className="text-foreground">{project.icon}</div>
                            <div>
                              <div className="text-sm font-semibold">
                                {project.title}
                              </div>
                              <p className="text-muted-foreground text-sm leading-snug">
                                {project.description}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  <Link href="/blog" className="text-md font-semibold">
                    Blog
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

function ListItem({
  title,
  children,
  href,
  icon,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & {
  href: string;
  icon?: React.ReactNode;
}) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
        >
          <div className="flex items-start gap-4">
            {icon && <div className="mt-1 text-foreground">{icon}</div>}
            <div className="flex-1">
              <div className="text-sm font-medium leading-none">{title}</div>
              <p className="text-muted-foreground line-clamp-2 text-sm leading-snug mt-1">
                {children}
              </p>
            </div>
          </div>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}
