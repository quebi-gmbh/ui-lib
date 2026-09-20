"use client"

import type { CalendarDate, DateDuration, DateValue } from "@internationalized/date"
import { today } from "@internationalized/date"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"
import { useLocale } from "react-aria-components"
import { Button } from "@/components/button"
import { Calendar } from "@/components/calendar"
import { dayToDate, DEFAULT_CALENDAR_TIME_ZONE } from "@/components/calendar-shell"
import { MonthPicker } from "@/components/month-picker"
import { Popover, PopoverContent } from "@/components/popover"
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
 * Every control is gated on its handler: no `onToday`, no today button. The
 * view switcher is the one that cannot be — it doubles as the read-only "which
 * view am I in" indicator, and dropping it would take that away — so it is
 * drawn `isDisabled` instead when no `onViewChange` is wired. The group is
 * fully controlled from `view`, so without a handler a press fires, changes
 * nothing, and the next render re-asserts the same selection; disabled says so
 * before the press rather than after it (task #169).
 *
 * `Calendar` exports `SelectMonth`, `StepMonth` and `StepYear`, and they are not
 * reused here: all three read react-aria's `CalendarStateContext`, so they only
 * work *inside* a `<Calendar>` and there is no such state above a week grid.
 * What is shared is the vocabulary — a chevron pair around a label — not the
 * code. `labelVariant="picker"` therefore mounts a `<Calendar>` of its own
 * inside a popover rather than borrowing one of those three (task #166).
 */

/**
 * How the date label is drawn.
 *
 * - `static` — a `<span>`. The default, so no existing view moves.
 * - `picker` — a button opening a date grid in a popover, the way `Calendar`'s
 *   own header opens the Month Picker (task #160). Without it the only way to
 *   another date is `Today` or one chevron press at a time.
 */
export type CalendarToolbarLabelVariant = "static" | "picker"

/**
 * Which grid the picker opens.
 *
 * `day` is a `Calendar` and `month` is a `MonthPicker`, and the choice belongs
 * to whoever knows what the label names: `MonthView`'s heading reads
 * `September 2026`, so a day grid there would ask for something the heading
 * does not say and hand back a date the month grid cannot show. The other
 * three views are anchored on a day and get `day`.
 */
export type CalendarToolbarPickerGranularity = "day" | "month"

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
  /**
   * Draw the label as a date picker instead of as text. Default `static`.
   *
   * `picker` needs `date` *and* `onDateChange`: the toolbar owns no state, so
   * with either missing there is nothing to open the grid on or to report a
   * choice to, and the label falls back to `static`. That fallback is not the
   * trap the view switcher had — the static label carries exactly the same
   * text, so nothing that looks pressable is left behind.
   *
   * A custom `label` is *wrapped* rather than ignored or warned about. `label`
   * says what you are looking at and `date` says where the picker opens, and
   * the two are independent: a page whose heading reads `Week 39 · Q3` still
   * wants to jump to an arbitrary day, and silently dropping the variant is
   * the class of bug task #169 was about.
   */
  labelVariant?: CalendarToolbarLabelVariant
  /** Where the picker opens, and what it reports relative to. */
  date?: CalendarDate
  /** Called with the day (or month) chosen in the picker. `useCalendarNavigation().goTo`. */
  onDateChange?: (date: CalendarDate) => void
  /** Day grid or month grid. Default `day`; `MonthView` passes `month`. */
  pickerGranularity?: CalendarToolbarPickerGranularity
  /** Accessible name for the grid inside the popover — the place to translate it. */
  pickerLabel?: string
  /** Dates before this cannot be picked. */
  minValue?: DateValue
  /** Dates after this cannot be picked. */
  maxValue?: DateValue
  /** Disable every control the toolbar draws. */
  isDisabled?: boolean
  /** The active view. Omit to hide the switcher. */
  view?: CalendarViewName
  /** Which switches to offer. Defaults to all four. */
  views?: readonly CalendarViewName[]
  /** Override one or more switch labels — the place to translate them. */
  viewLabels?: Partial<Record<CalendarViewName, string>>
  /** Omit to draw the switcher as a disabled indicator rather than a dead control. */
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
  labelVariant = "static",
  date,
  onDateChange,
  pickerGranularity = "day",
  pickerLabel,
  minValue,
  maxValue,
  isDisabled,
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
          <Button intent="outline" size="sm" isDisabled={isDisabled} onPress={onToday}>
            {todayLabel}
          </Button>
        ) : null}
        {onPrevious ? (
          <Button
            intent="ghost"
            size="sm"
            isCircle
            aria-label={previousLabel}
            isDisabled={isDisabled}
            onPress={onPrevious}
          >
            <ChevronLeft data-slot="icon" className="size-4" aria-hidden="true" />
          </Button>
        ) : null}
        {onNext ? (
          <Button
            intent="ghost"
            size="sm"
            isCircle
            aria-label={nextLabel}
            isDisabled={isDisabled}
            onPress={onNext}
          >
            <ChevronRight data-slot="icon" className="size-4" aria-hidden="true" />
          </Button>
        ) : null}
        {labelVariant === "picker" && date && onDateChange ? (
          <CalendarToolbarPicker
            label={label}
            date={date}
            onDateChange={onDateChange}
            granularity={pickerGranularity}
            pickerLabel={pickerLabel}
            minValue={minValue}
            maxValue={maxValue}
            isDisabled={isDisabled}
          />
        ) : (
          <span
            data-slot="calendar-toolbar-label"
            className="font-semibold text-quebi-fg tracking-tight"
          >
            {label}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {view && views.length > 1 ? (
          <ToggleGroup
            size="xs"
            aria-label="Calendar view"
            disallowEmptySelection
            isDisabled={isDisabled || !onViewChange}
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

interface CalendarToolbarPickerProps {
  label: React.ReactNode
  date: CalendarDate
  onDateChange: (date: CalendarDate) => void
  granularity: CalendarToolbarPickerGranularity
  pickerLabel: string | undefined
  minValue: DateValue | undefined
  maxValue: DateValue | undefined
  isDisabled: boolean | undefined
}

/**
 * The date label as a trigger, and the grid it opens.
 *
 * Its own component because the open state is a hook and the label is a
 * conditional. Shaped after `Calendar`'s `SelectMonthYear`, down to the two
 * things that are easy to get wrong there:
 *
 * - **No `aria-label` on the trigger.** It would *replace* the button's own
 *   text as the accessible name, and "Sunday, 20 September 2026" is the more
 *   useful of the two; `aria-expanded` already says it opens something. The
 *   stable handle for a test or a restyle is `data-slot`, as everywhere else.
 * - **The popover closes in `onChange`.** The toolbar keeps no date, so the
 *   choice goes upward and the surface gets out of the way; leaving it open
 *   would sit a grid over the view the press just changed.
 *
 * A month choice keeps the day the view was anchored on. `MonthPicker` reports
 * the first of the month because a month is all it was asked for, but the
 * anchor is a date — dropping to the 1st would silently move a consumer who
 * switches from Month back to Day. `era` travels with `year` and `month`: in an
 * era calendar the year counts from the start of the era, so two different
 * years can both be year 1.
 */
function CalendarToolbarPicker({
  label,
  date,
  onDateChange,
  granularity,
  pickerLabel,
  minValue,
  maxValue,
  isDisabled,
}: CalendarToolbarPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const gridLabel = pickerLabel ?? (granularity === "month" ? "Choose month" : "Choose date")

  return (
    <Popover isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button
        data-slot="calendar-toolbar-label"
        intent="outline"
        size="sm"
        isDisabled={isDisabled}
        className="font-semibold tracking-tight"
      >
        {label}
        <ChevronDown data-slot="icon" className="text-quebi-fg-muted" />
      </Button>
      <PopoverContent placement="bottom start" className="w-auto max-w-none p-3">
        {granularity === "month" ? (
          <MonthPicker
            autoFocus
            aria-label={gridLabel}
            calendar={date.calendar}
            value={date}
            minValue={minValue}
            maxValue={maxValue}
            isDisabled={isDisabled}
            onChange={(next) => {
              setIsOpen(false)
              onDateChange(date.set({ era: next.era, year: next.year, month: next.month }))
            }}
          />
        ) : (
          <Calendar
            autoFocus
            aria-label={gridLabel}
            value={date}
            minValue={minValue}
            maxValue={maxValue}
            isDisabled={isDisabled}
            onChange={(next) => {
              setIsOpen(false)
              onDateChange(next)
            }}
          />
        )}
      </PopoverContent>
    </Popover>
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
