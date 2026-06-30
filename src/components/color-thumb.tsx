"use client"

import { ColorThumb as ColorThumbPrimitive, type ColorThumbProps } from "react-aria-components"
import { cn } from "@/lib/utils"

/**
 * ColorThumb — quebi design system
 *
 * The draggable handle used inside a color area / color wheel / color slider.
 * Built on react-aria-components. The thumb's ring and border use quebi tokens;
 * its fill is the picked color (user data) and is left untouched. Focus grows the
 * thumb and adds the quebi teal ring; dragging keeps the picked color visible.
 */
export function ColorThumb({ className, ...props }: ColorThumbProps) {
  return (
    <ColorThumbPrimitive
      {...props}
      className={cn(
        "top-[50%] left-[50%] size-6 rounded-full border-2 border-white",
        "shadow-quebi-glow ring-1 ring-cyan-500/30",
        "transition-[width,height] duration-150",
        "focus-visible:size-8 focus-visible:ring-2 focus-visible:ring-quebi-brand/50",
        "disabled:opacity-50 disabled:forced-colors:border-[GrayText] disabled:forced-colors:bg-[GrayText]",
        "forced-colors:border-[ButtonBorder]",
        className,
      )}
    />
  )
}
