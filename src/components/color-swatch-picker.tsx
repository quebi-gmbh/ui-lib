"use client"

import {
  ColorSwatchPicker as ColorSwatchPickerPrimitive,
  type ColorSwatchPickerItemProps,
  ColorSwatchPickerItem as ColorSwatchPickerItemPrimitive,
  type ColorSwatchPickerProps,
  composeRenderProps,
} from "react-aria-components"
import { cn } from "@/lib/utils"

/**
 * ColorSwatchPicker — quebi design system
 *
 * Built on react-aria-components. A wrapping grid of selectable color swatches.
 *
 * Selection is marked with a halo, not with a hue: a ring in the foreground
 * token, separated from the swatch by an offset ring in the page colour. Both
 * tokens flip with the theme, so the mark reads over amber, over mint and over
 * white alike — a fixed brand-mint ring did not, and around a teal swatch it
 * disappeared altogether (task #133). Focus keeps the library-wide quebi mint
 * ring, so the two states differ by hue rather than by opacity.
 *
 * There is no dot inside the swatch any more: it was painted `bg-white/80`
 * whatever the swatch under it, which is invisible on a white or pale one. The
 * halo is outside the colour, so it never has that problem.
 *
 * Self-contained: render a ColorSwatch (from react-aria-components) inside
 * each item.
 */
export function ColorSwatchPicker({ className, ...props }: ColorSwatchPickerProps) {
  return (
    <ColorSwatchPickerPrimitive
      data-slot="control"
      className={composeRenderProps(className, (resolved) => cn("flex flex-wrap gap-2", resolved))}
      {...props}
    />
  )
}

export function ColorSwatchPickerItem({
  children,
  className,
  ...props
}: ColorSwatchPickerItemProps) {
  return (
    <ColorSwatchPickerItemPrimitive
      data-slot="item"
      className={composeRenderProps(className, (resolved) =>
        cn(
          "group relative rounded-quebi-sm outline-hidden",
          "*:rounded-quebi-sm",
          "transition-opacity duration-150",
          "data-[selected]:ring-2 data-[selected]:ring-quebi-fg data-[selected]:ring-offset-2 data-[selected]:ring-offset-quebi-bg",
          "data-[focus-visible]:ring-2 data-[focus-visible]:ring-quebi-brand-mark data-[focus-visible]:ring-offset-2 data-[focus-visible]:ring-offset-quebi-bg",
          "hover:opacity-90",
          "data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed",
          resolved,
        ),
      )}
      {...props}
    >
      {children}
    </ColorSwatchPickerItemPrimitive>
  )
}
