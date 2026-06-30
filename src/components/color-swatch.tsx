"use client"

import type { ColorSwatchProps } from "react-aria-components"
import { ColorSwatch as ColorSwatchPrimitive } from "react-aria-components"
import { cn } from "@/lib/utils"

/**
 * ColorSwatch — quebi design system
 *
 * Built on react-aria-components. Renders a fixed-size square filled with the
 * given color value (the user's color is preserved verbatim). A subtle cyan
 * inset ring keeps it on-brand against the quebi surface, using a quebi radius.
 */
export function ColorSwatch({ className, ...props }: ColorSwatchProps) {
  return (
    <ColorSwatchPrimitive
      data-slot="color-swatch"
      className={cn(
        "inset-ring-1 inset-ring-cyan-500/20 size-[calc(var(--color-swatch-size)+--spacing(1))] shrink-0 rounded-quebi-md [--color-swatch-size:--spacing(9)] sm:size-(--color-swatch-size)",
        className,
      )}
      {...props}
    />
  )
}
