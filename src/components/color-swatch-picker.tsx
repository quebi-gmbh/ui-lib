"use client"

import {
  ColorSwatchPicker as ColorSwatchPickerPrimitive,
  type ColorSwatchPickerItemProps,
  ColorSwatchPickerItem as ColorSwatchPickerItemPrimitive,
  type ColorSwatchPickerProps,
} from "react-aria-components"
import { cn } from "@/lib/utils"

/**
 * ColorSwatchPicker — quebi design system
 *
 * Built on react-aria-components. A wrapping grid of selectable color swatches.
 * The selected swatch gets a quebi-brand ring plus a small dot marker; focus
 * uses the quebi teal ring. Self-contained: render a ColorSwatch (from
 * react-aria-components) inside each item.
 */
export function ColorSwatchPicker({ className, ...props }: ColorSwatchPickerProps) {
  return (
    <ColorSwatchPickerPrimitive
      data-slot="control"
      className={cn("flex flex-wrap gap-2", className)}
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
      className={cn(
        "group relative rounded-quebi-sm outline-hidden",
        "*:rounded-quebi-sm",
        "transition-opacity duration-150",
        "data-[selected]:ring-2 data-[selected]:ring-quebi-brand data-[selected]:ring-offset-2 data-[selected]:ring-offset-quebi-bg",
        "data-[focus-visible]:ring-2 data-[focus-visible]:ring-quebi-brand/50 data-[focus-visible]:ring-offset-2 data-[focus-visible]:ring-offset-quebi-bg",
        "hover:opacity-90",
        "data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed",
        className,
      )}
      {...props}
    >
      {(values) => (
        <>
          {values.isSelected && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-white/80 shadow-quebi-glow"
            />
          )}
          {typeof children === "function" ? children(values) : children}
        </>
      )}
    </ColorSwatchPickerItemPrimitive>
  )
}
