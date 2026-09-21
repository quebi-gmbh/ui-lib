"use client"

import type { CalendarDate } from "@internationalized/date"
import { useMemo } from "react"
import { Button } from "react-aria-components"
import {
  type CalendarEvent,
  CalendarEventRow,
  type CalendarSource,
  DayOverflowPanel,
  dayToDate,
  DEFAULT_CALENDAR_TIME_ZONE,
  MoreLink,
  useCalendarToday,
} from "@/components/calendar-shell"
import {
  calendarMonthLabel,
  type CalendarToolbarLabelVariant,
  CalendarToolbar,
  type CalendarViewName,
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
 */
export interface MonthViewProps<E extends CalendarEvent = CalendarEvent> {
  /** Any day in the month on show. Controlled. */
  date?: CalendarDate
  /** Any day in the initial month. Defaults to today; pin it on a prerendered route. */
  defaultDate?: CalendarDate
  onDateChange?: (date: CalendarDate) => void
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
  views?: readonly CalendarViewName[]
  onViewChange?: (view: CalendarViewName) => void
  label?: React.ReactNode
  /**
   * The toolbar's heading as a picker, or as plain text. Default "picker".
   *
   * A month grid, not a day one: the heading here reads `September 2026`, and
   * a day picker would ask for a day this grid never shows the choice of.
   */
  labelVariant?: CalendarToolbarLabelVariant
  className?: string
}

/** A chip is 20px tall on a 4px rhythm; the date line above them takes 24px. */
const LANE_HEIGHT = 22
const CELL_HEADER = 26

export function MonthView<E extends CalendarEvent = CalendarEvent>({
  date,
  defaultDate,
  onDateChange,
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
  className,
}: MonthViewProps<E>) {
  const locale = useCalendarLocale(localeProp)
  const todayDate = useCalendarToday(now, timeZone)
  const navigation = useCalendarNavigation({
    date,
    defaultDate,
    onDateChange,
    step: { months: 1 },
    timeZone,
  })

  const weeks = useMemo(
    () => monthRange(navigation.date, locale, firstDayOfWeek),
    [navigation.date, locale, firstDayOfWeek],
  )
  const maxLanes = Math.max(1, Math.floor((weekHeight - CELL_HEADER) / LANE_HEIGHT))
  const headerDays = weeks[0] ?? []

  return (
    <div data-slot="month-view" className={cn("flex w-full flex-col gap-3", className)}>
      {showToolbar ? (
        <CalendarToolbar
          label={label ?? calendarMonthLabel(navigation.date, { locale, timeZone })}
          labelVariant={labelVariant}
          pickerGranularity="month"
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

      <div className="w-full overflow-hidden rounded-quebi-md border border-quebi-line/10 bg-quebi-bg">
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

        {weeks.map((week) => (
          <MonthWeek
            key={week[0]?.toString() ?? ""}
            week={week}
            month={navigation.date}
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
          />
        ))}
      </div>
    </div>
  )
}

interface MonthWeekProps<E extends CalendarEvent> {
  week: CalendarDate[]
  month: CalendarDate
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
}

/** One row of the month: seven cells, and the chips laid across them. */
function MonthWeek<E extends CalendarEvent>({
  week,
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
          const outside = !isInMonth(day, month)
          const isToday = today !== null && today.compare(day) === 0
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
                  {getDateTimeFormat(locale, { day: "numeric", timeZone }).format(
                    dayToDate(day, timeZone),
                  )}
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
}

/**
 * One event in the month grid: a `CalendarEventRow` placed by its band.
 *
 * What the row *is* — the dot, the time, the palette — is `CalendarEventRow`'s,
 * because the "+N more" panel lists the same events without any of this
 * geometry. What is left here is the geometry: which columns the band spans,
 * which lane it sits in, and which of its corners are cut because it runs on
 * into the week either side.
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
}: MonthChipProps<E>) {
  const filled = isAllDayEvent(band.event)
  const left = (band.startIndex / dayCount) * 100
  const width = ((band.endIndex - band.startIndex + 1) / dayCount) * 100

  return (
    <CalendarEventRow
      event={band.event}
      calendars={calendars}
      locale={locale}
      timeZone={timeZone}
      isSelected={isSelected}
      onActivate={onActivate}
      style={{ top, left: `${left}%`, width: `calc(${width}% - 6px)`, marginLeft: 3 }}
      className={cn(
        "absolute",
        // The accented edge is never rounded (task #176). `--radius-quebi-sm`
        // is 8px and the chip is 20px tall, so two corners eat 16px of the
        // 20 and the 2px border tapers as it turns — the series line reads
        // as a crescent hooked into a pill. `TimedBlock` already rounds only
        // its trailing corners for the same reason. A chip cut at the week
        // boundary squares that side too, so the halves read as one event.
        filled || band.continuesBefore ? "rounded-l-none" : "rounded-l-quebi-sm",
        filled && band.continuesAfter ? "rounded-r-none" : "rounded-r-quebi-sm",
      )}
    />
  )
}
