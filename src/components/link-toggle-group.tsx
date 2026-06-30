"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * LinkToggleGroup — quebi design system
 *
 * A segmented control rendered as a row of anchor links inside a tablist.
 * Use it for view switches that are real navigations (each option has an
 * href) — e.g. day/week/month, or list/board. The active segment lifts onto
 * a teal-tinted surface with a quebi glow; the brand accent marks selection.
 *
 * Self-contained: only `@/lib/utils` and React. No sibling component deps.
 */

export type LinkToggleGroupOption<T extends string = string> = {
  value: T
  label: ReactNode
  href: string
}

export interface LinkToggleGroupProps<T extends string = string> {
  options: LinkToggleGroupOption<T>[]
  current: T
  ariaLabel: string
  className?: string
}

export function LinkToggleGroup<T extends string = string>({
  options,
  current,
  ariaLabel,
  className,
}: LinkToggleGroupProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-1 rounded-quebi-md border border-cyan-500/10 bg-white/[0.02] p-[3px]",
        className,
      )}
    >
      {options.map((opt) => {
        const isActive = current === opt.value
        return (
          <a
            key={opt.value}
            role="tab"
            aria-selected={isActive}
            href={opt.href}
            className={cn(
              "rounded-quebi-sm px-2.5 py-1.5 text-[13px] font-semibold",
              "outline-none transition-colors duration-200",
              "focus-visible:ring-2 focus-visible:ring-quebi-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-quebi-bg",
              isActive
                ? "bg-quebi-brand/15 text-quebi-brand shadow-quebi-glow"
                : "text-quebi-fg-muted hover:text-white",
            )}
          >
            {opt.label}
          </a>
        )
      })}
    </div>
  )
}
