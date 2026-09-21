"use client"

import { Time } from "@internationalized/date"
import { useCallback, useLayoutEffect, useRef, useState } from "react"
import type { TimeValue } from "react-aria-components"
import { cn } from "@/lib/utils"
import { DayScheduleMinimap, minimapScrollTop } from "@/components/day-schedule-minimap"
import { TimeField, TimeInput } from "@/components/time-field"

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
 *
 * The times beside each span are text by default. `timeLabels="editable"` makes
 * them TimeFields instead, so a time can be typed rather than dragged to, and
 * they are drawn at the same 10.5px as the static ones either way.
 *
 * Both are rotated a quarter turn into their lane, which is what lets a lane be
 * 18px wide — a rotated time costs its line box, not its width.
 * `timeLabelOrientation="upright"` reads them left to right instead, at the
 * cost of a 64px lane and a sweep (`layoutEdgeTimes`) that keeps a short span's
 * start and end from landing on top of each other — which the rotation had been
 * hiding, because rotated the pair runs away from itself along the lane.
 *
 * Span names share a single column to the right of the lanes. Two spans can
 * always be dragged onto the same midpoint, so that column de-overlaps itself
 * (`layoutNames`) and any name it had to move keeps a leader line back to its
 * own bar.
 */

const DAY_MINUTES = 1440

/**
 * Lanes sit as far apart as the widest thing drawn in one, and a *rotated* edge
 * time is as wide as its own line box — so 18px clears a static label at 16px.
 *
 * The editable mode used to claim half again as much, on the reasoning that a
 * TimeField's line box is 20px and a focused segment's tint costs a few more.
 * Both halves were wrong once the field came down to the static labels' 10.5px
 * (task #173): measured in Chromium, a rotated editable field and a rotated
 * static label have the same 15.75px footprint, and focusing a segment changes
 * it by nothing at all — the tint is a background on a box that was always that
 * size. So 36 is now 24: the 18 that clears a label, plus air, because a field
 * is something you aim a pointer at and two of them 2px apart are one target.
 * `labelOffset` is derived from the gap, so the name column follows on its own.
 */
const LANE_GAP = 18
const EDITABLE_LANE_GAP = 24

/**
 * An *upright* edge time spends its width on its width, so the lane has to hold
 * the whole `09:00` rather than one line box of it. Measured in Chromium at the
 * shared 10.5px: a static label is 28px wide and a field 46.28px, and the field
 * starts 12.5px right of the bar (`translate(10px)`, plus half the 5px bar it
 * is centred on) — so a lane has to be at least 58.78px to keep one span's
 * times off the next span's bar. 64 is that, rounded up with 5px to spare. The
 * field is the binding case and the label fits inside it, so one number serves
 * both kinds rather than splitting `static` from `editable` again.
 */
const UPRIGHT_LANE_GAP = 64

/**
 * How far the name column sits past the last lane. The rotated label is only a
 * line box wide, so 28px clears it.
 *
 * The upright one needs a whole lane again, and it needs it from a constant
 * rather than from `laneGap`: the clearance is what the *last* lane requires,
 * and the last lane is precisely the one `laneGap` never applies to. It is the
 * same requirement a middle lane has, so it is the same number.
 */
const NAME_CLEARANCE = 28
const UPRIGHT_NAME_CLEARANCE = UPRIGHT_LANE_GAP

/**
 * The least vertical distance between a span's own two upright edge times.
 *
 * Rotated, the pair can never collide — each one runs *along* the lane, away
 * from the other. Upright they are two boxes stacked in one column, measured at
 * 15.75px each, and a span of `minDuration` on a 400px track is 8px of it: the
 * shipped example drew one straight over the other. 20 is that box rounded up,
 * plus 4px — more air than `LABEL_GAP` gives two names, because two times in a
 * column are eight digits that would otherwise read as one run of them.
 */
const UPRIGHT_EDGE_GAP = 20

/**
 * The least vertical distance between two span names. They share one column, so
 * this is the only thing keeping them apart: a `text-xs` line box is 16px, and
 * the extra two are what stop two names from reading as one block of text.
 */
const LABEL_GAP = 18

type SpanEdge = "start" | "end"

/** Which way an edge time faces: rotated into its lane, or upright beside it. */
export type DayScheduleTimeLabelOrientation = "rotated" | "upright"

/**
 * Where an edge time sits relative to its lane.
 *
 * `rotated` is a quarter turn anticlockwise about the lane, then clear of the
 * handle: the start time runs up from the span's start, the end time down from
 * its end. The `-50%` is half the element's own *height*, which is what centres
 * the rotated box on the lane — so a taller control still sits on its lane, it
 * just needs a wider gap to its neighbour.
 *
 * `upright` drops the rotation and nothing else. Both edges step the same 10px
 * to the right of the lane, so the pair reads as one column beside the bar
 * rather than straddling it: hanging `end` on the left instead would put it
 * over the previous lane, and over the hour axis for lane 0, which no `laneGap`
 * can fix because the first lane is not spaced from anything. What keeps the
 * pair off each other is `layoutEdgeTimes`. The `-50%` now means half the
 * element height in the ordinary sense: the box is centred on its own minute.
 */
const EDGE_TRANSFORM: Record<DayScheduleTimeLabelOrientation, Record<SpanEdge, string>> = {
  rotated: {
    start: "rotate(-90deg) translate(16px, -50%)",
    end: "rotate(-90deg) translate(calc(-100% - 16px), -50%)",
  },
  upright: {
    start: "translate(10px, -50%)",
    end: "translate(10px, -50%)",
  },
}

/**
 * How a tick's label and its gridline are shifted against the minute they mark.
 *
 * A label is centred on its minute and a rule is drawn at it, which is right
 * for every tick with track above it and below it, and wrong for the two that
 * have track on one side only: half of `00:00` sits above the track, half of
 * `24:00` below it, and the rule at `100%` lands on the row *after* the last
 * one. While the track was the outermost box that overhang was merely untidy.
 * Inside the viewport `zoom` put around it, it is seven pixels of scrollable
 * overflow at the bottom — so the browser paints a scrollbar on a schedule at
 * zoom 1, the one zoom documented never to scroll, and the clip cuts the two
 * labels a reader looks for first in half.
 *
 * So the ends tuck in: the first label hangs below its rule, the last sits
 * above its own, and the last rule moves up onto the track's final pixel. Every
 * tick with track on both sides is untouched, which on an ordinary
 * `tickInterval` is all the rest of them.
 */
function tickShift(minute: number) {
  if (minute === 0) return "translate-y-0"
  if (minute === DAY_MINUTES) return "-translate-y-full"
  return "-translate-y-1/2"
}

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

/**
 * `text` is the tone as *text*, which is a different value from the fill: these
 * are the theme's text tokens, so each one clears 4.5:1 on its own theme's
 * surface, where `bg-quebi-brand` — a fill colour, deliberately the same teal in
 * both themes — measures 1.74:1 on the light one.
 *
 * The name carries it because a name no longer always sits on its span's
 * midpoint: `layoutNames` moves it when a neighbour is in the way, and once it
 * has moved, the colour is what still says which bar it belongs to.
 */
const TONES: Record<DayScheduleTone, { bar: string; node: string; text: string }> = {
  brand: {
    bar: "bg-quebi-brand shadow-[0_0_12px_rgb(45_212_168/0.35)]",
    node: "border-quebi-brand-mark",
    text: "text-quebi-brand-text",
  },
  cyan: {
    bar: "bg-cyan-500 shadow-[0_0_12px_rgb(6_182_212/0.35)]",
    node: "border-cyan-500",
    text: "text-quebi-info",
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

/** Keep a computed pixel offset out of `top: 303.33333333333337px`. */
const round = (value: number) => Math.round(value * 100) / 100

/**
 * Where each span's name is drawn, in pixels down the track — indexed like
 * `spans`, whatever order they come in.
 *
 * A name wants to sit on its span's midpoint, and nothing stops two spans from
 * sharing one. Dragging until they do is the component's entire purpose, and
 * two names at the same `top` in the same column draw on top of each other:
 * unreadable, and silent about which of the two you are looking at. So the
 * wanted positions are de-overlapped before they are drawn — sort by y, sweep
 * down pushing each name clear of the one above it, then sweep back up so the
 * column still ends inside the track.
 *
 * This is arithmetic on `height`, which is a prop, so it is exact at render
 * time: no measuring, no layout effect. That is not an optimisation. The site
 * is prerendered, so a position taken from a measured DOM would be absent from
 * the HTML and would land — visibly — one frame after hydration.
 */
function layoutNames(spans: DaySpan[], height: number) {
  return sweepApart(
    spans.map((span, index) => ({
      index,
      y: (((span.start + span.end) / 2) * height) / DAY_MINUTES,
    })),
    LABEL_GAP,
    height,
  )
}

/**
 * The sweep itself, so the name column and the upright edge times share one
 * algorithm rather than two that drift. Takes where each box wants to be and
 * returns where it goes, in pixels, indexed as it came in.
 */
function sweepApart(wanted: SweepItem[], gap: number, height: number) {
  // Ties break by the caller's order rather than by whatever the sort makes of
  // them, so two boxes wanting the same y are laid out the same way every
  // render.
  wanted.sort((a, b) => a.y - b.y || a.index - b.index)

  // Down: each box clears the one above it, and the first clears the top edge.
  let floor = Number.NEGATIVE_INFINITY
  for (const item of wanted) {
    item.y = Math.max(item.y, floor, 0)
    floor = item.y + gap
  }

  // Up: the column ends inside the track. Skipped when the boxes cannot all fit
  // in `height` — pushing then would only trade an overflow at the bottom for
  // one at the top, and restack everything on the way.
  if ((wanted.length - 1) * gap <= height) {
    let ceiling = height
    for (let i = wanted.length - 1; i >= 0; i--) {
      wanted[i].y = Math.min(wanted[i].y, ceiling)
      ceiling = wanted[i].y - gap
    }
  }

  const tops: number[] = []
  for (const item of wanted) tops[item.index] = round(item.y)
  return tops
}

/**
 * Where one span's two *upright* edge times are drawn, in pixels down the track.
 *
 * Rotated, the pair can never collide: each time runs along the lane, away from
 * the other, and the only thing it can hit is a neighbouring lane — which is
 * what `laneGap` is for. Upright, they are two boxes in one column separated by
 * nothing but the span's own length, and a span of `minDuration` is 8px of a
 * 400px track. The shipped example would draw one straight over the other.
 *
 * So they go through the same sweep the name column uses. `start` sorts above
 * `end` because a span's start is never after its end, and ties break by the
 * order they are handed over, so the pair never swaps places under the sweep.
 */
function layoutEdgeTimes(span: DaySpan, height: number) {
  const [start, end] = sweepApart(
    (["start", "end"] as const).map((edge, index) => ({
      index,
      y: (span[edge] * height) / DAY_MINUTES,
    })),
    UPRIGHT_EDGE_GAP,
    height,
  )
  return { start, end }
}

/** One box in a de-overlapped column: where it wants to be, and who it is. */
interface SweepItem {
  index: number
  y: number
}

type DragPart = "body" | "start" | "end"

/** Which edge time to draw: none, read-only text, or a typeable field. */
export type DayScheduleTimeLabels = "none" | "static" | "editable"

/**
 * A minute offset as a `Time`. 1440 — midnight closing the day — has no `Time`
 * of its own, so it reads as `00:00`; leaving that field untouched never emits
 * a change, so the span keeps its 24:00 end.
 */
const toTimeValue = (minutes: number) =>
  new Time(Math.floor(minutes / 60) % 24, Math.floor(minutes % 60))

interface EdgeTimeFieldProps {
  /** The field's accessible name — "pairing start time". */
  label: string
  minutes: number
  /** The lane's `left`, shared with the bar and the handle. */
  lane: string
  /** Where down the track the box is centred — a percentage, or laid-out px. */
  top: string
  /** The orientation's placement for this edge. See `EDGE_TRANSFORM`. */
  transform: string
  isDisabled: boolean
  isReadOnly: boolean
  onCommit: (minutes: number) => void
}

/**
 * The typeable edge time — rotated into its lane, or upright beside it, which
 * the caller decides by handing it a `transform` and a `top` to match.
 *
 * It holds a draft of its own, and that is the whole point of it. react-aria
 * reports a segmented field on every keystroke, so typing `17` into the hour
 * emits `01:00` before it emits `17:00` — and committing the `01:00` would run
 * it through the same clamp a drag uses, pin the span against `minDuration`,
 * and leave the second keystroke editing a value the user never saw. The draft
 * is what the field shows while it has focus; it reaches the schedule when
 * focus leaves, or on Enter.
 */
function EdgeTimeField({
  label,
  minutes,
  lane,
  top,
  transform,
  isDisabled,
  isReadOnly,
  onCommit,
}: EdgeTimeFieldProps) {
  // `undefined` is "not being edited" — then the field shows the span itself,
  // so a drag on the handle still moves the number under the cursor.
  const [draft, setDraft] = useState<TimeValue | null>()

  const commit = () => {
    if (draft) onCommit(draft.hour * 60 + draft.minute)
    setDraft(undefined)
  }

  return (
    <TimeField
      aria-label={label}
      value={draft === undefined ? toTimeValue(minutes) : draft}
      onChange={(next) => setDraft(next)}
      // react-aria routes this through `useFocusWithin`, so it fires when focus
      // leaves the field — not when it steps from the hour segment to the minute.
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          // Commit without leaving the field, and — inside a form — without
          // submitting the draft the schedule has not been told about yet.
          event.preventDefault()
          commit()
        }
        if (event.key === "Escape") setDraft(undefined)
      }}
      isDisabled={isDisabled}
      isReadOnly={isReadOnly}
      // Match `formatDayTime`: two digits, 24-hour, whatever the locale prefers.
      hourCycle={24}
      shouldForceLeadingZeros
      className="absolute origin-top-left"
      style={{ left: lane, top, transform }}
    >
      {/* The box is the control's own metrics, so it carries no chrome
          and no padding of its own — the lane is the box. The type is the
          static labels' type, set here and nowhere else: `TimeInput` leaves its
          segments without a resting `text-*`, so all three of these inherit
          through to the digits (task #173). Sized down rather than the static
          labels up: those share a size with the hour axis and sit beside the
          span names, so raising them would put a time above its own name. */}
      <TimeInput
        bare
        className="w-auto px-0 py-0 text-[10.5px] text-quebi-fg-muted tabular-nums"
      />
    </TimeField>
  )
}

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
  /**
   * Height in pixels of the part you can see. At the default `zoom` of 1 that
   * is also the track's height, because the whole day fits in it.
   */
  height?: number
  /**
   * How many viewports tall the day is drawn. `1` is the whole day at once —
   * every schedule that existed before this. Above it the track becomes
   * `height × zoom` and the viewport scrolls, which is what buys a 15-minute
   * meeting enough pixels to aim a pointer at.
   *
   * Everything the component positions is a percentage of the track, so zoom
   * costs the layout nothing: the names de-overlap against the taller track and
   * therefore collide less, and a drag still reads its minute from the track's
   * own box rather than from what happens to be on screen.
   *
   * What a drag does not do is scroll. Dragging a span to an hour that is off
   * screen means scrolling there first — by the map, the wheel, or the arrow
   * keys on the span itself, which the browser scrolls into view as focus
   * moves. Auto-scrolling at the viewport's edges is the other answer, and it
   * is one that has to be tuned against a pointer that is merely near the edge
   * on its way somewhere else; the keyboard path already covers the case.
   */
  zoom?: number
  /**
   * Draw a {@link DayScheduleMinimap} beside the viewport — the whole day at
   * 36px wide, one line per span, with a rectangle marking the slice on screen.
   * Click or drag it to scroll there.
   *
   * It replaces the viewport's scrollbar rather than joining it: two bars down
   * one side of a schedule, one of which is also a map, is a choice nobody
   * wants to make. Useful precisely when `zoom` is above 1 — at 1 the rectangle
   * covers the strip, because the window really is the day.
   */
  minimap?: boolean
  /**
   * The minute to open scrolled to, centred in the viewport. Only does anything
   * with a `zoom` above 1, where there is somewhere else to be.
   *
   * Without it a zoomed schedule opens at 00:00, which is the one hour of the
   * day nothing is ever booked in — every consumer would write the same
   * scroll-on-mount effect, against a viewport this component does not hand
   * out. `540` is nine in the morning.
   */
  startMinute?: number
  /**
   * Horizontal distance between lanes, in pixels. Defaults to 18, to 24 in
   * `timeLabels="editable"` — where the rotated control wants to be separately
   * clickable — and to 64 in `timeLabelOrientation="upright"`, where a time is
   * as wide as a time rather than as wide as a line box.
   */
  laneGap?: number
  /** Offset of the first lane from the track's left edge, in pixels. */
  laneOffset?: number
  /**
   * The start/end times beside each span. `"static"` draws them as
   * text; `"editable"` draws a TimeField the user can type a time into, which
   * also widens the default `laneGap` to fit it; `"none"` omits them.
   *
   * A typed time is taken as typed — `step` snaps a drag, not a keystroke.
   * `formatTime` does not apply to an editable field: the segments are
   * react-aria's, rendered for the active locale.
   */
  timeLabels?: DayScheduleTimeLabels
  /**
   * How an edge time is drawn: `"rotated"` a quarter turn into its lane (the
   * default, and what every schedule looked like before this existed), or
   * `"upright"` beside it, reading left to right like any other label or field.
   *
   * It is its own axis on purpose: `timeLabels` chooses *what* the edge time is
   * and this chooses *how it faces*, so the two compose. Upright widens the
   * default `laneGap` again — a rotated label spends its line box on the gap
   * and an upright one spends its whole width — and moves a span's two times
   * apart when its length cannot keep them apart on its own.
   *
   * Ignored when `timeLabels` is `"none"`: there is nothing to face.
   */
  timeLabelOrientation?: DayScheduleTimeLabelOrientation
  /** @deprecated Use `timeLabels`: `false` is `"none"`, `true` is `"static"`. */
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
  zoom = 1,
  minimap = false,
  startMinute,
  laneGap: laneGapProp,
  laneOffset = 24,
  timeLabels,
  timeLabelOrientation = "rotated",
  showTimeLabels = true,
  isDisabled = false,
  isReadOnly = false,
  formatTime = formatDayTime,
  className,
  ...props
}: DayScheduleProps) {
  const labelMode: DayScheduleTimeLabels = timeLabels ?? (showTimeLabels ? "static" : "none")
  // `"none"` draws nothing in the lane, so neither the orientation nor the
  // editable widening has anything to make room for.
  const isUpright = timeLabelOrientation === "upright" && labelMode !== "none"
  const defaultLaneGap = isUpright
    ? UPRIGHT_LANE_GAP
    : labelMode === "editable"
      ? EDITABLE_LANE_GAP
      : LANE_GAP
  const laneGap = laneGapProp ?? defaultLaneGap

  const [uncontrolled, setUncontrolled] = useState<DaySpan[]>(defaultSpans)
  const isControlled = controlledSpans !== undefined
  const spans = isControlled ? controlledSpans : uncontrolled
  const trackRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)

  // Zoom below 1 would be a track shorter than the box holding it, which is a
  // gap at the bottom rather than a smaller day.
  const scale = Math.max(1, zoom)
  const trackHeight = Math.round(height * scale)
  // Whether the track is taller than the box around it — which is the same
  // question as whether that box has anything at all to scroll.
  const isZoomed = scale > 1

  // Before paint rather than after it: this is where the viewport *starts*, and
  // a scroll applied in a passive effect is a visible jump away from midnight.
  // It runs on mount and when the minute asked for changes — not on every
  // render, which would fight the user's own scrolling.
  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (!viewport || startMinute === undefined) return
    viewport.scrollTop = minimapScrollTop(
      startMinute / DAY_MINUTES,
      viewport.scrollHeight,
      viewport.clientHeight,
    )
  }, [startMinute])

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

  // The minute each gridline marks. It is also each gridline's identity — two
  // ticks can never share a minute — so the rows below key on it rather than on
  // their position in the array.
  const tickMinutes = Array.from(
    { length: Math.floor(DAY_MINUTES / tickInterval) + 1 },
    (_, i) => i * tickInterval,
  )
  // Push the name column clear of the widest lane so labels never overlap bars.
  // The clearance does not come from `laneGap`: it is what the *last* lane
  // needs, and the last lane is the one `laneGap` never applies to.
  const labelOffset =
    laneOffset +
    Math.max(0, spans.length - 1) * laneGap +
    (isUpright ? UPRIGHT_NAME_CLEARANCE : NAME_CLEARANCE)
  // …and clear of each other, which the column on its own does not give you.
  const nameTops = layoutNames(spans, trackHeight)

  return (
    <div
      className={cn(
        "flex w-full gap-2 font-sans select-none",
        isDisabled && "pointer-events-none opacity-50",
        className,
      )}
      {...props}
    >
      {/* The viewport. At zoom 1 the track exactly fills it, so it does not
          become a scroll container at all: an `overflow` of anything but
          `visible` clips, and a box whose content is its own height to the
          pixel is one stray half-line-box away from a scrollbar it has nothing
          to scroll. That is what this wrapper changing nothing for a schedule
          which does not ask for a zoom has to mean — the `tickShift` above
          keeps the hour axis inside the track, and this keeps anything else
          that overhangs (a handle sitting on midnight) drawn rather than cut. */}
      <div
        ref={viewportRef}
        // Named so something outside can find the thing that scrolls — a test
        // asserting where the window landed, a scene posing one for a
        // screenshot. The minimap does not need it; it is handed the ref.
        data-day-schedule-viewport=""
        className={cn(
          "min-w-0 flex-1",
          isZoomed
            ? cn(
                "overflow-y-auto overscroll-y-contain",
                // The map replaces the bar rather than sitting next to it — which
                // is exactly what `quebi-scrollbar-none` is for, so the two
                // browsers' ways of saying "no bar" are declared in one place and
                // not here.
                "quebi-scrollbar",
                minimap && "quebi-scrollbar-none",
              )
            : "overflow-visible",
        )}
        style={{ height }}
      >
        <div className="flex w-full gap-2.5">
          {/* Hour axis */}
          <div
            className="relative w-10 flex-none border-r border-quebi-line/10"
            style={{ height: trackHeight }}
            aria-hidden="true"
          >
            {tickMinutes.map((minute) => (
              <div
                key={minute}
                className={cn(
                  "absolute left-0 text-[9.5px] text-quebi-fg-subtle tabular-nums",
                  tickShift(minute),
                )}
                style={{ top: toPercent(minute) }}
              >
                {minute === DAY_MINUTES ? "24:00" : formatTime(minute)}
              </div>
            ))}
          </div>

          {/* Span track */}
          <div ref={trackRef} className="relative flex-1" style={{ height: trackHeight }}>
            {tickMinutes.map((minute) => (
              <div
                key={minute}
                aria-hidden="true"
                className={cn(
                  "absolute inset-x-0 h-px bg-quebi-line/[0.06]",
                  // Only the last rule moves: a 1px line has no half to centre.
                  minute === DAY_MINUTES && "-translate-y-full",
                )}
                style={{ top: toPercent(minute) }}
              />
            ))}

            {spans.map((span, index) => {
              const tone = TONES[span.tone ?? (index % 2 === 0 ? "brand" : "cyan")]
              const laneX = laneOffset + index * laneGap
              const lane = `${laneX}px`
              const valueText = `${span.label}, ${formatTime(span.start)} to ${formatTime(span.end)}`
              // Rotated, a span's two times run away from each other along the
              // lane and cannot collide; upright they are one column, kept apart
              // by the sweep rather than by the span happening to be long enough.
              const edgeTops = isUpright ? layoutEdgeTimes(span, trackHeight) : null
              const edgeTop = (edge: SpanEdge) =>
                edgeTops ? `${edgeTops[edge]}px` : toPercent(span[edge])
              const edgeTransform = EDGE_TRANSFORM[isUpright ? "upright" : "rotated"]
              // Where the name would sit if nothing were in its way, and where it
              // actually sits. A name that had to move gets a leader line back to
              // its own span, because the tone alone repeats every other lane.
              const midpointY = round((((span.start + span.end) / 2) * trackHeight) / DAY_MINUTES)
              const nameTop = nameTops[index]
              const isNameMoved = Math.abs(nameTop - midpointY) >= 1

              return (
                // biome-ignore lint/a11y/useSemanticElements: <fieldset> is the element for this role, but this wrapper only exists to name the three sliders below it and has no box of its own — a fieldset brings a UA border, padding and `min-inline-size: min-content` into a track whose children are absolutely positioned against it.
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
                      "focus-visible:ring-2 focus-visible:ring-quebi-brand-mark focus-visible:ring-offset-2 focus-visible:ring-offset-quebi-bg",
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
                        "focus-visible:ring-2 focus-visible:ring-quebi-brand-mark focus-visible:ring-offset-2 focus-visible:ring-offset-quebi-bg",
                      )}
                      style={{ left: lane, top: toPercent(span[part]) }}
                    />
                  ))}

                  {/* Leader line — only drawn for a name that had to move.
                      `currentColor` and not a `stroke` attribute on purpose: a
                      colour that reaches the DOM only as an attribute value is a
                      name Tailwind never scans, so the variable behind it may not
                      be emitted at all. A utility class on the <svg> is scanned. */}
                  {isNameMoved && (
                    <svg
                      aria-hidden="true"
                      focusable="false"
                      className={cn(
                        "pointer-events-none absolute inset-0 h-full w-full opacity-40",
                        tone.text,
                      )}
                    >
                      <line
                        x1={laneX + 6}
                        y1={midpointY}
                        x2={labelOffset - 4}
                        y2={nameTop}
                        stroke="currentColor"
                        strokeWidth={1}
                        strokeDasharray="2 3"
                      />
                    </svg>
                  )}

                  {/* Name */}
                  <div
                    className={cn(
                      "absolute -translate-y-1/2 whitespace-nowrap text-xs",
                      tone.text,
                    )}
                    style={{ left: `${labelOffset}px`, top: `${nameTop}px` }}
                  >
                    {span.label}
                  </div>

                  {/* Edge times — text, or a field to type one into */}
                  {labelMode === "static" &&
                    (["start", "end"] as const).map((edge) => (
                      <div
                        key={edge}
                        aria-hidden="true"
                        className="absolute origin-top-left whitespace-nowrap text-[10.5px] text-quebi-fg-muted tabular-nums"
                        style={{
                          left: lane,
                          top: edgeTop(edge),
                          transform: edgeTransform[edge],
                        }}
                      >
                        {formatTime(span[edge])}
                      </div>
                    ))}

                  {labelMode === "editable" &&
                    (["start", "end"] as const).map((edge) => (
                      <EdgeTimeField
                        key={edge}
                        label={`${span.label} ${edge} time`}
                        minutes={span[edge]}
                        lane={lane}
                        top={edgeTop(edge)}
                        transform={edgeTransform[edge]}
                        isDisabled={isDisabled}
                        isReadOnly={isReadOnly}
                        // Through the same clamp a drag uses, so `minDuration` and
                        // the day bounds stay in one place. It does not snap, and
                        // that is deliberate: typing 13:07 and getting 13:00 back
                        // would be the control disagreeing with the keyboard.
                        onCommit={(minute) => applyMove(index, edge, minute, span)}
                      />
                    ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {minimap && (
        <DayScheduleMinimap
          // The tone the schedule actually drew, not the one the span declared:
          // the default alternates by array position, and a line whose colour
          // disagrees with its bar is worse than no colour at all.
          spans={spans.map((span, index) => ({
            id: span.id,
            start: span.start,
            end: span.end,
            tone: span.tone ?? (index % 2 === 0 ? ("brand" as const) : ("cyan" as const)),
          }))}
          viewportRef={viewportRef}
          scale={scale}
        />
      )}
    </div>
  )
}
