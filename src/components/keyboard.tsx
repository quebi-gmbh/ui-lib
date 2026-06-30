"use client"

import { Keyboard as KeyboardPrimitive } from "react-aria-components"
import { cn } from "@/lib/utils"

/**
 * Keyboard — quebi design system
 *
 * Renders a keyboard shortcut hint (`<kbd>`) inside menu items, buttons, and
 * tooltips. Muted by default so it sits quietly next to the label; styled with
 * the quebi hairline aesthetic. Hidden below `lg` so it never crowds compact
 * layouts. Inherits state from a `group` parent (hover/focus/disabled).
 */
export function Keyboard({
  className,
  ...props
}: React.ComponentProps<typeof KeyboardPrimitive>) {
  return (
    <KeyboardPrimitive
      data-slot="keyboard"
      className={cn(
        "hidden font-mono text-[0.8rem] text-quebi-fg-muted",
        "group-hover:text-white group-focus:text-white group-focus:opacity-90 group-disabled:opacity-50",
        "lg:inline forced-colors:group-focus:text-[HighlightText]",
        className,
      )}
      {...props}
    />
  )
}

/**
 * Kbd — a single keyboard key glyph, styled with the quebi hairline border.
 *
 * Use inside `Keyboard` (or standalone) to render individual keys with a subtle
 * surface and cyan hairline outline.
 */
export function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center px-1.5",
        "rounded-quebi-sm border border-cyan-500/10 bg-white/[0.03]",
        "font-mono text-[0.7rem] leading-none text-quebi-fg-muted",
        className,
      )}
      {...props}
    />
  )
}
