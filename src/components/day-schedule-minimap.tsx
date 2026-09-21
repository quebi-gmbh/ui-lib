"use client"

import { useCallback, useLayoutEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

/**
 * DayScheduleMinimap — quebi design system
 *
 * A narrow strip beside a zoomed DaySchedule's viewport that replaces its
 * scrollbar. It shows the whole 24-hour day at once — one line per span, plus a
 * rectangle marking the slice the viewport currently shows — and click or drag
 * anywhere on it scrolls there.
 *
 * It is a scrollbar, so it is `aria-hidden` and has no tab stop: every span in
 * the schedule is already reachable by Tab and drags the viewport along with
 * it. A focusable thumb would need a name and arrow keys of its own, and those
 * arrow keys would fight the sliders' — all for a duplicate of something the
 * keyboard can already do.
 *
 * Layers, back to front: hour rules → span lines → the viewport rectangle.
 *
 * Everything vertical is `minute / 1440`, the same arithmetic the schedule
 * itself uses minus the zoom: the map is always the whole day, never the
 * window. Everything horizontal is the lane grid below, which is the part worth
 * reading before changing.
 */

const DAY_MINUTES = 1440

/**
 * How thick one span's line is, in pixels — a constant, never a share of the
 * width.
 *
 * Dividing the width by the span count looks like the obvious answer and is the
 * wrong one twice over. The same appointment would be fat on a quiet day and a
 * thread on a busy one, so two days stop being comparable at a glance; and
 * below about 3px a line stops separating anything from its neighbour, which is
 * the only job it has here.
 */
export const MINIMAP_BAR_PX = 5
/** Between two lines. Enough to read them apart, not enough to spend width on. */
const MINIMAP_GAP_PX = 1.5
/** Between the outermost line and the strip's inner edge. */
const MINIMAP_EDGE_PX = 1

/** A five-minute span is a third of a pixel tall. This is what keeps it visible. */
const MINIMAP_MIN_LINE_PX = 3

/**
 * The corner radius of the viewport rectangle when it is nowhere near an edge.
 * See `rectRadius` for the case that matters.
 */
const MINIMAP_RECT_MIN_RADIUS_PX = 2

/**
 * What the strip measures before it has been measured — its rendered width at
 * the default `w-9` (36px) less the 1px border on each side.
 *
 * The real number comes from `clientWidth`, so the grid follows the width class
 * rather than a second copy of it. But the site is prerendered and a measured
 * value is absent from the HTML, so the first paint needs an answer: this is
 * the right one for the default, and one frame stale for anything else.
 */
const MINIMAP_FALLBACK_INNER_WIDTH_PX = 34
/** `rounded-quebi-sm` (8px) less that same 1px border. Same reasoning. */
const MINIMAP_FALLBACK_INNER_RADIUS_PX = 7

/**
 * Where an hour rule is drawn. Midnight and 24:00 are missing on purpose: they
 * are the strip's own top and bottom border, and a hairline underneath one is a
 * hairline nobody sees.
 */
const MINIMAP_RULE_MINUTES = [360, 720, 1080]

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const toPercent = (minutes: number) => `${((minutes / DAY_MINUTES) * 100).toFixed(4)}%`

/**
 * Which lane belongs in the middle of the strip: the fractional *rank* of
 * `minute` among the ascending start times.
 *
 * Rank, not clock. Eight spans starting inside one hour have to move the grid
 * eight lanes as that hour passes, and an empty afternoon has to move it barely
 * at all — a clock-linear number pans straight past everything there is to see
 * and spends the rest of the day drifting over nothing.
 *
 * Continuous in `minute`, so the grid glides rather than stepping; equal starts
 * share a lane; an empty day is lane 0.
 */
export function minimapLaneAtMinute(sortedStarts: readonly number[], minute: number): number {
  const last = sortedStarts.length - 1
  if (last < 0) return 0
  if (minute <= sortedStarts[0]) return 0
  if (minute >= sortedStarts[last]) return last
  let index = 0
  while (index < last && sortedStarts[index + 1] <= minute) index++
  const from = sortedStarts[index]
  const to = sortedStarts[index + 1]
  return to > from ? index + (minute - from) / (to - from) : index
}

export interface MinimapLane {
  /** Pixels from the strip's inner left edge. */
  left: number
  width: number
}

export interface MinimapLanesOptions {
  /** How many lanes — one per span. */
  count: number
  /** The strip's inner width in pixels, border excluded. */
  innerWidthPx: number
  /** The lane to put in the middle, from `minimapLaneAtMinute`. */
  centerLane?: number
  barPx?: number
  gapPx?: number
  edgePx?: number
}

/**
 * Where each lane's line is drawn, left to right, with the ride.
 *
 * Thirty-four pixels hold six lines, and a day can easily have twenty. What
 * does not fit sideways is *ridden*, not squeezed: the strip shows the section
 * of the lane grid belonging to the hours on screen, so scrolling down slides
 * that section across the grid and each line rides through the strip from right
 * to left. A line that rides off either end parks on that edge and overlaps its
 * neighbours there — its minute, which is the whole point of the map, stays
 * exactly true either way.
 *
 * The pan is clamped to `overflow`, which is precisely what does not fit. So on
 * an ordinary day it is zero and nothing moves at all: the ride begins where
 * the width runs out, like a scrollbar that appears only when it is needed.
 */
export function minimapLanes({
  count,
  innerWidthPx,
  centerLane = 0,
  barPx = MINIMAP_BAR_PX,
  gapPx = MINIMAP_GAP_PX,
  edgePx = MINIMAP_EDGE_PX,
}: MinimapLanesOptions): MinimapLane[] {
  const usable = innerWidthPx - 2 * edgePx
  if (!Number.isFinite(count) || count <= 0 || !(usable > 0)) return []
  const lanes = Math.floor(count)
  const width = Math.min(barPx, usable)
  const pitch = width + gapPx
  const overflow = Math.max(0, (lanes - 1) * pitch + width - usable)
  const wanted = centerLane * pitch + width / 2 - usable / 2
  const pan = Math.min(overflow, Math.max(0, wanted))
  return Array.from({ length: lanes }, (_, i) => ({
    // The clamp is the parking: a lane panned past either edge stops on it.
    left: Math.min(edgePx + usable - width, Math.max(edgePx, edgePx + i * pitch - pan)),
    width,
  }))
}

/**
 * Where to scroll so that `fraction` of the content lands in the *middle* of the
 * window rather than at its top edge.
 *
 * Clicking 13:00 on the map means "show me 13:00", and putting 13:00 at the top
 * edge shows you 13:00 and the rest of the evening. The same rule answers both
 * questions this pair of components asks — where a click on the strip goes, and
 * where `startMinute` opens a zoomed schedule — so there is one of it.
 */
export function minimapScrollTop(fraction: number, scrollHeight: number, clientHeight: number) {
  return clamp(
    fraction * scrollHeight - clientHeight / 2,
    0,
    Math.max(0, scrollHeight - clientHeight),
  )
}

/**
 * The corner radius for one end of the viewport rectangle.
 *
 * The strip is rounded with `overflow-hidden`, so a square-cornered rectangle
 * sitting against the top or the bottom gets its corners clipped off by the
 * curve — visibly, and only at the two scroll positions a user reaches most
 * often. Sliding the radius with the distance to that edge makes the rectangle
 * agree with the strip when it is flush against it and go back to square as it
 * moves away.
 */
function rectRadius(innerRadiusPx: number, gapPx: number) {
  return Math.max(MINIMAP_RECT_MIN_RADIUS_PX, innerRadiusPx - Math.max(0, gapPx))
}

export type DayScheduleMinimapTone = "brand" | "cyan"

/** The two accents, as fills. Deliberately the schedule's own, so a line and its bar match. */
const MINIMAP_TONES: Record<DayScheduleMinimapTone, string> = {
  brand: "bg-quebi-brand",
  cyan: "bg-cyan-500",
}

export interface DayScheduleMinimapSpan {
  /** Stable identity — used as the React key. */
  id: string
  /** Minutes from midnight, 0–1440. */
  start: number
  /** Minutes from midnight, 0–1440. */
  end: number
  tone?: DayScheduleMinimapTone
}

export interface DayScheduleMinimapProps extends Omit<React.ComponentProps<"div">, "children"> {
  /** The spans to draw, in any order — a lane is a rank by start time, not an index. */
  spans: readonly DayScheduleMinimapSpan[]
  /** The scrolling element the map mirrors and scrolls. */
  viewportRef: React.RefObject<HTMLElement | null>
  /**
   * How many viewports tall the scrolled content is. The window therefore shows
   * `1 / scale` of the day, which is where the rectangle's height comes from —
   * it is arithmetic, not a measurement, so it is right on the first paint.
   */
  scale?: number
}

/**
 * A 36px map of the whole day beside a scrolling schedule, replacing its
 * scrollbar.
 */
export function DayScheduleMinimap({
  spans,
  viewportRef,
  scale = 1,
  className,
  ...props
}: DayScheduleMinimapProps) {
  const stripRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)

  const [metrics, setMetrics] = useState({
    widthPx: MINIMAP_FALLBACK_INNER_WIDTH_PX,
    heightPx: 0,
    radiusPx: MINIMAP_FALLBACK_INNER_RADIUS_PX,
  })
  /** Where the window starts, as a fraction of the day. The only measured part of it. */
  const [windowTop, setWindowTop] = useState(0)

  useLayoutEffect(() => {
    const strip = stripRef.current
    const inner = innerRef.current
    const viewport = viewportRef.current
    if (!strip || !inner || !viewport) return

    let frame = 0

    const measure = () => {
      frame = 0
      const style = getComputedStyle(strip)
      // The strip's *inner* radius: what the curve is where the rectangle sits,
      // which is one border width inside the radius the class declares. Read
      // rather than hardcoded, so restyling the strip cannot desync the two.
      const radiusPx = Math.max(
        0,
        (Number.parseFloat(style.borderTopLeftRadius) || 0) -
          (Number.parseFloat(style.borderTopWidth) || 0),
      )
      setMetrics((previous) =>
        previous.widthPx === inner.clientWidth &&
        previous.heightPx === inner.clientHeight &&
        previous.radiusPx === radiusPx
          ? previous
          : { widthPx: inner.clientWidth, heightPx: inner.clientHeight, radiusPx },
      )
      setWindowTop(viewport.scrollHeight > 0 ? viewport.scrollTop / viewport.scrollHeight : 0)
    }

    // One frame per burst: a scroll fires far more often than it paints, and
    // the rectangle only has to be right once per paint.
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }

    const observer = new ResizeObserver(schedule)
    observer.observe(inner)
    observer.observe(viewport)
    viewport.addEventListener("scroll", schedule, { passive: true })
    measure()

    return () => {
      viewport.removeEventListener("scroll", schedule)
      observer.disconnect()
      if (frame) cancelAnimationFrame(frame)
    }
  }, [viewportRef])

  /** Scroll so that the minute under the pointer lands in the middle of the window. */
  const scrollToPointer = useCallback(
    (clientY: number) => {
      const inner = innerRef.current
      const viewport = viewportRef.current
      if (!inner || !viewport) return
      const rect = inner.getBoundingClientRect()
      if (rect.height <= 0) return
      const fraction = clamp((clientY - rect.top) / rect.height, 0, 1)
      viewport.scrollTop = minimapScrollTop(
        fraction,
        viewport.scrollHeight,
        viewport.clientHeight,
      )
    },
    [viewportRef],
  )

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    isDraggingRef.current = true
    scrollToPointer(event.clientY)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) scrollToPointer(event.clientY)
  }

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  // A lane is a rank by start time, never the index in `spans`: the ride only
  // means anything if the order the grid pans through is the order of the day.
  const order = spans
    .map((span, index) => ({ index, start: span.start }))
    .sort((a, b) => a.start - b.start || a.index - b.index)
  const laneOfSpan = new Map(order.map((entry, lane) => [entry.index, lane]))

  const windowHeight = clamp(1 / Math.max(1, scale), 0, 1)
  const top = clamp(windowTop, 0, 1 - windowHeight)
  const centerLane = minimapLaneAtMinute(
    order.map((entry) => entry.start),
    (top + windowHeight / 2) * DAY_MINUTES,
  )
  const lanes = minimapLanes({
    count: spans.length,
    innerWidthPx: metrics.widthPx || MINIMAP_FALLBACK_INNER_WIDTH_PX,
    centerLane,
  })

  const topGapPx = top * metrics.heightPx
  const bottomGapPx = (1 - top - windowHeight) * metrics.heightPx
  const topRadius = rectRadius(metrics.radiusPx, topGapPx)
  const bottomRadius = rectRadius(metrics.radiusPx, bottomGapPx)

  return (
    // A div with pointer handlers and no role, on purpose: this is a scrollbar.
    // `aria-hidden` with no tab stop — the spans it maps are all reachable by
    // Tab and scroll the viewport along with them, so a focusable thumb here
    // would be a duplicate whose arrow keys fought the sliders' own.
    <div
      ref={stripRef}
      aria-hidden="true"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={cn(
        "relative w-9 flex-none cursor-pointer touch-none select-none overflow-hidden",
        "rounded-quebi-sm border border-quebi-line/10 bg-quebi-bg",
        className,
      )}
      {...props}
    >
      <div ref={innerRef} className="absolute inset-0">
        {MINIMAP_RULE_MINUTES.map((minute) => (
          <div
            key={minute}
            className="absolute inset-x-0 h-px bg-quebi-line/[0.08]"
            style={{ top: toPercent(minute) }}
          />
        ))}

        {spans.map((span, index) => {
          const lane = lanes[laneOfSpan.get(index) ?? 0]
          if (!lane) return null
          const tone = MINIMAP_TONES[span.tone ?? (index % 2 === 0 ? "brand" : "cyan")]
          return (
            <div
              key={span.id}
              // No `inset-x-*` and no transition anywhere in here: the line's x
              // is the lane grid's answer, and the motion *is* the scroll — a
              // transition would only ever run late behind it.
              className={cn("absolute rounded-full", tone)}
              style={{
                left: `${lane.left}px`,
                width: `${lane.width}px`,
                top: toPercent(span.start),
                height: toPercent(span.end - span.start),
                minHeight: `${MINIMAP_MIN_LINE_PX}px`,
              }}
            />
          )
        })}

        {/* The window. A border and not a fill, so it hides nothing; neutral ink
            and not the accent, because the lines under it are already two of
            those. */}
        <div
          data-minimap-window=""
          className="absolute inset-x-0 border border-quebi-fg-muted"
          style={{
            top: `${(top * 100).toFixed(4)}%`,
            height: `${(windowHeight * 100).toFixed(4)}%`,
            borderRadius: `${topRadius}px ${topRadius}px ${bottomRadius}px ${bottomRadius}px`,
          }}
        />
      </div>
    </div>
  )
}
