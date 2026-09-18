"use client"

import type { ColorSwatchProps } from "react-aria-components"
import { ColorSwatch as ColorSwatchPrimitive, composeRenderProps } from "react-aria-components"
import { cn } from "@/lib/utils"

/**
 * ColorSwatch — quebi design system
 *
 * Built on react-aria-components. Renders a fixed-size square filled with the
 * given color value (the user's color is preserved verbatim). A subtle inset
 * hairline in the quebi line token keeps it against the quebi surface, using a
 * quebi radius.
 *
 * The size is one `size-*` utility and the responsive step is on the variable
 * behind it — 40px, 36px from `sm` up. That is what makes a consumer's
 * `size-8` or `size-full` actually win: tailwind-merge collapses two `size-*`
 * in the same variant group, so the class passed in replaces this one at every
 * breakpoint. Expressed as `size-[calc(…)]` plus `sm:size-(…)` it could not —
 * the `sm:` rule survived the merge and overrode every consumer size above
 * 640px, in silence (task #130).
 */
export function ColorSwatch({ className, ...props }: ColorSwatchProps) {
  return (
    <ColorSwatchPrimitive
      data-slot="color-swatch"
      className={composeRenderProps(className, (resolved) =>
        cn(
          "inset-ring-1 inset-ring-quebi-line/20 size-(--color-swatch-size) shrink-0 rounded-quebi-md [--color-swatch-size:--spacing(10)] sm:[--color-swatch-size:--spacing(9)]",
          resolved,
        ),
      )}
      {...props}
    />
  )
}
