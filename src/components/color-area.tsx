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
 *
 * Disabled keeps the gradient and mutes it with `opacity-50`: a color surface
 * with the color taken out is an empty box, not a state. react-aria puts the
 * gradient on `style` itself, so there is no `style` prop here to delete it.
 */
export function ColorArea({ className, ...props }: ColorAreaProps) {
  return (
    <ColorAreaPrimitive
      {...props}
      data-slot="color-area"
      className={cn(
        "size-56 shrink-0 rounded-quebi-md border border-quebi-line/10",
        "disabled:opacity-50 disabled:forced-colors:bg-[GrayText]",
        className,
      )}
    >
      {/* The thumb is inside the surface, so the area's opacity already dims it;
          its own `disabled:opacity-50` would compound to a quarter. */}
      <ColorThumb className="disabled:opacity-100" />
    </ColorAreaPrimitive>
  )
}
