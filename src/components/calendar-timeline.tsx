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
  CalendarToolbar,
  type CalendarViewName,
  useCalendarLocale,
  useCalendarNavigation,
} from "@/components/calendar-toolbar"
import { type DaySegment, packBands, packIntervals, segmentByDay } from "@/lib/calendar"
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
 * Each row is labelled with its calendar's name in a column that stays put while
 * the time axis scrolls, so the colour is the second channel and never the only
 * one. Display and selection only; see the note in `CalendarShell`.
 */
export interface CalendarTimelineProps<E extends CalendarEvent = CalendarEvent> {
  /** The rows, top to bottom. Their `color` is what the bars in each row wear. */
  calendars: readonly CalendarSource[]
  events: readonly E[]
  /** The day on show. Controlled. */
  date?: CalendarDate
  /** The initial day. Defaults to today; pin it on a prerendered route. */
  defaultDate?: CalendarDate
  onDateChange?: (date: CalendarDate) => void
  timeZone?: string
  locale?: string
  /**
   * First hour on the axis. Default 6 — a resource view rarely starts at midnight.
   *
   * As in `CalendarShell`, the axis is the grid's extent: a bar outside
   * `[startHour, endHour)` is not drawn, and one crossing an edge is cut at it.
   */
  startHour?: number
  /** Last hour on the axis, exclusive. Default 22. See `startHour`. */
  endHour?: number
  /** Pixels per hour. Default 72. */
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
  /** Shown in a row that has nothing on it. */
  emptyRowLabel?: string
  className?: string
}

export function CalendarTimeline<E extends CalendarEvent = CalendarEvent>({
  calendars,
  events,
  date,
  defaultDate,
  onDateChange,
  timeZone = DEFAULT_CALENDAR_TIME_ZONE,
  locale: localeProp,
  startHour = 6,
  endHour = 22,
  hourWidth = 72,
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
  emptyRowLabel = "Nothing scheduled",
  className,
}: CalendarTimelineProps<E>) {
  const locale = useCalendarLocale(localeProp)
  const navigation = useCalendarNavigation({
    date,
    defaultDate,
    onDateChange,
    step: { days: 1 },
    timeZone,
  })

  const axisStart = Math.max(0, Math.min(23, Math.trunc(startHour)))
  const axisEnd = Math.max(axisStart + 1, Math.min(24, Math.trunc(endHour)))
  const hours = Array.from({ length: axisEnd - axisStart }, (_, index) => axisStart + index)
  const axisMinutes = (axisEnd - axisStart) * 60
  const gridWidth = (axisEnd - axisStart) * hourWidth

  const day = navigation.date
  const days = useMemo(() => [day], [day])

  const rows = useMemo(
    () => buildRows(calendars, events, days, timeZone, axisStart * 60, axisEnd * 60),
    [calendars, events, days, timeZone, axisStart, axisEnd],
  )

  const toLeft = (minutes: number) => ((minutes - axisStart * 60) / axisMinutes) * gridWidth
  const nowMinutes = useTimelineNow(now, day, timeZone)

  const activate = (event: E) => {
    onSelectionChange?.(selectedEventId === event.id ? null : event.id)
    onEventClick?.(event)
  }

  return (
    <div data-slot="calendar-timeline" className={cn("flex w-full flex-col gap-3", className)}>
      {showToolbar ? (
        <CalendarToolbar
          label={label ?? calendarRangeLabel(days, { locale, timeZone })}
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
          <div className="flex border-quebi-line/10 border-b">
            <div
              className="sticky left-0 z-20 shrink-0 bg-quebi-bg px-3 py-2 text-quebi-fg-subtle text-xs"
              style={{ width: nameWidth }}
            >
              {getDateTimeFormat(locale, { weekday: "long", timeZone }).format(
                toZoned(toCalendarDateTime(day, new Time(0)), timeZone).toDate(),
              )}
            </div>
            <div className="relative shrink-0" style={{ width: gridWidth, height: 32 }}>
              {hours.map((hour) => (
                <span
                  key={hour}
                  className="absolute top-2 border-quebi-line/10 border-l pl-1.5 text-quebi-fg-subtle text-xs tabular-nums"
                  style={{ left: toLeft(hour * 60), height: 16 }}
                >
                  {getDateTimeFormat(locale, { hour: "numeric", timeZone }).format(
                    toZoned(toCalendarDateTime(day, new Time(hour)), timeZone).toDate(),
                  )}
                </span>
              ))}
            </div>
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
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className="absolute inset-y-0 border-quebi-line/10 border-l"
                      style={{ left: toLeft(hour * 60) }}
                    />
                  ))}
                </div>

                {row.bars.length === 0 ? (
                  <span className="absolute top-2 left-2 text-quebi-fg-subtle text-xs">
                    {emptyRowLabel}
                  </span>
                ) : null}

                {row.bars.map((bar) => {
                  const palette = CALENDAR_COLORS[resolveEventColor(bar.segment.event, calendars)]
                  const left = toLeft(bar.segment.start)
                  const right = toLeft(bar.segment.end)
                  // The minimum grows a short bar rightwards; against the end of
                  // the axis that would put it past the last hour line, so it is
                  // pushed back onto the grid instead.
                  const width = Math.max(18, right - left - 2)
                  return (
                    <Button
                      key={`${bar.segment.event.id}:${bar.lane}`}
                      data-slot="calendar-bar"
                      data-event-id={bar.segment.event.id}
                      onPress={() => activate(bar.segment.event)}
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
                        bar.segment.continuesBefore ? "rounded-l-none" : "rounded-l-quebi-sm",
                        bar.segment.continuesAfter ? "rounded-r-none" : "rounded-r-quebi-sm",
                        selectedEventId === bar.segment.event.id &&
                          "ring-2 ring-quebi-brand-mark ring-inset",
                      )}
                    >
                      <span className="truncate font-semibold text-quebi-fg">
                        {bar.segment.event.title}
                      </span>
                      <span className="shrink-0 text-quebi-fg-subtle tabular-nums">
                        {formatEventTime(bar.segment.event.start, locale, timeZone)}
                      </span>
                    </Button>
                  )
                })}

                {nowMinutes !== null &&
                nowMinutes >= axisStart * 60 &&
                nowMinutes <= axisEnd * 60 ? (
                  <div
                    data-slot="calendar-now-marker"
                    className="pointer-events-none absolute inset-y-0 z-10 w-px bg-red-500"
                    style={{ left: toLeft(nowMinutes) }}
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

interface TimelineBar<E extends CalendarEvent> {
  segment: DaySegment<E>
  lane: number
}

interface TimelineRow<E extends CalendarEvent> {
  calendar: CalendarSource
  bars: TimelineBar<E>[]
  lanes: number
}

/**
 * One row per calendar, with its events packed into lanes.
 *
 * An all-day event has no position on a time axis, so it is drawn as a bar
 * across the whole visible window — which is what it means — and packed with
 * everything else, so it pushes the timed events onto a second lane rather than
 * sitting underneath them.
 */
function buildRows<E extends CalendarEvent>(
  calendars: readonly CalendarSource[],
  events: readonly E[],
  days: readonly CalendarDate[],
  timeZone: string,
  windowStart: number,
  windowEnd: number,
): TimelineRow<E>[] {
  // Cut against the axis, for the same reason `CalendarShell` does: `toLeft` has
  // no clamp in it, so an event the window does not cover is drawn past the end
  // of the grid, where it inflates the horizontal scroll instead of being absent
  // (task #161).
  const timed = segmentByDay(events, days, timeZone, {
    startMinute: windowStart,
    endMinute: windowEnd,
  })
  const allDay = packBands(events, days, timeZone).map(
    (band): DaySegment<E> => ({
      event: band.event,
      dayIndex: 0,
      start: windowStart,
      end: windowEnd,
      continuesBefore: band.continuesBefore,
      continuesAfter: band.continuesAfter,
    }),
  )

  return calendars.map((calendar) => {
    const mine = [...allDay, ...timed].filter(
      (segment) => segment.event.calendarId === calendar.id,
    )
    const placements = packIntervals(
      mine.map((segment) => ({
        start: segment.start,
        // The same minimum the bar is drawn at, so a five-minute event is packed
        // as the ~18px it occupies rather than as the sliver it computes to.
        end: Math.max(segment.end, segment.start + 15),
      })),
    )
    const bars = mine.map((segment, index) => ({
      segment,
      lane: placements[index]?.lane ?? 0,
    }))
    const lanes = bars.reduce((max, bar) => Math.max(max, bar.lane + 1), 1)
    return { calendar, bars, lanes }
  })
}

/**
 * The now-marker's position, in clock minutes, or `null`.
 *
 * `null` both before mount — the prerender must not put a clock reading in the
 * HTML — and on any day that is not the one being shown, because a marker on a
 * day you are not looking at is a line with no meaning.
 */
function useTimelineNow(
  provided: ZonedDateTime | null | undefined,
  day: CalendarDate,
  timeZone: string,
): number | null {
  const instant = useCalendarNowInstant(provided, timeZone)
  if (!instant) return null
  if (toCalendarDate(instant).compare(day) !== 0) return null
  return instant.hour * 60 + instant.minute
}
