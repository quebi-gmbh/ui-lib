"use client"

import type {
  ColorSliderProps as PrimitiveColorSliderProps,
  SliderOutputProps,
  SliderTrackProps,
} from "react-aria-components"
import { use } from "react"
import {
  ColorSlider as PrimitiveColorSlider,
  ColorThumb,
  composeRenderProps,
  SliderOutput,
  SliderStateContext,
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
 * quebi tokens. Disabled keeps the gradient and mutes it with `opacity-50`.
 *
 * The slider's length along its own axis is a default, not a fixture: a
 * horizontal slider fills its container and a vertical track is 14rem tall
 * until `className` says otherwise. Those defaults are picked off the
 * `orientation` prop rather than written as `orientation-*:` variants, because
 * a variant compiles to `.orientation-horizontal\:w-full[data-orientation=…]`
 * — specificity (0,2,0) against a consumer's bare `.w-64` (0,1,0), which
 * tailwind-merge keeps (different group) and CSS then resolves in the
 * library's favour. The consumer's class loses in silence. Same trap as the
 * one `Slider` fell into (tasks #114, #151). The one variant left is the
 * grid/flex switch, which is not a thing a consumer overrides.
 *
 * A vertical track used to carry `ms-[50%] -translate-x-[50%]` on top of the
 * root's `items-center`. Two centrings do not compose: a 50% inline margin
 * makes the margin box half the root wider than the line it is centred in, so
 * the painted track ended up 6px left of the root and overhanging its edge
 * (measured, task #131). `items-center` alone is exact.
 */
export interface ColorSliderProps extends PrimitiveColorSliderProps {
  /** Optional eyebrow label rendered above the track. */
  label?: React.ReactNode
}

export function ColorSlider({
  className,
  label,
  children,
  orientation = "horizontal",
  ...props
}: ColorSliderProps) {
  return (
    <PrimitiveColorSlider
      data-slot="control"
      orientation={orientation}
      className={composeRenderProps(className, (resolved) =>
        cn(
          "orientation-vertical:flex orientation-horizontal:grid",
          "grid-cols-[1fr_auto] flex-col items-center gap-2",
          // Plain utility, not `orientation-horizontal:w-full` — see the docblock.
          // Vertical gets no width of its own: the track carries the size there,
          // and the root is a bare column around it.
          orientation === "horizontal" && "w-full",
          resolved,
        ),
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
      className={composeRenderProps(className, (resolved) =>
        cn(
          "orientation-vertical:hidden font-medium text-sm text-quebi-fg-muted",
          resolved,
        ),
      )}
      {...props}
    />
  )
}

export function ColorSliderTrack({ className, ...props }: SliderTrackProps) {
  // The orientation react-aria resolved, not one this component was told: the
  // track is exported on its own and composed inside `<ColorSlider>`, so the
  // prop lives on the root. `SliderStateContext` is what `SliderTrack` itself
  // reads, and `ColorSlider` provides it.
  const isVertical = use(SliderStateContext)?.orientation === "vertical"
  return (
    <SliderTrack
      className={composeRenderProps(className, (resolved) =>
        cn(
          // An inset ring rather than a border: react-aria's inline `background`
          // shorthand resets `background-clip` to `border-box`, so a border is
          // composited over the track's own gradient and thins out at the
          // rounded ends. A ring is a box-shadow painted above it (task #127).
          "group col-span-2 rounded-quebi-sm inset-ring-1 inset-ring-quebi-line/10",
          // Plain utilities so a consumer's `h-80` / `w-40` can win — see the
          // docblock on ColorSlider (task #151).
          isVertical ? "h-56 w-6" : "h-6 w-full",
          "disabled:opacity-50 disabled:forced-colors:bg-[GrayText]",
          resolved,
        ),
      )}
      {...props}
      style={({ defaultStyle }) => ({
        ...defaultStyle,
        background: `${defaultStyle.background}, repeating-conic-gradient(#262b30 0% 25%, #1a1e22 0% 50%) 50% / 16px 16px`,
      })}
    />
  )
}

export function ColorSliderThumb({ className }: { className?: string }) {
  return (
    <ColorThumb
      className={cn(
        // Both axes, always. react-aria inlines a percentage on the *main*
        // axis only (`left` when horizontal, `top` when vertical) and leaves
        // the cross axis to the class list; `translate(-50%, -50%)` then
        // centres the thumb on that point. With `left-[50%]` missing, a
        // vertical thumb fell back to `left: auto` and landed on the track's
        // start edge (task #131). This matches the shared ColorThumb.
        "top-[50%] left-[50%] size-5 rounded-full border-2 border-white",
        "shadow-quebi-glow transition-[box-shadow] duration-150",
        "data-[focus-visible]:ring-2 data-[focus-visible]:ring-quebi-brand-mark data-[focus-visible]:ring-offset-2 data-[focus-visible]:ring-offset-quebi-bg",
        "data-[dragging]:scale-110",
        className,
      )}
    />
  )
}
