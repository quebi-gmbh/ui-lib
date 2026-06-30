"use client"

import { ColorArea as ColorAreaPrimitive, type ColorAreaProps } from "react-aria-components"
import { ColorThumb } from "@/components/color-thumb"
import { cn } from "@/lib/utils"

/**
 * ColorArea — quebi design system
 *
 * A two-dimensional gradient surface for picking two color channels at once
 * (e.g. saturation/brightness). Built on react-aria-components. The gradient is
 * the picked color (user data) and is left untouched; only the border and
 * rounding use quebi tokens. The draggable handle is the quebi ColorThumb.
 */
export function ColorArea({ className, ...props }: ColorAreaProps) {
  return (
    <ColorAreaPrimitive
      {...props}
      data-slot="color-area"
      className={cn(
        "size-56 shrink-0 rounded-quebi-md border border-cyan-500/10",
        "disabled:opacity-50 forced-colors:bg-[GrayText]",
        className,
      )}
      style={({ defaultStyle, isDisabled }) => ({
        ...defaultStyle,
        background: isDisabled ? undefined : defaultStyle.background,
      })}
    >
      <ColorThumb />
    </ColorAreaPrimitive>
  )
}
