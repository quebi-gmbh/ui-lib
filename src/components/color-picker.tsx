"use client"

import { use } from "react"
import {
  ColorPicker as ColorPickerPrimitive,
  type ColorPickerProps as ColorPickerPrimitiveProps,
  ColorPickerStateContext,
  parseColor,
} from "react-aria-components"
import { Button } from "@/components/button"
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

const EyeDropper = () => {
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
      className="shrink-0"
      aria-label="Eye dropper"
      size="sq-md"
      intent="outline"
      onPress={() => {
        const eyeDropper = window.EyeDropper ? new window.EyeDropper() : null
        eyeDropper?.open().then((result) => state.setColor(parseColor(result.sRGBHex)))
      }}
    >
      <EyeDropperIcon />
    </Button>
  )
}

export type { ColorPickerProps }
export { ColorPicker, EyeDropper }
