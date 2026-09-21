"use client"

import type { CalendarDate } from "@internationalized/date"
import {
  type CalendarEvent,
  type CalendarGridViewProps,
  CalendarShell,
  DEFAULT_CALENDAR_TIME_ZONE,
} from "@/components/calendar-shell"
import {
  calendarRangeLabel,
  type CalendarToolbarLabelVariant,
  CalendarToolbar,
  type CalendarViewName,
  useCalendarLocale,
  useCalendarNavigation,
} from "@/components/calendar-toolbar"
import { cn } from "@/lib/utils"

/**
 * DayView — quebi design system
 *
 * One day on a time axis, Outlook-style: the hours down the left, an all-day
 * band across the top for calendars that have all-day events, overlapping
 * meetings packed side by side, and a marker on the current time. Events carry
 * `ZonedDateTime` and the view carries the zone it is drawn in, so a meeting
 * booked in another zone lands on the right hour here rather than on the hour
 * the reader's laptop happens to think it is.
 *
 * Display and selection only — there is no drag to create, move or resize. See
 * the note in `CalendarShell`, which does the drawing; this file decides the day
 * and wires the toolbar to it.
 *
 * `DayView` and `WeekView` are the same grid with a different number of columns,
 * and they are two components rather than one prop because the question that
 * picks between them is the one a reader asks — "am I looking at a day or a
 * week?" — and because their toolbars step by different amounts.
 */
export interface DayViewProps<E extends CalendarEvent = CalendarEvent>
  extends CalendarGridViewProps<E> {
  /** The day on show. Controlled. */
  date?: CalendarDate
  /** The initial day. Defaults to today in `timeZone`; pin it on a prerendered route. */
  defaultDate?: CalendarDate
  onDateChange?: (date: CalendarDate) => void
  /** Draw the toolbar above the grid. Default true. */
  showToolbar?: boolean
  /** Highlight a view switch and report presses on it — for a page hosting all four. */
  view?: CalendarViewName
  views?: readonly CalendarViewName[]
  onViewChange?: (view: CalendarViewName) => void
  /** Replace the heading the toolbar shows. */
  label?: React.ReactNode
  /** Make the toolbar's date label a picker that jumps to any day. Default "static". */
  labelVariant?: CalendarToolbarLabelVariant
}

export function DayView<E extends CalendarEvent = CalendarEvent>({
  date,
  defaultDate,
  onDateChange,
  showToolbar = true,
  view,
  views,
  onViewChange,
  label,
  labelVariant,
  timeZone = DEFAULT_CALENDAR_TIME_ZONE,
  locale: localeProp,
  className,
  ...shell
}: DayViewProps<E>) {
  const locale = useCalendarLocale(localeProp)
  const navigation = useCalendarNavigation({
    date,
    defaultDate,
    onDateChange,
    step: { days: 1 },
    timeZone,
  })
  const days = [navigation.date]

  return (
    <div data-slot="day-view" className={cn("flex w-full flex-col gap-3", className)}>
      {showToolbar ? (
        <CalendarToolbar
          label={label ?? calendarRangeLabel(days, { locale, timeZone })}
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
      <CalendarShell {...shell} days={days} locale={locale} timeZone={timeZone} />
    </div>
  )
}
