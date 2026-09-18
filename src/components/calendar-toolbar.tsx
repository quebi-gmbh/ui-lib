"use client"

import type { CalendarDate, DateDuration } from "@internationalized/date"
import { today } from "@internationalized/date"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"
import { useLocale } from "react-aria-components"
import { Button } from "@/components/button"
import { dayToDate, DEFAULT_CALENDAR_TIME_ZONE } from "@/components/calendar-shell"
import { ToggleGroup, ToggleGroupItem } from "@/components/toggle-group"
import { getDateTimeFormat } from "@/lib/intl"
import { cn } from "@/lib/utils"

/**
 * CalendarToolbar — quebi design system
 *
 * The chrome above an Outlook-style view: step back, step forward, jump to
 * today, the range you are looking at, and the switch between day, week, month
 * and timeline. `TableControls` to `CalendarShell`'s `TableShell` — it owns none
 * of the state and reports every press, so the same toolbar drives a view that
 * keeps its own date and one whose date lives in a URL.
 *
 * `Calendar` exports `SelectMonth`, `StepMonth` and `StepYear`, and they are not
 * reused here: all three read react-aria's `CalendarStateContext`, so they only
 * work *inside* a `<Calendar>` and there is no such state above a week grid.
 * What is shared is the vocabulary — a chevron pair around a label — not the
 * code.
 */

/** The views a toolbar can switch between. A subset is fine; the order is yours. */
export type CalendarViewName = "day" | "week" | "month" | "timeline"

const DEFAULT_VIEW_LABELS: Record<CalendarViewName, string> = {
  day: "Day",
  week: "Week",
  month: "Month",
  timeline: "Timeline",
}

export interface CalendarToolbarProps {
  /** What you are looking at — usually `calendarRangeLabel(...)`. */
  label: React.ReactNode
  /** The active view. Omit to hide the switcher. */
  view?: CalendarViewName
  /** Which switches to offer. Defaults to all four. */
  views?: readonly CalendarViewName[]
  /** Override one or more switch labels — the place to translate them. */
  viewLabels?: Partial<Record<CalendarViewName, string>>
  onViewChange?: (view: CalendarViewName) => void
  onPrevious?: () => void
  onNext?: () => void
  onToday?: () => void
  /** Accessible names for the two chevrons, and the text on the today button. */
  previousLabel?: string
  nextLabel?: string
  todayLabel?: string
  /** Extra chrome, placed after the view switcher — a filter, a legend, a menu. */
  children?: React.ReactNode
  className?: string
}

export function CalendarToolbar({
  label,
  view,
  views = ["day", "week", "month", "timeline"],
  viewLabels,
  onViewChange,
  onPrevious,
  onNext,
  onToday,
  previousLabel = "Previous",
  nextLabel = "Next",
  todayLabel = "Today",
  children,
  className,
}: CalendarToolbarProps) {
  return (
    <div
      data-slot="calendar-toolbar"
      className={cn("flex flex-wrap items-center justify-between gap-3", className)}
    >
      <div className="flex items-center gap-2">
        {onToday ? (
          <Button intent="outline" size="sm" onPress={onToday}>
            {todayLabel}
          </Button>
        ) : null}
        {onPrevious ? (
          <Button intent="ghost" size="sm" isCircle aria-label={previousLabel} onPress={onPrevious}>
            <ChevronLeft data-slot="icon" className="size-4" aria-hidden="true" />
          </Button>
        ) : null}
        {onNext ? (
          <Button intent="ghost" size="sm" isCircle aria-label={nextLabel} onPress={onNext}>
            <ChevronRight data-slot="icon" className="size-4" aria-hidden="true" />
          </Button>
        ) : null}
        <span
          data-slot="calendar-toolbar-label"
          className="font-semibold text-quebi-fg tracking-tight"
        >
          {label}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {view && views.length > 1 ? (
          <ToggleGroup
            size="xs"
            aria-label="Calendar view"
            disallowEmptySelection
            selectedKeys={[view]}
            onSelectionChange={(keys) => {
              const next = [...keys][0]
              if (typeof next === "string") onViewChange?.(next as CalendarViewName)
            }}
          >
            {views.map((name) => (
              <ToggleGroupItem key={name} id={name}>
                {viewLabels?.[name] ?? DEFAULT_VIEW_LABELS[name]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        ) : null}
        {children}
      </div>
    </div>
  )
}

export interface RangeLabelOptions {
  locale?: string
  timeZone?: string
}

/**
 * The heading for a run of days: one date spelled out, or a range collapsed as
 * far as the two ends allow.
 *
 * `21.–27. September 2026` says the month once because both ends share it;
 * `28. Sep – 4. Okt 2026` cannot, and says the year once because they do. Every
 * part goes through `getDateTimeFormat`, so the site's prerender and the browser
 * that hydrates it produce the same string — a bare `toLocaleDateString()` here
 * is a hydration bug, not a shortcut.
 */
export function calendarRangeLabel(
  days: readonly CalendarDate[],
  { locale, timeZone = DEFAULT_CALENDAR_TIME_ZONE }: RangeLabelOptions = {},
): string {
  const first = days[0]
  const last = days.length > 0 ? days[days.length - 1] : undefined
  if (!first || !last || !locale) return ""

  const start = dayToDate(first, timeZone)
  const end = dayToDate(last, timeZone)

  if (first.compare(last) === 0) {
    return getDateTimeFormat(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone,
    }).format(start)
  }

  // `formatRange` is the part of Intl written for exactly this: it elides the
  // shared month or year itself, in whatever way the locale does it.
  return getDateTimeFormat(locale, {
    day: "numeric",
    month: first.month === last.month ? "long" : "short",
    year: "numeric",
    timeZone,
  }).formatRange(start, end)
}

/** `September 2026` — the month view's heading. */
export function calendarMonthLabel(
  month: CalendarDate,
  { locale, timeZone = DEFAULT_CALENDAR_TIME_ZONE }: RangeLabelOptions = {},
): string {
  if (!locale) return ""
  return getDateTimeFormat(locale, { month: "long", year: "numeric", timeZone }).format(
    dayToDate(month, timeZone),
  )
}

/** The locale a view formats in: the prop, else the nearest `I18nProvider`. */
export function useCalendarLocale(override?: string): string {
  const { locale } = useLocale()
  return override ?? locale
}

export interface CalendarNavigationOptions {
  /** Controlled anchor date. */
  date?: CalendarDate
  /** Starting anchor date when uncontrolled. Defaults to today in `timeZone`. */
  defaultDate?: CalendarDate
  onDateChange?: (date: CalendarDate) => void
  /** How far one press of a chevron moves. `{ days: 7 }` for a week view. */
  step: DateDuration
  timeZone?: string
}

/**
 * The anchor date a view is drawn around, and the three things the toolbar does
 * to it.
 *
 * Controlled through `date` or self-managed from `defaultDate` — the same pair
 * every other stateful component here offers. The uncontrolled default reads the
 * clock, which on a prerendered page means the build machine's day, so a route
 * that is prerendered should pass `defaultDate` and decide for itself; the
 * examples in this library all do, which is also what keeps the gallery stable.
 */
export function useCalendarNavigation({
  date,
  defaultDate,
  onDateChange,
  step,
  timeZone = DEFAULT_CALENDAR_TIME_ZONE,
}: CalendarNavigationOptions) {
  const [uncontrolled, setUncontrolled] = useState<CalendarDate>(
    () => defaultDate ?? today(timeZone),
  )
  const current = date ?? uncontrolled

  const move = (next: CalendarDate) => {
    if (date === undefined) setUncontrolled(next)
    onDateChange?.(next)
  }

  return {
    date: current,
    goToPrevious: () => move(current.subtract(step)),
    goToNext: () => move(current.add(step)),
    goToToday: () => move(today(timeZone)),
    goTo: move,
  }
}
