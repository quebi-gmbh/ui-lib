"use client"

import {
  type CalendarDate,
  Time,
  toCalendarDate,
  toCalendarDateTime,
  toZoned,
  type ZonedDateTime,
} from "@internationalized/date"
import { useMemo } from "react"
import { Button } from "react-aria-components"
import {
  CALENDAR_COLORS,
  type CalendarEvent,
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
import { packBands, packIntervals, segmentByDay } from "@/lib/calendar"
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
 * one. Display and selection only; see the note in `CalendarShell`.
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
  showToolbar?: boolean
  view?: CalendarViewName
  views?: readonly CalendarViewName[]
  onViewChange?: (view: CalendarViewName) => void
  label?: React.ReactNode
  /** Make the toolbar's date label a picker that jumps to any day. Default "static". */
  labelVariant?: CalendarToolbarLabelVariant
  /** Shown in a row that has nothing on it. */
  emptyRowLabel?: string
  className?: string
}

/** The narrowest a bar is ever drawn. `buildRows` packs against the same minimum. */
const MIN_BAR_WIDTH = 18

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
  showToolbar = true,
  view,
  views,
  onViewChange,
  label,
  labelVariant,
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
  const hourFormat = getDateTimeFormat(locale, { hour: "numeric", timeZone })

  const dayCells = visibleDays.map((current, dayIndex) => ({
    key: current.toString(),
    label: dayLabelFormat.format(atHour(current, 0, timeZone)),
    left: dayIndex * dayWidth,
  }))

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
            <div key={row.calendar.id} className="flex border-quebi-line/10 border-b last:border-b-0">
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
                  return (
                    <Button
                      key={`${bar.span.event.id}:${bar.span.startDayIndex}:${bar.lane}`}
                      data-slot="calendar-bar"
                      data-event-id={bar.span.event.id}
                      onPress={() => activate(bar.span.event)}
                      style={{
                        left: Math.max(0, Math.min(left, gridWidth - width)),
                        width,
                        top: 4 + bar.lane * laneHeight,
                        height: laneHeight - 4,
                      }}
                      className={cn(
                        "absolute flex cursor-pointer items-center gap-1.5 overflow-hidden px-2 text-left",
                        "border-l-2 text-xs transition-colors duration-150",
                        "outline-none focus-visible:ring-2 focus-visible:ring-quebi-brand-mark focus-visible:ring-inset",
                        palette.block,
                        palette.edge,
                        bar.span.continuesBefore ? "rounded-l-none" : "rounded-l-quebi-sm",
                        bar.span.continuesAfter ? "rounded-r-none" : "rounded-r-quebi-sm",
                        selectedEventId === bar.span.event.id &&
                          cn("outline-2 outline-solid outline-offset-0", palette.selected),
                      )}
                    >
                      <span className="truncate font-semibold text-quebi-fg">
                        {bar.span.event.title}
                      </span>
                      <span className="shrink-0 text-quebi-fg-subtle tabular-nums">
                        {formatEventTime(bar.span.event.start, locale, timeZone)}
                      </span>
                    </Button>
                  )
                })}

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

/** A day at a given hour, as the `Date` the Intl formatters take. */
const atHour = (day: CalendarDate, hour: number, timeZone: string) =>
  toZoned(toCalendarDateTime(day, new Time(hour)), timeZone).toDate()

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
