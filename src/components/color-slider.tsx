"use client"

import type {
  ColorSliderProps as PrimitiveColorSliderProps,
  SliderOutputProps,
  SliderTrackProps,
} from "react-aria-components"
import {
  ColorSlider as PrimitiveColorSlider,
  ColorThumb,
  SliderOutput,
  SliderTrack,
} from "react-aria-components"
import { cn } from "@/lib/utils"

/**
 * ColorSlider — quebi design system
 *
 * Built on react-aria-components. A single-channel color slider (hue,
 * saturation, lightness, alpha, …) with a live gradient track, an optional
 * label/output row, and a self-contained draggable thumb. The gradient track
 * is user data; the chrome (label, output, focus ring, thumb) is restyled to
 * quebi tokens.
 */
export interface ColorSliderProps extends PrimitiveColorSliderProps {
  /** Optional eyebrow label rendered above the track. */
  label?: React.ReactNode
}

export function ColorSlider({ className, label, children, ...props }: ColorSliderProps) {
  return (
    <PrimitiveColorSlider
      data-slot="control"
      className={cn(
        "orientation-vertical:flex orientation-horizontal:grid orientation-horizontal:w-full",
        "grid-cols-[1fr_auto] flex-col items-center gap-2",
        className,
      )}
      {...props}
    >
      {children ?? (
        <>
          {label != null && (
            <span className="quebi-eyebrow orientation-vertical:hidden col-span-2 self-start">
              {label}
            </span>
          )}
          <ColorSliderTrack>
            <ColorSliderThumb />
          </ColorSliderTrack>
          <ColorSliderOutput />
        </>
      )}
    </PrimitiveColorSlider>
  )
}

export function ColorSliderOutput({ className, ...props }: SliderOutputProps) {
  return (
    <SliderOutput
      className={cn(
        "orientation-vertical:hidden font-medium text-sm text-quebi-fg-muted",
        className,
      )}
      {...props}
    />
  )
}

export function ColorSliderTrack({ className, ...props }: SliderTrackProps) {
  return (
    <SliderTrack
      className={cn(
        "group col-span-2 rounded-quebi-sm border border-cyan-500/10",
        "orientation-horizontal:h-6 orientation-horizontal:w-full",
        "orientation-vertical:ms-[50%] orientation-vertical:h-56 orientation-vertical:w-6 orientation-vertical:-translate-x-[50%]",
        "disabled:opacity-50 forced-colors:bg-[GrayText]",
        className,
      )}
      {...props}
      style={({ defaultStyle, isDisabled }) => ({
        ...defaultStyle,
        background: isDisabled
          ? undefined
          : `${defaultStyle.background}, repeating-conic-gradient(#262b30 0% 25%, #1a1e22 0% 50%) 50% / 16px 16px`,
      })}
    />
  )
}

export function ColorSliderThumb({ className }: { className?: string }) {
  return (
    <ColorThumb
      className={cn(
        "top-[50%] size-5 rounded-full border-2 border-white",
        "shadow-quebi-glow transition-[box-shadow] duration-150",
        "data-[focus-visible]:ring-2 data-[focus-visible]:ring-quebi-brand/50 data-[focus-visible]:ring-offset-2 data-[focus-visible]:ring-offset-quebi-bg",
        "data-[dragging]:scale-110",
        className,
      )}
    />
  )
}
