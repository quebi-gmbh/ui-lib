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
 * Styled with the signature quebi hairline border color.
 */
export function Separator({ orientation = "horizontal", className, ...props }: SeparatorProps) {
  return (
    <SeparatorPrimitive
      className={cn(
        "shrink-0 border-0 bg-cyan-500/10 forced-colors:bg-[ButtonBorder]",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      {...props}
    />
  )
}
