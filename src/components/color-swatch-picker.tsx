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
 * Selection is marked with a halo, not with a hue: an ink ring, separated from
 * the swatch by an offset ring in the page colour. Both tokens flip with the
 * theme, so the mark reads over any swatch colour. Focus is the library-wide
 * focus ring in the same place, so a selected swatch that takes focus shows
 * one ring rather than two.
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
          "group relative rounded-(--q-radius-mark) outline-hidden",
          "transition-opacity duration-150",
          "data-[selected]:ring-2 data-[selected]:ring-quebi-fg data-[selected]:ring-offset-2 data-[selected]:ring-offset-quebi-bg",
          "data-[focus-visible]:ring-2 data-[focus-visible]:ring-quebi-focus data-[focus-visible]:ring-offset-2 data-[focus-visible]:ring-offset-quebi-bg",
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
