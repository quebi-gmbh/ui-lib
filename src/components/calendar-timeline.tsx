"use client"

import {
  type CalendarDate,
  Time,
  toCalendarDate,
  toCalendarDateTime,
  toZoned,
  type ZonedDateTime,
} from "@internationalized/date"
import { useEffect, useMemo, useRef, useState } from "react"
import { mergeProps, useMove } from "react-aria"
import { Button } from "react-aria-components"
import {
  CALENDAR_COLORS,
  type CalendarEvent,
  type CalendarEventChange,
  type CalendarSource,
  DEFAULT_CALENDAR_TIME_ZONE,
  formatEventTime,
  resolveEventColor,
  useCalendarNowInstant,
} from "@/components/calendar-shell"
import {
  calendarRangeLabel,
  type CalendarToolbarLabelVariant,
  CalendarToolbar,
  type CalendarViewName,
  useCalendarLocale,
  useCalendarNavigation,
} from "@/components/calendar-toolbar"
import { packBands, packIntervals, segmentByDay, wallMinutes } from "@/lib/calendar"
import { getDateTimeFormat } from "@/lib/intl"
import { cn } from "@/lib/utils"

/**
 * CalendarTimeline — quebi design system
 *
 * One row per calendar, resource or room, with time running *horizontally*. This
 * is the view that answers "who is busy when" — six people side by side for one
 * day, rather than one person's day in detail — and it is the piece the library
 * had no form of at all.
 *
 * It is the same parts turned ninety degrees: the same event model, the same
 * per-calendar palette, and the same interval packing, used here to stack
 * overlapping events *within* a row so a double-booked room grows a second lane
 * instead of drawing two bars on top of each other. What it does not share is
 * `CalendarShell`'s axis, because a vertical axis and a horizontal one have
 * almost no geometry in common — so the family is two render surfaces over one
 * model, which is exactly the shape `TableShell` and `TableControls` have.
 *
 * The axis is `days` wide (task #167). One day is a schedule; three is a sprint;
 * thirty is the resource plan the `gantt` tag promises. Each day keeps its own
 * `[startHour, endHour)` window, so widening the span narrows every day rather
 * than changing what a day means — and the header degrades with it, dropping the
 * hour row entirely once a day column is too narrow for hours to be the unit you
 * read (see `hourTickStep`).
 *
 * Each row is labelled with its calendar's name in a column that stays put while
 * the time axis scrolls, so the colour is the second channel and never the only
 * one.
 *
 * A bar is display and selection until `isEventEditable` and `onEventChange`
 * are both given, and then it is also something to drag: along the axis to
 * another time, onto another row to change which calendar owns it, and by
 * either end to change how long it is (task #183). The component never edits
 * `events` — it reports the result of the gesture and the caller applies it,
 * which is `ServerTable.onQueryChange`'s contract. What is still display-only
 * is an all-day band, and drag-to-create, which is not a gesture this has.
 */
export interface CalendarTimelineProps<E extends CalendarEvent = CalendarEvent> {
  /** The rows, top to bottom. Their `color` is what the bars in each row wear. */
  calendars: readonly CalendarSource[]
  events: readonly E[]
  /** The first day on show. Controlled. */
  date?: CalendarDate
  /** The initial first day. Defaults to today; pin it on a prerendered route. */
  defaultDate?: CalendarDate
  onDateChange?: (date: CalendarDate) => void
  /**
   * How many days the axis covers, starting at `date`. Default 1.
   *
   * A chevron pages the whole span, and the toolbar's heading becomes the range
   * label. The default `hourWidth` shrinks as this grows — see `hourWidth`.
   */
  days?: number
  timeZone?: string
  locale?: string
  /**
   * First hour on the axis, in every day of the span. Default 6 — a resource
   * view rarely starts at midnight.
   *
   * As in `CalendarShell`, the axis is the grid's extent: a bar outside
   * `[startHour, endHour)` is not drawn, and one crossing an edge is cut at it.
   * Over several days that also means an event running through midnight is two
   * segments with the undrawn night between them, which is what the window says.
   */
  startHour?: number
  /** Last hour on the axis, exclusive. Default 22. See `startHour`. */
  endHour?: number
  /**
   * Pixels per hour.
   *
   * Defaults to a width that keeps the whole span roughly two to four screens
   * wide rather than a fixed 72: 72 for one day, 48 for up to three, 20 for up
   * to a week, 8 beyond that. Pass it to overrule the span — a wide `hourWidth`
   * on a long span is a legitimate thing to want, and the header follows it.
   */
  hourWidth?: number
  /** Height of one lane within a row, in pixels. Default 30. */
  laneHeight?: number
  /** Width of the sticky name column, in pixels. Default 180. */
  nameWidth?: number
  /** Pin the now-marker, or pass `null` to omit it. Undefined reads the clock after mount. */
  now?: ZonedDateTime | null
  onEventClick?: (event: E) => void
  selectedEventId?: string | null
  onSelectionChange?: (id: string | null) => void
  /**
   * Which events may be dragged to another time, row or length. Default: none.
   *
   * A predicate rather than a flag, because editability is usually a property
   * of the event — someone else's booking, a past one, one the reader may see
   * and not touch — and a caller that had to filter `events` first would lose
   * the bars it filtered out rather than freezing them. `false`, or an omitted
   * `onEventChange`, leaves a bar exactly what it was before this existed: a
   * press target that selects.
   *
   * Two kinds of bar are never editable, whatever this returns. An all-day
   * band fills each day's window instead of occupying a time, so it has no edge
   * to pull and no minute to be dropped on. And a segment the axis *cut* — one
   * carrying `continuesBefore` or `continuesAfter`, which is how an event
   * running through midnight or past the last hour of the window is drawn — has
   * no edge of its own either: the one you would grab is the window's, so the
   * delta from it is a delta from the edge of the grid. Task #182 draws the same
   * line in the week view.
   */
  isEventEditable?: boolean | ((event: E) => boolean)
  /**
   * A move or resize finished: the event it was, and the times it now wants.
   *
   * The change is the family's `CalendarEventChange`, so a handler written for
   * `CalendarShell`'s drag (task #182) takes this one unchanged. Its
   * `calendarId` is the row the bar was dropped on — the timeline's way of
   * saying "this booking moved to another room", since a row *is* a calendar
   * here, and the field the grid views leave undefined because their columns
   * are days. It is reported on every change and equals the event's own when the
   * drag stayed in one row, so one handler can apply all three fields without
   * asking which gesture produced them; ignore it to refuse cross-row moves.
   *
   * Nothing is applied here. The component draws a preview while the gesture
   * runs and repacks only once the new `events` come back, so a caller that
   * validates, rejects or round-trips the change through a server sees the bar
   * stay where it was rather than jump and return.
   */
  onEventChange?: (event: E, next: CalendarEventChange) => void
  showToolbar?: boolean
  view?: CalendarViewName
  views?: readonly CalendarViewName[]
  onViewChange?: (view: CalendarViewName) => void
  label?: React.ReactNode
  /** The toolbar's date label as a picker that jumps to any day, or as plain
   * text. Default "picker". */
  labelVariant?: CalendarToolbarLabelVariant
  /** Shown in a row that has nothing on it. */
  emptyRowLabel?: string
  className?: string
}

/**
 * The narrowest a bar is ever drawn, and so the smallest touch target it offers.
 *
 * 24px is the WCAG 2.5.8 minimum against a 26px-tall bar, and it is a floor on
 * the *box*: `BarText` decides separately what fits inside it. `buildRows` packs
 * against the same minimum — see `minSpanMinutes`.
 */
const MIN_BAR_WIDTH = 24

/**
 * Below this a bar shows no text at all; its name lives on `aria-label`/`title`.
 *
 * Measured against the rendered Outfit 12px face rather than guessed: at this
 * width the content box is 36px (46 less `px-1` and the 2px edge), the ellipsis
 * costs 9.7px, and an average Outfit glyph at 12px advances ~6.5px — so 36px is
 * four characters and a "…". Below four characters a stub is not a word, it is
 * texture, and the tooltip serves it better than the bar does.
 */
const BAR_TITLE_WIDTH = 46

/**
 * Below this a bar shows the title alone — the time is what goes first.
 *
 * The same arithmetic with the time added: a four-character title (36px), the
 * `gap-1.5` between them (6px), the widest common time the library formats
 * ("12:00 AM" in tabular figures, ~44px) and `px-2` plus the edge (18px).
 * Also the width at which the bar can afford `px-2` at all — a bar with no room
 * for its time has no room for its padding either.
 */
const BAR_TIME_WIDTH = 104

/**
 * The hit area at each end of an editable bar, in pixels.
 *
 * Ten is the width at which an edge can be aimed at without the body behind it
 * becoming something you cannot grab — see `MIN_RESIZABLE_BAR_WIDTH`, which is
 * the same number read as a floor on the bar rather than on the handle.
 */
const RESIZE_HANDLE_WIDTH = 10

/**
 * Below this an editable bar is move-only and draws no resize handles.
 *
 * Two handles either side of a body that is still a legal touch target:
 * 24 + 2 × 10 = 44. A bar at `MIN_BAR_WIDTH` has room for the handles or for
 * itself and not for both, and a bar that is all handle cannot be moved at all
 * — which is the worse loss, because moving works at every span and resizing
 * only means something once a bar is long enough to have ends. At the thirty-day
 * default of 8px an hour, 44px is five and a half hours, so most bars on a month
 * plan are move-only by pointer.
 *
 * The keyboard is not subject to it: `Shift` + `←`/`→` on the bar itself
 * resizes at any width, so the sliver that has no room for a handle is still
 * adjustable without a pointer.
 */
const MIN_RESIZABLE_BAR_WIDTH = MIN_BAR_WIDTH + 2 * RESIZE_HANDLE_WIDTH

/**
 * The narrowest a snap step may be drawn, in pixels.
 *
 * A step is the smallest movement the component will make, so it has to be one
 * the reader can see and aim at. Eight pixels is a third of the minimum touch
 * target; below it a drag either appears not to move or moves by an amount
 * nobody asked for.
 */
const MIN_SNAP_WIDTH = 8

/**
 * Snap steps in minutes, finest first. The first to clear `MIN_SNAP_WIDTH` wins.
 *
 * Derived from `pixelsPerHour` rather than fixed at a quarter of an hour,
 * because the axis is not one scale: at the one-day default of 72px an hour a
 * quarter hour is 18px and fifteen minutes is the obvious step, and at the
 * thirty-day default of 8px an hour one *pixel* is 7.5 minutes — a
 * fifteen-minute step there is two pixels, which is not a step but a jitter.
 * The ladder lands on 15 minutes for a day or three, half an hour for a week,
 * and an hour from a fortnight out.
 *
 * It is also the shortest an event may be made by dragging its end: one step is
 * the smallest difference this scale can express, so it is the smallest one the
 * component will produce.
 */
const SNAP_STEPS = [15, 30, 60, 120, 240, 480] as const

/**
 * How far a pointer may travel before a press becomes a drag, in pixels.
 *
 * `useMove` starts reporting on the first pointer *movement*, and a hand on a
 * trackpad moves a pixel or two while clicking. Without a threshold that jitter
 * begins a gesture which changes nothing — every candidate is snapped, so a
 * two-pixel drag lands where it started — and then swallows the click that was
 * supposed to select, because the click arrives after the gesture has ended.
 * Three pixels is the figure task #182 settled on for the week view, and the
 * two views should not disagree about what counts as a click.
 */
const DRAG_SLOP = 3

/**
 * The width of the drag preview's time label, so a label near the right-hand
 * edge of the grid can be kept on it rather than scrolled off it.
 */
const DRAG_LABEL_WIDTH = 132

/**
 * The narrowest an hour tick may be drawn.
 *
 * A rendered tick is its label plus the `pl-1.5` and the 1px rule it hangs from:
 * 43.5px for the widest form the library produces ("21 Uhr" in tabular figures,
 * 36.5px of text). 48 is that with a few pixels of air, so two ticks never touch.
 */
const HOUR_TICK_WIDTH = 48

/**
 * Hour-row tick steps, coarsest last. The first that clears `HOUR_TICK_WIDTH` wins.
 *
 * 12 is deliberately absent: one tick in a working day is not an axis.
 */
const HOUR_TICK_STEPS = [1, 2, 3, 6] as const

/**
 * A day narrower than this gets no hour row — task #167's design call.
 *
 * Four legible ticks is the point below which the hour row stops describing the
 * *inside* of a day and starts competing with the day boundaries for the same
 * few pixels. Above it the reader is asking "when on Tuesday"; below it the
 * question is "which days", the day row already answers it, and a third of the
 * strip spent on hour labels nobody can line up with a bar is worse than empty.
 * This is what turns the thirty-day span into a day axis at its default width
 * (128px a day) while a week keeps three-hour ticks at 320px a day.
 */
const HOUR_ROW_MIN_DAY_WIDTH = 4 * HOUR_TICK_WIDTH

/**
 * Day-label ladder: the width each format needs before it is worth rendering.
 *
 * Measured the same way. "Montag, 21. Sep" is 87px and "Wednesday, 21 Sep" is
 * ~115px, so the full form wants 140 with its `px-1.5`; "Mon, 21/9" is 55px, so
 * the short form wants 72; "M 21" is 27px. The day number is the part that never
 * goes, because it is the one that tells two Mondays apart.
 */
const DAY_LABEL_FULL_WIDTH = 140
const DAY_LABEL_SHORT_WIDTH = 72
const DAY_LABEL_NARROW_WIDTH = 40

export function CalendarTimeline<E extends CalendarEvent = CalendarEvent>({
  calendars,
  events,
  date,
  defaultDate,
  onDateChange,
  days = 1,
  timeZone = DEFAULT_CALENDAR_TIME_ZONE,
  locale: localeProp,
  startHour = 6,
  endHour = 22,
  hourWidth,
  laneHeight = 30,
  nameWidth = 180,
  now,
  onEventClick,
  selectedEventId,
  onSelectionChange,
  isEventEditable,
  onEventChange,
  showToolbar = true,
  view,
  views,
  onViewChange,
  label,
  labelVariant = "picker",
  emptyRowLabel = "Nothing scheduled",
  className,
}: CalendarTimelineProps<E>) {
  const locale = useCalendarLocale(localeProp)
  const dayCount = Math.max(1, Math.trunc(days))
  const navigation = useCalendarNavigation({
    date,
    defaultDate,
    onDateChange,
    step: { days: dayCount },
    timeZone,
  })

  const axisStart = Math.max(0, Math.min(23, Math.trunc(startHour)))
  const axisEnd = Math.max(axisStart + 1, Math.min(24, Math.trunc(endHour)))
  const windowHours = axisEnd - axisStart
  const axisMinutes = windowHours * 60
  const pixelsPerHour = hourWidth ?? defaultHourWidth(dayCount)
  const dayWidth = windowHours * pixelsPerHour
  const gridWidth = dayCount * dayWidth

  const day = navigation.date
  const visibleDays = useMemo(
    () => Array.from({ length: dayCount }, (_, index) => day.add({ days: index })),
    [day, dayCount],
  )

  // The bar is the same minimum in minutes that it is in pixels, so a row's
  // lanes describe the bars that were actually drawn rather than the intervals
  // they came from. At eight pixels an hour that minimum is nearly three hours.
  const minSpanMinutes = ((MIN_BAR_WIDTH + 2) / pixelsPerHour) * 60

  const rows = useMemo(
    () =>
      buildRows(
        calendars,
        events,
        visibleDays,
        timeZone,
        axisStart * 60,
        axisEnd * 60,
        minSpanMinutes,
      ),
    [calendars, events, visibleDays, timeZone, axisStart, axisEnd, minSpanMinutes],
  )

  /**
   * Minutes on day `dayIndex` to pixels from the left of the grid.
   *
   * Two-dimensional on purpose: the same clock minute is a different place on
   * every day of the span, and a bar that ignored the day would draw Tuesday's
   * 09:00 on top of Monday's.
   */
  const toLeft = (dayIndex: number, minutes: number) =>
    dayIndex * dayWidth + ((minutes - axisStart * 60) / axisMinutes) * dayWidth

  const hourStep = HOUR_TICK_STEPS.find((step) => step * pixelsPerHour >= HOUR_TICK_WIDTH)
  const showHourRow = hourStep !== undefined && dayWidth >= HOUR_ROW_MIN_DAY_WIDTH
  const tickHours =
    showHourRow && hourStep
      ? Array.from({ length: windowHours }, (_, index) => axisStart + index).filter(
          // A tick needs `HOUR_TICK_WIDTH` of room before whatever comes next,
          // and at the right-hand end of a day that is the *day boundary*, not
          // another tick. The step alone does not say so: a 6–22 window stepped
          // by three ends on 21:00 with one hour left, so at a week's 20px an
          // hour the last label had 20px and printed over the next day's first.
          (hour) =>
            hour % hourStep === 0 && (axisEnd - hour) * pixelsPerHour >= HOUR_TICK_WIDTH,
        )
      : []

  const dayLabelFormat = getDateTimeFormat(locale, { ...dayLabelOptions(dayWidth), timeZone })
  const dayNameFormat = getDateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone,
  })
  const hourFormat = getDateTimeFormat(locale, { hour: "numeric", timeZone })

  const dayCells = visibleDays.map((current, dayIndex) => ({
    key: current.toString(),
    label: dayLabelFormat.format(atHour(current, 0, timeZone)),
    name: dayNameFormat.format(atHour(current, 0, timeZone)),
    left: dayIndex * dayWidth,
  }))
  const dayNames = dayCells.map((cell) => cell.name)

  const hourTicks = visibleDays.flatMap((current, dayIndex) =>
    tickHours.map((hour) => ({
      key: `${current.toString()}:${hour}`,
      left: toLeft(dayIndex, hour * 60),
      label: hourFormat.format(atHour(current, hour, timeZone)),
    })),
  )
  // Every tick gets its rule, including the one on `axisStart`: that is the line
  // between the sticky name column and the grid, and the header draws it too.
  // The day boundaries go over the top of them, so a seam reads stronger than an
  // hour without either line having to know about the other.
  const dayLines = dayCells.slice(1)

  const nowPosition = useTimelineNow(now, visibleDays, timeZone)
  const showNow =
    nowPosition !== null &&
    nowPosition.minutes >= axisStart * 60 &&
    nowPosition.minutes <= axisEnd * 60

  const activate = (event: E) => {
    onSelectionChange?.(selectedEventId === event.id ? null : event.id)
    onEventClick?.(event)
  }

  // --- moving and resizing (task #183) ---------------------------------------

  const snapMinutes = snapStepFor(pixelsPerHour)
  const windowStart = axisStart * 60
  const windowEnd = axisEnd * 60

  // The gesture in flight. A ref rather than state because it is written on
  // every pointer frame and read by the next one; the only part of it the
  // render needs is the preview, which is state.
  const dragRef = useRef<DragOrigin<E> | null>(null)
  const previewRef = useRef<DragPreview | null>(null)
  const [preview, setPreview] = useState<DragPreview | null>(null)
  const rowRefs = useRef(new Map<string, HTMLElement>())
  const barRefs = useRef(new Map<string, HTMLElement>())
  const refocusRef = useRef<string | null>(null)

  // A keyboard gesture commits on every keypress, and the element that came
  // back may not be the one that was focused: a lane, a day or a row later, it
  // is a different node with a different key. So the bars register themselves
  // and the focus is put back on whichever one now stands for the same edge.
  useEffect(() => {
    const key = refocusRef.current
    if (!key) return
    refocusRef.current = null
    barRefs.current.get(key)?.focus()
  })

  const editableFor = (span: TimelineSpan<E>) => {
    if (!onEventChange || !isEventEditable) return false
    // An all-day band has no time to move, and a segment the axis cut has no
    // edge of its own: its `start` or `end` is the window's, so a delta measured
    // from it is a delta from the edge of the grid rather than from the event.
    // Task #182 draws the same line in the week view.
    if (span.allDay || span.continuesBefore || span.continuesAfter) return false
    return typeof isEventEditable === "function" ? isEventEditable(span.event) : true
  }

  const publish = (next: DragPreview | null) => {
    previewRef.current = next
    setPreview(next)
  }

  /**
   * The inverse of `toLeft`: pixels from the left of the grid back to the day
   * and the clock minute under them.
   *
   * Two-dimensional for the same reason `toLeft` is — a pixel on a thirty-day
   * axis is a time *and* a date, and dropping the date would land every bar on
   * the anchor day.
   */
  const fromLeft = (px: number) => {
    const onGrid = clampTo(px, 0, Math.max(0, gridWidth - 0.001))
    const dayIndex = clampTo(Math.floor(onGrid / dayWidth), 0, dayCount - 1)
    return {
      dayIndex,
      minutes: windowStart + ((onGrid - dayIndex * dayWidth) / dayWidth) * axisMinutes,
    }
  }

  const snap = (minutes: number) => Math.round(minutes / snapMinutes) * snapMinutes

  /** The time the preview is showing, spelled the way the bar spells its own. */
  const previewLabel = (dayIndex: number, start: number, end: number) => {
    const target = visibleDays[dayIndex] ?? day
    const from = formatEventTime(atMinute(target, start, timeZone), locale, timeZone)
    const to = formatEventTime(atMinute(target, end, timeZone), locale, timeZone)
    const times = `${from} – ${to}`
    // On a span the day is half of where the bar has landed, so the label says
    // it; on one day it would repeat the heading.
    return dayCount > 1 ? `${dayCells[dayIndex]?.label ?? ""} ${times}` : times
  }

  /**
   * Which row the gesture is over. Rows are the drop targets, and only rows:
   * a lane is what packing produced, not something a bar can be dropped into.
   */
  const rowUnder = (drag: DragOrigin<E>, keyboard: boolean) => {
    if (drag.dy === 0) return drag.calendarId
    if (keyboard) {
      const from = calendars.findIndex((calendar) => calendar.id === drag.calendarId)
      const to = clampTo(from + Math.sign(drag.dy), 0, calendars.length - 1)
      return calendars[to]?.id ?? drag.calendarId
    }
    if (drag.pointerY === null) return drag.calendarId
    const y = drag.pointerY + drag.dy
    const hit = drag.rows.find((row) => y >= row.top && y < row.bottom)
    if (hit) return hit.id
    const first = drag.rows[0]
    const last = drag.rows[drag.rows.length - 1]
    if (first && y < first.top) return first.id
    return last?.id ?? drag.calendarId
  }

  /**
   * Where the gesture currently points, as a segment on a day and a row.
   *
   * All of it is model arithmetic — the grabbed edge's own clock minute plus
   * the pixels the pointer has travelled — and none of it reads the bar's box.
   * That box is not the event: `MIN_BAR_WIDTH` makes a short one wider than its
   * span and the clamp onto the grid moves the left edge of one at the end of
   * the axis, so a resize measured from the rectangle would resize to whatever
   * the floor had invented.
   */
  const computePreview = (drag: DragOrigin<E>, pointerType: string): DragPreview | null => {
    const keyboard = pointerType === "keyboard"
    // Shift + arrow is the keyboard's resize, and the only one a bar too narrow
    // for handles has. It ends the event rather than starting it because a
    // length is the thing being changed and the start is where the bar is.
    const part = drag.part === "body" && keyboard && drag.shiftKey ? "end" : drag.part
    const edge = part === "end" ? drag.spanEnd : drag.spanStart
    const drawn = Math.min(drag.spanEnd - drag.spanStart, axisMinutes)

    let dayIndex = drag.dayIndex
    let minutes = edge

    if (drag.dx !== 0) {
      if (keyboard) {
        minutes = snap(edge + Math.sign(drag.dx) * snapMinutes)
      } else if (part === "body") {
        const landed = fromLeft(toLeft(drag.dayIndex, edge) + drag.dx)
        dayIndex = landed.dayIndex
        minutes = snap(landed.minutes)
      } else {
        // An edge stays on the day it was grabbed on. The night between two
        // days is not drawn, so an edge dropped in it would be a time nobody
        // pointed at — a move carries the whole event across a boundary, a
        // resize does not reach through one.
        const px = toLeft(drag.dayIndex, edge) + drag.dx - drag.dayIndex * dayWidth
        minutes = snap(windowStart + (px / dayWidth) * axisMinutes)
      }
    }

    if (part === "body") {
      const latest = Math.max(windowStart, windowEnd - drawn)
      // A keyboard step has no pixels to cross a day boundary with, so the step
      // that runs off the end of a day arrives at the start of the next one —
      // which is what the same gesture does with a pointer.
      if (keyboard && minutes > latest && dayIndex < dayCount - 1) {
        dayIndex += 1
        minutes = windowStart
      } else if (keyboard && minutes < windowStart && dayIndex > 0) {
        dayIndex -= 1
        minutes = latest
      }
      minutes = clampTo(minutes, windowStart, latest)
    } else {
      // The edge that is not moving, measured on the day the moving one sits on
      // — which is not always inside the window, because half of a clipped
      // event is off the axis by construction.
      const anchor = wallMinutes(
        part === "start" ? drag.event.end : drag.event.start,
        visibleDays[drag.dayIndex] ?? day,
        timeZone,
      )
      minutes = clampTo(
        part === "start"
          ? Math.min(minutes, anchor - snapMinutes)
          : Math.max(minutes, anchor + snapMinutes),
        windowStart,
        windowEnd,
      )
      // The window can win against the minimum: an event whose other end is off
      // the axis has nowhere inside the window to be shortened to. Refusing the
      // frame leaves the preview where it was, which is the honest answer —
      // the alternative is drawing a length the drop would not produce.
      if ((part === "start" ? anchor - minutes : minutes - anchor) < snapMinutes) {
        return previewRef.current
      }
    }

    const calendarId = part === "body" ? rowUnder(drag, keyboard) : drag.calendarId
    const start = part === "end" ? drag.spanStart : minutes
    const end = part === "start" ? drag.spanEnd : part === "end" ? minutes : minutes + drawn

    return {
      eventId: drag.event.id,
      part,
      calendarId,
      // Staying in the row keeps the bar's own lane, so the preview tracks the
      // pointer; arriving in another row has no lane yet, because lanes are
      // what the drop repacks.
      lane: calendarId === drag.calendarId ? drag.lane : 0,
      dayIndex,
      start,
      end: Math.min(end, windowEnd),
      label: previewLabel(dayIndex, start, Math.min(end, windowEnd)),
    }
  }

  const editing: TimelineEditing<E> = {
    onDragStart(init) {
      // The rows as boxes, measured once: they are the drop targets, and
      // measuring them per frame would read a layout the drag is changing.
      const rows = calendars.flatMap((calendar) => {
        const box = rowRefs.current.get(calendar.id)?.getBoundingClientRect()
        return box ? [{ id: calendar.id, top: box.top, bottom: box.bottom }] : []
      })
      const drag: DragOrigin<E> = { ...init, rows, dx: 0, dy: 0, shiftKey: false }
      dragRef.current = drag
      publish(computePreview(drag, init.pointerType))
    },
    onDragMove(deltaX, deltaY, pointerType, shiftKey) {
      const drag = dragRef.current
      if (!drag) return
      drag.dx += deltaX
      drag.dy += deltaY
      drag.shiftKey = shiftKey
      publish(computePreview(drag, pointerType))
    },
    onDragEnd(pointerType) {
      const drag = dragRef.current
      const landed = previewRef.current
      dragRef.current = null
      publish(null)
      if (!drag || !landed) return

      const dayDelta = landed.dayIndex - drag.dayIndex
      const minuteDelta =
        (landed.part === "end" ? landed.end : landed.start) -
        (landed.part === "end" ? drag.spanEnd : drag.spanStart)
      const movedRow = landed.calendarId !== drag.calendarId
      if (dayDelta === 0 && minuteDelta === 0 && !movedRow) return

      if (pointerType === "keyboard") refocusRef.current = `${drag.event.id}:${drag.part}`

      // Wall-clock arithmetic on purpose. The grid is drawn in wall minutes
      // (`wallMinutes`), so a bar dropped on 09:00 means 09:00 on the day it
      // landed on — including the day a daylight-saving change makes 23 hours
      // long, where the same delta in absolute minutes would land an hour out.
      const shift = { days: dayDelta, minutes: minuteDelta }
      onEventChange?.(drag.event, {
        start: landed.part === "end" ? drag.event.start : drag.event.start.add(shift),
        end: landed.part === "start" ? drag.event.end : drag.event.end.add(shift),
        calendarId: landed.calendarId,
      })
    },
  }

  const previewLeft = preview ? toLeft(preview.dayIndex, preview.start) : 0
  const previewWidth = preview
    ? Math.max(MIN_BAR_WIDTH, toLeft(preview.dayIndex, preview.end) - previewLeft - 2)
    : 0

  return (
    <div data-slot="calendar-timeline" className={cn("flex w-full flex-col gap-3", className)}>
      {showToolbar ? (
        <CalendarToolbar
          label={label ?? calendarRangeLabel(visibleDays, { locale, timeZone })}
          labelVariant={labelVariant}
          date={navigation.date}
          onDateChange={navigation.goTo}
          view={view}
          views={views}
          onViewChange={onViewChange}
          onPrevious={navigation.goToPrevious}
          onNext={navigation.goToNext}
          onToday={navigation.goToToday}
        />
      ) : null}

      <div className="w-full overflow-x-auto rounded-quebi-md border border-quebi-line/10 bg-quebi-bg">
        <div style={{ minWidth: nameWidth + gridWidth }}>
          <div className="border-quebi-line/10 border-b">
            <div className="flex">
              <div
                className="sticky left-0 z-20 shrink-0 bg-quebi-bg"
                style={{ width: nameWidth }}
              />
              <div className="relative shrink-0" style={{ width: gridWidth, height: 28 }}>
                {dayCells.map((cell) => (
                  <span
                    key={cell.key}
                    data-slot="calendar-day-label"
                    className="absolute top-2 truncate px-1.5 font-medium text-quebi-fg-muted text-xs"
                    style={{ left: cell.left, width: dayWidth }}
                  >
                    {cell.label}
                  </span>
                ))}
              </div>
            </div>

            {showHourRow ? (
              <div className="flex">
                <div
                  className="sticky left-0 z-20 shrink-0 bg-quebi-bg"
                  style={{ width: nameWidth }}
                />
                <div
                  data-slot="calendar-hour-row"
                  className="relative shrink-0"
                  style={{ width: gridWidth, height: 24 }}
                >
                  {hourTicks.map((tick) => (
                    <span
                      key={tick.key}
                      className="absolute top-1 border-quebi-line/10 border-l pl-1.5 text-quebi-fg-subtle text-xs tabular-nums"
                      style={{ left: tick.left, height: 16 }}
                    >
                      {tick.label}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {rows.map((row) => (
            <div
              key={row.calendar.id}
              ref={(node) => {
                if (node) rowRefs.current.set(row.calendar.id, node)
                else rowRefs.current.delete(row.calendar.id)
              }}
              className="flex border-quebi-line/10 border-b last:border-b-0"
            >
              <div
                className="sticky left-0 z-20 flex shrink-0 items-start gap-2 bg-quebi-bg px-3 py-2"
                style={{ width: nameWidth }}
              >
                <span
                  className={cn(
                    "mt-1 size-2 shrink-0 rounded-full",
                    CALENDAR_COLORS[row.calendar.color].dot,
                  )}
                  aria-hidden="true"
                />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-semibold text-quebi-fg text-sm">
                    {row.calendar.name}
                  </span>
                  {row.calendar.description ? (
                    <span className="truncate text-quebi-fg-subtle text-xs">
                      {row.calendar.description}
                    </span>
                  ) : null}
                </span>
              </div>

              <div
                className="relative shrink-0"
                style={{ width: gridWidth, height: row.lanes * laneHeight + 8 }}
              >
                <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                  {hourTicks.map((tick) => (
                    <div
                      key={tick.key}
                      className="absolute inset-y-0 border-quebi-line/10 border-l"
                      style={{ left: tick.left }}
                    />
                  ))}
                  {dayLines.map((line) => (
                    <div
                      key={line.key}
                      className="absolute inset-y-0 border-quebi-line/25 border-l"
                      style={{ left: line.left }}
                    />
                  ))}
                </div>

                {row.bars.length === 0 ? (
                  <span className="absolute top-2 left-2 text-quebi-fg-subtle text-xs">
                    {emptyRowLabel}
                  </span>
                ) : null}

                {row.bars.map((bar) => {
                  const palette = CALENDAR_COLORS[resolveEventColor(bar.span.event, calendars)]
                  const left = toLeft(bar.span.startDayIndex, bar.span.start)
                  const right = toLeft(bar.span.endDayIndex, bar.span.end)
                  // The minimum grows a short bar rightwards; against the end of
                  // the axis that would put it past the last hour line, so it is
                  // pushed back onto the grid instead.
                  const width = Math.max(MIN_BAR_WIDTH, right - left - 2)
                  // A sliver has no room for text, so the name it would have
                  // shown has to reach the reader another way: `aria-label` for
                  // a screen reader, `title` for a pointer. Without them the only
                  // way to find out what an 18px bar is was to click it.
                  const name = barName(bar.span, dayNames, dayCount, locale, timeZone)
                  const editable = editableFor(bar.span)
                  const surface = barSurface(
                    palette,
                    bar.span,
                    width,
                    selectedEventId === bar.span.event.id,
                    editable,
                  )
                  const geometry = {
                    left: Math.max(0, Math.min(left, gridWidth - width)),
                    width,
                    top: 4 + bar.lane * laneHeight,
                    height: laneHeight - 4,
                  }
                  // The lane is deliberately not in the key. A keyboard edit
                  // commits on every keypress, and a bar that was remounted
                  // because packing moved it one lane would have dropped the
                  // focus that was driving it.
                  const key = `${bar.span.event.id}:${bar.span.allDay ? "band" : bar.span.startDayIndex}`
                  const text = (
                    <BarText
                      event={bar.span.event}
                      allDay={bar.span.allDay}
                      width={width}
                      locale={locale}
                      timeZone={timeZone}
                    />
                  )

                  if (editable) {
                    return (
                      <EditableTimelineBar
                        key={key}
                        span={bar.span}
                        lane={bar.lane}
                        calendarId={row.calendar.id}
                        name={name}
                        width={width}
                        style={geometry}
                        className={surface}
                        isDragging={preview?.eventId === bar.span.event.id}
                        windowStart={windowStart}
                        windowEnd={windowEnd}
                        locale={locale}
                        timeZone={timeZone}
                        editing={editing}
                        register={barRefs.current}
                        onActivate={activate}
                      >
                        {text}
                      </EditableTimelineBar>
                    )
                  }

                  return (
                    // The geometry and the tooltip sit on the wrapper, not on the
                    // button. `react-aria-components`' `Button` forwards exactly
                    // five global attributes — dir, lang, hidden, inert,
                    // translate — so a `title` on it is accepted by the types and
                    // dropped in silence, which is the failure mode this repo has
                    // a lint rule about. `aria-label` is labelable and does reach
                    // the element, so the two channels are split across the two.
                    <div
                      key={key}
                      data-slot="calendar-bar"
                      data-event-id={bar.span.event.id}
                      title={name}
                      className="absolute"
                      style={geometry}
                    >
                      <Button
                        data-slot="calendar-bar-button"
                        aria-label={name}
                        onPress={() => activate(bar.span.event)}
                        className={surface}
                      >
                        {text}
                      </Button>
                    </div>
                  )
                })}

                {preview && preview.calendarId === row.calendar.id ? (
                  <>
                    <div
                      data-slot="calendar-bar-preview"
                      aria-hidden="true"
                      className={cn(
                        "pointer-events-none absolute z-10 rounded-quebi-sm",
                        "border-2 border-quebi-brand-mark border-dashed bg-quebi-brand/10",
                      )}
                      style={{
                        left: Math.max(0, Math.min(previewLeft, gridWidth - previewWidth)),
                        width: previewWidth,
                        top: 4 + preview.lane * laneHeight,
                        height: laneHeight - 4,
                      }}
                    />
                    <span
                      data-slot="calendar-bar-preview-label"
                      aria-hidden="true"
                      className={cn(
                        "pointer-events-none absolute z-20 flex items-center justify-center",
                        "truncate rounded-quebi-sm border border-quebi-line/20 bg-quebi-elevated px-1.5",
                        "text-quebi-fg text-xs tabular-nums shadow-quebi-glow",
                      )}
                      style={{
                        left: Math.max(0, Math.min(previewLeft, gridWidth - DRAG_LABEL_WIDTH)),
                        width: DRAG_LABEL_WIDTH,
                        top: 4 + preview.lane * laneHeight,
                        height: laneHeight - 4,
                      }}
                    >
                      {preview.label}
                    </span>
                  </>
                ) : null}

                {showNow && nowPosition ? (
                  <div
                    data-slot="calendar-now-marker"
                    className="pointer-events-none absolute inset-y-0 z-10 w-px bg-red-500"
                    style={{ left: toLeft(nowPosition.dayIndex, nowPosition.minutes) }}
                  />
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface BarTextProps {
  event: CalendarEvent
  allDay: boolean
  width: number
  locale: string
  timeZone: string
}

/**
 * Title and time, dropped one at a time as the bar gets narrower (task #164).
 *
 * The horizontal counterpart of `CalendarShell`'s `BlockText`, and it keeps that
 * one's rule: the title is never the thing that goes. The bar used to render
 * both unconditionally with `truncate` on the title and `shrink-0` on the time,
 * which under flex is exactly backwards — the interesting half collapsed to
 * nothing first and a 15-minute booking was a coloured sliver saying "09:00".
 *
 * Dropping the time is done here rather than by flex because flex cannot drop a
 * child, only squash it, and a time squashed to `0…` is noise where an absent
 * one is merely absent. What flex still does is give the title the slack: it is
 * `flex-1 min-w-0`, so it takes every pixel the time does not need.
 *
 * Below `BAR_TITLE_WIDTH` nothing is drawn — the bar is a sliver by
 * construction — and the name reaches the reader through the `aria-label` and
 * `title` the caller puts on the button.
 */
function BarText({ event, allDay, width, locale, timeZone }: BarTextProps) {
  if (width < BAR_TITLE_WIDTH) return null

  return (
    <>
      <span className="min-w-0 flex-1 truncate font-semibold text-quebi-fg">{event.title}</span>
      {allDay || width < BAR_TIME_WIDTH ? null : (
        <span className="shrink-0 text-quebi-fg-subtle tabular-nums">
          {formatEventTime(event.start, locale, timeZone)}
        </span>
      )}
    </>
  )
}

/** Which part of a bar a gesture has hold of. */
type DragPart = "body" | "start" | "end"

/** What the bar knows about a gesture at the moment it begins. */
interface DragInit<E extends CalendarEvent> {
  event: E
  part: DragPart
  /** The row the bar started in — a calendar id, because a row is a calendar. */
  calendarId: string
  lane: number
  /** The day the grabbed segment sits on. Editable spans are always one day. */
  dayIndex: number
  /** The segment's drawn clock minutes, clamped to the window. */
  spanStart: number
  spanEnd: number
  /** Where the pointer went down, for the row hit test. Null for the keyboard. */
  pointerY: number | null
  pointerType: string
}

/** A gesture in flight: where it started, and how far it has travelled. */
interface DragOrigin<E extends CalendarEvent> extends DragInit<E> {
  rows: { id: string; top: number; bottom: number }[]
  dx: number
  dy: number
  shiftKey: boolean
}

/** Where the gesture currently points — the ghost bar, and its time label. */
interface DragPreview {
  eventId: string
  /** The part being applied, which is not the part grabbed under Shift + arrow. */
  part: DragPart
  calendarId: string
  lane: number
  dayIndex: number
  start: number
  end: number
  label: string
}

/** The three callbacks a bar needs to hand a gesture back to the timeline. */
interface TimelineEditing<E extends CalendarEvent> {
  onDragStart: (init: DragInit<E>) => void
  onDragMove: (deltaX: number, deltaY: number, pointerType: string, shiftKey: boolean) => void
  onDragEnd: (pointerType: string) => void
}

interface EditableTimelineBarProps<E extends CalendarEvent> {
  span: TimelineSpan<E>
  lane: number
  calendarId: string
  name: string
  width: number
  style: React.CSSProperties
  className: string
  isDragging: boolean
  windowStart: number
  windowEnd: number
  locale: string
  timeZone: string
  editing: TimelineEditing<E>
  /** Where a bar records its elements, so a keyboard edit can find them again. */
  register: Map<string, HTMLElement>
  onActivate: (event: E) => void
  children: React.ReactNode
}

/**
 * A bar that can be dragged, dropped on another row, and pulled by either end.
 *
 * It is not the read-only bar with handlers added, and the difference is
 * `react-aria-components`' `Button`: it captures the pointer for its own press
 * handling and stops `pointerdown` propagating, so a `useMove` anywhere in the
 * tree above it never sees a gesture begin. What replaces it is `useMove`
 * itself, which gives pointer *and* keyboard movement from one hook — the
 * reason this does not have to hand-roll arrow keys the way `DaySchedule` did —
 * over an element that says what it is with `role="slider"`, as that component's
 * handles do.
 *
 * Pressing it still selects, because `useMove` only starts reporting once the
 * pointer has actually moved: a press that goes nowhere raises no move events
 * at all and arrives here as the plain click it was.
 */
function EditableTimelineBar<E extends CalendarEvent>({
  span,
  lane,
  calendarId,
  name,
  width,
  style,
  className,
  isDragging,
  windowStart,
  windowEnd,
  locale,
  timeZone,
  editing,
  register,
  onActivate,
  children,
}: EditableTimelineBarProps<E>) {
  const pointerY = useRef<number | null>(null)
  // How far this gesture has travelled, and whether that is far enough to have
  // been a drag rather than a press — see `DRAG_SLOP`.
  const travel = useRef(0)
  const dragged = useRef(false)
  // Below the threshold there is no room for two handles and a body, so the bar
  // is move-only by pointer. Shift + arrow still resizes it.
  const showHandles = width >= MIN_RESIZABLE_BAR_WIDTH

  const gesture = (part: DragPart) => ({
    onMoveStart(event: { pointerType: string }) {
      editing.onDragStart({
        event: span.event,
        part,
        calendarId,
        lane,
        dayIndex: span.startDayIndex,
        spanStart: span.start,
        spanEnd: span.end,
        pointerY: pointerY.current,
        pointerType: event.pointerType,
      })
    },
    onMove(event: { deltaX: number; deltaY: number; pointerType: string; shiftKey: boolean }) {
      if (event.pointerType !== "keyboard") {
        travel.current += Math.abs(event.deltaX) + Math.abs(event.deltaY)
        if (travel.current > DRAG_SLOP) dragged.current = true
      }
      editing.onDragMove(event.deltaX, event.deltaY, event.pointerType, event.shiftKey)
    },
    onMoveEnd(event: { pointerType: string }) {
      editing.onDragEnd(event.pointerType)
    },
  })

  const body = useMove(gesture("body"))
  const startEdge = useMove(gesture("start"))
  const endEdge = useMove(gesture("end"))

  const bind = (part: DragPart) => (node: HTMLElement | null) => {
    const key = `${span.event.id}:${part}`
    if (node) register.set(key, node)
    else register.delete(key)
  }

  // `useMove` calls `preventDefault` on `pointerdown` — which is what keeps a
  // drag from selecting the text under it, and also what stops the press from
  // focusing the bar. So the focus is taken here, where the pointer's own
  // position is recorded for the row hit test.
  const grab = (event: React.PointerEvent<HTMLElement>) => {
    pointerY.current = event.clientY
    travel.current = 0
    dragged.current = false
    event.currentTarget.focus()
  }

  const handleClass = cn(
    "absolute inset-y-0 z-10 flex cursor-ew-resize touch-none items-center justify-center",
    "outline-none focus-visible:ring-2 focus-visible:ring-quebi-brand-mark focus-visible:ring-inset",
  )
  const gripClass = cn(
    "h-1/2 w-[3px] rounded-full bg-quebi-fg/60 opacity-0 transition-opacity duration-150",
    "group-hover/edge:opacity-100 group-focus-visible/edge:opacity-100",
  )

  return (
    <div
      data-slot="calendar-bar"
      data-event-id={span.event.id}
      data-editable="true"
      title={name}
      className="absolute"
      style={style}
    >
      <div
        {...mergeProps(body.moveProps, {
          onPointerDown: grab,
          // The click arrives after the gesture: `pointerup` ends the move and
          // then the browser raises the click it was part of. A drag that
          // selected as well as moved would be one gesture doing two things.
          onClick: () => {
            if (dragged.current) {
              dragged.current = false
              return
            }
            onActivate(span.event)
          },
          onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
            if (event.key !== "Enter" && event.key !== " ") return
            event.preventDefault()
            onActivate(span.event)
          },
        })}
        ref={bind("body")}
        data-slot="calendar-bar-button"
        data-drag-part="body"
        role="slider"
        tabIndex={0}
        aria-label={name}
        aria-valuemin={windowStart}
        aria-valuemax={windowEnd}
        aria-valuenow={span.start}
        aria-valuetext={name}
        className={cn(className, isDragging && "opacity-40")}
      >
        {children}
      </div>

      {showHandles ? (
        <div
          {...mergeProps(startEdge.moveProps, { onPointerDown: grab })}
          ref={bind("start")}
          data-drag-part="start"
          role="slider"
          tabIndex={0}
          aria-label={`${span.event.title}, start time`}
          aria-valuemin={windowStart}
          aria-valuemax={windowEnd}
          aria-valuenow={span.start}
          aria-valuetext={formatEventTime(span.event.start, locale, timeZone)}
          className={cn("group/edge left-0", handleClass)}
          style={{ width: RESIZE_HANDLE_WIDTH }}
        >
          <span aria-hidden="true" className={gripClass} />
        </div>
      ) : null}

      {showHandles ? (
        <div
          {...mergeProps(endEdge.moveProps, { onPointerDown: grab })}
          ref={bind("end")}
          data-drag-part="end"
          role="slider"
          tabIndex={0}
          aria-label={`${span.event.title}, end time`}
          aria-valuemin={windowStart}
          aria-valuemax={windowEnd}
          aria-valuenow={span.end}
          aria-valuetext={formatEventTime(span.event.end, locale, timeZone)}
          className={cn("group/edge right-0", handleClass)}
          style={{ width: RESIZE_HANDLE_WIDTH }}
        >
          <span aria-hidden="true" className={gripClass} />
        </div>
      ) : null}
    </div>
  )
}

/**
 * The bar's surface, shared by the two elements that can draw it.
 *
 * A read-only bar is a `Button` and an editable one is a slider, and neither
 * fact is visible: the box, the palette, the cut corners and the selected ring
 * are the same thing wearing a different element, so they are written once.
 */
function barSurface<E extends CalendarEvent>(
  palette: (typeof CALENDAR_COLORS)[keyof typeof CALENDAR_COLORS],
  span: TimelineSpan<E>,
  width: number,
  isSelected: boolean,
  isEditable: boolean,
): string {
  return cn(
    "flex h-full w-full items-center gap-1.5 overflow-hidden text-left",
    isEditable ? "cursor-grab touch-none select-none active:cursor-grabbing" : "cursor-pointer",
    width < BAR_TIME_WIDTH ? "px-1" : "px-2",
    "border-l-2 text-xs transition-colors duration-150",
    "outline-none focus-visible:ring-2 focus-visible:ring-quebi-brand-mark focus-visible:ring-inset",
    palette.block,
    palette.edge,
    span.continuesBefore ? "rounded-l-none" : "rounded-l-quebi-sm",
    span.continuesAfter ? "rounded-r-none" : "rounded-r-quebi-sm",
    isSelected && cn("outline-2 outline-solid outline-offset-0", palette.selected),
  )
}

/** Clamp, for the geometry this file does that `@/lib/calendar` keeps to itself. */
const clampTo = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** The snap step for a scale, finest first — see `SNAP_STEPS`. */
function snapStepFor(pixelsPerHour: number): number {
  return SNAP_STEPS.find((step) => (step / 60) * pixelsPerHour >= MIN_SNAP_WIDTH) ?? 480
}

/** One event's presence on the axis: a run of days, and minutes within the ends. */
interface TimelineSpan<E extends CalendarEvent> {
  event: E
  /** Index into the visible days the span starts on. */
  startDayIndex: number
  /** Index into the visible days the span ends on, inclusive. */
  endDayIndex: number
  /** Clock minutes on `startDayIndex`, clamped to the window. */
  start: number
  /** Clock minutes on `endDayIndex`, clamped to the window. */
  end: number
  continuesBefore: boolean
  continuesAfter: boolean
  /** An all-day band, which has no time to show and fills each day's window. */
  allDay: boolean
}

interface TimelineBar<E extends CalendarEvent> {
  span: TimelineSpan<E>
  lane: number
}

interface TimelineRow<E extends CalendarEvent> {
  calendar: CalendarSource
  bars: TimelineBar<E>[]
  lanes: number
}

/**
 * Absolute minutes from the left edge of the grid — day and clock in one number.
 *
 * Packing has to happen in these rather than in clock minutes, or 16:00 on
 * Monday and 09:00 on Tuesday are compared as 960 against 540 and the packer
 * decides Tuesday comes first (task #167).
 */
const absoluteMinutes = (
  dayIndex: number,
  minutes: number,
  windowStart: number,
  axisMinutes: number,
) => dayIndex * axisMinutes + (minutes - windowStart)

/**
 * One row per calendar, with its events packed into lanes.
 *
 * An all-day event has no position on a time axis, so it is drawn as a bar
 * across the days it covers — which is what it means — and packed with
 * everything else, so it pushes the timed events onto a second lane rather than
 * sitting underneath them. Over a span it is the `packBands` day range that says
 * how far it reaches; mapping every band onto day 0 for the whole window, as
 * this did while the axis was one day wide, drew a three-day offsite as a bar
 * over Monday.
 */
function buildRows<E extends CalendarEvent>(
  calendars: readonly CalendarSource[],
  events: readonly E[],
  days: readonly CalendarDate[],
  timeZone: string,
  windowStart: number,
  windowEnd: number,
  minSpanMinutes: number,
): TimelineRow<E>[] {
  const axisMinutes = windowEnd - windowStart

  // Cut against the axis, for the same reason `CalendarShell` does: `toLeft` has
  // no clamp in it, so an event the window does not cover is drawn past the end
  // of the grid, where it inflates the horizontal scroll instead of being absent
  // (task #161).
  const timed = segmentByDay(events, days, timeZone, {
    startMinute: windowStart,
    endMinute: windowEnd,
  }).map(
    (segment): TimelineSpan<E> => ({
      event: segment.event,
      startDayIndex: segment.dayIndex,
      endDayIndex: segment.dayIndex,
      start: segment.start,
      end: segment.end,
      continuesBefore: segment.continuesBefore,
      continuesAfter: segment.continuesAfter,
      allDay: false,
    }),
  )
  const allDay = packBands(events, days, timeZone).map(
    (band): TimelineSpan<E> => ({
      event: band.event,
      startDayIndex: band.startIndex,
      endDayIndex: band.endIndex,
      start: windowStart,
      end: windowEnd,
      continuesBefore: band.continuesBefore,
      continuesAfter: band.continuesAfter,
      allDay: true,
    }),
  )

  return calendars.map((calendar) => {
    const mine = [...allDay, ...timed].filter((span) => span.event.calendarId === calendar.id)
    const placements = packIntervals(
      mine.map((span) => {
        const start = absoluteMinutes(span.startDayIndex, span.start, windowStart, axisMinutes)
        const end = absoluteMinutes(span.endDayIndex, span.end, windowStart, axisMinutes)
        // The same minimum the bar is drawn at, so a five-minute event is packed
        // as the pixels it occupies rather than as the sliver it computes to.
        return { start, end: Math.max(end, start + minSpanMinutes) }
      }),
    )
    const bars = mine.map((span, index) => ({
      span,
      lane: placements[index]?.lane ?? 0,
    }))
    const lanes = bars.reduce((max, bar) => Math.max(max, bar.lane + 1), 1)
    return { calendar, bars, lanes }
  })
}

/**
 * The default pixels-per-hour for a span.
 *
 * A fixed 72 is right for a day and absurd for a month — thirty days of a
 * sixteen-hour window would be 34,560 pixels of scroll. These keep the whole
 * span inside a few screens at every step, which is what makes the span
 * readable as one picture rather than as a thing you scroll through.
 */
function defaultHourWidth(dayCount: number): number {
  if (dayCount <= 1) return 72
  if (dayCount <= 3) return 48
  if (dayCount <= 7) return 20
  if (dayCount <= 14) return 14
  return 8
}

/**
 * The day-row label, as wide as the column can afford.
 *
 * The same ladder idea as `BarText`, applied to the header: the day number is
 * the part that never goes, because it is the one that tells two Mondays apart.
 */
function dayLabelOptions(dayWidth: number): Intl.DateTimeFormatOptions {
  if (dayWidth >= DAY_LABEL_FULL_WIDTH) {
    return { weekday: "long", day: "numeric", month: "short" }
  }
  if (dayWidth >= DAY_LABEL_SHORT_WIDTH) {
    return { weekday: "short", day: "numeric", month: "numeric" }
  }
  if (dayWidth >= DAY_LABEL_NARROW_WIDTH) {
    return { weekday: "narrow", day: "numeric" }
  }
  return { day: "numeric" }
}

/**
 * A day at a given clock minute, as the instant the grid means by that pixel.
 *
 * Built by adding minutes to midnight rather than by constructing a `Time`, so
 * a minute past the end of the day, or one inside an hour a daylight-saving
 * change removed, resolves rather than throws.
 */
const atMinute = (day: CalendarDate, minutes: number, timeZone: string) =>
  toZoned(toCalendarDateTime(day, new Time(0)), timeZone).add({ minutes })

/** A day at a given hour, as the `Date` the Intl formatters take. */
const atHour = (day: CalendarDate, hour: number, timeZone: string) =>
  toZoned(toCalendarDateTime(day, new Time(hour)), timeZone).toDate()

/**
 * What a bar is called, for a screen reader and for a hover.
 *
 * Everything the bar might have drawn and more: over a span the day is part of
 * the answer, because "Standup, 09:00 – 09:15" on a thirty-day axis is only half
 * of where it is.
 */
function barName<E extends CalendarEvent>(
  span: TimelineSpan<E>,
  dayNames: readonly string[],
  dayCount: number,
  locale: string,
  timeZone: string,
): string {
  const parts = [span.event.title]

  if (dayCount > 1) {
    const from = dayNames[span.startDayIndex]
    const to = dayNames[span.endDayIndex]
    if (from && to) parts.push(from === to ? from : `${from} – ${to}`)
  }

  if (!span.allDay) {
    parts.push(
      `${formatEventTime(span.event.start, locale, timeZone)} – ${formatEventTime(
        span.event.end,
        locale,
        timeZone,
      )}`,
    )
  }

  return parts.join(", ")
}

/**
 * The now-marker's position — which day of the span, and the clock minute.
 *
 * `null` both before mount — the prerender must not put a clock reading in the
 * HTML — and when the instant falls outside the span, because a marker on days
 * you are not looking at is a line with no meaning. Over a range it is the
 * *range* that decides, not the anchor day: a thirty-day plan that contains
 * today should say where today is.
 */
function useTimelineNow(
  provided: ZonedDateTime | null | undefined,
  days: readonly CalendarDate[],
  timeZone: string,
): { dayIndex: number; minutes: number } | null {
  const instant = useCalendarNowInstant(provided, timeZone)
  if (!instant) return null
  const today = toCalendarDate(instant)
  const dayIndex = days.findIndex((day) => day.compare(today) === 0)
  if (dayIndex < 0) return null
  return { dayIndex, minutes: instant.hour * 60 + instant.minute }
}
