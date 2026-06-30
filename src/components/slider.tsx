"use client"

import { use } from "react"
import {
  Slider as SliderPrimitive,
  type SliderProps,
  SliderOutput as SliderOutputPrimitive,
  type SliderOutputProps,
  SliderStateContext,
  SliderThumb as SliderThumbPrimitive,
  type SliderThumbProps,
  SliderTrack as SliderTrackPrimitive,
  type SliderTrackProps,
} from "react-aria-components"
import { cn } from "@/lib/utils"

/**
 * Slider — quebi design system
 *
 * Built on react-aria-components. A slim cyan-tinted track whose filled portion
 * and grab handle use brand teal. Supports single and range values, horizontal
 * and vertical orientations, an optional value output, and disabled state. Focus
 * uses the quebi teal ring.
 */
export function SliderGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="control"
      className={cn("flex items-center gap-x-3 *:data-[slot=icon]:size-5", className)}
      {...props}
    />
  )
}

export function Slider({ className, ...props }: SliderProps) {
  return (
    <SliderPrimitive
      data-slot="control"
      className={cn(
        "group relative flex touch-none select-none flex-col disabled:opacity-50",
        "orientation-horizontal:w-full orientation-horizontal:min-w-fit orientation-horizontal:gap-y-2",
        "orientation-vertical:h-full orientation-vertical:min-h-fit orientation-vertical:w-1.5 orientation-vertical:items-center orientation-vertical:gap-y-2",
        className,
      )}
      {...props}
    />
  )
}

export function SliderOutput({ className, ...props }: SliderOutputProps) {
  return (
    <SliderOutputPrimitive
      data-slot="label"
      className={cn("font-medium text-sm text-white tabular-nums", className)}
      {...props}
    />
  )
}

export function SliderThumb({ className, ...props }: SliderThumbProps) {
  return (
    <SliderThumbPrimitive
      data-slot="indicator"
      className={cn(
        "top-1/2 left-1/2 size-5 rounded-full border border-cyan-500/20 bg-quebi-brand outline-hidden",
        "shadow-quebi-glow transition-[width,height] duration-150",
        "data-[focus-visible]:ring-2 data-[focus-visible]:ring-quebi-brand/50 data-[focus-visible]:ring-offset-2 data-[focus-visible]:ring-offset-quebi-bg",
        "data-[dragging]:scale-110 data-[disabled]:opacity-60",
        className,
      )}
      {...props}
    />
  )
}

export function SliderTrack({ className, children, ...props }: SliderTrackProps) {
  return (
    <SliderTrackPrimitive
      className={cn(
        "group/track relative cursor-default rounded-full bg-cyan-500/10",
        "grow group-orientation-horizontal:h-1.5 group-orientation-horizontal:w-full group-orientation-vertical:w-1.5 group-orientation-vertical:flex-1",
        "disabled:cursor-default disabled:opacity-60",
        className,
      )}
      {...props}
    >
      {(values) => (
        <>
          {typeof children === "function"
            ? children(values)
            : (children ?? (
                <>
                  <SliderFill />
                  <SliderThumb />
                </>
              ))}
        </>
      )}
    </SliderTrackPrimitive>
  )
}

export function SliderFill({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const state = use(SliderStateContext)
  const { orientation, getThumbPercent, values } = state || {}

  const getStyle = () => {
    const percent0 = getThumbPercent ? getThumbPercent(0) * 100 : 0
    const percent1 = getThumbPercent ? getThumbPercent(1) * 100 : 0

    if (values?.length === 1) {
      return orientation === "horizontal" ? { width: `${percent0}%` } : { height: `${percent0}%` }
    }

    return orientation === "horizontal"
      ? {
          left: `${percent0}%`,
          width: `${Math.abs(percent0 - percent1)}%`,
        }
      : {
          bottom: `${percent0}%`,
          height: `${Math.abs(percent0 - percent1)}%`,
        }
  }

  return (
    <div
      {...props}
      style={getStyle()}
      className={cn(
        "pointer-events-none absolute rounded-full bg-quebi-brand",
        "group-orientation-horizontal/track:top-0 group-orientation-horizontal/track:h-full",
        "group-orientation-vertical/track:bottom-0 group-orientation-vertical/track:w-full",
        "group-disabled/track:opacity-60",
        className,
      )}
    />
  )
}
