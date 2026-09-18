"use client"

import { Separator as SeparatorPrimitive, type SeparatorProps } from "react-aria-components"
import { cn } from "@/lib/utils"

/**
 * Separator — quebi design system
 *
 * A thin divider line that visually splits content. Renders horizontally
 * (full width) or vertically (full height). Built on react-aria-components
 * so it carries the correct separator semantics.
 *
 * Painted in the `quebi-line` hairline token, not raw cyan — `--q-line` flips to
 * ink under `.light`, where cyan at low alpha is all but invisible on the
 * surface. At `/20` rather than `/10` because the line *is* the component:
 * `/10` renders 1.24:1 against a light Card, `/20` 1.54:1. On dark `--q-line`
 * is cyan-500, so this reads as one step more present than before.
 */
export function Separator({ orientation = "horizontal", className, ...props }: SeparatorProps) {
  return (
    <SeparatorPrimitive
      className={cn(
        "shrink-0 border-0 bg-quebi-line/20 forced-colors:bg-[ButtonBorder]",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      {...props}
    />
  )
}
