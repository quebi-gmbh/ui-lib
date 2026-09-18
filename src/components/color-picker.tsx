"use client"

import { use } from "react"
import {
  ColorPicker as ColorPickerPrimitive,
  type ColorPickerProps as ColorPickerPrimitiveProps,
  ColorPickerStateContext,
  parseColor,
} from "react-aria-components"
import { Button, type ButtonProps } from "@/components/button"
import { cn } from "@/lib/utils"

/**
 * ColorPicker — quebi design system
 *
 * A thin wrapper around react-aria-components' ColorPicker that lays out the
 * trigger/swatch/inputs in a quebi-styled control row. Compose it with the
 * react-aria color primitives (ColorSwatch, ColorArea, ColorSlider, etc.).
 *
 * The companion EyeDropper uses the browser EyeDropper API (where supported)
 * to sample a color straight onto the picker's state.
 */
interface ColorPickerProps extends ColorPickerPrimitiveProps {
  className?: string
}

const ColorPicker = ({ className, ...props }: ColorPickerProps) => {
  return (
    <div
      data-slot="control"
      className={cn("flex w-fit items-center gap-2", className)}
    >
      <ColorPickerPrimitive {...props} />
    </div>
  )
}

declare global {
  interface Window {
    EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> }
  }
}

const EyeDropperIcon = () => (
  <svg
    data-slot="icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="m2 22 1-1h3l9-9" />
    <path d="M3 21v-3l9-9" />
    <path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3l.4.4Z" />
  </svg>
)

/** Button's square scale, kept in sync with `Button` rather than restated. */
type SquareButtonSize = Extract<NonNullable<ButtonProps["size"]>, `sq-${string}`>

interface EyeDropperProps {
  /**
   * Button's square size. Defaults to `sq-sm` — 38px, which is the field
   * scale's `sm` exactly, so the dropper is the height of the `Input` or
   * `Button` beside it. The old default was `sq-md` (46px), a height no field
   * in this library ships; it overhung a hex input by 4px top and bottom.
   */
  size?: SquareButtonSize
  /** Escape hatch for a row on a height the square scale does not have. */
  className?: string
}

const EyeDropper = ({ size = "sq-sm", className }: EyeDropperProps) => {
  const state = use(ColorPickerStateContext)
  if (!state) throw new Error("EyeDropper must be used within a ColorPicker")

  if (typeof window !== "undefined" && !window.EyeDropper) {
    return (
      <span className="text-[12px] text-quebi-fg-muted">
        EyeDropper is not supported in your browser.
      </span>
    )
  }

  return (
    <Button
      className={cn("shrink-0", className)}
      aria-label="Eye dropper"
      size={size}
      intent="outline"
      onPress={() => {
        const eyeDropper = window.EyeDropper ? new window.EyeDropper() : null
        eyeDropper
          ?.open()
          .then((result) => state.setColor(parseColor(result.sRGBHex)))
          // Dismissing the native eyedropper (Esc, or a click outside it)
          // rejects with AbortError. A cancelled pick is not a failure — left
          // unhandled it was one console error per Esc. Anything else still is.
          .catch((error: unknown) => {
            if (!(error instanceof DOMException && error.name === "AbortError")) throw error
          })
      }}
    >
      <EyeDropperIcon />
    </Button>
  )
}

export type { ColorPickerProps, EyeDropperProps }
export { ColorPicker, EyeDropper }
