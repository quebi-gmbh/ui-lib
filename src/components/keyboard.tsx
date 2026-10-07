"use client"

import { Keyboard as KeyboardPrimitive } from "react-aria-components"
import { cn } from "@/lib/utils"

/**
 * Keyboard — quebi design system
 *
 * Renders a keyboard shortcut hint (`<kbd>`) inside menu items, buttons, and
 * tooltips. Mono in the subtle ink, so it sits quietly next to the label.
 * Hidden below `lg` so it never crowds compact layouts. Inherits state from a
 * `group` parent (hover/focus/disabled).
 */
export function Keyboard({
  className,
  ...props
}: React.ComponentProps<typeof KeyboardPrimitive>) {
  return (
    <KeyboardPrimitive
      data-slot="keyboard"
      className={cn(
        "hidden font-mono text-quebi-caption text-quebi-fg-subtle",
        "group-hover:text-quebi-fg group-focus:text-quebi-fg group-disabled:opacity-45",
        "lg:inline forced-colors:group-focus:text-[HighlightText]",
        className,
      )}
      {...props}
    />
  )
}

/**
 * Kbd — a single keyboard key glyph: a square hairline box around mono type.
 *
 * Use inside `Keyboard` (or standalone) to render individual keys.
 */
export function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center px-1.5",
        "border border-quebi-hairline",
        "font-mono text-quebi-label leading-none tracking-normal text-quebi-fg-muted",
        className,
      )}
      {...props}
    />
  )
}
