"use client"

import { type CalendarDate, startOfMonth, type ZonedDateTime } from "@internationalized/date"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useId, useMemo, useRef, useState } from "react"
import { useMove } from "react-aria"
import { Button as AriaButton } from "react-aria-components"
import { Button } from "@/components/button"
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
import { ToggleGroup, ToggleGroupItem } from "@/components/toggle-group"
import { getDateTimeFormat, getNumberFormat } from "@/lib/intl"
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
 *
 * ## The carousel
 *
 * `{ months: 2, carousel: true }` is the side-by-side view through a window:
 * the months either side of it show a slice of themselves, blurred and dimmed,
 * and the chevrons move by one month rather than by a page — so the month that
 * was peeking is the month you get, and the reader can see what they are
 * stepping into before they step. How many months the window holds is *the
 * reader's* choice here rather than the caller's: `choices` puts a segmented
 * control in the toolbar beside the view switcher, and `onMonthsChange`
 * reports what was picked. It is the one thing about a calendar's density that
 * a reader can answer better than the page can — a laptop holds three months,
 * the same page on a tablet holds one.
 *
 * Three decisions worth knowing about, because each of them is a thing a
 * carousel usually does and this one does not:
 *
 * - **The neighbours are `inert`, not merely faded**, and they stay that way
 *   even when the veil lifts. A peeking month is a picture of what is next: its
 *   day buttons are not tab stops, its chips are not draggable, and a screen
 *   reader is not read a month nobody is looking at. Hovering one *eases* the
 *   veil — half the blur, a lighter tint — so it can be read without stopping
 *   being a peek, and the chevron drawn over it is how you go there. *Seeing*
 *   next month is not being in it.
 * - **The blur ramps rather than covering.** Two masked `backdrop-blur` layers
 *   and a dimming gradient over the same axis, so a peek is sharp where it
 *   meets the window and blurred at its outer edge. A uniform blur reads as a
 *   frosted panel stuck to the side of the calendar; a ramp reads as the page
 *   carrying on past the edge of what you are looking at.
 * - **It is not `Carousel`.** That component is embla over a fixed list of
 *   slides, and this is an unbounded run of months generated from a date the
 *   toolbar owns. There is no list to be at slide 3 of, and the prev/next
 *   controls already exist one component up.
 * - **Every move travels the whole way, and the date does not wait for it.**
 *   The press commits the month immediately — the label and `onDateChange`
 *   have it from the first frame — and the band then journeys from where it
 *   was to where it now belongs, over every month in between: a jump to next
 *   year slides past eleven of them. Only the ends of the journey are drawn
 *   properly, the window it left and the window it is going to with their
 *   peeks; the months it only passes are placeholders of the right shape,
 *   because each is on screen for a few frames and nobody can read a grid in
 *   that time. See `useCarouselTravel` for how the band moves without anything
 *   on screen jumping — including a second press that lands mid-flight, which
 *   carries on from where the band had got to rather than starting again.
 *   The date committing first is also what makes reduced motion safe: the
 *   animation-first arrangement, commit when the transition ends, stops
 *   committing the moment transitions are off. Here the band simply arrives.
 * - **Every month in a carousel is six rows.** The single-month view draws only
 *   the rows its month needs, which is right for a month you are looking at and
 *   wrong for a band you are stepping through — February would make the whole
 *   calendar two rows shorter and everything anchored to its height would jump
 *   under the press that did it, including the chevrons.
 * - **There is no swipe**, and for a sharper reason than the rest: on a touch
 *   screen a swipe across the grid is the gesture that drags an event to
 *   another day.
 */

/**
 * What the grid draws. One object rather than two numbers, because "how many
 * months" and "how many weeks" are answers to the same question and a view
 * that had been told both would have to ignore one of them in silence.
 */
export type MonthViewRange =
  | {
      /**
       * Whole months, side by side. `1` is the default single grid.
       *
       * In a carousel this is where the reader starts rather than where they
       * are kept: it seeds the window, and `choices` is what they may change
       * it to. Passing a new one moves the window back — the prop leads, the
       * reader's choice follows it, which is what makes the count controllable
       * from outside without a second prop for the same number.
       */
      months: number
      /** Draw them through a window, with the months either side peeking in. */
      carousel?: boolean | MonthCarouselOptions
    }
  /** A rolling strip of whole weeks, anchored on a week rather than a month. */
  | { weeks: number }

/** How the window is cut, and what the reader may change about it. */
export interface MonthCarouselOptions {
  /**
   * How much of the month either side shows, as a fraction of one grid.
   * Default 0.22, clamped to between 0.05 and 0.5.
   *
   * Enough to read a weekday header and the shape of the first week — which is
   * what makes it a preview of somewhere to go rather than a decorative edge.
   * Half is the ceiling because at more than that the thing peeking is as
   * present as the thing in the window, and the window has stopped being one.
   */
  peek?: number
  /**
   * The counts the reader may switch between, as a segmented control in the
   * toolbar. Default `[1, 2, 3]`, plus `months` if it is not among them.
   *
   * An empty list draws no control and the count stays the caller's, which is
   * the carousel with the reader's half of it turned off — a page that decides
   * its own density from its own breakpoint wants exactly that.
   */
  choices?: readonly number[]
  /** The control's accessible name. Default "Months shown". */
  choicesLabel?: string
  /** `(n) => "2 months"` — what one choice is called to a screen reader. */
  choiceLabel?: (count: number) => string
}

export interface MonthViewProps<E extends CalendarEvent = CalendarEvent> {
  /** Any day in the month on show — or in the first month, or in the strip's first week. Controlled. */
  date?: CalendarDate
  /** Any day in the initial month. Defaults to today; pin it on a prerendered route. */
  defaultDate?: CalendarDate
  onDateChange?: (date: CalendarDate) => void
  /**
   * One month, several months side by side, a carousel of them, or a rolling
   * strip of weeks. Default `{ months: 1 }`. See the note above.
   */
  range?: MonthViewRange
  /**
   * Fires when the reader changes how many months a carousel shows.
   *
   * The view keeps the choice itself, so this is a report rather than a
   * requirement — take it to persist the density, or to move `range.months`
   * with it, or ignore it.
   */
  onMonthsChange?: (months: number) => void
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
  /**
   * The names of the chevrons a carousel draws over its peeking months — the
   * place to translate them. Default "Previous month" / "Next month".
   */
  previousMonthLabel?: string
  nextMonthLabel?: string
  /** What a screen reader is told a movable chip can do. */
  moveHintLabel?: string
  /** The line announced after a move. Defaults to the event and its new date. */
  moveAnnouncement?: (event: E, next: CalendarEventChange) => string
  className?: string
}

/**
 * A chip is 20px tall on a 4px rhythm, and `CELL_HEADER` is the band above them
 * that the date line owns: `pt-1` plus the button's `h-6`, so 4 + 24.
 *
 * It is the date line's *height*, not an estimate of it — the wrapper below is
 * given this number, because a header box the chips do not clear is a chip
 * drawn over the day number. It used to be 26 against a 28px line, and the two
 * pixels it was short ate the bottom of today's filled circle.
 */
const LANE_HEIGHT = 22
const CELL_HEADER = 28

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

/** `2026-09` as a number, so a move can be measured in months. */
const monthOrdinal = (date: CalendarDate) => date.year * 12 + date.month

/** One cell of a carousel's band. */
interface CarouselCell {
  /** The month's own string, so a month keeps its DOM across a journey. */
  key: string
  month: CalendarDate
  /** Drawn in full, or a placeholder for a month the band is only passing. */
  full: boolean
  /** One of the months being read — the only ones that are not `inert`. */
  inWindow: boolean
}

/** A one-cell step takes this long; longer journeys take a little longer. */
const TRAVEL_MS = 400
/** What each further cell adds, so a year reads as further than a month. */
const TRAVEL_PER_CELL_MS = 50
/** And the ceiling, so a jump across years is still a jump. */
const TRAVEL_MAX_MS = 900
/** How long after its end a journey that never reported ending is settled anyway. */
const SETTLE_GRACE_MS = 120

const legDuration = (cells: number) =>
  Math.min(TRAVEL_MAX_MS, TRAVEL_MS + TRAVEL_PER_CELL_MS * Math.max(0, cells - 1))

/**
 * Where a carousel's band is, and where it is going.
 *
 * The band is laid out against an `origin` month — the cell for month `k` sits
 * `k - origin` cells from it — and that origin is held still for the whole of a
 * journey. That is the property everything else rests on: months can be added
 * to either end of the band while it is moving without a single cell already on
 * screen changing position, so a second press mid-flight is just a new `focus`,
 * and the browser carries the transform on from wherever it had got to. Only
 * when the band comes to rest is it laid out again, around where it stopped,
 * and that happens in a frame with no transitions, because it changes numbers
 * and not pixels.
 */
interface CarouselTravel {
  origin: number
  /** The window's first month: where the band is at rest, or where it is going. */
  focus: number
  /**
   * Every window this journey has been heading for, origin first. Each of them
   * is drawn in full, with its peeks; the months between them are not.
   */
  stops: readonly number[]
  /**
   * `rest` — still; only a change of count animates. `travel` — moving to
   * `focus`. `settle` — just laid out again around where it stopped: one frame
   * with nothing animating, then `rest`.
   */
  phase: "rest" | "travel" | "settle"
  /** Did this leg begin while the band was already moving? */
  retarget: boolean
  duration: number
  /** Counts legs, so a timer set for one leg cannot settle the next. */
  leg: number
}

const restAt = (ordinal: number, leg = 0): CarouselTravel => ({
  origin: ordinal,
  focus: ordinal,
  stops: [ordinal],
  phase: "rest",
  retarget: false,
  duration: TRAVEL_MS,
  leg,
})

/** The band after it arrives: laid out around `focus`, in a frame that does not animate. */
const settled = (travel: CarouselTravel): CarouselTravel =>
  travel.phase === "travel" ? { ...restAt(travel.focus, travel.leg), phase: "settle" } : travel

/** Whether the reader has asked for less motion — read at the moment of a move. */
const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

/**
 * The next state of the band when the window's first month becomes `to`.
 *
 * From rest, a journey begins where the band is. Mid-flight, it *continues*:
 * the origin is kept, the new window joins the stops, and only the target
 * moves — the browser retargets a running transition from its current value,
 * so a third press on `›` picks up speed from where the second one had got to
 * rather than jumping to the end of it first.
 */
function journey(travel: CarouselTravel, to: number, animate: boolean): CarouselTravel {
  const leg = travel.leg + 1
  if (!animate) return { ...restAt(to, leg), phase: "settle" }
  if (travel.phase === "travel") {
    return {
      ...travel,
      focus: to,
      stops: travel.stops.includes(to) ? travel.stops : [...travel.stops, to],
      retarget: true,
      duration: legDuration(Math.abs(to - travel.focus)),
      leg,
    }
  }
  return {
    origin: travel.focus,
    focus: to,
    stops: [travel.focus, to],
    phase: "travel",
    retarget: false,
    duration: legDuration(Math.abs(to - travel.focus)),
    leg,
  }
}

/**
 * A carousel's position, and the handler that tells it a journey is over.
 *
 * A move is noticed during render rather than in an effect — the band for the
 * new month is drawn in the same commit as the new month, so there is no frame
 * in which the label says October and the band has not heard. The transform
 * changes in that commit too, and the browser transitions it from the value it
 * last painted, which is where the band was.
 */
function useCarouselTravel(ordinal: number, enabled: boolean) {
  const [travel, setTravel] = useState(() => restAt(ordinal))

  if (ordinal !== travel.focus) {
    setTravel(journey(travel, ordinal, enabled && !prefersReducedMotion()))
  }

  // `transitionend` is how a journey says it is over, but a transition that
  // never ran never ends — a background tab, a band that was never laid out —
  // so a timer settles it a beat after it should have finished. It is keyed on
  // the leg, so a press mid-flight replaces it rather than racing it.
  const { phase, duration, leg } = travel
  useEffect(() => {
    if (phase !== "travel") return
    const timer = setTimeout(
      () => setTravel((current) => (current.leg === leg ? settled(current) : current)),
      duration + SETTLE_GRACE_MS,
    )
    return () => clearTimeout(timer)
  }, [phase, duration, leg])

  // One frame laid out and still, then free to animate a change of count again.
  useEffect(() => {
    if (phase !== "settle") return
    const rest = () =>
      setTravel((current) => (current.phase === "settle" ? { ...current, phase: "rest" } : current))
    if (typeof requestAnimationFrame !== "function") {
      rest()
      return
    }
    const frame = requestAnimationFrame(rest)
    return () => cancelAnimationFrame(frame)
  }, [phase])

  const onTransitionEnd = (event: React.TransitionEvent<HTMLElement>) => {
    // The cells' own `flex-basis` transitions bubble here too; only the band's
    // transform is the journey.
    if (event.target !== event.currentTarget || event.propertyName !== "transform") return
    setTravel(settled)
  }

  return { travel, onTransitionEnd }
}

/** The carousel's settings, with every default already applied. */
interface ResolvedCarousel {
  peek: number
  choices: readonly number[]
  choicesLabel: string
  choiceLabel: (count: number) => string
}

const CAROUSEL_DEFAULT_CHOICES = [1, 2, 3]

/** Every month in a carousel is drawn six rows tall. See the band below. */
const CAROUSEL_WEEK_ROWS = 6

/** How many months' rows a carousel keeps before starting its cache again. */
const WEEKS_CACHE_LIMIT = 48

/**
 * `carousel` as the four things the render needs, or null for no carousel.
 *
 * `choices` always contains the count the view is on, however it got there: a
 * segmented control whose options do not include the current one has no
 * selected segment, and a control with nothing selected is a control that
 * looks broken rather than one that is showing a state.
 */
function resolveCarousel(
  carousel: boolean | MonthCarouselOptions | undefined,
  months: number,
): ResolvedCarousel | null {
  if (!carousel) return null
  const options = carousel === true ? {} : carousel
  const choices = options.choices ?? CAROUSEL_DEFAULT_CHOICES
  return {
    peek: Math.min(0.5, Math.max(0.05, options.peek ?? 0.22)),
    choices:
      choices.length === 0 || choices.includes(months)
        ? choices
        : [...choices, months].sort((a, b) => a - b),
    choicesLabel: options.choicesLabel ?? "Months shown",
    choiceLabel: options.choiceLabel ?? ((count) => (count === 1 ? "1 month" : `${count} months`)),
  }
}

export function MonthView<E extends CalendarEvent = CalendarEvent>({
  date,
  defaultDate,
  onDateChange,
  range = SINGLE_MONTH,
  onMonthsChange,
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
  previousMonthLabel = "Previous month",
  nextMonthLabel = "Next month",
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
  const carousel = "weeks" in range ? null : resolveCarousel(range.carousel, monthCount)

  // The reader's count, seeded from the prop and re-seeded whenever the prop
  // changes — the adjust-state-during-render pattern rather than an effect,
  // because a render that drew the old count first would be a frame of the
  // wrong number of months. The caller leads and the reader follows, which is
  // what lets one number be owned from either side without a second prop for
  // it. Outside a carousel there is no control and the count is the prop.
  const [chosenMonths, setChosenMonths] = useState(monthCount)
  const [seededFrom, setSeededFrom] = useState(monthCount)
  if (seededFrom !== monthCount) {
    setSeededFrom(monthCount)
    setChosenMonths(monthCount)
  }
  const visibleMonths = carousel ? chosenMonths : monthCount

  const navigation = useCalendarNavigation({
    date,
    defaultDate,
    onDateChange,
    // A page at a time in months — September–October steps to November–December
    // rather than to an overlapping pair — one week at a time in a strip, which
    // is the whole of what "endless" means there, and one month at a time in a
    // carousel, because the month peeking in at the edge is the thing the press
    // is a press towards.
    step: stripWeeks !== null ? { weeks: 1 } : { months: carousel ? 1 : monthCount },
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
    // The carousel draws its band below, from where the band *is* rather than
    // from the date alone.
    if (carousel) return []
    const first = startOfMonth(navigation.date)
    return Array.from({ length: monthCount }, (_, index) => {
      const month = first.add({ months: index })
      return { key: month.toString(), month, weeks: monthRange(month, locale, firstDayOfWeek) }
    })
  }, [stripWeeks, monthCount, carousel, navigation.date, locale, firstDayOfWeek])

  const ordinal = monthOrdinal(navigation.date)
  const { travel, onTransitionEnd } = useCarouselTravel(ordinal, carousel !== null)

  // Each month's rows, kept across journeys. A month drawn before a settle and
  // after it has to be handed the *same* arrays, because `MonthWeek` packs its
  // events against the identity of its week — new arrays on the frame the band
  // comes to rest would repack every grid on screen at the moment nothing on
  // screen has changed. Cleared when it has grown past a few years of browsing
  // rather than never, and whenever what a week *is* changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: the dependencies are the invalidation — a new locale or first day is a new answer to which days a row holds
  const weeksCache = useMemo(() => new Map<string, CalendarDate[][]>(), [locale, firstDayOfWeek])
  const carouselWeeks = (month: CalendarDate) => {
    const key = month.toString()
    const cached = weeksCache.get(key)
    if (cached) return cached
    if (weeksCache.size > WEEKS_CACHE_LIMIT) weeksCache.clear()
    const weeks = weekStrip(month, locale, CAROUSEL_WEEK_ROWS, firstDayOfWeek)
    weeksCache.set(key, weeks)
    return weeks
  }

  // The band: every month from one before the earliest stop to one after the
  // latest window, which is exactly the run the band can be seen to pass over.
  // The stops and their peeks are drawn in full — where the journey started,
  // where it is going, and anywhere a press mid-flight sent it — and the
  // months between them are placeholders. A jump to next year slides past
  // eleven months of the right shape without packing a single event into them:
  // they are on screen for a few frames each, and a grid nobody can read in
  // that time is not worth the work of drawing one.
  const band = useMemo(() => {
    if (!carousel) return { lo: 0, cells: [] as CarouselCell[] }
    const anchor = startOfMonth(navigation.date)
    const lo = Math.min(...travel.stops) - 1
    const hi = Math.max(...travel.stops) + visibleMonths
    const cells: CarouselCell[] = []
    for (let k = lo; k <= hi; k++) {
      const month = anchor.add({ months: k - ordinal })
      cells.push({
        key: month.toString(),
        month,
        full: travel.stops.some((stop) => k >= stop - 1 && k <= stop + visibleMonths),
        inWindow: k >= travel.focus && k < travel.focus + visibleMonths,
      })
    }
    return { lo, cells }
  }, [carousel, navigation.date, ordinal, travel.stops, travel.focus, visibleMonths])

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

  // The heading names what is *in* the window — never the months peeking at
  // its edges, and never the ones a moving band is passing. It is read from the
  // date, which changes once, rather than from the band, which is mid-journey.
  const windowStart = startOfMonth(navigation.date)
  const defaultLabel =
    stripWeeks === null
      ? calendarMonthRangeLabel(
          windowStart,
          windowStart.add({ months: (carousel ? visibleMonths : monthCount) - 1 }),
          { locale, timeZone },
        )
      : // A strip has no month to name, so it names its ends — the same range
        // label the week view's heading uses, over eight weeks instead of one.
        calendarRangeLabel(grids[0]?.weeks.flat() ?? [], { locale, timeZone })

  /** One cell as a percentage of the window: the band's whole geometry. */
  const cellWidth = carousel ? 100 / (visibleMonths + 2 * carousel.peek) : 100

  const chooseMonths = (count: number) => {
    setChosenMonths(count)
    onMonthsChange?.(count)
  }

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
        >
          {/* The toolbar's `children` slot, which is the one right after the
              view switcher — the two controls are the same question asked
              twice (how much calendar is on screen), so they sit together and
              are drawn the same way. */}
          {carousel && carousel.choices.length > 1 ? (
            <ToggleGroup
              size="sm"
              height="control"
              aria-label={carousel.choicesLabel}
              disallowEmptySelection
              selectedKeys={[String(visibleMonths)]}
              onSelectionChange={(keys) => {
                const key = [...keys][0]
                if (typeof key === "string") chooseMonths(Number(key))
              }}
            >
              {carousel.choices.map((count) => (
                <ToggleGroupItem key={count} id={String(count)} aria-label={carousel.choiceLabel(count)}>
                  {/* A digit is still a number, and this site is prerendered:
                      `getNumberFormat` is how every other number here reaches
                      the DOM, so a locale that writes its digits differently
                      writes these ones too. */}
                  {getNumberFormat(locale, {}).format(count)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          ) : null}
        </CalendarToolbar>
      ) : null}

      {carousel ? (
        // The window, and the band that runs through it. The band is `visible
        // + 2` cells wide, each cell `100 / (visible + 2 * peek)` percent of
        // the window; sliding it left by all but the peek of one cell puts the
        // first month of the window at the window's own left edge and leaves a
        // slice of the month before it showing. Percentages throughout, so the
        // arithmetic holds at any width without measuring anything — which is
        // also why the gutter is padding inside a cell rather than a `gap`: a
        // gap is a length, and a length in this sum would have to be measured.
        <div data-slot="month-carousel" className="relative w-full overflow-hidden">
          <div
            data-slot="month-band"
            className={cn(
              "flex items-start",
              travel.phase === "settle"
                ? // The frame that lays the band out again around where it
                  // stopped. The numbers change and the pixels do not, and a
                  // transition would animate the numbers.
                  "transition-none"
                : cn(
                    "transition-transform duration-400 motion-reduce:transition-none",
                    // Out of rest and back into it: the band starts still in
                    // front of the reader, and a curve that begins at full
                    // speed reads as a jump caught halfway. A press that lands
                    // mid-flight is the exception — the band is already moving,
                    // and easing in again would stall it for a beat before it
                    // picked up speed it already had.
                    travel.retarget ? "ease-out" : "ease-quebi-travel",
                  ),
            )}
            // Month `k` sits `k - origin` cells from the origin, which is held
            // still for the whole of a journey; the window's first month is put
            // a peek's width in from the window's left edge, with the month
            // before it showing through that peek.
            style={{
              transform: `translateX(${-(travel.focus - travel.origin - carousel.peek) * cellWidth}%)`,
              transitionDuration: travel.phase === "travel" ? `${travel.duration}ms` : undefined,
            }}
            onTransitionEnd={onTransitionEnd}
          >
            {/* Where the band's first cell starts, measured from the origin.
                A spacer rather than a transform, because a transform is what
                is animating: when a journey adds months to the near end of the
                band, this takes up exactly the cells they add, in the same
                frame, and nothing already on screen moves. It animates only at
                rest, alongside the cells, when the count changes. */}
            <div
              aria-hidden="true"
              data-slot="month-band-origin"
              className={cn(
                "shrink-0",
                travel.phase === "rest"
                  ? "transition-[margin-left] duration-400 ease-quebi-travel motion-reduce:transition-none"
                  : "transition-none",
              )}
              style={{ marginLeft: `${(band.lo - travel.origin) * cellWidth}%` }}
            />
            {band.cells.map((cell) => (
              <div
                key={cell.key}
                data-slot="month-cell"
                className={cn(
                  "shrink-0 px-1.5",
                  // The same travel, because it is the same movement: when the
                  // count changes these widen while the band slides under them,
                  // and two curves would read as two events.
                  "transition-[flex-basis] duration-400 ease-quebi-travel",
                  "motion-reduce:transition-none",
                )}
                style={{ flexBasis: `${cellWidth}%` }}
              >
                {cell.full ? (
                  // `inert` rather than a class and a `tabIndex={-1}`: a month
                  // nobody is looking at should not be a tab stop, should not
                  // be read out, and should not answer a click that lands on
                  // it. One attribute says all three — and it stays true while
                  // the veil is eased, because seeing next month is not the
                  // same as being in it. The chevron is how you get there.
                  <div inert={!cell.inWindow || undefined}>
                    <MonthGrid
                      weeks={carouselWeeks(cell.month)}
                      month={cell.month}
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
                      className="w-full"
                    />
                  </div>
                ) : (
                  <MonthPlaceholder weekHeight={weekHeight} />
                )}
              </div>
            ))}
          </div>

          {/* The veils and the chevrons belong to the window rather than to the
              months, and that is what keeps them still. A peek is always the
              same slice of the same two places — the near edge of the viewport
              — so an overlay pinned there does not travel with the band when it
              slides, does not need re-finding when the count changes, and does
              not move a hand's width when a month with five rows follows one
              with six. Inside a cell all three happened. */}
          <MonthPeek
            side="start"
            width={carousel.peek * cellWidth}
            label={previousMonthLabel}
            onStep={navigation.goToPrevious}
            // The toolbar's chevrons are the same two presses, so with a
            // toolbar these are a pointer affordance and stay out of the tab
            // order rather than making every carousel two tab stops longer for
            // a control the reader has already passed. Without one they are the
            // only way through the months, and then they are everyone's.
            isFocusable={!showToolbar}
          />
          <MonthPeek
            side="end"
            width={carousel.peek * cellWidth}
            label={nextMonthLabel}
            onStep={navigation.goToNext}
            isFocusable={!showToolbar}
          />
        </div>
      ) : (
        /* However many grids there are, they are one row of them: a single
           month is a single flex child at full width, and the wrap is what
           makes two months stack instead of squeeze on a narrow page.
           `min-w-72` is the width below which seven columns stop being
           readable, and it is only set when there is more than one grid — a
           lone month narrower than that is still the only thing on the page. */
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
      )}

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

/**
 * How every layer of the veil answers a pointer on the peek — and each of them
 * answers differently, because hovering a peek eases the blur rather than
 * clearing it.
 *
 * Lifting the veil entirely made the hover a second window: a month at full
 * sharpness beside the ones being read, with nothing but its position saying
 * which was which. Easing it keeps the peek a peek and still lets it be read.
 * The compounding layer goes, which is a real halving of the blur rather than a
 * blurred picture turned down — eight pixels at the outer edge become four, on
 * the same ramp — and the tint lightens so the days underneath come through.
 */
const VEIL_TRANSITION =
  "transition-opacity duration-200 ease-out motion-reduce:transition-none"

interface MonthPeekProps {
  /** Which end of the window this peek sits at. */
  side: "start" | "end"
  /** How wide the slice is, as a percentage of the window. */
  width: number
  label: string
  onStep: () => void
  /** Is this chevron the keyboard's way through the months, or the pointer's? */
  isFocusable: boolean
}

/**
 * What makes a peeking month read as a peek: a veil that ramps, and the chevron
 * that takes you into it.
 *
 * Both are drawn over the *window*, at the slice of it a peeking month shows
 * through — not over the month. A peek is always the same strip of the same two
 * places, so an overlay pinned there is still while the band slides beneath it,
 * and still when the month behind it has one row more than the last one did. A
 * chevron that moved when a month with five weeks followed one with six would
 * be a button that moves under the press that summoned it.
 *
 * The blur is *progressive* — two `backdrop-blur` layers, each masked to begin
 * further out than the last, so the strip is sharp where it meets the month
 * being read and eight pixels of blur at the viewport's edge, with a dimming
 * gradient over the same axis. A single uniform blur reads as a frosted panel
 * stuck to the side of the calendar; a ramp reads as the page carrying on past
 * the edge of what you are looking at. It is masks and a gradient rather than
 * an animated filter for a plain reason: no browser interpolates a blur radius
 * across an element, and stacking two cheap ones is how every progressive blur
 * is actually built.
 *
 * The veil eases on hover — see `VEIL_TRANSITION` for what each layer does —
 * and each layer carries its own opacity transition rather than the box around
 * them carrying one for all three. That is not a style choice: an ancestor at
 * less than full opacity is a backdrop root, and a `backdrop-filter` inside one
 * has nothing left to sample — so fading the wrapper would drop both blurs on
 * the first frame of the transition and the reveal would pop. Fading each layer
 * is the same picture and composites correctly, because opacity on the filtered
 * element applies to the filter's own result.
 *
 * The overlay takes the pointer rather than passing it through, which costs
 * nothing: everything under it is `inert`. The month stays that way while the
 * veil is eased — *seeing* next month is not being in it, and the chevron is
 * how you get there.
 */
function MonthPeek({ side, width, label, onStep, isFocusable }: MonthPeekProps) {
  const leading = side === "start"
  return (
    <div
      data-slot="month-peek"
      className={cn(
        "group/peek absolute inset-y-0 flex items-center justify-center",
        leading ? "left-0" : "right-0",
      )}
      style={{ width: `${width}%` }}
    >
      <div data-slot="month-peek-veil" aria-hidden="true" className="absolute inset-0">
        {/* Two layers of the same 4px blur rather than one of 8: masked to
            different distances they compound where they overlap, which is the
            ramp. Both run *away* from the window — sharp where the peek meets
            the month being read, four pixels across the middle of the strip,
            eight at the viewport's edge. */}
        <div
          className={cn(
            "absolute inset-0 backdrop-blur-xs",
            VEIL_TRANSITION,
            "group-hover/peek:opacity-80",
            leading ? "mask-r-from-0% mask-r-to-100%" : "mask-l-from-0% mask-l-to-100%",
          )}
        />
        {/* The one that goes on hover: with it the strip reaches eight pixels
            at the viewport's edge, without it four, and the ramp is the same
            shape either way. */}
        <div
          className={cn(
            "absolute inset-0 backdrop-blur-xs",
            VEIL_TRANSITION,
            "group-hover/peek:opacity-0",
            leading ? "mask-r-from-0% mask-r-to-50%" : "mask-l-from-0% mask-l-to-50%",
          )}
        />
        {/* The page's own background over the same ramp, so the month dims as
            it blurs instead of staying a sharp-edged grey rectangle. */}
        <div
          className={cn(
            "absolute inset-0",
            VEIL_TRANSITION,
            "group-hover/peek:opacity-40",
            leading
              ? "bg-gradient-to-l from-transparent to-quebi-bg/70"
              : "bg-gradient-to-r from-transparent to-quebi-bg/70",
          )}
        />
      </div>

      {/* `aria-hidden` sits on the box rather than on the button: react-aria
          passes through the ARIA props it knows and this is not one of them,
          and a wrapper hides the subtree just as well. It is only safe because
          the button inside is out of the tab order — an `aria-hidden` element
          that can still be focused is the worse bug of the two. */}
      <div aria-hidden={isFocusable ? undefined : true} className="relative">
        <Button
          intent="outline"
          size="sq-sm"
          aria-label={label}
          excludeFromTabOrder={!isFocusable}
          onPress={onStep}
          className="rounded-full bg-quebi-elevated/80 shadow-md backdrop-blur-sm"
        >
          {leading ? (
            <ChevronLeft data-slot="icon" aria-hidden="true" />
          ) : (
            <ChevronRight data-slot="icon" aria-hidden="true" />
          )}
        </Button>
      </div>
    </div>
  )
}

/**
 * A month the band is only passing through: the right shape and nothing else.
 *
 * A jump to next year slides past eleven months, each on screen for a few
 * frames. Drawing them properly means packing every event into every week of
 * each of them for a picture nobody has time to read, so they are drawn as
 * what the reader can actually see at that speed — a card of the right size
 * going by. Size is the part that has to be exact: the header strip is the
 * same line of `text-xs` the weekday row is, and the rows are `weekHeight`
 * each, so the band is one height from end to end and the full months either
 * side of a run of these line up with them.
 */
function MonthPlaceholder({ weekHeight }: { weekHeight: number }) {
  return (
    <div
      aria-hidden="true"
      data-slot="month-placeholder"
      className="w-full overflow-hidden rounded-quebi-md border border-quebi-line/10 bg-quebi-bg"
    >
      <div className="border-quebi-line/10 border-b py-2 text-xs">{"\u00a0"}</div>
      {Array.from({ length: CAROUSEL_WEEK_ROWS }, (_, row) => (
        <div
          // The rows are a fixed count in a fixed order and never reorder.
          // biome-ignore lint/suspicious/noArrayIndexKey: six empty rows have no identity but their place
          key={row}
          className="border-quebi-line/10 border-b last:border-b-0"
          style={{ height: weekHeight }}
        />
      ))}
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
              <div className="flex justify-end px-1.5 pt-1" style={{ height: CELL_HEADER }}>
                <AriaButton
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
                </AriaButton>
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
