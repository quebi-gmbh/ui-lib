"use client"

import {
  ColorWheelTrack,
  ColorWheel as PrimitiveColorWheel,
  type ColorWheelProps as PrimitiveColorWheelProps,
} from "react-aria-components"
import { ColorThumb } from "@/components/color-thumb"

/**
 * ColorWheel — quebi design system
 *
 * A circular hue picker built on react-aria-components. The hue gradient on the
 * track is user data (the spectrum) and is left untouched; quebi tokens style
 * the thumb. Drag the thumb around the ring to pick a hue.
 *
 * Disabled keeps the spectrum and mutes it with `opacity-50`, matching ColorArea
 * and ColorSliderTrack: a color surface with the color taken out is an empty
 * ring, not a state.
 */
export interface ColorWheelProps
  extends Omit<PrimitiveColorWheelProps, "outerRadius" | "innerRadius"> {}

export function ColorWheel(props: ColorWheelProps) {
  return (
    <PrimitiveColorWheel {...props} outerRadius={100} innerRadius={74}>
      <ColorWheelTrack
        className="disabled:opacity-50 disabled:forced-colors:bg-[GrayText]"
        style={({ defaultStyle }) => ({
          ...defaultStyle,
          background: `${defaultStyle.background}, repeating-conic-gradient(#CCC 0% 25%, white 0% 50%) 50% / 16px 16px`,
        })}
      />
      <ColorThumb />
    </PrimitiveColorWheel>
  )
}
