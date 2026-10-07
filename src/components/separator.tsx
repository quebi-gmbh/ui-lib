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
 * Painted in `quebi-hairline`, the same line that runs between rows and under
 * the nav. The token is already translucent, so it takes no opacity modifier.
 */
export function Separator({ orientation = "horizontal", className, ...props }: SeparatorProps) {
  return (
    <SeparatorPrimitive
      className={cn(
        "shrink-0 border-0 bg-quebi-hairline forced-colors:bg-[ButtonBorder]",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      {...props}
    />
  )
}
