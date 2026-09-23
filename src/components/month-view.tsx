"use client"

import { type CalendarDate, startOfMonth, type ZonedDateTime } from "@internationalized/date"
import { useEffect, useId, useMemo, useRef, useState } from "react"
import { useMove } from "react-aria"
import { Button } from "react-aria-components"
import {
  type CalendarEvent,
  type CalendarEventChange,
  CalendarEventRow,
  type CalendarSource,
  DayOverflowPanel,
  dayIndexAtOffset,
  dayToDate,
  DEFAULT_CALENDAR_TIME_ZONE,
  DRAG_THRESHOLD,
  MoreLink,
  MOVE_KEYS,
  useCalendarToday,
  withoutCancelling,
} from "@/components/calendar-shell"
import {
  calendarMonthRangeLabel,
  calendarRangeLabel,
  type CalendarToolbarLabelVariant,
  CalendarToolbar,
  type CalendarViewName,
  type CalendarViewOption,
  useCalendarLocale,
  useCalendarNavigation,
} from "@/components/calendar-toolbar"
import {
  type EventBand,
  isAllDayEvent,
  isInMonth,
  limitLanes,
  monthRange,
  packBands,
  weekStrip,
} from "@/lib/calendar"
import { getDateTimeFormat } from "@/lib/intl"
import { cn } from "@/lib/utils"

/**
 * MonthView — quebi design system
 *
 * The month as whole weeks, with events drawn as chips that run across the days
 * they cover and fold into a "+N more" when a cell runs out of room. Leading and
 * trailing days from the neighbouring months are dimmed rather than blanked, so
 * an event on the 1st is visible from the last week of the month before it.
 *
 * `Calendar` is the other month grid in this library and it is not this: that one
 * is an input, built on react-aria's `CalendarGrid`, and its cells hold a date
 * and nothing else. This one displays, and the two are named for the question
 * that chooses between them — are you *picking* a date, or *reading* what is on
 * one.
 *
 * Unlike the day and week grids, a month cell has no time axis, so every event
 * is a band here: a 09:00 meeting is a one-day chip carrying its start time as
 * text, and a three-day trip is one chip three columns wide. That is the whole
 * difference, and it is one argument to `packBands`.
 *
 * ## Moving an event
 *
 * Given `isEventEditable` and `onEventChange`, a chip can be dragged onto
 * another day — or arrow-keyed there — and the view reports where it was
 * dropped, exactly as `CalendarShell` does for the day and week grids. The
 * props are the same two, the change is the same `CalendarEventChange`, and the
 * view still moves nothing itself.
 *
 * What a move *is* differs, because this grid is not that one. A month cell has
 * no time axis, so the only thing a drop can say is which day, and the move is
 * therefore a whole number of days with the clock untouched: a 09:00 meeting
 * dropped on Thursday is at 09:00 on Thursday, and a three-day trip dragged one
 * cell right is three days long one day later. That also makes the gesture
 * answerable for a chip the week boundary cut in two — the piece is not the
 * event, but the *distance* it travelled is the same distance either piece
 * travelled, so both halves of a trip spanning a weekend can be picked up. The
 * day grids refuse their cut blocks because a drop there is an absolute
 * position, and half a block off the axis has no position to report.
 *
 * ## Two months, or eight weeks
 *
 * `range` says what the grid is a grid *of*, and there are two answers because
 * there are two questions a month grid gets asked:
 *
 * - `{ months: 2 }` draws two month grids beside each other — this month and
 *   the next — which is the shape every booking and planning calendar uses,
 *   because "is there room the week after next" is a question that straddles
 *   the 30th. Each grid keeps its own header row and dims its own leading and
 *   trailing days, since a day outside September is outside it whatever is
 *   drawn to the right. The chevrons step a whole page, so stepping forward
 *   from September–October lands on November–December and no month is read
 *   twice.
 * - `{ weeks: 8 }` drops the month entirely: eight rows of seven days, the
 *   first of them the week the anchor date falls in, and no dimming at all
 *   because nothing in a strip is outside it. The heading is a *week* picker
 *   rather than a month one — the reader is choosing where the strip starts,
 *   and the chevrons slide it one week at a time, which is what makes it read
 *   as endless rather than as pages. The one seam left is the month boundary,
 *   and the grid marks it where it happens: the 1st says `1. Okt` instead of
 *   `1`.
 *
 * Both are the same grid, the same packing and the same gesture. What a drag
 * cannot do is cross from one grid to the next: each is its own coordinate
 * space, and a pointer over October's grid is not measurable against
 * September's, so a chip dragged off the edge of its own month clamps to it.
 */

/**
 * What the grid draws. One object rather than two numbers, because "how many
 * months" and "how many weeks" are answers to the same question and a view
 * that had been told both would have to ignore one of them in silence.
 */
export type MonthViewRange =
  /** Whole months, side by side. `1` is the default single grid. */
  | { months: number }
  /** A rolling strip of whole weeks, anchored on a week rather than a month. */
  | { weeks: number }

export interface MonthViewProps<E extends CalendarEvent = CalendarEvent> {
  /** Any day in the month on show — or in the first month, or in the strip's first week. Controlled. */
  date?: CalendarDate
  /** Any day in the initial month. Defaults to today; pin it on a prerendered route. */
  defaultDate?: CalendarDate
  onDateChange?: (date: CalendarDate) => void
  /**
   * One month, several months side by side, or a rolling strip of weeks.
   * Default `{ months: 1 }`. See the note above.
   */
  range?: MonthViewRange
  events: readonly E[]
  calendars?: readonly CalendarSource[]
  timeZone?: string
  locale?: string
  /** Override the locale's first day of the week. */
  firstDayOfWeek?: "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat"
  /** Height of one week row in pixels. Default 116. */
  weekHeight?: number
  /** `(n) => "+2 more"`. */
  moreLabel?: (count: number) => string
  /** Fires when an overflow link is activated, with everything on that day. */
  onMoreClick?: (day: CalendarDate, events: E[]) => void
  /** Fires when a day number is activated — the hook for "switch to this day". */
  onDayClick?: (day: CalendarDate) => void
  onEventClick?: (event: E) => void
  selectedEventId?: string | null
  onSelectionChange?: (id: string | null) => void
  /** Pin "today", or pass `null` to highlight nothing. */
  now?: CalendarDate | null
  showToolbar?: boolean
  view?: CalendarViewName
  views?: readonly CalendarViewOption[]
  onViewChange?: (view: CalendarViewName) => void
  label?: React.ReactNode
  /**
   * The toolbar's heading as a picker, or as plain text. Default "picker".
   *
   * Which grid it opens follows `range` rather than being a prop of its own,
   * because the heading names what you are looking at and the picker has to
   * offer that: months are picked by month (`September 2026`, and a day picker
   * would ask for a day this grid never shows the choice of), and a strip is
   * picked by week, because the week it starts on is the only thing about it
   * the reader chooses.
   */
  labelVariant?: CalendarToolbarLabelVariant
  /**
   * Which events may be dragged onto another day. Default none.
   *
   * Opt-in per event, for the reason `CalendarShell` gives: "can this be moved"
   * is a question about the event, not about the view. Pass `true` for all of
   * them, or a predicate. It takes two — without `onEventChange` a drop has
   * nowhere to go, so nothing is movable however this prop reads.
   */
  isEventEditable?: boolean | ((event: E) => boolean)
  /**
   * Fires once on drop, with the event and the days it landed on.
   *
   * The view moves nothing: it reports the drop and re-renders from the
   * `events` you hand back. The duration and the time of day are preserved —
   * a month grid has no axis to change them on — so `start` and `end` are the
   * event's own, shifted by whole days. `calendarId` is undefined: the columns
   * here are days.
   */
  onEventChange?: (event: E, next: CalendarEventChange) => void
  /** What a screen reader is told a movable chip can do. */
  moveHintLabel?: string
  /** The line announced after a move. Defaults to the event and its new date. */
  moveAnnouncement?: (event: E, next: CalendarEventChange) => string
  className?: string
}

/** A chip is 20px tall on a 4px rhythm; the date line above them takes 24px. */
const LANE_HEIGHT = 22
const CELL_HEADER = 26

/** `monthRange` returns whole weeks, and the grid that draws them is `grid-cols-7`. */
const DAYS_PER_WEEK = 7

/**
 * Which week row `y` pixels down the grid falls in — `dayIndexAtOffset` for the
 * other axis.
 *
 * The rows are the one measurement a month grid does not have to read back from
 * the DOM: every one of them is `weekHeight` tall, borders included, because
 * the border box is what the height is set on. A y outside the grid clamps to
 * the row it left by, so a drag off the bottom lands on the last week rather
 * than nowhere.
 */
export function weekIndexAtOffset(y: number, weekHeight: number, weekCount: number): number {
  if (weekCount <= 1 || weekHeight <= 0) return 0
  return Math.min(weekCount - 1, Math.max(0, Math.floor(y / weekHeight)))
}

/** The drop a drag currently stands for: the event, shifted by whole days. */
interface MonthMovePreview<E extends CalendarEvent = CalendarEvent> {
  event: E
  /** Days between where the event is and where it would land. Signed. */
  deltaDays: number
  start: ZonedDateTime
  end: ZonedDateTime
}

interface MonthMoveOrigin<E extends CalendarEvent> {
  event: E
  /** The cell the gesture started on, as `week * 7 + column`. */
  grabbed: number
  /** Page coordinates of the press. Null for a keyboard move, which has none. */
  pointer: { x: number; y: number } | null
  /** The grid's box in page coordinates, read once — see `start`. */
  grid: { left: number; top: number; width: number } | null
  deltaX: number
  deltaY: number
  /** The cell the drop would land on, or null while nothing has moved. */
  target: number | null
  dragged: boolean
}

interface MonthMoveOptions<E extends CalendarEvent> {
  weeks: readonly CalendarDate[][]
  weekHeight: number
  gridRef: React.RefObject<HTMLDivElement | null>
  isEventEditable: boolean | ((event: E) => boolean) | undefined
  onEventChange: ((event: E, next: CalendarEventChange) => void) | undefined
  announce: (event: E, next: CalendarEventChange) => void
  hintId: string
}

interface MonthMoveController<E extends CalendarEvent> {
  /** Is anything movable at all? Gates the hint and the live region. */
  enabled: boolean
  /** The sr-only line describing the gesture, for `aria-describedby`. */
  hintId: string
  preview: MonthMovePreview<E> | null
  isMovable: (event: E) => boolean
  /** `cell` is where the chip sits, used when the pointer cannot be placed. */
  start: (event: E, cell: number, pointer: { x: number; y: number } | null) => void
  move: (deltaX: number, deltaY: number, pointerType: string) => void
  end: (pointerType: string) => void
  /** Was the press that just fired the tail of a drag? Consumes the flag. */
  consumePress: () => boolean
}

/**
 * Dragging a chip onto another day: task #182's gesture, over a grid that has
 * no time axis.
 *
 * `CalendarShell`'s `useEventMove` is the same gesture over a different
 * question, and the two are separate hooks because the answer they compute
 * shares nothing: there the drop is an absolute position on a time axis,
 * snapped to the slot grid and clamped so the whole block fits in the drawn
 * hours; here it is a signed number of days, and the clock is not in it. What
 * *is* shared is shared — `DRAG_THRESHOLD`, `MOVE_KEYS` and `withoutCancelling`
 * are imported rather than copied, because those three are where the two views
 * must agree about what a drag even is.
 *
 * Three decisions, the first two of which are the shell's and the third of
 * which is this grid's:
 *
 * - **Nothing repacks mid-drag.** The chips stay in their lanes while the
 *   pointer is down; the ghost is the only thing that moves. See
 *   `previewBands` for what the ghost is packed against.
 * - **A press is not a drag.** The flag is set on the first `onMove` past
 *   `DRAG_THRESHOLD` and consumed by the press react-aria fires afterwards,
 *   which is what keeps a plain click on a chip selecting it.
 * - **The gesture measures from the cell it started on, not from the event.**
 *   The chip follows the pointer, so the day under the finger at the drop
 *   minus the day under it at the press is the distance moved — which is the
 *   reading that survives a chip the week boundary cut, and the reading a
 *   reader dragging the middle of a three-day trip expects. With no pointer
 *   (the keyboard) or no measurable grid, the chip's own first day stands in.
 */
function useMonthEventMove<E extends CalendarEvent>(
  options: MonthMoveOptions<E>,
): MonthMoveController<E> {
  const { weeks, weekHeight, gridRef, isEventEditable, onEventChange, announce, hintId } = options
  const [preview, setPreview] = useState<MonthMovePreview<E> | null>(null)
  const originRef = useRef<MonthMoveOrigin<E> | null>(null)
  const draggedRef = useRef(false)
  const refocusRef = useRef<string | null>(null)
  const cellCount = weeks.length * DAYS_PER_WEEK

  // A keyboard move commits on every key press, and a commit that changes the
  // week remounts the chip under another row — React has no way to carry focus
  // across that, and focus lost after the first ArrowRight is the keyboard path
  // gone. So the chip is found again by the id it carries and re-focused, once,
  // on the render that follows the commit.
  useEffect(() => {
    const id = refocusRef.current
    if (!id) return
    refocusRef.current = null
    const chips = gridRef.current?.querySelectorAll<HTMLElement>('[data-slot="calendar-chip"]')
    // By id rather than by selector: an id is a consumer's string and `CSS.escape`
    // is not everywhere, and a multi-day event has one chip per week it crosses,
    // so the first match is the one to land on.
    Array.from(chips ?? []).find((chip) => chip.dataset.eventId === id)?.focus()
  })

  const enabled = onEventChange !== undefined && isEventEditable !== undefined

  const isMovable = (event: E) => {
    if (!enabled) return false
    return typeof isEventEditable === "function" ? isEventEditable(event) : isEventEditable === true
  }

  const clampCell = (cell: number) => Math.min(cellCount - 1, Math.max(0, cell))

  const cellAt = (x: number, y: number, gridWidth: number) =>
    weekIndexAtOffset(y, weekHeight, weeks.length) * DAYS_PER_WEEK +
    dayIndexAtOffset(x, gridWidth, DAYS_PER_WEEK)

  const previewAt = (origin: MonthMoveOrigin<E>, cell: number): MonthMovePreview<E> => {
    const deltaDays = cell - origin.grabbed
    return {
      event: origin.event,
      deltaDays,
      // Wall-clock arithmetic, so a 09:00 meeting is still at 09:00 on the day
      // it lands on — including across the two nights a year that are not 24
      // hours long.
      start: origin.event.start.add({ days: deltaDays }),
      end: origin.event.end.add({ days: deltaDays }),
    }
  }

  const commit = (origin: MonthMoveOrigin<E>, pointerType: string) => {
    if (origin.target === null || origin.target === origin.grabbed) return
    const next = previewAt(origin, origin.target)
    if (pointerType === "keyboard") refocusRef.current = origin.event.id
    const change = { start: next.start, end: next.end }
    onEventChange?.(origin.event, change)
    announce(origin.event, change)
  }

  return {
    enabled,
    hintId,
    preview,
    isMovable,

    start(event, cell, pointer) {
      draggedRef.current = false
      if (!isMovable(event)) {
        originRef.current = null
        return
      }
      // The grid's box is read once, at the press. Reading it per frame would
      // pick up the scroll the drag itself can cause and walk the ghost.
      const rect = gridRef.current?.getBoundingClientRect()
      const grid = rect
        ? { left: rect.left + window.scrollX, top: rect.top + window.scrollY, width: rect.width }
        : null
      originRef.current = {
        event,
        grabbed:
          grid && grid.width > 0 && pointer
            ? cellAt(pointer.x - grid.left, pointer.y - grid.top, grid.width)
            : clampCell(cell),
        pointer,
        grid,
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
      // so the keyboard's unit is chosen here, and it is the one the grid is
      // drawn in: a day across, a week down. Each press commits on its own
      // `moveend`, which is what makes the move announceable step by step
      // instead of only at the end.
      if (pointerType === "keyboard") {
        origin.target = clampCell(
          origin.grabbed + Math.sign(deltaX) + Math.sign(deltaY) * DAYS_PER_WEEK,
        )
        return
      }

      origin.deltaX += deltaX
      origin.deltaY += deltaY
      if (Math.abs(origin.deltaX) > DRAG_THRESHOLD || Math.abs(origin.deltaY) > DRAG_THRESHOLD) {
        origin.dragged = true
        draggedRef.current = true
      }

      // An unmeasurable grid keeps the event where it is rather than guessing:
      // a drag that cannot answer "which day" has not been told anything moved.
      const target =
        origin.grid && origin.grid.width > 0 && origin.pointer
          ? cellAt(
              origin.pointer.x + origin.deltaX - origin.grid.left,
              origin.pointer.y + origin.deltaY - origin.grid.top,
              origin.grid.width,
            )
          : origin.grabbed
      origin.target = target
      setPreview(previewAt(origin, target))
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

/**
 * Where the dragged event would be drawn if the drop happened now.
 *
 * The ghost is packed, not placed: the event is taken out of the set, put back
 * at its target, and `packBands` run over every week the way the grid itself
 * runs it. So the lane the ghost takes is the lane the drop gives it, a chip
 * that would be cut by a week boundary is drawn cut in both rows, and one that
 * would leave the grid is drawn in neither. Only the dragged event's own bands
 * are read out of the result — the chips around it keep the lanes the reader
 * last saw them in, which is the rule `CalendarShell` states for its ghost.
 */
function previewBands<E extends CalendarEvent>(
  events: readonly E[],
  preview: MonthMovePreview<E>,
  weeks: readonly CalendarDate[][],
  timeZone: string,
): { weekIndex: number; band: EventBand }[] {
  const moved: CalendarEvent = { ...preview.event, start: preview.start, end: preview.end }
  const others: CalendarEvent[] = events.filter((event) => event.id !== preview.event.id)
  const all = [...others, moved]

  return weeks.flatMap((week, weekIndex) => {
    const band = packBands(all, week, timeZone, { include: "all" }).find(
      (candidate) => candidate.event.id === moved.id,
    )
    return band ? [{ weekIndex, band }] : []
  })
}

/** Which columns of its week a band spans, and by how much it is inset. */
function bandGeometry(band: EventBand, dayCount: number): React.CSSProperties {
  const left = (band.startIndex / dayCount) * 100
  const width = ((band.endIndex - band.startIndex + 1) / dayCount) * 100
  return { left: `${left}%`, width: `calc(${width}% - 6px)`, marginLeft: 3 }
}

/**
 * Which of a chip's corners the *week boundary* cuts.
 *
 * Only that one, now: the accented edge is squared by `CalendarEventRow`
 * itself (task #176, and see the radius there), because whether a row draws
 * the accent is the row's own business and the panel lists the same events
 * with no geometry at all. What is left is what the grid knows and the row
 * cannot — that this chip is one half of an event cut at the end of a week,
 * and the two halves read as one thing only if the cut is square.
 */
function bandCorners(band: EventBand): string {
  return cn(
    band.continuesBefore && "rounded-l-none",
    isAllDayEvent(band.event) && band.continuesAfter && "rounded-r-none",
  )
}

/** `range`'s default, hoisted so it is not a new object on every render. */
const SINGLE_MONTH: MonthViewRange = { months: 1 }

/** One grid to draw: its weeks, and the month it dims against — or no month. */
interface MonthGridSpec {
  /** Stable across a step, so React keeps the rows it can. */
  key: string
  month: CalendarDate | null
  weeks: CalendarDate[][]
}

export function MonthView<E extends CalendarEvent = CalendarEvent>({
  date,
  defaultDate,
  onDateChange,
  range = SINGLE_MONTH,
  events,
  calendars,
  timeZone = DEFAULT_CALENDAR_TIME_ZONE,
  locale: localeProp,
  firstDayOfWeek,
  weekHeight = 116,
  moreLabel = (count) => `+${count} more`,
  onMoreClick,
  onDayClick,
  onEventClick,
  selectedEventId,
  onSelectionChange,
  now,
  showToolbar = true,
  view,
  views,
  onViewChange,
  label,
  labelVariant = "picker",
  isEventEditable,
  onEventChange,
  moveHintLabel = "Press the arrow keys to move this event to another day.",
  moveAnnouncement,
  className,
}: MonthViewProps<E>) {
  const locale = useCalendarLocale(localeProp)
  const todayDate = useCalendarToday(now, timeZone)

  // Read as numbers before anything else touches it: `range` is written as an
  // object literal in JSX and is therefore a new identity every render, so the
  // grids have to be memoised on what it *says*. Both are clamped once, here —
  // `{ months: 0 }` is a view of nothing, and a view of nothing is a bug
  // wherever it is drawn.
  const stripWeeks = "weeks" in range ? Math.max(1, Math.trunc(range.weeks)) : null
  const monthCount = "weeks" in range ? 1 : Math.max(1, Math.trunc(range.months))

  const navigation = useCalendarNavigation({
    date,
    defaultDate,
    onDateChange,
    // A page at a time in months — September–October steps to November–December
    // rather than to an overlapping pair — and one week at a time in a strip,
    // which is the whole of what "endless" means here.
    step: stripWeeks === null ? { months: monthCount } : { weeks: 1 },
    timeZone,
  })

  const grids = useMemo<MonthGridSpec[]>(() => {
    if (stripWeeks !== null) {
      return [
        {
          key: "strip",
          month: null,
          weeks: weekStrip(navigation.date, locale, stripWeeks, firstDayOfWeek),
        },
      ]
    }
    const first = startOfMonth(navigation.date)
    return Array.from({ length: monthCount }, (_, index) => {
      const month = first.add({ months: index })
      return { key: month.toString(), month, weeks: monthRange(month, locale, firstDayOfWeek) }
    })
  }, [stripWeeks, monthCount, navigation.date, locale, firstDayOfWeek])

  const maxLanes = Math.max(1, Math.floor((weekHeight - CELL_HEADER) / LANE_HEIGHT))

  const hintId = useId()
  const [announcement, setAnnouncement] = useState("")

  // Each grid has its own move controller, so `enabled` is asked here as well:
  // the hint and the live region belong to the view, and they are needed under
  // exactly the condition every one of those controllers turns on under.
  const moveEnabled = onEventChange !== undefined && isEventEditable !== undefined

  const announce = (event: E, next: CalendarEventChange) =>
    setAnnouncement(
      moveAnnouncement
        ? moveAnnouncement(event, next)
        : `${event.title}: ${getDateTimeFormat(locale, {
            weekday: "long",
            day: "numeric",
            month: "long",
            timeZone,
          }).format(next.start.toDate())}`,
    )

  const firstMonth = grids[0]?.month
  const lastMonth = grids[grids.length - 1]?.month
  const defaultLabel =
    firstMonth && lastMonth
      ? calendarMonthRangeLabel(firstMonth, lastMonth, { locale, timeZone })
      : // A strip has no month to name, so it names its ends — the same range
        // label the week view's heading uses, over eight weeks instead of one.
        calendarRangeLabel(grids[0]?.weeks.flat() ?? [], { locale, timeZone })

  return (
    <div data-slot="month-view" className={cn("flex w-full flex-col gap-3", className)}>
      {showToolbar ? (
        <CalendarToolbar
          label={label ?? defaultLabel}
          labelVariant={labelVariant}
          pickerGranularity={stripWeeks === null ? "month" : "week"}
          // Which seven days a row is, told to the grid the heading opens as
          // well — a week picker that disagreed with the strip about where a
          // week starts would hand back a week the strip then redraws as a
          // different one. `WeekView` passes the same pair for the same reason.
          locale={locale}
          firstDayOfWeek={firstDayOfWeek}
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

      {/* However many grids there are, they are one row of them: a single month
          is a single flex child at full width, and the wrap is what makes two
          months stack instead of squeeze on a narrow page. `min-w-72` is the
          width below which seven columns stop being readable, and it is only
          set when there is more than one grid — a lone month narrower than
          that is still the only thing on the page. */}
      <div className="flex w-full flex-wrap items-start gap-3">
        {grids.map((grid) => (
          <MonthGrid
            key={grid.key}
            weeks={grid.weeks}
            month={grid.month}
            events={events}
            calendars={calendars}
            timeZone={timeZone}
            locale={locale}
            weekHeight={weekHeight}
            maxLanes={maxLanes}
            moreLabel={moreLabel}
            onMoreClick={onMoreClick}
            onDayClick={onDayClick}
            onEventClick={onEventClick}
            selectedEventId={selectedEventId ?? null}
            onSelectionChange={onSelectionChange}
            today={todayDate}
            isEventEditable={isEventEditable}
            onEventChange={onEventChange}
            announce={announce}
            hintId={hintId}
            className={grids.length > 1 ? "min-w-72" : undefined}
          />
        ))}
      </div>

      {/* The keyboard half of the gesture needs saying out loud, twice over: a
          movable chip is described as movable before anyone tries, and every
          landing is announced, because the ghost is a picture and a picture is
          not a channel every reader has. The region is `polite` — a move is
          the reader's own doing, so it waits its turn rather than
          interrupting. */}
      {moveEnabled ? (
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

interface MonthGridProps<E extends CalendarEvent> {
  weeks: CalendarDate[][]
  /** The month the leading and trailing days are dimmed against. Null in a strip. */
  month: CalendarDate | null
  events: readonly E[]
  calendars: readonly CalendarSource[] | undefined
  timeZone: string
  locale: string
  weekHeight: number
  maxLanes: number
  moreLabel: (count: number) => string
  onMoreClick: ((day: CalendarDate, events: E[]) => void) | undefined
  onDayClick: ((day: CalendarDate) => void) | undefined
  onEventClick: ((event: E) => void) | undefined
  selectedEventId: string | null
  onSelectionChange: ((id: string | null) => void) | undefined
  today: CalendarDate | null
  isEventEditable: boolean | ((event: E) => boolean) | undefined
  onEventChange: ((event: E, next: CalendarEventChange) => void) | undefined
  announce: (event: E, next: CalendarEventChange) => void
  hintId: string
  className?: string
}

/**
 * One box of weekday headers and week rows — the whole of what a month grid is
 * drawn as, and what a side-by-side view draws more than one of.
 *
 * The move gesture is set up here rather than in `MonthView` because it is
 * measured against *this* box: a cell is numbered `week * 7 + column` from this
 * grid's own top-left, and the pointer is placed against this grid's rect. Two
 * months are therefore two controllers, which is also the answer to what
 * happens when a chip is dragged past the edge of its own month — it clamps
 * there, because the grid next to it is a coordinate space this gesture cannot
 * express.
 */
function MonthGrid<E extends CalendarEvent>({
  weeks,
  month,
  events,
  calendars,
  timeZone,
  locale,
  weekHeight,
  maxLanes,
  moreLabel,
  onMoreClick,
  onDayClick,
  onEventClick,
  selectedEventId,
  onSelectionChange,
  today,
  isEventEditable,
  onEventChange,
  announce,
  hintId,
  className,
}: MonthGridProps<E>) {
  const gridRef = useRef<HTMLDivElement>(null)
  const move = useMonthEventMove<E>({
    weeks,
    weekHeight,
    gridRef,
    isEventEditable,
    onEventChange,
    announce,
    hintId,
  })

  const ghosts = useMemo(
    () => (move.preview ? previewBands(events, move.preview, weeks, timeZone) : []),
    [move.preview, events, weeks, timeZone],
  )

  const headerDays = weeks[0] ?? []

  return (
    <div
      className={cn(
        "min-w-0 flex-1 overflow-hidden rounded-quebi-md border border-quebi-line/10 bg-quebi-bg",
        className,
      )}
    >
      <div className="grid grid-cols-7 border-quebi-line/10 border-b">
        {headerDays.map((day) => (
          <div
            key={day.toString()}
            className="px-2 py-2 text-center text-quebi-fg-subtle text-xs uppercase"
          >
            {getDateTimeFormat(locale, { weekday: "short", timeZone }).format(
              dayToDate(day, timeZone),
            )}
          </div>
        ))}
      </div>

      {/* The weeks share one box, and that box is what a drag is measured
          against: a chip lives in its own row, and a row has no coordinate
          space the row above it is expressible in. It is also where the
          ghost is drawn, for the same reason `CalendarShell` draws its own
          across the whole grid rather than inside a day column. */}
      <div ref={gridRef} data-slot="month-grid" className="relative">
        {weeks.map((week, weekIndex) => (
          <MonthWeek
            key={week[0]?.toString() ?? ""}
            week={week}
            weekIndex={weekIndex}
            month={month}
            events={events}
            calendars={calendars}
            timeZone={timeZone}
            locale={locale}
            weekHeight={weekHeight}
            maxLanes={maxLanes}
            moreLabel={moreLabel}
            onMoreClick={onMoreClick}
            onDayClick={onDayClick}
            onEventClick={onEventClick}
            selectedEventId={selectedEventId}
            onSelectionChange={onSelectionChange}
            today={today}
            move={move}
          />
        ))}

        {ghosts.map(({ weekIndex, band }) => (
          <CalendarEventRow
            key={`${band.event.id}:${weekIndex}`}
            slot="month-move-preview"
            isPreview
            event={band.event}
            calendars={calendars}
            locale={locale}
            timeZone={timeZone}
            isSelected={false}
            onActivate={NO_OP}
            style={{
              ...bandGeometry(band, DAYS_PER_WEEK),
              // The lane is the one the drop would give it — clamped to the
              // last lane the cell draws, because a target day that is
              // already full puts the chip behind its own "+N more" and a
              // ghost on the lane after that would hang into the week below.
              top:
                weekIndex * weekHeight +
                CELL_HEADER +
                Math.min(band.lane, maxLanes - 1) * LANE_HEIGHT,
            }}
            className={cn("absolute", bandCorners(band))}
          />
        ))}
      </div>
    </div>
  )
}
const NO_OP = () => {}

interface MonthWeekProps<E extends CalendarEvent> {
  week: CalendarDate[]
  /** Which row this is, so a chip can say which cell it was grabbed from. */
  weekIndex: number
  /** The month to dim against, or null in a strip, where no day is outside. */
  month: CalendarDate | null
  events: readonly E[]
  calendars: readonly CalendarSource[] | undefined
  timeZone: string
  locale: string
  weekHeight: number
  maxLanes: number
  moreLabel: (count: number) => string
  onMoreClick: ((day: CalendarDate, events: E[]) => void) | undefined
  onDayClick: ((day: CalendarDate) => void) | undefined
  onEventClick: ((event: E) => void) | undefined
  selectedEventId: string | null
  onSelectionChange: ((id: string | null) => void) | undefined
  today: CalendarDate | null
  move: MonthMoveController<E>
}

/** One row of the month: seven cells, and the chips laid across them. */
function MonthWeek<E extends CalendarEvent>({
  week,
  weekIndex,
  month,
  events,
  calendars,
  timeZone,
  locale,
  weekHeight,
  maxLanes,
  moreLabel,
  onMoreClick,
  onDayClick,
  onEventClick,
  selectedEventId,
  onSelectionChange,
  today,
  move,
}: MonthWeekProps<E>) {
  const bands = useMemo(
    () => packBands(events, week, timeZone, { include: "all" }),
    [events, week, timeZone],
  )
  const limited = useMemo(() => limitLanes(bands, week.length, maxLanes), [bands, week, maxLanes])

  const activate = (event: E) => {
    onSelectionChange?.(selectedEventId === event.id ? null : event.id)
    onEventClick?.(event)
  }

  return (
    <div className="relative border-quebi-line/10 border-b last:border-b-0" style={{ height: weekHeight }}>
      <div className="grid h-full grid-cols-7">
        {week.map((day) => {
          const outside = month !== null && !isInMonth(day, month)
          const isToday = today !== null && today.compare(day) === 0
          // The one seam a strip still has. With no month above the grid to
          // say which one you are reading, the 1st says it itself — `1. Okt`
          // — and every other day stays a bare number, because a date line
          // that spelled the month out twice a row would be reading noise.
          const opensMonth = month === null && day.day === 1
          return (
            <div
              key={day.toString()}
              className={cn(
                "border-quebi-line/10 border-l first:border-l-0",
                outside && "bg-quebi-surface/[0.02]",
              )}
            >
              <div className="flex justify-end px-1.5 pt-1">
                <Button
                  onPress={() => onDayClick?.(day)}
                  isDisabled={!onDayClick}
                  className={cn(
                    "flex h-6 min-w-6 items-center justify-center rounded-full px-1.5",
                    "font-semibold text-xs tabular-nums transition-colors duration-150",
                    "outline-none focus-visible:ring-2 focus-visible:ring-quebi-brand-mark focus-visible:ring-inset",
                    onDayClick && "cursor-pointer hover:bg-quebi-surface/[0.08]",
                    isToday
                      ? "bg-quebi-brand text-quebi-on-brand"
                      : outside
                        ? "text-quebi-fg-subtle"
                        : "text-quebi-fg",
                  )}
                >
                  {getDateTimeFormat(locale, {
                    day: "numeric",
                    ...(opensMonth ? { month: "short" as const } : {}),
                    timeZone,
                  }).format(dayToDate(day, timeZone))}
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {limited.bands.map((band) => (
        <MonthChip
          key={band.event.id}
          band={band}
          dayCount={week.length}
          calendars={calendars}
          locale={locale}
          timeZone={timeZone}
          top={CELL_HEADER + band.lane * LANE_HEIGHT}
          isSelected={selectedEventId === band.event.id}
          onActivate={activate}
          cell={weekIndex * DAYS_PER_WEEK + band.startIndex}
          move={move}
        />
      ))}

      <div className="pointer-events-none absolute inset-x-0 grid grid-cols-7" style={{ top: CELL_HEADER }}>
        {week.map((day, index) => {
          const hidden = limited.hiddenPerDay[index] ?? 0
          if (hidden === 0) return <div key={day.toString()} />
          return (
            <div
              key={day.toString()}
              className="pointer-events-auto px-1"
              style={{ marginTop: (maxLanes - 1) * LANE_HEIGHT }}
            >
              {/* Supplying `onMoreClick` says the consumer owns what "+N more"
                  does — the documented "switch to this day" hook — so the
                  library draws no panel behind it. Without it the panel is the
                  default, which is the only reading under which the affordance
                  does something on its own. */}
              {onMoreClick ? (
                <MoreLink
                  count={hidden}
                  label={moreLabel}
                  onPress={() => onMoreClick(day, eventsOn(events, day, timeZone))}
                />
              ) : (
                <MoreLink count={hidden} label={moreLabel}>
                  <DayOverflowPanel
                    day={day}
                    events={eventsOn(events, day, timeZone)}
                    calendars={calendars}
                    locale={locale}
                    timeZone={timeZone}
                    selectedId={selectedEventId}
                    onActivate={activate}
                  />
                </MoreLink>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Everything on `day`, all-day first then by start — what a "+N more" opens onto. */
function eventsOn<E extends CalendarEvent>(
  events: readonly E[],
  day: CalendarDate,
  timeZone: string,
): E[] {
  return packBands(events, [day], timeZone, { include: "all" })
    .map((band) => band.event)
    .sort((a, b) => {
      const allDay = Number(isAllDayEvent(b)) - Number(isAllDayEvent(a))
      return allDay !== 0 ? allDay : a.start.compare(b.start)
    })
}

interface MonthChipProps<E extends CalendarEvent> {
  band: EventBand<E>
  dayCount: number
  calendars: readonly CalendarSource[] | undefined
  locale: string
  timeZone: string
  top: number
  isSelected: boolean
  onActivate: (event: E) => void
  /** The grid cell the chip starts on — where a keyboard move measures from. */
  cell: number
  move: MonthMoveController<E>
}

/**
 * One event in the month grid: a `CalendarEventRow` placed by its band.
 *
 * What the row *is* — the dot, the time, the palette — is `CalendarEventRow`'s,
 * because the "+N more" panel lists the same events without any of this
 * geometry. What is left here is the geometry: which columns the band spans,
 * which lane it sits in, and which of its corners are cut because it runs on
 * into the week either side.
 *
 * A movable chip is that same row inside a wrapper that carries the gesture and
 * the geometry, which is `TimedBlock`'s arrangement in `CalendarShell` and for
 * its reason: `useMove` has to start from the capture phase, above a react-aria
 * `Button` that stops `pointerdown` dead on itself.
 */
function MonthChip<E extends CalendarEvent>({
  band,
  dayCount,
  calendars,
  locale,
  timeZone,
  top,
  isSelected,
  onActivate,
  cell,
  move,
}: MonthChipProps<E>) {
  const isMovable = move.isMovable(band.event)
  const geometry = { ...bandGeometry(band, dayCount), top }

  // `useMove` rather than a raw `onPointerDown`, because it is the hook that
  // already knows the difference between a pointer and an arrow key — the
  // gesture arrives from both, and an event that can only be moved by dragging
  // cannot be moved by everyone.
  const { moveProps } = useMove({
    onMove: (event) => move.move(event.deltaX, event.deltaY, event.pointerType),
    onMoveEnd: (event) => move.end(event.pointerType),
  })

  const row = (
    <CalendarEventRow
      event={band.event}
      calendars={calendars}
      locale={locale}
      timeZone={timeZone}
      isSelected={isSelected}
      describedBy={isMovable ? move.hintId : undefined}
      onActivate={(event) => {
        // The press that ends a drag is still a press. See `useMonthEventMove`.
        if (isMovable && move.consumePress()) return
        onActivate(event)
      }}
      // A movable chip is positioned by the wrapper that carries the gesture,
      // and fills it; everything else positions itself.
      style={isMovable ? undefined : geometry}
      className={cn(
        isMovable ? "w-full cursor-grab active:cursor-grabbing" : "absolute",
        move.preview?.event.id === band.event.id && "opacity-40",
        bandCorners(band),
      )}
    />
  )

  if (!isMovable) return row

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
        move.start(band.event, cell, { x: event.pageX, y: event.pageY })
        // react-aria's press handling stops `pointerdown` dead on the chip
        // itself, so the bubble-phase listener `useMove` installs on this
        // wrapper would never see one. Starting the move from the capture
        // phase is what gets both halves: the gesture begins here, and the
        // event carries on down to the button where the press it might still
        // be is waiting for it. See `withoutCancelling`.
        moveProps.onPointerDown?.(withoutCancelling(event))
      }}
      onKeyDownCapture={(event) => {
        if (MOVE_KEYS.has(event.key)) move.start(band.event, cell, null)
      }}
    >
      {row}
    </div>
  )
}
