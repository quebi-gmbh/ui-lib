"use client"

import { use } from "react"
import {
  composeRenderProps,
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
 * Built on react-aria-components. A 2px `hairline` track, an `action` ink fill
 * and a round ink thumb — no shadow, no border. Supports single and range
 * values, horizontal and vertical orientations, an optional value output, and
 * disabled state. Focus is the outward ring on the thumb.
 *
 * The slider's length along its own axis is a default, not a fixture: a
 * horizontal slider fills its container and a vertical one is 12rem tall until
 * `className` says otherwise (`w-72`, `h-64`, `h-full`). The other axis is the
 * track's 2px thickness, which the component owns; a transparent `before:`
 * band widens what a pointer can hit to 18px without drawing anything.
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

export function Slider({ className, orientation = "horizontal", ...props }: SliderProps) {
  const isVertical = orientation === "vertical"
  return (
    <SliderPrimitive
      data-slot="control"
      orientation={orientation}
      className={composeRenderProps(className, (resolved) =>
        cn(
          "group relative flex touch-none select-none flex-col disabled:opacity-50",
          "orientation-horizontal:min-w-fit orientation-horizontal:gap-y-2",
          "orientation-vertical:min-h-fit orientation-vertical:items-center orientation-vertical:gap-y-2",
          // The slider's length along its own axis is the one thing a consumer
          // always sets — `<Slider className="w-72">`, `<Slider
          // orientation="vertical" className="h-48">` — so the default has to be
          // a plain utility that tailwind-merge can drop. Written as an
          // `orientation-*:` variant it compiles to
          // `.orientation-vertical\:h-full[data-orientation="vertical"]`, which
          // tailwind-merge keeps (different group) and CSS then resolves in the
          // variant's favour at specificity (0,2,0) against a bare `.h-48`. The
          // consumer's class lost silently, and for vertical it lost to
          // `height: 100%` of an auto-height parent: the track is `flex-1`, so
          // the whole slider collapsed to the thumb. Picking the class off the
          // prop instead keeps both axes overridable.
          isVertical ? "h-48 w-fit" : "w-full",
          resolved,
        ),
      )}
      {...props}
    />
  )
}

export function SliderOutput({ className, ...props }: SliderOutputProps) {
  return (
    <SliderOutputPrimitive
      data-slot="label"
      className={composeRenderProps(className, (resolved) =>
        cn("font-mono text-quebi-caption text-quebi-fg-subtle tabular-nums", resolved),
      )}
      {...props}
    />
  )
}

export function SliderThumb({ className, ...props }: SliderThumbProps) {
  return (
    <SliderThumbPrimitive
      data-slot="indicator"
      className={composeRenderProps(className, (resolved) =>
        cn(
          "top-1/2 left-1/2 size-4 rounded-full bg-quebi-action outline-hidden",
          "transition-[width,height] duration-150",
          "data-[focus-visible]:ring-2 data-[focus-visible]:ring-quebi-focus data-[focus-visible]:ring-offset-3 data-[focus-visible]:ring-offset-quebi-bg",
          "data-[dragging]:scale-110 data-[disabled]:opacity-60",
          resolved,
        ),
      )}
      {...props}
    />
  )
}

export function SliderTrack({ className, children, ...props }: SliderTrackProps) {
  return (
    <SliderTrackPrimitive
      // The element the field stack treats as this field's control: a slider's
      // label points at the track, not at the `Slider` root that holds the
      // label too. See `fieldStackStyles` in `field.tsx`.
      data-slot="control"
      className={composeRenderProps(className, (resolved) =>
        cn(
          "group/track relative cursor-default bg-quebi-hairline",
          "grow group-orientation-horizontal:h-0.5 group-orientation-horizontal:w-full group-orientation-vertical:w-0.5 group-orientation-vertical:flex-1",
          "before:absolute before:content-[''] group-orientation-horizontal:before:inset-x-0 group-orientation-horizontal:before:-inset-y-2 group-orientation-vertical:before:inset-y-0 group-orientation-vertical:before:-inset-x-2",
          "disabled:cursor-default disabled:opacity-60",
          resolved,
        ),
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
      data-slot="slider-fill"
      {...props}
      style={getStyle()}
      className={cn(
        "pointer-events-none absolute bg-quebi-action",
        "group-orientation-horizontal/track:top-0 group-orientation-horizontal/track:h-full",
        "group-orientation-vertical/track:bottom-0 group-orientation-vertical/track:w-full",
        "group-disabled/track:opacity-60",
        className,
      )}
    />
  )
}
