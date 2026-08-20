"use client"

import { useCallback, useRef, useState } from "react"
import { cn } from "@/lib/utils"

/**
 * DaySchedule — quebi design system
 *
 * A vertical 24-hour day axis with named time spans laid out in parallel lanes.
 * Each span can be dragged to move and resized from either end, snapping to a
 * configurable step with a minimum duration. Fully keyboard operable: the bar
 * and both handles expose `role="slider"` with arrow-key adjustment.
 *
 * Spans are minutes from midnight (0–1440), so the component stays free of any
 * date library. Supply `spans` + `onSpansChange` for controlled use, or
 * `defaultSpans` to let it manage its own state.
 */

const DAY_MINUTES = 1440

export type DayScheduleTone = "brand" | "cyan"

export interface DaySpan {
  /** Stable identity — used as the React key and in change callbacks. */
  id: string
  label: string
  /** Minutes from midnight, 0–1440. */
  start: number
  /** Minutes from midnight, 0–1440. Always greater than `start`. */
  end: number
  /** Accent color. Defaults to alternating brand/cyan by lane order. */
  tone?: DayScheduleTone
}

const TONES: Record<DayScheduleTone, { bar: string; node: string }> = {
  brand: {
    bar: "bg-quebi-brand shadow-[0_0_12px_rgb(45_212_168/0.35)]",
    node: "border-quebi-brand",
  },
  cyan: {
    bar: "bg-cyan-500 shadow-[0_0_12px_rgb(6_182_212/0.35)]",
    node: "border-cyan-500",
  },
}

/** `540` → `"09:00"`. */
export function formatDayTime(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = Math.floor(minutes % 60)
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

const toPercent = (minutes: number) => `${((minutes / DAY_MINUTES) * 100).toFixed(4)}%`

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

type DragPart = "body" | "start" | "end"

export interface DayScheduleProps extends Omit<React.ComponentProps<"div">, "onChange"> {
  /** Controlled spans. Pair with `onSpansChange`. */
  spans?: DaySpan[]
  /** Initial spans for uncontrolled use. */
  defaultSpans?: DaySpan[]
  onSpansChange?: (spans: DaySpan[]) => void
  /** Snap increment in minutes. */
  step?: number
  /** Shortest allowed span in minutes. */
  minDuration?: number
  /** Gap between axis labels and gridlines, in minutes. */
  tickInterval?: number
  /** Track height in pixels. */
  height?: number
  /** Horizontal distance between lanes, in pixels. */
  laneGap?: number
  /** Offset of the first lane from the track's left edge, in pixels. */
  laneOffset?: number
  /** Render the rotated start/end time labels beside each span. */
  showTimeLabels?: boolean
  isDisabled?: boolean
  isReadOnly?: boolean
  /** Override how a minute offset is rendered as a time. */
  formatTime?: (minutes: number) => string
}

export function DaySchedule({
  spans: controlledSpans,
  defaultSpans = [],
  onSpansChange,
  step = 15,
  minDuration = 30,
  tickInterval = 120,
  height = 560,
  laneGap = 18,
  laneOffset = 24,
  showTimeLabels = true,
  isDisabled = false,
  isReadOnly = false,
  formatTime = formatDayTime,
  className,
  ...props
}: DayScheduleProps) {
  const [uncontrolled, setUncontrolled] = useState<DaySpan[]>(defaultSpans)
  const isControlled = controlledSpans !== undefined
  const spans = isControlled ? controlledSpans : uncontrolled
  const trackRef = useRef<HTMLDivElement>(null)

  const interactive = !isDisabled && !isReadOnly

  const commit = useCallback(
    (next: DaySpan[]) => {
      if (!isControlled) setUncontrolled(next)
      onSpansChange?.(next)
    },
    [isControlled, onSpansChange],
  )

  // The pointermove listener is attached once per drag, so it would otherwise
  // close over the spans array from the render that started the drag. Reading
  // through a ref keeps every move applied against current state.
  const spansRef = useRef(spans)
  spansRef.current = spans

  /** Apply a start/end delta to one span, honouring snapping and the day bounds. */
  const applyMove = useCallback(
    (index: number, part: DragPart, minute: number, origin: DaySpan) => {
      const next = spansRef.current.map((span, i) => {
        if (i !== index) return span
        if (part === "start") {
          return { ...span, start: clamp(minute, 0, span.end - minDuration) }
        }
        if (part === "end") {
          return { ...span, end: clamp(minute, span.start + minDuration, DAY_MINUTES) }
        }
        const length = origin.end - origin.start
        const start = clamp(minute, 0, DAY_MINUTES - length)
        return { ...span, start, end: start + length }
      })
      commit(next)
    },
    [minDuration, commit],
  )

  const minuteFromClientY = useCallback(
    (clientY: number) => {
      const track = trackRef.current
      if (!track) return 0
      const rect = track.getBoundingClientRect()
      const ratio = clamp((clientY - rect.top) / rect.height, 0, 1)
      return Math.round((ratio * DAY_MINUTES) / step) * step
    },
    [step],
  )

  const startDrag = (
    event: React.PointerEvent<HTMLElement>,
    index: number,
    part: DragPart,
  ) => {
    if (!interactive || event.button !== 0) return
    event.preventDefault()

    const target = event.currentTarget
    const origin = spans[index]
    const grabbedAt = minuteFromClientY(event.clientY)
    target.setPointerCapture(event.pointerId)

    const handleMove = (moveEvent: PointerEvent) => {
      const minute = minuteFromClientY(moveEvent.clientY)
      // Body drags translate by the delta from the grab point so the span does
      // not jump to centre itself under the cursor.
      const value = part === "body" ? origin.start + (minute - grabbedAt) : minute
      applyMove(index, part, value, origin)
    }

    const handleUp = () => {
      target.releasePointerCapture?.(event.pointerId)
      target.removeEventListener("pointermove", handleMove)
      target.removeEventListener("pointerup", handleUp)
      target.removeEventListener("pointercancel", handleUp)
    }

    target.addEventListener("pointermove", handleMove)
    target.addEventListener("pointerup", handleUp)
    target.addEventListener("pointercancel", handleUp)
  }

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLElement>,
    index: number,
    part: DragPart,
  ) => {
    if (!interactive) return
    const span = spans[index]
    // Shift jumps a full tick (an hour at the default interval) for coarse moves.
    const delta = event.shiftKey ? tickInterval : step
    let direction = 0
    if (event.key === "ArrowUp" || event.key === "ArrowLeft") direction = -1
    if (event.key === "ArrowDown" || event.key === "ArrowRight") direction = 1

    if (direction !== 0) {
      event.preventDefault()
      const base = part === "end" ? span.end : span.start
      applyMove(index, part, base + direction * delta, span)
      return
    }

    if (event.key === "Home" || event.key === "End") {
      event.preventDefault()
      const edge = event.key === "Home" ? 0 : DAY_MINUTES
      applyMove(index, part, edge, span)
    }
  }

  const ticks = Math.floor(DAY_MINUTES / tickInterval)
  // Push the name column clear of the widest lane so labels never overlap bars.
  const labelOffset = laneOffset + Math.max(0, spans.length - 1) * laneGap + 28

  return (
    <div
      className={cn(
        "flex w-full gap-2.5 font-sans select-none",
        isDisabled && "pointer-events-none opacity-50",
        className,
      )}
      {...props}
    >
      {/* Hour axis */}
      <div
        className="relative w-10 flex-none border-r border-quebi-line/10"
        style={{ height }}
        aria-hidden="true"
      >
        {Array.from({ length: ticks + 1 }, (_, i) => (
          <div
            key={i}
            className="absolute left-0 -translate-y-1/2 text-[9.5px] text-quebi-fg-subtle tabular-nums"
            style={{ top: toPercent(i * tickInterval) }}
          >
            {i === ticks ? "24:00" : formatTime(i * tickInterval)}
          </div>
        ))}
      </div>

      {/* Span track */}
      <div ref={trackRef} className="relative flex-1" style={{ height }}>
        {Array.from({ length: ticks + 1 }, (_, i) => (
          <div
            key={i}
            aria-hidden="true"
            className="absolute inset-x-0 h-px bg-quebi-line/[0.06]"
            style={{ top: toPercent(i * tickInterval) }}
          />
        ))}

        {spans.map((span, index) => {
          const tone = TONES[span.tone ?? (index % 2 === 0 ? "brand" : "cyan")]
          const lane = `${laneOffset + index * laneGap}px`
          const valueText = `${span.label}, ${formatTime(span.start)} to ${formatTime(span.end)}`

          return (
            <div key={span.id} role="group" aria-label={span.label}>
              {/* Body — drag to move the whole span */}
              <div
                role="slider"
                tabIndex={interactive ? 0 : -1}
                aria-label={`${span.label} span`}
                aria-valuemin={0}
                aria-valuemax={DAY_MINUTES}
                aria-valuenow={span.start}
                aria-valuetext={valueText}
                aria-disabled={isDisabled || undefined}
                aria-readonly={isReadOnly || undefined}
                onPointerDown={(e) => startDrag(e, index, "body")}
                onKeyDown={(e) => handleKeyDown(e, index, "body")}
                className={cn(
                  "absolute w-[5px] -translate-x-1/2 rounded-[3px] outline-hidden",
                  "touch-none transition-shadow duration-150",
                  tone.bar,
                  interactive ? "cursor-grab active:cursor-grabbing" : "cursor-default",
                  "focus-visible:ring-2 focus-visible:ring-quebi-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-quebi-bg",
                )}
                style={{
                  left: lane,
                  top: toPercent(span.start),
                  height: toPercent(span.end - span.start),
                }}
              />

              {/* Start / end handles */}
              {(["start", "end"] as const).map((part) => (
                <div
                  key={part}
                  role="slider"
                  tabIndex={interactive ? 0 : -1}
                  aria-label={`${span.label} ${part} time`}
                  aria-valuemin={0}
                  aria-valuemax={DAY_MINUTES}
                  aria-valuenow={span[part]}
                  aria-valuetext={formatTime(span[part])}
                  aria-disabled={isDisabled || undefined}
                  aria-readonly={isReadOnly || undefined}
                  onPointerDown={(e) => startDrag(e, index, part)}
                  onKeyDown={(e) => handleKeyDown(e, index, part)}
                  className={cn(
                    "absolute size-[11px] -translate-x-1/2 -translate-y-1/2 rounded-full",
                    "border-2 bg-quebi-bg outline-hidden touch-none",
                    "transition-transform duration-150",
                    tone.node,
                    interactive ? "cursor-ns-resize hover:scale-110" : "cursor-default",
                    "focus-visible:ring-2 focus-visible:ring-quebi-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-quebi-bg",
                  )}
                  style={{ left: lane, top: toPercent(span[part]) }}
                />
              ))}

              {/* Name */}
              <div
                className="absolute -translate-y-1/2 whitespace-nowrap text-xs text-quebi-fg-muted"
                style={{
                  left: `${labelOffset}px`,
                  top: toPercent((span.start + span.end) / 2),
                }}
              >
                {span.label}
              </div>

              {/* Rotated edge times */}
              {showTimeLabels && (
                <>
                  <div
                    aria-hidden="true"
                    className="absolute origin-top-left whitespace-nowrap text-[10.5px] text-quebi-fg-muted tabular-nums"
                    style={{
                      left: lane,
                      top: toPercent(span.start),
                      transform: "rotate(-90deg) translate(16px, -50%)",
                    }}
                  >
                    {formatTime(span.start)}
                  </div>
                  <div
                    aria-hidden="true"
                    className="absolute origin-top-left whitespace-nowrap text-[10.5px] text-quebi-fg-muted tabular-nums"
                    style={{
                      left: lane,
                      top: toPercent(span.end),
                      transform: "rotate(-90deg) translate(calc(-100% - 16px), -50%)",
                    }}
                  >
                    {formatTime(span.end)}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
