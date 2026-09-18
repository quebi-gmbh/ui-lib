"use client"

import {
  ColorThumb as ColorThumbPrimitive,
  type ColorThumbProps,
  composeRenderProps,
} from "react-aria-components"
import { cn } from "@/lib/utils"

/**
 * ColorThumb — quebi design system
 *
 * The draggable handle inside a ColorArea or a ColorWheel. Built on
 * react-aria-components. The thumb's ring and border use quebi tokens; its fill
 * is the picked color (user data) and is left untouched. Focus grows the thumb
 * and adds the quebi teal ring; dragging keeps the picked color visible.
 *
 * It is a slot, not only a fixture: `ColorArea` renders its `children` and falls
 * back to this thumb, so styling the handle means passing one of these with a
 * `className` rather than reaching past the area. A thumb nested in an area wants
 * `disabled:opacity-100` — the area's own `disabled:opacity-50` already covers
 * its subtree, and the two compound to a quarter.
 *
 * `ColorSlider` does *not* use this component: its track is 1.5rem tall, so its
 * handle is the smaller `ColorSliderThumb` declared beside it.
 */
export function ColorThumb({ className, ...props }: ColorThumbProps) {
  return (
    <ColorThumbPrimitive
      {...props}
      className={composeRenderProps(className, (resolved) =>
        cn(
          "top-[50%] left-[50%] size-6 rounded-full border-2 border-white",
          "shadow-quebi-glow ring-1 ring-quebi-line/30",
          "transition-[width,height] duration-150",
          "focus-visible:size-8 focus-visible:ring-2 focus-visible:ring-quebi-brand-mark",
          "disabled:opacity-50 disabled:forced-colors:border-[GrayText] disabled:forced-colors:bg-[GrayText]",
          "forced-colors:border-[ButtonBorder]",
          resolved,
        ),
      )}
    />
  )
}
