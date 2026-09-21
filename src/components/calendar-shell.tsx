"use client"

import {
  type CalendarDate,
  fromDate,
  Time,
  toCalendarDate,
  toCalendarDateTime,
  toZoned,
  type ZonedDateTime,
} from "@internationalized/date"
import { useEffect, useId, useMemo, useRef, useState } from "react"
import { useMove } from "react-aria"
import { Button, Dialog, Heading, useLocale } from "react-aria-components"
import {
  type CalendarColorName,
  type CalendarEvent,
  type CalendarSource,
  type DaySegment,
  type EventBand,
  eventsOnDay,
  isAllDayEvent,
  limitLanes,
  MINUTES_PER_DAY,
  packBands,
  packColumns,
  segmentByDay,
} from "@/lib/calendar"
import { getDateTimeFormat } from "@/lib/intl"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent } from "@/components/popover"

/**
 * CalendarShell — quebi design system
 *
 * The parts every Outlook-style view is drawn from: a time axis, the hour
 * gridlines, the all-day band with its "+N more" overflow, the now-marker, and
 * the event blocks laid out by `@/lib/calendar`'s packing pass. `DayView`,
 * `WeekView` and `MonthView` are assemblies over this; `CalendarTimeline` reuses
 * the palette and the blocks and draws its own axis, because its time runs
 * horizontally.
 *
 * This is the `TableShell` of the calendar family: it renders, it does not
 * decide. Which days are visible, what the toolbar says and who owns the date
 * are the assembly's business, and none of it is reachable from here.
 *
 * ## Display, selection and move
 *
 * What the shell reports is what a display can honestly know: `onEventClick`
 * when something is activated, `onSelectionChange` for the one event drawn as
 * selected, and — since task #182 — `onEventChange` when an event is dragged to
 * another time or another day. Move is opt-in per event through
 * `isEventEditable` and it changes nothing by itself: the shell reports the
 * drop, the consumer owns the events array, which is the contract
 * `ServerTable`'s `onQueryChange` has. `DayView` and `WeekView` pass both props
 * straight through, so the machinery is here once rather than in each view.
 *
 * Drag-to-create and drag-to-resize are still out, and that is the half of the
 * old v1 line that holds: `DaySchedule` is the component that owns dragging a
 * time span's *edges* around. `onEventChange` reports a start, an end and a
 * calendar rather than a delta so that resize can arrive behind this same prop
 * instead of beside it.
 */

/**
 * The calendar palette, as classes.
 *
 * `calendarColorNames` in `@/lib/calendar` fixes the *order* — it is the
 * `dataviz` skill's validated categorical ordering, whose adjacent pairs clear
 * the colour-vision gate in both themes — and this is the only place that turns
 * a slot into pixels. Three rules from that skill shape what each entry says:
 *
 * - **The fill is a wash, not a block.** The hue at low opacity, with the solid
 *   hue kept for a 2px edge that reads as the series line. A saturated block
 *   behind text is the thing that makes a week view look like a bar chart.
 * - **Text wears text tokens.** The title is `quebi-fg`, never the series hue,
 *   so it keeps its contrast whichever slot the calendar landed in.
 * - **Colour is never the only channel.** Every block carries its title and its
 *   time as text, and a timeline row is labelled with the calendar's name, so
 *   the hue is a second signal rather than the signal.
 *
 * **The wash is opaque.** A tint spelled `bg-blue-500/15` is 85% transparent, so
 * the hour lines, the sub-slot lines and the column rules the grid draws *under*
 * an event are all still legible through it — the bar reads as a pane of tinted
 * glass laid over the grid rather than as an object sitting on it (task #165).
 * Each entry therefore names the colour that tint *resolves to* over the page:
 * `color-mix(in oklab, <hue> 15%, var(--color-quebi-bg))`, at alpha 1. The
 * apparent colour is unchanged in both themes — `--color-quebi-bg` is the
 * theme-aware token the surface is already painted in — but nothing shows
 * through. `band` converts with `block`: the all-day band and the month chip sit
 * over the day-column rules rather than over hour lines, which is the same
 * defect with a different line under it.
 *
 * The eight pairs are written out rather than built by a helper because a
 * Tailwind v4 class only exists if its full text appears in a scanned file. A
 * helper interpolating the hue would emit `bg-[color-mix(…var(--color-blue-500)…)]`
 * at runtime and Tailwind would never have generated a rule for it, so every bar
 * would paint transparent. Theme tokens (`--q-calendar-tint-*`) would compile,
 * but they would move eight values a consumer copying this file cannot see into
 * a stylesheet they have to copy too — and self-containment is why the palette
 * uses Tailwind's own scales in the first place.
 *
 * **Selection wears the event's own hue.** `selected` is the colour of the ring
 * drawn round a selected event (task #168). It used to be `quebi-brand-mark`
 * for every calendar, which made the highlight a second colour system arguing
 * with the first — teal over a blue bar — and made selection indistinguishable
 * from focus, which is that same brand ring. Focus keeps the brand mark;
 * selection is now a saturated version of what the event is already painted in,
 * so the two differ by hue as well as by position. It is an `outline-` rather
 * than a `ring-` utility because the ring these views draw is *inset*, and an
 * inset ring lands exactly on top of the 2px `edge` — selecting an event used
 * to erase the one piece of chrome saying which calendar it belongs to. An
 * outline sits outside the border box, so the accent survives being selected,
 * and it rides a different CSS property from the focus ring, so a bar that is
 * both focused and selected shows both. `brand` is the one entry whose value is
 * chosen rather than derived: `-quebi-brand-mark`, matching its `edge`, and
 * never bare `-quebi-brand`, which `tests/mark-contrast.test.ts` rejects for a
 * stroke.
 *
 * The scales here are Tailwind's rather than quebi tokens because quebi has one
 * accent, and one accent cannot tell eight calendars apart. That is the same
 * argument `chart.tsx` makes for its series palette, and the same exception
 * `no-hardcoded-design-values` already grants the library source — the values
 * are argued about here, once, instead of in a consumer's lint run.
 */
export const CALENDAR_COLORS: Record<
  CalendarColorName,
  { block: string; edge: string; dot: string; band: string; selected: string }
> = {
  blue: {
    block: "bg-[color-mix(in_oklab,var(--color-blue-500)_15%,var(--color-quebi-bg))] hover:bg-[color-mix(in_oklab,var(--color-blue-500)_25%,var(--color-quebi-bg))]",
    edge: "border-l-blue-500",
    dot: "bg-blue-500",
    band: "bg-[color-mix(in_oklab,var(--color-blue-500)_20%,var(--color-quebi-bg))]",
    selected: "outline-blue-500",
  },
  orange: {
    block: "bg-[color-mix(in_oklab,var(--color-orange-500)_15%,var(--color-quebi-bg))] hover:bg-[color-mix(in_oklab,var(--color-orange-500)_25%,var(--color-quebi-bg))]",
    edge: "border-l-orange-500",
    dot: "bg-orange-500",
    band: "bg-[color-mix(in_oklab,var(--color-orange-500)_20%,var(--color-quebi-bg))]",
    selected: "outline-orange-500",
  },
  brand: {
    block: "bg-[color-mix(in_oklab,var(--color-quebi-brand)_15%,var(--color-quebi-bg))] hover:bg-[color-mix(in_oklab,var(--color-quebi-brand)_25%,var(--color-quebi-bg))]",
    edge: "border-l-quebi-brand-mark",
    dot: "bg-quebi-brand",
    band: "bg-[color-mix(in_oklab,var(--color-quebi-brand)_20%,var(--color-quebi-bg))]",
    selected: "outline-quebi-brand-mark",
  },
  amber: {
    block: "bg-[color-mix(in_oklab,var(--color-amber-500)_15%,var(--color-quebi-bg))] hover:bg-[color-mix(in_oklab,var(--color-amber-500)_25%,var(--color-quebi-bg))]",
    edge: "border-l-amber-500",
    dot: "bg-amber-500",
    band: "bg-[color-mix(in_oklab,var(--color-amber-500)_20%,var(--color-quebi-bg))]",
    selected: "outline-amber-500",
  },
  pink: {
    block: "bg-[color-mix(in_oklab,var(--color-pink-500)_15%,var(--color-quebi-bg))] hover:bg-[color-mix(in_oklab,var(--color-pink-500)_25%,var(--color-quebi-bg))]",
    edge: "border-l-pink-500",
    dot: "bg-pink-500",
    band: "bg-[color-mix(in_oklab,var(--color-pink-500)_20%,var(--color-quebi-bg))]",
    selected: "outline-pink-500",
  },
  emerald: {
    block: "bg-[color-mix(in_oklab,var(--color-emerald-500)_15%,var(--color-quebi-bg))] hover:bg-[color-mix(in_oklab,var(--color-emerald-500)_25%,var(--color-quebi-bg))]",
    edge: "border-l-emerald-500",
    dot: "bg-emerald-500",
    band: "bg-[color-mix(in_oklab,var(--color-emerald-500)_20%,var(--color-quebi-bg))]",
    selected: "outline-emerald-500",
  },
  violet: {
    block: "bg-[color-mix(in_oklab,var(--color-violet-500)_15%,var(--color-quebi-bg))] hover:bg-[color-mix(in_oklab,var(--color-violet-500)_25%,var(--color-quebi-bg))]",
    edge: "border-l-violet-500",
    dot: "bg-violet-500",
    band: "bg-[color-mix(in_oklab,var(--color-violet-500)_20%,var(--color-quebi-bg))]",
    selected: "outline-violet-500",
  },
  rose: {
    block: "bg-[color-mix(in_oklab,var(--color-rose-500)_15%,var(--color-quebi-bg))] hover:bg-[color-mix(in_oklab,var(--color-rose-500)_25%,var(--color-quebi-bg))]",
    edge: "border-l-rose-500",
    dot: "bg-rose-500",
    band: "bg-[color-mix(in_oklab,var(--color-rose-500)_20%,var(--color-quebi-bg))]",
    selected: "outline-rose-500",
  },
}

/** The zone every view is drawn in unless told otherwise — pinned, never read
 * from the runtime. A prerendered calendar and the browser that hydrates it are
 * two machines with two `Intl.DateTimeFormat().resolvedOptions().timeZone`s, and
 * a day grid that disagrees about which day it is re-renders every event. Same
 * argument, same default as `FormattedDate`. */
export const DEFAULT_CALENDAR_TIME_ZONE = "Europe/Berlin"

/** The event's own colour, else its calendar's, else the first slot. */
export function resolveEventColor(
  event: CalendarEvent,
  calendars: readonly CalendarSource[] | undefined,
): CalendarColorName {
  if (event.color) return event.color
  const source = calendars?.find((candidate) => candidate.id === event.calendarId)
  return source?.color ?? "brand"
}

/** `09:00` / `9:00 AM` — the locale decides, the cache builds the formatter once. */
export function formatEventTime(instant: ZonedDateTime, locale: string, timeZone: string) {
  return getDateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone }).format(
    instant.toDate(),
  )
}

/** The gutter label for an hour — `09 Uhr`, `9 AM`. */
function formatHourLabel(day: CalendarDate, hour: number, locale: string, timeZone: string) {
  const instant = toZoned(toCalendarDateTime(day, new Time(hour)), timeZone)
  return getDateTimeFormat(locale, { hour: "numeric", timeZone }).format(instant.toDate())
}

/** A `CalendarDate` as a `Date`, at midnight in `timeZone`, for a formatter. */
export function dayToDate(day: CalendarDate, timeZone: string): Date {
  return toZoned(toCalendarDateTime(day, new Time(0)), timeZone).toDate()
}

/**
 * The current instant, or `null` until the component has mounted.
 *
 * Reading the clock during render puts one time in the prerendered HTML and a
 * different one in the hydrated tree, so the now-marker is absent from the
 * server's output by construction and appears on mount. It then re-reads once a
 * minute, which is the resolution the marker is drawn at. Pass `now` explicitly
 * to pin it — the tests do, and so should anything that needs a stable
 * screenshot.
 */
export function useCalendarNowInstant(
  provided: ZonedDateTime | null | undefined,
  timeZone: string,
): ZonedDateTime | null {
  const [tick, setTick] = useState<Date | null>(null)

  useEffect(() => {
    if (provided !== undefined) return
    setTick(new Date())
    const id = setInterval(() => setTick(new Date()), 60_000)
    return () => clearInterval(id)
  }, [provided])

  return useMemo(() => {
    if (provided !== undefined) return provided
    if (!tick) return null
    // `fromDate` is the instant → wall-clock conversion done *in the grid's
    // zone*, not the runtime's: the marker sits an hour out for anyone reading a
    // Berlin calendar from London if the browser's zone is allowed in here.
    return fromDate(tick, timeZone)
  }, [provided, tick, timeZone])
}

/**
 * Today's date in `timeZone`, or `null` until mount.
 *
 * The same prerender argument as `useCalendarNowInstant`, for the views that
 * only need the day:
 * the month grid highlights today, and a build machine's idea of today is not
 * the reader's. Pass a `CalendarDate` to pin it, or `null` to highlight nothing.
 */
export function useCalendarToday(
  provided: CalendarDate | null | undefined,
  timeZone: string,
): CalendarDate | null {
  const instant = useCalendarNowInstant(provided === undefined ? undefined : null, timeZone)
  if (provided !== undefined) return provided
  return instant ? toCalendarDate(instant) : null
}

/**
 * The axis as the four numbers any conversion between minutes and pixels needs.
 *
 * The grid positions with `offsetOfMinutes` and reads a drop back with
 * `minutesFromOffset`. They are written as a pair, and the pair is why an event
 * dropped on a gridline lands on the time that line is labelled with.
 */
export interface CalendarAxis {
  /** First hour drawn. */
  startHour: number
  /** Last hour drawn, exclusive. */
  endHour: number
  /** Pixels per hour. */
  hourHeight: number
  /** The snap step in minutes — the sub-slot lines the grid draws. */
  slotMinutes: number
}

/** Clock minutes → pixels down the grid. What every block is positioned by. */
export function offsetOfMinutes(minutes: number, axis: CalendarAxis): number {
  return ((minutes - axis.startHour * 60) * axis.hourHeight) / 60
}

/**
 * Pixels down the grid → clock minutes: the inverse of `offsetOfMinutes`,
 * snapped and clamped (task #182).
 *
 * The snap is to the sub-slot the grid actually draws, anchored at the top of
 * the axis, so a dropped block sits *on* a line rather than near one — and a
 * 09:15 event dragged anywhere lands at :00 or :30 under the default
 * `slotMinutes`, because the grid it is being dropped onto has no other lines
 * on it. With `slotMinutes` at 0 the only lines are the hours and the snap
 * follows them.
 *
 * The clamp takes `durationMinutes` because what has to fit is the block, not
 * its top edge: a block lands whole inside `[startHour, endHour)` or it does
 * not land there at all. The axis is the grid's extent rather than a scroll
 * position — `startHour` says so, and `segmentByDay` cuts against it — so a
 * drop half an hour past `endHour` would hand the reader an event the grid
 * cannot draw, which is an event that vanished under their own hand. The upper
 * bound is floored back onto the snap grid, so the last legal position is still
 * on a line, and an event longer than the axis pins to the top of it.
 */
export function minutesFromOffset(top: number, axis: CalendarAxis, durationMinutes = 0): number {
  const first = axis.startHour * 60
  const last = axis.endHour * 60
  const step = axis.slotMinutes > 0 ? axis.slotMinutes : 60
  const raw = axis.hourHeight > 0 ? first + (top * 60) / axis.hourHeight : first
  const snapped = first + Math.round((raw - first) / step) * step
  const latest = first + Math.floor(Math.max(0, last - durationMinutes - first) / step) * step
  return Math.min(Math.max(snapped, first), Math.max(first, latest))
}

/**
 * Which day column `x` pixels across the grid falls in.
 *
 * The columns are equal fractions of the one `relative grid flex-1` container,
 * so the hit test needs that container's width and nothing else — which is what
 * makes a drag that leaves its own day answerable at all: the per-day wrappers
 * the blocks live in are laid out by the grid and have no coordinate space a
 * neighbouring column is expressible in. An x outside the grid clamps to the
 * first or last day rather than reporting a column that is not there, so a drag
 * off the side lands on the edge it left by.
 */
export function dayIndexAtOffset(x: number, gridWidth: number, dayCount: number): number {
  if (dayCount <= 1 || gridWidth <= 0) return 0
  return Math.min(dayCount - 1, Math.max(0, Math.floor(x / (gridWidth / dayCount))))
}

/** A `CalendarDate` plus clock minutes as an instant, rolling over midnight. */
function zonedAt(day: CalendarDate, minutes: number, timeZone: string): ZonedDateTime {
  const dayOffset = Math.floor(minutes / MINUTES_PER_DAY)
  const within = minutes - dayOffset * MINUTES_PER_DAY
  const base = dayOffset === 0 ? day : day.add({ days: dayOffset })
  return toZoned(
    toCalendarDateTime(base, new Time(Math.floor(within / 60), within % 60)),
    timeZone,
  )
}

/**
 * Where an event was dropped.
 *
 * A start, an end and a calendar rather than a delta, because the consumer owns
 * the events array and what it needs is the event it should write back — the
 * same shape `ServerTable` hands to `onQueryChange`. Move preserves the
 * duration, so `end` is `start` plus what the event already lasted; the field
 * is here for the resize that will arrive behind this same prop.
 */
export interface CalendarEventChange {
  start: ZonedDateTime
  end: ZonedDateTime
  /**
   * The calendar the event landed on, when the thing a column stands for is a
   * calendar. Undefined from the grid views, whose columns are days.
   */
  calendarId?: string
}

/** The ghost drawn at the snapped target while a drag is in flight. */
export interface CalendarMovePreview<E extends CalendarEvent = CalendarEvent> {
  event: E
  /** Column the ghost sits in. */
  dayIndex: number
  /** Clock minutes on that day — the ghost's geometry. */
  startMinutes: number
  endMinutes: number
  /** The drop it stands for, which is what `onEventChange` is handed. */
  start: ZonedDateTime
  end: ZonedDateTime
}

/** How far a pointer has to travel before the gesture is a drag and not a click. */
const DRAG_THRESHOLD = 3

interface MoveOrigin<E extends CalendarEvent> {
  event: E
  dayIndex: number
  startMinutes: number
  durationMinutes: number
  /** Page coordinates of the press. Null for a keyboard move, which has none. */
  pointer: { x: number; y: number } | null
  /** The grid's box in page coordinates, read once — see `start`. */
  grid: { left: number; width: number } | null
  deltaX: number
  deltaY: number
  target: { dayIndex: number; startMinutes: number } | null
  dragged: boolean
}

interface EventMoveOptions<E extends CalendarEvent> {
  days: readonly CalendarDate[]
  timeZone: string
  axis: CalendarAxis
  gridRef: React.RefObject<HTMLDivElement | null>
  isEventEditable: boolean | ((event: E) => boolean) | undefined
  onEventChange: ((event: E, next: CalendarEventChange) => void) | undefined
  announce: (event: E, next: CalendarMovePreview<E>) => void
  hintId: string
}

interface EventMoveController<E extends CalendarEvent> {
  /** Is anything movable at all? Gates the hint and the live region. */
  enabled: boolean
  /** The sr-only line describing the gesture, for `aria-describedby`. */
  hintId: string
  preview: CalendarMovePreview<E> | null
  isMovable: (segment: DaySegment<E>) => boolean
  start: (segment: DaySegment<E>, pointer: { x: number; y: number } | null) => void
  move: (deltaX: number, deltaY: number, pointerType: string) => void
  end: (pointerType: string) => void
  /** Was the press that just fired the tail of a drag? Consumes the flag. */
  consumePress: () => boolean
}

/** `CSS.escape`, where there is one — happy-dom and older engines have none. */
const escapeId = (id: string) =>
  typeof CSS !== "undefined" && typeof CSS.escape === "function" ? CSS.escape(id) : id

/**
 * Dragging an event to another time or another day (task #182).
 *
 * Three decisions are in here rather than in the caller, because all three are
 * about what the grid can honestly draw:
 *
 * - **Nothing repacks mid-drag.** The feedback is a ghost at the snapped
 *   target, so the real blocks never leave their column while the pointer is
 *   down — `packColumns` is a pass over the whole day, and re-running it per
 *   frame would reflow the dragged event's neighbours under a reader who is
 *   looking at something else. The drop reports, the consumer re-renders, and
 *   the packer runs once, on the new events.
 * - **A cut segment is not movable.** `continuesBefore` / `continuesAfter` mean
 *   the block is a slice of an event whose real start is off the axis, so a
 *   drop position for *it* says nothing about where the event goes. The 22:00
 *   → 06:00 shift is the case: it draws as two blocks on two days, and neither
 *   of them is the thing you would be moving.
 * - **A press is not a drag.** react-aria's press fires from a document-level
 *   `pointerup` and `useMove`'s end from a window-level one, so the press
 *   always arrives first and cannot be suppressed from `onMoveEnd`. The flag is
 *   therefore set on the first `onMove` past `DRAG_THRESHOLD` and consumed by
 *   the press, which is what keeps a plain click selecting.
 */
function useEventMove<E extends CalendarEvent>(
  options: EventMoveOptions<E>,
): EventMoveController<E> {
  const { days, timeZone, axis, gridRef, isEventEditable, onEventChange, announce, hintId } =
    options
  const [preview, setPreview] = useState<CalendarMovePreview<E> | null>(null)
  const originRef = useRef<MoveOrigin<E> | null>(null)
  const draggedRef = useRef(false)
  const refocusRef = useRef<string | null>(null)

  // A keyboard move commits on every key press, and a commit that changes the
  // day remounts the block under another column's wrapper — React has no way to
  // carry focus across that, and a focus lost after the first ArrowRight is the
  // keyboard path gone. So the block is found again by the id it carries and
  // re-focused, once, on the render that follows the commit.
  useEffect(() => {
    const id = refocusRef.current
    if (!id) return
    refocusRef.current = null
    gridRef.current
      ?.querySelector<HTMLElement>(
        `[data-slot="calendar-event"][data-event-id="${escapeId(id)}"]`,
      )
      ?.focus()
  })

  const enabled = onEventChange !== undefined && isEventEditable !== undefined

  const isMovable = (segment: DaySegment<E>) => {
    if (!enabled) return false
    if (segment.continuesBefore || segment.continuesAfter) return false
    return typeof isEventEditable === "function"
      ? isEventEditable(segment.event)
      : isEventEditable === true
  }

  const previewAt = (
    origin: MoveOrigin<E>,
    dayIndex: number,
    startMinutes: number,
  ): CalendarMovePreview<E> | null => {
    const day = days[dayIndex]
    if (!day) return null
    const start = zonedAt(day, startMinutes, timeZone)
    return {
      event: origin.event,
      dayIndex,
      startMinutes,
      endMinutes: startMinutes + origin.durationMinutes,
      start,
      // Wall-clock arithmetic, so a 90-minute meeting is 90 minutes on the
      // clock it is read from even on the day a zone changes offset.
      end: start.add({ minutes: origin.durationMinutes }),
    }
  }

  const commit = (origin: MoveOrigin<E>, pointerType: string) => {
    const target = origin.target
    if (!target) return
    if (target.dayIndex === origin.dayIndex && target.startMinutes === origin.startMinutes) return
    const next = previewAt(origin, target.dayIndex, target.startMinutes)
    if (!next) return
    if (pointerType === "keyboard") refocusRef.current = origin.event.id
    onEventChange?.(origin.event, { start: next.start, end: next.end })
    announce(origin.event, next)
  }

  return {
    enabled,
    hintId,
    preview,
    isMovable,

    start(segment, pointer) {
      draggedRef.current = false
      if (!isMovable(segment)) {
        originRef.current = null
        return
      }
      // The grid's box is read once, at the press. Reading it per frame would
      // pick up the scroll the drag itself can cause and walk the ghost.
      const rect = gridRef.current?.getBoundingClientRect()
      originRef.current = {
        event: segment.event,
        dayIndex: segment.dayIndex,
        startMinutes: segment.start,
        durationMinutes: segment.end - segment.start,
        pointer,
        grid: rect ? { left: rect.left + window.scrollX, width: rect.width } : null,
        deltaX: 0,
        deltaY: 0,
        target: null,
        dragged: false,
      }
    },

    move(deltaX, deltaY, pointerType) {
      const origin = originRef.current
      if (!origin) return

      // `useMove` reports one unit per arrow press whatever the pointer type,
      // so the keyboard's unit is chosen here: a slot down the axis, a day
      // across it. Each press commits on its own `moveend`, which is what makes
      // the move announceable step by step instead of only at the end.
      if (pointerType === "keyboard") {
        const step = axis.slotMinutes > 0 ? axis.slotMinutes : 60
        origin.target = {
          dayIndex: Math.min(days.length - 1, Math.max(0, origin.dayIndex + Math.sign(deltaX))),
          startMinutes: minutesFromOffset(
            offsetOfMinutes(origin.startMinutes + Math.sign(deltaY) * step, axis),
            axis,
            origin.durationMinutes,
          ),
        }
        return
      }

      origin.deltaX += deltaX
      origin.deltaY += deltaY
      if (
        Math.abs(origin.deltaX) > DRAG_THRESHOLD ||
        Math.abs(origin.deltaY) > DRAG_THRESHOLD
      ) {
        origin.dragged = true
        draggedRef.current = true
      }

      // An unmeasurable grid keeps the event in its own column rather than
      // guessing at the first one: a drag that cannot answer "which day" has
      // not been told the event moved days.
      const dayIndex =
        origin.grid && origin.grid.width > 0 && origin.pointer
          ? dayIndexAtOffset(
              origin.pointer.x + origin.deltaX - origin.grid.left,
              origin.grid.width,
              days.length,
            )
          : origin.dayIndex
      const startMinutes = minutesFromOffset(
        offsetOfMinutes(origin.startMinutes, axis) + origin.deltaY,
        axis,
        origin.durationMinutes,
      )
      origin.target = { dayIndex, startMinutes }
      setPreview(previewAt(origin, dayIndex, startMinutes))
    },

    end(pointerType) {
      const origin = originRef.current
      originRef.current = null
      setPreview(null)
      if (!origin) return
      // A wobble under the threshold is the click it looked like, and the press
      // that follows it is left to do its job.
      if (pointerType !== "keyboard" && !origin.dragged) return
      commit(origin, pointerType)
    },

    consumePress() {
      if (!draggedRef.current) return false
      draggedRef.current = false
      return true
    },
  }
}

export interface CalendarShellProps<E extends CalendarEvent = CalendarEvent> {
  /** The visible days, left to right. One for a day view, seven for a week. */
  days: readonly CalendarDate[]
  events: readonly E[]
  /** Colour and naming for the calendars the events belong to. */
  calendars?: readonly CalendarSource[]
  /** IANA zone the grid is drawn in. Pinned by default — see the constant. */
  timeZone?: string
  /** BCP 47 tag. Defaults to the nearest `I18nProvider`'s locale. */
  locale?: string
  /**
   * First hour on the axis. Default 0.
   *
   * The axis is the grid's extent, not a scroll position: an event outside
   * `[startHour, endHour)` is not drawn, and one reaching across either edge is
   * cut at it and gets the same flat edge a midnight crossing does. Narrow the
   * axis and you are choosing what the grid shows, so pair it with a filter the
   * reader can see if events can fall outside it.
   */
  startHour?: number
  /** Last hour on the axis, exclusive. Default 24. See `startHour`. */
  endHour?: number
  /** Pixels per hour. Default 48. */
  hourHeight?: number
  /** Minutes between the faint intermediate gridlines. Default 30. */
  slotMinutes?: number
  /** Width of the time gutter in pixels. Default 60. */
  axisWidth?: number
  /** Height of the scrolling area in pixels. Default 520. */
  height?: number
  /** Pin the now-marker, or pass `null` to omit it. Undefined reads the clock after mount. */
  now?: ZonedDateTime | null
  /** Draw the all-day band above the grid. Default true. */
  showAllDayRow?: boolean
  /** Lanes the all-day band may grow to before it folds into "+N more". Default 2. */
  maxAllDayLanes?: number
  /** Accessible name and gutter label for the all-day band. */
  allDayLabel?: string
  /** `(n) => "+2 more"`. */
  moreLabel?: (count: number) => string
  /** Draw the weekday/date row above the grid. Default true. */
  showDayHeaders?: boolean
  /** Replace the default weekday + date header for one column. */
  renderDayHeader?: (day: CalendarDate, index: number) => React.ReactNode
  /** The event drawn as selected. Controlled. */
  selectedEventId?: string | null
  /** The initially selected event, for the uncontrolled case. */
  defaultSelectedEventId?: string | null
  /** Fires with the new selection, or `null` when the selected event is clicked again. */
  onSelectionChange?: (id: string | null) => void
  /** Fires on every activation, selected or not. */
  onEventClick?: (event: E) => void
  /** Fires when an overflow link is activated, with everything on that day. */
  onMoreClick?: (day: CalendarDate, events: E[]) => void
  /**
   * Which events may be dragged to another time or another day. Default none.
   *
   * Opt-in per event, because "can this be moved" is a question about the
   * event and not about the view: a meeting someone else owns, a booking past
   * its cut-off and a holiday are all things a calendar draws and nobody may
   * drag. Pass `true` for all of them, or a predicate.
   *
   * It takes two to turn the gesture on: without `onEventChange` a drop has
   * nowhere to go, so nothing is movable however this prop reads. An event the
   * axis *cuts* — a shift running past midnight, drawn as two blocks — is not
   * movable either, whatever the predicate says, because neither of its blocks
   * is the event you would be moving.
   */
  isEventEditable?: boolean | ((event: E) => boolean)
  /**
   * Fires once on drop, with the event and where it landed.
   *
   * The shell moves nothing. It reports the drop and re-renders from the
   * `events` you hand back, the same contract `ServerTable`'s `onQueryChange`
   * has — so an app that validates the move, refuses it, or rounds it to its
   * own booking grid does that by not writing the event it was given, and the
   * block stays where it was with nothing to undo.
   *
   * The duration is preserved, and `calendarId` is undefined from the grid
   * views: their columns are days.
   */
  onEventChange?: (event: E, next: CalendarEventChange) => void
  /** What a screen reader is told a movable event can do. */
  moveHintLabel?: string
  /** The line announced after a move. Defaults to the event and its new slot. */
  moveAnnouncement?: (event: E, next: CalendarEventChange) => string
  className?: string
}

/**
 * The time grid: a gutter, `days.length` columns, and the events packed into
 * them. Every geometric decision here comes out of `@/lib/calendar`; what is
 * left is turning minutes into pixels.
 */
export function CalendarShell<E extends CalendarEvent = CalendarEvent>({
  days,
  events,
  calendars,
  timeZone = DEFAULT_CALENDAR_TIME_ZONE,
  locale: localeProp,
  startHour = 0,
  endHour = 24,
  hourHeight = 48,
  slotMinutes = 30,
  axisWidth = 60,
  height = 520,
  now,
  showAllDayRow = true,
  maxAllDayLanes = 2,
  allDayLabel = "all day",
  moreLabel = (count) => `+${count} more`,
  showDayHeaders = true,
  renderDayHeader,
  selectedEventId,
  defaultSelectedEventId = null,
  onSelectionChange,
  onEventClick,
  onMoreClick,
  isEventEditable,
  onEventChange,
  moveHintLabel = "Press the arrow keys to move this event.",
  moveAnnouncement,
  className,
}: CalendarShellProps<E>) {
  const { locale: contextLocale } = useLocale()
  const locale = localeProp ?? contextLocale
  const selection = useSelection(selectedEventId, defaultSelectedEventId, onSelectionChange)
  const currentInstant = useCalendarNowInstant(now, timeZone)

  const axisStart = Math.max(0, Math.min(23, Math.trunc(startHour)))
  const axisEnd = Math.max(axisStart + 1, Math.min(24, Math.trunc(endHour)))
  const gridHeight = (axisEnd - axisStart) * hourHeight
  const axis: CalendarAxis = {
    startHour: axisStart,
    endHour: axisEnd,
    hourHeight,
    slotMinutes,
  }

  // Cut against the axis, not against midnight: `toTop` is a linear map with no
  // clamp in it, so a segment the window does not contain is drawn outside the
  // grid rather than not at all — see `DayWindow`.
  const segments = useMemo(
    () =>
      segmentByDay(events, days, timeZone, {
        startMinute: axisStart * 60,
        endMinute: axisEnd * 60,
      }),
    [events, days, timeZone, axisStart, axisEnd],
  )
  const packed = useMemo(() => packColumns(segments), [segments])
  const bands = useMemo(() => packBands(events, days, timeZone), [events, days, timeZone])
  const limited = useMemo(
    () => limitLanes(bands, days.length, maxAllDayLanes),
    [bands, days.length, maxAllDayLanes],
  )

  // One direction of the pair. `minutesFromOffset` is the other, and a drag
  // reads its drop back through it.
  const toTop = (minutes: number) => offsetOfMinutes(minutes, axis)
  const hours = Array.from({ length: axisEnd - axisStart }, (_, index) => axisStart + index)
  const firstDay = days[0]

  // Where the now-marker goes, or `null` when there is no line to draw on any
  // column: no clock read yet, or a reading this axis does not cover. The second
  // half is the guard `CalendarTimeline` has always had — without it 19:04 on a
  // 09:00–13:00 axis is placed 388px below the last gridline, which is scrollable
  // space the grid never drew (task #161).
  const markerMinutes = currentInstant ? currentInstant.hour * 60 + currentInstant.minute : null
  const markerTop =
    markerMinutes !== null && markerMinutes >= axisStart * 60 && markerMinutes <= axisEnd * 60
      ? toTop(markerMinutes)
      : null

  const columns = { gridTemplateColumns: `repeat(${Math.max(1, days.length)}, minmax(0, 1fr))` }

  const gridRef = useRef<HTMLDivElement>(null)
  const hintId = useId()
  const [announcement, setAnnouncement] = useState("")
  const move = useEventMove<E>({
    days,
    timeZone,
    axis,
    gridRef,
    isEventEditable,
    onEventChange,
    hintId,
    announce: (event, next) =>
      setAnnouncement(
        moveAnnouncement
          ? moveAnnouncement(event, { start: next.start, end: next.end })
          : `${event.title}: ${getDateTimeFormat(locale, {
              weekday: "long",
              day: "numeric",
              month: "long",
              timeZone,
            }).format(next.start.toDate())}, ${formatEventTime(next.start, locale, timeZone)} – ${formatEventTime(next.end, locale, timeZone)}`,
      ),
  })

  const activate = (event: E) => {
    selection.toggle(event.id)
    onEventClick?.(event)
  }

  return (
    <div
      data-slot="calendar-shell"
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-quebi-md",
        "border border-quebi-line/10 bg-quebi-bg",
        className,
      )}
    >
      {showDayHeaders ? (
        <div className="flex border-quebi-line/10 border-b">
          <div className="shrink-0" style={{ width: axisWidth }} />
          <div className="grid flex-1" style={columns}>
            {days.map((day, index) => (
              <div
                key={day.toString()}
                data-slot="calendar-day-header"
                className="border-quebi-line/10 border-l px-2 py-2 text-center first:border-l-0"
              >
                {renderDayHeader ? (
                  renderDayHeader(day, index)
                ) : (
                  <DayHeading
                    day={day}
                    locale={locale}
                    timeZone={timeZone}
                    isToday={isSameDayAs(currentInstant, day)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {showAllDayRow ? (
        <div className="flex border-quebi-line/10 border-b">
          <div
            className="shrink-0 px-2 py-1 text-right text-quebi-fg-subtle text-xs"
            style={{ width: axisWidth }}
          >
            {allDayLabel}
          </div>
          <AllDayBand
            days={days}
            bands={limited.bands}
            hiddenPerDay={limited.hiddenPerDay}
            allBands={bands}
            segments={segments}
            calendars={calendars}
            locale={locale}
            timeZone={timeZone}
            columns={columns}
            selectedId={selection.value}
            moreLabel={moreLabel}
            onActivate={activate}
            onMoreClick={onMoreClick}
          />
        </div>
      ) : null}

      {/* The one scrolling surface in the shell, and it took the platform's bar
          until now — stepper arrows on Linux, a grey slab everywhere, next to
          the quebi pill every other scroll surface in the library draws.
          `quebi-scrollbar` is that pill; see the utility in `quebi-theme.css`.
          No `quebi-scrollbar-corners` here: this viewport is a square box, and
          the rounded corner the bar has to curve away from belongs to
          `calendar-shell` above, whose `overflow-hidden rounded-quebi-md`
          already clips the bar with it. */}
      <div
        data-slot="calendar-viewport"
        className="quebi-scrollbar relative overflow-y-auto"
        style={{ maxHeight: height }}
      >
        <div className="flex" style={{ height: gridHeight }}>
          <div className="relative shrink-0" style={{ width: axisWidth }}>
            {firstDay
              ? hours.map((hour) => (
                  <div
                    key={hour}
                    className="-translate-y-1/2 absolute right-2 text-quebi-fg-subtle text-xs tabular-nums"
                    style={{ top: toTop(hour * 60) }}
                  >
                    {hour === axisStart ? null : formatHourLabel(firstDay, hour, locale, timeZone)}
                  </div>
                ))
              : null}
          </div>

          <div
            ref={gridRef}
            data-slot="calendar-grid"
            className="relative grid flex-1"
            style={columns}
          >
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="absolute inset-x-0 border-quebi-line/10 border-t"
                  style={{ top: toTop(hour * 60) }}
                />
              ))}
              {slotMinutes > 0 && slotMinutes < 60
                ? hours.flatMap((hour) =>
                    subSlots(slotMinutes).map((offset) => (
                      <div
                        key={`${hour}:${offset}`}
                        className="absolute inset-x-0 border-quebi-line/5 border-t"
                        style={{ top: toTop(hour * 60 + offset) }}
                      />
                    )),
                  )
                : null}
            </div>

            {days.map((day, index) => (
              <div
                key={day.toString()}
                className="relative border-quebi-line/10 border-l first:border-l-0"
              >
                {packed
                  .filter((segment) => segment.dayIndex === index)
                  .map((segment) => (
                    <TimedBlock
                      key={`${segment.event.id}:${segment.dayIndex}`}
                      segment={segment}
                      color={resolveEventColor(segment.event, calendars)}
                      top={toTop(segment.start)}
                      bottom={toTop(segment.end)}
                      gridHeight={gridHeight}
                      locale={locale}
                      timeZone={timeZone}
                      isSelected={selection.value === segment.event.id}
                      isMovable={move.isMovable(segment)}
                      isDragging={move.preview?.event.id === segment.event.id}
                      move={move}
                      onActivate={activate}
                    />
                  ))}
                {markerTop !== null && currentInstant && isSameDayAs(currentInstant, day) ? (
                  <NowMarker
                    top={markerTop}
                    label={formatEventTime(currentInstant, locale, timeZone)}
                  />
                ) : null}
              </div>
            ))}

            {move.preview ? (
              <MovePreviewBlock
                preview={move.preview}
                color={resolveEventColor(move.preview.event, calendars)}
                dayCount={Math.max(1, days.length)}
                top={toTop(move.preview.startMinutes)}
                bottom={toTop(move.preview.endMinutes)}
                locale={locale}
                timeZone={timeZone}
              />
            ) : null}
          </div>
        </div>
      </div>

      {/* The keyboard half of the gesture needs saying out loud, twice over:
          a movable block is described as movable before anyone tries, and
          every landing is announced, because the ghost and the snapped
          position are pictures and a picture is not a channel every reader
          has. The region is `polite` — a move is the reader's own doing, so it
          waits its turn rather than interrupting. */}
      {move.enabled ? (
        <>
          <span id={hintId} className="sr-only">
            {moveHintLabel}
          </span>
          <span role="status" aria-live="polite" className="sr-only">
            {announcement}
          </span>
        </>
      ) : null}
    </div>
  )
}

/** Faint lines inside an hour, at `every` minutes — 30 gives the half-hour rule. */
function subSlots(every: number): number[] {
  const offsets: number[] = []
  for (let minute = every; minute < 60; minute += every) offsets.push(minute)
  return offsets
}

/** Is `instant` on `day`, read in `timeZone`? Used for "today" and the marker. */
function isSameDayAs(instant: ZonedDateTime | null, day: CalendarDate): boolean {
  if (!instant) return false
  return toCalendarDate(instant).compare(day) === 0
}

/** Controlled-or-not selection of a single event id. */
function useSelection(
  controlled: string | null | undefined,
  initial: string | null,
  onChange: ((id: string | null) => void) | undefined,
) {
  const [uncontrolled, setUncontrolled] = useState<string | null>(initial)
  const value = controlled === undefined ? uncontrolled : controlled

  return {
    value,
    toggle(id: string) {
      const next = value === id ? null : id
      if (controlled === undefined) setUncontrolled(next)
      onChange?.(next)
    },
  }
}

interface DayHeadingProps {
  day: CalendarDate
  locale: string
  timeZone: string
  isToday: boolean
}

/** `Mo` over `21`, with today's number filled in brand teal. */
export function DayHeading({ day, locale, timeZone, isToday }: DayHeadingProps) {
  const date = dayToDate(day, timeZone)
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-quebi-fg-subtle text-xs uppercase">
        {getDateTimeFormat(locale, { weekday: "short", timeZone }).format(date)}
      </span>
      <span
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full font-semibold text-sm tabular-nums",
          isToday ? "bg-quebi-brand text-quebi-on-brand" : "text-quebi-fg",
        )}
      >
        {getDateTimeFormat(locale, { day: "numeric", timeZone }).format(date)}
      </span>
    </div>
  )
}

interface TimedBlockProps<E extends CalendarEvent> {
  segment: DaySegment<E> & { column: number; columns: number; span: number }
  color: CalendarColorName
  top: number
  bottom: number
  /** The axis's full height, so a block short enough to need padding stays in it. */
  gridHeight: number
  locale: string
  timeZone: string
  isSelected: boolean
  /** May this block be dragged? See `isEventEditable`. */
  isMovable: boolean
  /** Is this the block the ghost currently stands for? */
  isDragging: boolean
  move: EventMoveController<E>
  onActivate: (event: E) => void
}

/** The shortest block that still holds a line of text. */
const MIN_BLOCK_HEIGHT = 18

const NO_OP = () => {}

/**
 * The event, minus its ability to cancel the press it may still turn out to be.
 *
 * `useMove` stops propagation and prevents the default on `pointerdown`, which
 * is right when it owns the element and wrong when it is being started from
 * above one that is also a button: stopping propagation there would cancel the
 * press, and preventing the default would cancel the click the press is
 * triggered from. Everything else about the event is passed through.
 */
function withoutCancelling<T extends Element>(event: React.PointerEvent<T>): React.PointerEvent<T> {
  return new Proxy(event, {
    get(target, key) {
      if (key === "stopPropagation" || key === "preventDefault") return NO_OP
      const value = Reflect.get(target, key) as unknown
      return typeof value === "function" ? value.bind(target) : value
    },
  })
}

/** The keys `useMove` turns into a move, and so the keys that start one. */
const MOVE_KEYS = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Up", "Down", "Left", "Right"])

function TimedBlock<E extends CalendarEvent>({
  segment,
  color,
  top,
  bottom,
  gridHeight,
  locale,
  timeZone,
  isSelected,
  isMovable,
  isDragging,
  move,
  onActivate,
}: TimedBlockProps<E>) {
  const palette = CALENDAR_COLORS[color]
  const height = Math.max(MIN_BLOCK_HEIGHT, bottom - top)
  // The minimum grows a short block downwards, so a five-minute event against
  // the end of the axis would hang past the last gridline — the same escape the
  // now-marker used to make, in miniature. Push it up onto the axis instead.
  const y = Math.max(0, Math.min(top, gridHeight - height))
  const left = (segment.column / segment.columns) * 100
  const width = (segment.span / segment.columns) * 100
  // The 2px inset is the negative space that separates touching blocks. A
  // border round each one would be ink that is not data — see the palette note
  // above — and two adjacent borders read as one thick divider.
  const geometry = { top: y, height, left: `${left}%`, width: `calc(${width}% - 2px)` }

  // `useMove` rather than a raw `onPointerDown`, for two reasons that are the
  // same reason: it is the hook that already knows the difference between a
  // pointer and an arrow key, and the block it would be attached to is a
  // react-aria `Button` that captures the pointer for its own press handling.
  // What it gives back is pointer *and* keyboard movement from one surface —
  // `DaySchedule` had to hand-roll `role="slider"` plus arrow keys to get the
  // same thing, and got it for one component.
  const { moveProps } = useMove({
    onMove: (event) => move.move(event.deltaX, event.deltaY, event.pointerType),
    onMoveEnd: (event) => move.end(event.pointerType),
  })

  const block = (
    <Button
      data-slot="calendar-event"
      data-event-id={segment.event.id}
      data-dragging={isDragging || undefined}
      aria-describedby={isMovable ? move.hintId : undefined}
      onPress={() => {
        // The press that ends a drag is still a press. See `useEventMove`.
        if (isMovable && move.consumePress()) return
        onActivate(segment.event)
      }}
      style={isMovable ? undefined : geometry}
      className={cn(
        "cursor-pointer overflow-hidden text-left",
        "border-l-2 px-1.5 py-0.5 transition-colors duration-150",
        "outline-none focus-visible:ring-2 focus-visible:ring-quebi-brand-mark focus-visible:ring-inset",
        // Movable blocks are positioned by the wrapper that carries the
        // gesture, and fill it; everything else positions itself.
        isMovable ? "h-full w-full cursor-grab active:cursor-grabbing" : "absolute",
        palette.block,
        palette.edge,
        // A segment continuing past midnight loses the radius on that edge, so
        // the two halves of one event read as one thing cut, not two events.
        segment.continuesBefore ? "rounded-t-none" : "rounded-tr-quebi-sm",
        segment.continuesAfter ? "rounded-b-none" : "rounded-br-quebi-sm",
        // Selection is an outline, not the inset ring focus uses: it sits
        // outside the border box, so it neither overpaints `edge` nor
        // vanishes when the same block takes focus. `outline-solid` is
        // load-bearing — it is what displaces the `outline-none` above,
        // which would otherwise leave the outline styled away.
        isSelected && cn("outline-2 outline-solid outline-offset-0", palette.selected),
        // The block being dragged stays where it is and steps back; the ghost
        // is the thing that moves. Repacking it into its new column per frame
        // would reflow its neighbours under a reader watching the ghost.
        isDragging && "opacity-40",
      )}
    >
      <BlockText
        event={segment.event}
        locale={locale}
        timeZone={timeZone}
        height={height}
      />
    </Button>
  )

  if (!isMovable) return block

  // `touch-none` is what makes a touch drag a drag: without it the browser
  // claims the gesture for scrolling before `useMove` sees the second frame.
  return (
    <div
      data-slot="calendar-event-move"
      className="absolute touch-none"
      style={geometry}
      {...moveProps}
      onPointerDownCapture={(event) => {
        if (event.button !== 0) return
        move.start(segment, { x: event.pageX, y: event.pageY })
        // react-aria's press handling stops `pointerdown` dead on the block
        // itself — `usePress` calls `stopPropagation` unless a press handler
        // opts out, and none of them do — so the bubble-phase listener
        // `useMove` installs on this wrapper would never see one. Starting the
        // move from the capture phase is what gets both halves: the gesture
        // begins here, and the event carries on down to the button where the
        // press it might still be is waiting for it. `useMove` ignores a second
        // `pointerdown` while a pointer is down, so the listener it also
        // installed costs nothing.
        moveProps.onPointerDown?.(withoutCancelling(event))
      }}
      onKeyDownCapture={(event) => {
        if (MOVE_KEYS.has(event.key)) move.start(segment, null)
      }}
    >
      {block}
    </div>
  )
}

interface MovePreviewBlockProps<E extends CalendarEvent> {
  preview: CalendarMovePreview<E>
  color: CalendarColorName
  dayCount: number
  top: number
  bottom: number
  locale: string
  timeZone: string
}

/**
 * The ghost at the snapped target, labelled with the time it would land on.
 *
 * It is drawn in the grid container rather than in a day column, because the
 * column is the one place a drag that left it cannot be drawn: the per-day
 * wrappers are grid cells with no coordinate space their neighbours are
 * expressible in. One box, `left: (dayIndex / days.length) * 100%`, is that
 * space — and with the ghost carrying every frame of the feedback, the real
 * blocks never have to leave their wrapper, which is what kept the layout all
 * four views share out of this change.
 */
function MovePreviewBlock<E extends CalendarEvent>({
  preview,
  color,
  dayCount,
  top,
  bottom,
  locale,
  timeZone,
}: MovePreviewBlockProps<E>) {
  const palette = CALENDAR_COLORS[color]
  const height = Math.max(MIN_BLOCK_HEIGHT, bottom - top)

  return (
    <div
      data-slot="calendar-move-preview"
      // The ghost is a picture of the drag in progress; the drop itself is
      // announced through the shell's live region, where it is one line rather
      // than one per frame.
      aria-hidden="true"
      style={{
        top,
        height,
        left: `${(preview.dayIndex / dayCount) * 100}%`,
        width: `calc(${100 / dayCount}% - 2px)`,
      }}
      className={cn(
        "pointer-events-none absolute z-10 overflow-hidden px-1.5 py-0.5",
        "rounded-quebi-sm outline-2 outline-quebi-brand-mark outline-dashed",
        palette.block,
        palette.edge,
        "border-l-2",
      )}
    >
      <span className="flex flex-col gap-0.5 text-xs leading-tight">
        <span className="truncate font-semibold text-quebi-fg">{preview.event.title}</span>
        <span className="truncate text-quebi-fg-muted tabular-nums">
          {formatEventTime(preview.start, locale, timeZone)}
          {" – "}
          {formatEventTime(preview.end, locale, timeZone)}
        </span>
      </span>
    </div>
  )
}

interface BlockTextProps {
  event: CalendarEvent
  locale: string
  timeZone: string
  height: number
}

/**
 * Title, time and location, dropped one at a time as the block gets shorter.
 *
 * Text is what makes the colour a second channel rather than the only one, so
 * the title is never the thing that goes: a 20-pixel block is title-only, and
 * the time moves onto the same line where there is room for it.
 */
function BlockText({ event, locale, timeZone, height }: BlockTextProps) {
  const time = formatEventTime(event.start, locale, timeZone)

  if (height < 34) {
    return (
      <span className="flex items-baseline gap-1.5 truncate text-xs leading-tight">
        <span className="font-semibold text-quebi-fg">{event.title}</span>
        <span className="text-quebi-fg-subtle tabular-nums">{time}</span>
      </span>
    )
  }

  return (
    <span className="flex flex-col gap-0.5 text-xs leading-tight">
      <span className="truncate font-semibold text-quebi-fg">{event.title}</span>
      <span className="truncate text-quebi-fg-muted tabular-nums">
        {time}
        {" – "}
        {formatEventTime(event.end, locale, timeZone)}
      </span>
      {event.location && height >= 56 ? (
        <span className="truncate text-quebi-fg-subtle">{event.location}</span>
      ) : null}
    </span>
  )
}

/** The red line across today's column, with the clock time in the gutter end. */
function NowMarker({ top, label }: { top: number; label: string }) {
  return (
    <div
      data-slot="calendar-now-marker"
      className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
      style={{ top }}
    >
      {/* The line is the sighted channel and the text is the other one: a
          horizontal rule at a y offset is not information a screen reader can
          recover, and `aria-label` on a plain div is dropped. */}
      <span className="sr-only">{label}</span>
      <span className="-ml-1 h-2 w-2 shrink-0 rounded-full bg-red-500" aria-hidden="true" />
      <span className="h-px flex-1 bg-red-500" aria-hidden="true" />
    </div>
  )
}

interface AllDayBandProps<E extends CalendarEvent> {
  days: readonly CalendarDate[]
  bands: EventBand<E>[]
  allBands: EventBand<E>[]
  segments: readonly DaySegment<E>[]
  hiddenPerDay: number[]
  calendars: readonly CalendarSource[] | undefined
  locale: string
  timeZone: string
  columns: React.CSSProperties
  selectedId: string | null
  moreLabel: (count: number) => string
  onActivate: (event: E) => void
  onMoreClick: ((day: CalendarDate, events: E[]) => void) | undefined
}

/** The band above the grid: multi-day and all-day events, stacked in lanes. */
function AllDayBand<E extends CalendarEvent>({
  days,
  bands,
  allBands,
  segments,
  hiddenPerDay,
  calendars,
  locale,
  timeZone,
  columns,
  selectedId,
  moreLabel,
  onActivate,
  onMoreClick,
}: AllDayBandProps<E>) {
  const lanes = bands.reduce((max, band) => Math.max(max, band.lane + 1), 0)
  const overflow = hiddenPerDay.some((count) => count > 0)

  return (
    <div className="relative flex-1 py-1" style={{ minHeight: 28 }}>
      <div className="grid" style={columns}>
        {days.map((day) => (
          <div key={day.toString()} className="border-quebi-line/10 border-l first:border-l-0">
            <div style={{ height: lanes * 22 }} />
          </div>
        ))}
      </div>

      {bands.map((band) => {
        const palette = CALENDAR_COLORS[resolveEventColor(band.event, calendars)]
        const left = (band.startIndex / days.length) * 100
        const width = ((band.endIndex - band.startIndex + 1) / days.length) * 100
        return (
          <Button
            key={band.event.id}
            data-slot="calendar-band"
            data-event-id={band.event.id}
            onPress={() => onActivate(band.event)}
            style={{
              top: 4 + band.lane * 22,
              left: `${left}%`,
              width: `calc(${width}% - 4px)`,
              marginLeft: 2,
            }}
            className={cn(
              "absolute flex h-5 cursor-pointer items-center gap-1.5 overflow-hidden px-2 text-left",
              "border-l-2 text-xs transition-colors duration-150",
              "outline-none focus-visible:ring-2 focus-visible:ring-quebi-brand-mark focus-visible:ring-inset",
              palette.band,
              palette.edge,
              // Square on the accent, rounded on the trailing edge — the same
              // treatment `TimedBlock` gives its own edge, and for the same
              // reason (task #176): an 8px radius on a 20px band bends the 2px
              // series line into a crescent. The left is already square, so
              // `continuesBefore` has nothing left to change on that side;
              // `continuesAfter` still squares a band cut at the week boundary.
              "rounded-l-none",
              band.continuesAfter ? "rounded-r-none" : "rounded-r-quebi-sm",
              selectedId === band.event.id &&
                cn("outline-2 outline-solid outline-offset-0", palette.selected),
            )}
          >
            <span className="truncate font-semibold text-quebi-fg">{band.event.title}</span>
          </Button>
        )
      })}

      {overflow ? (
        <div className="grid" style={columns}>
          {days.map((day, index) => (
            <div key={day.toString()} className="px-1">
              {(hiddenPerDay[index] ?? 0) > 0 ? (
                // Supplying `onMoreClick` says the consumer owns what "+N more"
                // does — the documented "switch to this day" hook — so the
                // library draws no panel behind it. Without it the panel is the
                // default, which is the only reading under which the affordance
                // does something on its own.
                onMoreClick ? (
                  <MoreLink
                    count={hiddenPerDay[index] ?? 0}
                    label={moreLabel}
                    onPress={() => onMoreClick(day, eventsOnDay(allBands, segments, index))}
                  />
                ) : (
                  <MoreLink count={hiddenPerDay[index] ?? 0} label={moreLabel}>
                    <DayOverflowPanel
                      day={day}
                      events={eventsOnDay(allBands, segments, index)}
                      calendars={calendars}
                      locale={locale}
                      timeZone={timeZone}
                      selectedId={selectedId}
                      onActivate={onActivate}
                    />
                  </MoreLink>
                )
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

    </div>
  )
}

/**
 * `plain` is a bare row of dots for above or below the grid; `overlay` is the
 * same row on a surface, for a legend that sits *on* the calendar.
 */
export type CalendarLegendVariant = "plain" | "overlay"

export interface CalendarLegendProps {
  calendars: readonly CalendarSource[]
  /** Default "plain". "overlay" adds the surface an overlapping legend needs. */
  variant?: CalendarLegendVariant
  className?: string
}

const LEGEND_VARIANTS: Record<CalendarLegendVariant, string> = {
  plain: "",
  // The chart tooltip's treatment, for the same reason: a translucent elevated
  // surface over data reads as floating above it, and the blur keeps the row
  // legible without hiding what it covers. `shadow-lg` is the neutral occlusion
  // shadow, never the mint glow — see the note in `popover.tsx`.
  overlay:
    "rounded-quebi-md border border-quebi-line/20 bg-quebi-elevated/80 px-2.5 py-1.5 shadow-lg backdrop-blur-sm",
}

/**
 * The key: one dot and one name per calendar.
 *
 * Two or more series always get a legend — that is the rule that keeps hue a
 * second channel rather than the only one — and it lives in the library because
 * the palette does. An app that hand-rolled this row would be writing the series
 * colours into its own markup, which is the thing `no-hardcoded-design-values`
 * exists to stop; `CalendarTimeline` needs no legend because every row is
 * already labelled with its calendar's name.
 *
 * ## Where it goes is yours; what it looks like is not
 *
 * The legend takes no placement prop, because placement is layout: put it
 * before the view or after it, align it with `self-end`, stack it into a column
 * beside the grid with `className="flex-col items-start"`, or position it over
 * the calendar from a `relative` wrapper. All of that is one className and none
 * of it needs the library's permission.
 *
 * What the library does owe you is the one thing a placement cannot supply. A
 * legend laid over the grid has events behind it, so a bare row of small muted
 * text stops being readable — that is `variant="overlay"`, which is the same
 * row on an elevated surface. Reach for it whenever the legend overlaps
 * something, and leave it alone when the legend has a line of its own.
 */
export function CalendarLegend({ calendars, variant = "plain", className }: CalendarLegendProps) {
  return (
    <div
      data-slot="calendar-legend"
      data-variant={variant}
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-1",
        LEGEND_VARIANTS[variant],
        className,
      )}
    >
      {calendars.map((calendar) => (
        <span key={calendar.id} className="flex items-center gap-1.5 text-quebi-fg-muted text-xs">
          <span
            className={cn("size-2 shrink-0 rounded-full", CALENDAR_COLORS[calendar.color].dot)}
            aria-hidden="true"
          />
          {calendar.name}
        </span>
      ))}
    </div>
  )
}

export interface CalendarEventRowProps<E extends CalendarEvent = CalendarEvent> {
  event: E
  calendars: readonly CalendarSource[] | undefined
  locale: string
  timeZone: string
  isSelected: boolean
  onActivate: (event: E) => void
  /** Geometry — where the row sits and which of its corners are cut. */
  className?: string
  style?: React.CSSProperties
  /** `data-slot`; the month grid's chips answer to `calendar-chip`. */
  slot?: string
}

/**
 * One event on one line: a dot, a time and a title.
 *
 * A timed event is a dot, a time and a title on a transparent chip — the shape
 * that reads as "at 09:00" rather than as "all morning". An all-day or multi-day
 * one is the filled band, because it genuinely occupies the days it covers.
 *
 * Two things draw an event this way and they disagree about nothing except
 * where it goes: the month grid positions it absolutely from its band geometry,
 * and a "+N more" panel stacks it in a static list. So position is the caller's
 * (`className` and `style`) and everything that makes it *an event* — the
 * palette, the dot, the time, the selected ring — is here, once. Reusing the
 * chip as-is was the alternative, and it would have meant a list of absolutely
 * positioned rows all sitting on top of each other.
 */
export function CalendarEventRow<E extends CalendarEvent>({
  event,
  calendars,
  locale,
  timeZone,
  isSelected,
  onActivate,
  className,
  style,
  slot = "calendar-chip",
}: CalendarEventRowProps<E>) {
  const palette = CALENDAR_COLORS[resolveEventColor(event, calendars)]
  const filled = isAllDayEvent(event)

  return (
    <Button
      data-slot={slot}
      data-event-id={event.id}
      onPress={() => onActivate(event)}
      style={style}
      className={cn(
        "flex h-5 cursor-pointer items-center gap-1.5 overflow-hidden px-1.5 text-left text-xs",
        "transition-colors duration-150",
        "outline-none focus-visible:ring-2 focus-visible:ring-quebi-brand-mark focus-visible:ring-inset",
        filled ? cn(palette.band, "border-l-2", palette.edge) : "hover:bg-quebi-surface/[0.06]",
        // Selection is an outline, not the inset ring focus uses: it sits
        // outside the border box, so it neither overpaints `edge` nor vanishes
        // when the same row takes focus. `outline-solid` is load-bearing — it
        // is what displaces the `outline-none` above, which would otherwise
        // leave the outline styled away (task #168).
        isSelected && cn("outline-2 outline-solid outline-offset-0", palette.selected),
        className,
      )}
    >
      {filled ? null : (
        <span className={cn("size-1.5 shrink-0 rounded-full", palette.dot)} aria-hidden="true" />
      )}
      {filled ? null : (
        <span className="shrink-0 text-quebi-fg-subtle tabular-nums">
          {formatEventTime(event.start, locale, timeZone)}
        </span>
      )}
      <span className="truncate font-semibold text-quebi-fg">{event.title}</span>
    </Button>
  )
}

export interface DayOverflowPanelProps<E extends CalendarEvent = CalendarEvent> {
  day: CalendarDate
  events: readonly E[]
  calendars: readonly CalendarSource[] | undefined
  locale: string
  timeZone: string
  selectedId: string | null
  onActivate: (event: E) => void
}

/**
 * What a "+N more" opens onto: the date, and everything on it.
 *
 * Everything, not only what the cell hid — a list that started at the fourth
 * event would be a list of what the layout happened to run out of room for, and
 * it is the same payload `onMoreClick` has always been handed. Activating a row
 * closes the panel, because the question it was opened to ask has been answered
 * and the answer is behind it.
 */
export function DayOverflowPanel<E extends CalendarEvent>({
  day,
  events,
  calendars,
  locale,
  timeZone,
  selectedId,
  onActivate,
}: DayOverflowPanelProps<E>) {
  return (
    <Dialog data-slot="calendar-day-panel" className="flex flex-col gap-1 p-2 outline-none">
      {({ close }) => (
        <>
          <Heading slot="title" className="px-1.5 pb-1 font-semibold text-quebi-fg text-xs">
            {getDateTimeFormat(locale, {
              weekday: "long",
              day: "numeric",
              month: "long",
              timeZone,
            }).format(dayToDate(day, timeZone))}
          </Heading>
          {events.map((event) => (
            <CalendarEventRow
              key={event.id}
              event={event}
              calendars={calendars}
              locale={locale}
              timeZone={timeZone}
              isSelected={selectedId === event.id}
              onActivate={(activated) => {
                close()
                onActivate(activated)
              }}
              className="w-full rounded-quebi-sm"
              slot="calendar-day-event"
            />
          ))}
        </>
      )}
    </Dialog>
  )
}

export interface MoreLinkProps {
  count: number
  label: (count: number) => string
  /** Fires on press. Only reachable when the link opens no panel of its own. */
  onPress?: () => void
  /**
   * The panel the link opens, if it opens one.
   *
   * Given children the link is a popover trigger, and react-aria supplies
   * `aria-expanded`, focus into the panel, focus contained while it is open,
   * Escape to dismiss and focus back on the trigger on the way out — none of
   * which a bare button can claim. (It sets no `aria-haspopup`: react-aria
   * omits it for a dialog trigger, where `aria-expanded` is the signal.) Given
   * no children it stays that bare button, which is what keeps `onMoreClick`
   * the consumer's to own.
   */
  children?: React.ReactNode
}

/** The "+N more" affordance, shared by the all-day band and the month cells. */
export function MoreLink({ count, label, onPress, children }: MoreLinkProps) {
  const trigger = (
    <Button
      data-slot="calendar-more"
      data-more-count={count}
      onPress={children ? undefined : () => onPress?.()}
      className={cn(
        "w-full cursor-pointer truncate rounded-quebi-sm px-1 text-left text-xs",
        "text-quebi-fg-subtle transition-colors duration-150",
        "hover:bg-quebi-surface/[0.06] hover:text-quebi-fg",
        "outline-none focus-visible:ring-2 focus-visible:ring-quebi-brand-mark focus-visible:ring-inset",
      )}
    >
      {label(count)}
    </Button>
  )

  if (!children) return trigger

  return (
    <Popover>
      {trigger}
      {/* A cell is narrower than the day it holds, so `min-w-(--trigger-width)`
          alone would draw a panel the width of a "+3 more". The cap is the
          popover's own `max-w-xs`, and `maxHeight` hands react-aria the ceiling
          it then shrinks further against the viewport — a busy day scrolls in
          the popover's `quebi-scrollbar` rather than running off the screen. */}
      <PopoverContent data-slot="calendar-more-panel" className="min-w-56" maxHeight={320}>
        {children}
      </PopoverContent>
    </Popover>
  )
}

/**
 * Everything a grid view forwards to the shell untouched.
 *
 * `DayView` and `WeekView` differ in which days they hand over and in nothing
 * else, so the props they merely pass through are named once here rather than
 * re-declared twice and drifting apart on the third change.
 */
export interface CalendarGridViewProps<E extends CalendarEvent = CalendarEvent>
  extends Pick<
    CalendarShellProps<E>,
    | "events"
    | "calendars"
    | "timeZone"
    | "locale"
    | "startHour"
    | "endHour"
    | "hourHeight"
    | "slotMinutes"
    | "axisWidth"
    | "height"
    | "now"
    | "showAllDayRow"
    | "maxAllDayLanes"
    | "allDayLabel"
    | "moreLabel"
    | "selectedEventId"
    | "defaultSelectedEventId"
    | "onSelectionChange"
    | "onEventClick"
    | "onMoreClick"
    | "isEventEditable"
    | "onEventChange"
    | "moveHintLabel"
    | "moveAnnouncement"
    | "className"
  > {}

export type { CalendarColorName, CalendarEvent, CalendarSource }
export { MINUTES_PER_DAY }
