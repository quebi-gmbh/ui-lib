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
  type CalendarViewOption,
  useCalendarLocale,
  useCalendarNavigation,
} from "@/components/calendar-toolbar"
import { weekRange } from "@/lib/calendar"
import { cn } from "@/lib/utils"

/**
 * WeekView — quebi design system
 *
 * Seven days on one time axis, with overlapping meetings packed into side-by-side
 * columns per day, an all-day band that folds into "+N more" for calendars that
 * have all-day events, and the now-marker on today's column. `visibleDays={5}`
 * is the work week; the week still starts where the locale says it does, so the
 * five days are Monday to Friday under `de-DE` and Sunday to Thursday under
 * `en-US` unless `firstDayOfWeek` says otherwise.
 *
 * The toolbar's heading is a week picker: the label names a week, so the grid
 * it opens offers whole weeks rather than asking which of the seven days you
 * meant when all seven lead to the same view.
 *
 * Display, selection, and — given `isEventEditable` and `onEventChange` —
 * dragging an event to another time or another day, by pointer or by arrow key.
 * The machinery for that is `CalendarShell`'s; see the note there, including
 * what it will and will not let you drop. This file decides which seven days,
 * and nothing else.
 */
export interface WeekViewProps<E extends CalendarEvent = CalendarEvent>
  extends CalendarGridViewProps<E> {
  /** Any day in the week on show. Controlled. */
  date?: CalendarDate
  /** Any day in the initial week. Defaults to today; pin it on a prerendered route. */
  defaultDate?: CalendarDate
  onDateChange?: (date: CalendarDate) => void
  /** How many days from the start of the week. 5 is the work week. Default 7. */
  visibleDays?: number
  /** Override the locale's first day — 0 is Sunday. */
  firstDayOfWeek?: "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat"
  showToolbar?: boolean
  view?: CalendarViewName
  views?: readonly CalendarViewOption[]
  onViewChange?: (view: CalendarViewName) => void
  label?: React.ReactNode
  /** The toolbar's date label as a picker, or as plain text. Default "picker". */
  labelVariant?: CalendarToolbarLabelVariant
  /**
   * Which grid that picker opens. Default "week".
   *
   * The heading names a week, so a week is what it offers — the row is the
   * target and the ISO number is in the gutter. `day` is there for a view whose
   * reader is really choosing a day and looking at its week around it.
   */
  pickerGranularity?: "day" | "week"
}

export function WeekView<E extends CalendarEvent = CalendarEvent>({
  date,
  defaultDate,
  onDateChange,
  visibleDays = 7,
  firstDayOfWeek,
  showToolbar = true,
  view,
  views,
  onViewChange,
  label,
  labelVariant = "picker",
  pickerGranularity = "week",
  timeZone = DEFAULT_CALENDAR_TIME_ZONE,
  locale: localeProp,
  className,
  ...shell
}: WeekViewProps<E>) {
  const locale = useCalendarLocale(localeProp)
  const navigation = useCalendarNavigation({
    date,
    defaultDate,
    onDateChange,
    // A week steps by a week even when only five days are shown: a work-week
    // view that advanced five days at a time would drift onto a Saturday.
    step: { weeks: 1 },
    timeZone,
  })
  const days = weekRange(navigation.date, locale, visibleDays, firstDayOfWeek)

  return (
    <div data-slot="week-view" className={cn("flex w-full flex-col gap-3", className)}>
      {showToolbar ? (
        <CalendarToolbar
          label={label ?? calendarRangeLabel(days, { locale, timeZone })}
          labelVariant={labelVariant}
          pickerGranularity={pickerGranularity}
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
      <CalendarShell {...shell} days={days} locale={locale} timeZone={timeZone} />
    </div>
  )
}
