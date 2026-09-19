"use client"

import { BookOpen } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export function ReaderModeToggle() {
  const [active, setActive] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("reader-mode")
    if (stored === "true") {
      document.documentElement.classList.add("reader-mode")
      setActive(true)
    }
  }, [])

  const toggle = () => {
    const next = !active
    document.documentElement.classList.toggle("reader-mode", next)
    localStorage.setItem("reader-mode", String(next))
    setActive(next)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      aria-pressed={active}
      className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
    >
      <BookOpen className="size-3.5" aria-hidden="true" />
      {active ? "읽기 모드 끄기" : "읽기 모드"}
    </Button>
  )
}
