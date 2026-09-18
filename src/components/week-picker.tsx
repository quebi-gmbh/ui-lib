"use client"

import {
  type CalendarDate,
  type DateValue,
  getLocalTimeZone,
  getWeeksInMonth,
  startOfMonth,
  startOfWeek,
  today,
} from "@internationalized/date"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"
import {
  ListBoxItem as ListBoxItemPrimitive,
  ListBox as ListBoxPrimitive,
  useLocale,
} from "react-aria-components"
import { Button } from "@/components/button"
import { Popover, PopoverContent } from "@/components/popover"
import { getDateTimeFormat, getNumberFormat } from "@/lib/intl"
import { cn } from "@/lib/utils"

/**
 * Week Picker — quebi design system
 *
 * A month of days where the row is the target, not the cell: hovering lights the
 * whole week, clicking selects it, and the value is the whole week. That is the
 * difference from Range Calendar, which selects an arbitrary span in two clicks
 * and would let a "week" be Wednesday to Tuesday.
 *
 * Weeks start where the locale says they do — `startOfWeek` from
 * `@internationalized/date` — so the rows line up with Calendar in the same
 * locale. The number in the gutter is the ISO-8601 week, which is what people
 * mean by "week 38"; in a Sunday-first locale the row's Sunday belongs to the
 * previous ISO week, so the number is taken from the day that dominates the row
 * rather than from its first day.
 *
 * The rows are a react-aria ListBox, so roving focus, arrow keys, typeahead
 * ("week 38") and the selection state come from react-aria rather than from
 * hand-rolled key handling. One option per week is also the honest accessibility
 * tree: the user is choosing between weeks, not between days.
 *
 * `minValue` / `maxValue` gate which weeks are selectable — a week is offered if
 * any of its days is in range — and never truncate the emitted range. A whole
 * week is the point of the control; a partial one would be a Range Calendar.
 */

/** A whole week: seven days, first day to last, in the locale's week order. */
export interface WeekRange {
  start: CalendarDate
  end: CalendarDate
}

export interface WeekPickerProps {
  /** The selected week. Any day inside it works; it is snapped. Controlled. */
  value?: WeekRange | null
  /** The initially selected week. Any day inside it works; it is snapped. */
  defaultValue?: WeekRange | null
  /** Called with the whole week — never a partial range. */
  onChange?: (value: WeekRange) => void
  /** Weeks ending before this are not selectable. */
  minValue?: DateValue
  /** Weeks starting after this are not selectable. */
  maxValue?: DateValue
  isDisabled?: boolean
  isReadOnly?: boolean
  /** Hide the ISO week-number gutter. */
  hideWeekNumbers?: boolean
  /** Move focus into the grid on mount — what the popover field wants. */
  autoFocus?: boolean
  className?: string
  "aria-label"?: string
  "aria-labelledby"?: string
  "aria-describedby"?: string
}

export function WeekPicker({
  value,
  defaultValue,
  onChange,
  minValue,
  maxValue,
  isDisabled,
  isReadOnly,
  hideWeekNumbers,
  autoFocus,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
}: WeekPickerProps) {
  const { locale } = useLocale()
  const now = today(getLocalTimeZone())
  const isControlled = value !== undefined

  const [uncontrolled, setUncontrolled] = useState<WeekRange | null>(defaultValue ?? null)
  const selected = isControlled ? (value ?? null) : uncontrolled
  const selectedStart = selected ? startOfWeek(selected.start, locale) : null

  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(selected?.start ?? now),
  )

  // Follow the value when it moves from outside; paging by hand does not go
  // through here, so the user's own navigation is never yanked back.
  const [lastSelected, setLastSelected] = useState(selectedStart?.toString())
  if (selectedStart?.toString() !== lastSelected) {
    setLastSelected(selectedStart?.toString())
    if (selectedStart) setVisibleMonth(startOfMonth(selectedStart.add({ days: 3 })))
  }

  const dayFormatter = getDateTimeFormat(locale, { day: "numeric", timeZone: "UTC" })
  const weekdayFormatter = getDateTimeFormat(locale, { weekday: "short", timeZone: "UTC" })
  const monthFormatter = getDateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
  const rangeFormatter = getDateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
  const numberFormatter = getNumberFormat(locale)

  const firstWeekStart = startOfWeek(visibleMonth, locale)
  const weeks = Array.from({ length: getWeeksInMonth(visibleMonth, locale) }, (_, index) =>
    firstWeekStart.add({ weeks: index }),
  )
  const currentWeekStart = startOfWeek(now, locale)

  // react-aria's ListBox has no `isDisabled` of its own — a disabled grid is one
  // where every row is disabled, which is also what stops it taking focus.
  const disabledWeeks = isDisabled
    ? weeks.map((week) => week.toString())
    : weeks
        .filter((week) => !isWeekAvailable(week, minValue, maxValue))
        .map((week) => week.toString())

  const select = (key: string) => {
    const start = weeks.find((week) => week.toString() === key)
    if (!start) return
    const next = { start, end: start.add({ days: 6 }) }
    if (!isControlled) setUncontrolled(next)
    setLastSelected(start.toString())
    onChange?.(next)
  }

  return (
    <div data-slot="week-picker" className={cn("w-fit", isDisabled && "opacity-50", className)}>
      <PagerHeader
        label={monthFormatter.format(visibleMonth.toDate("UTC"))}
        isDisabled={isDisabled}
        previousLabel="Previous month"
        nextLabel="Next month"
        onPrevious={() => setVisibleMonth(visibleMonth.subtract({ months: 1 }))}
        onNext={() => setVisibleMonth(visibleMonth.add({ months: 1 }))}
      />

      {/* Column headings. Hidden from the accessibility tree because each row
          carries its own full label — "Week 38, 14 to 20 September 2026" — and a
          weekday name above a row that is selected whole adds nothing to it. */}
      <div aria-hidden="true" className="flex items-center gap-1 px-0.5 pb-2">
        {!hideWeekNumbers && (
          <span className="w-8 text-center font-semibold text-[11px] text-quebi-fg-muted uppercase tracking-[0.08em]">
            Wk
          </span>
        )}
        {Array.from({ length: 7 }, (_, index) => firstWeekStart.add({ days: index })).map((day) => (
          <span
            key={day.toString()}
            className="w-9 text-center font-semibold text-[11px] text-quebi-fg-muted uppercase tracking-[0.08em]"
          >
            {weekdayFormatter.format(day.toDate("UTC"))}
          </span>
        ))}
      </div>

      <ListBoxPrimitive
        aria-label={ariaLabel ?? (ariaLabelledBy ? undefined : "Week")}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        selectionMode="single"
        disallowEmptySelection
        autoFocus={autoFocus}
        disabledKeys={disabledWeeks}
        // Escape belongs to whatever is above the grid (the popover, usually);
        // the default would spend it clearing the selection instead.
        escapeKeyBehavior="none"
        selectedKeys={selectedStart ? [selectedStart.toString()] : []}
        onSelectionChange={(keys) => {
          if (isReadOnly || keys === "all") return
          const [key] = [...keys]
          if (typeof key === "string") select(key)
        }}
        className="flex flex-col gap-0.5 outline-hidden"
      >
        {weeks.map((week) => {
          const days = Array.from({ length: 7 }, (_, index) => week.add({ days: index }))
          const weekNumber = isoWeekNumber(dominantDay(week))
          const isCurrentWeek = week.compare(currentWeekStart) === 0
          const label = `Week ${weekNumber}, ${rangeFormatter.formatRange(
            week.toDate("UTC"),
            week.add({ days: 6 }).toDate("UTC"),
          )}`

          return (
            <ListBoxItemPrimitive
              key={week.toString()}
              id={week.toString()}
              textValue={`Week ${weekNumber}`}
              aria-label={label}
              className={({ isSelected, isDisabled: isItemDisabled, isFocusVisible }) =>
                cn(
                  "flex cursor-default items-center gap-1 rounded-quebi-sm px-0.5 py-0.5 outline-hidden transition-colors duration-150 hover:bg-quebi-surface/[0.04]",
                  isCurrentWeek && !isSelected && "ring-1 ring-inset ring-quebi-brand-mark",
                  isSelected && "bg-quebi-brand hover:bg-quebi-brand-hover",
                  isItemDisabled && "hover:bg-transparent",
                  isFocusVisible &&
                    "ring-2 ring-quebi-brand-mark ring-offset-2 ring-offset-quebi-bg",
                )
              }
            >
              {({ isSelected, isDisabled: isItemDisabled }) => (
                <>
                  {!hideWeekNumbers && (
                    <span
                      className={cn(
                        "w-8 text-center text-xs tabular-nums transition-colors duration-150",
                        isSelected ? "text-quebi-on-brand/80" : "text-quebi-fg-muted",
                      )}
                    >
                      {numberFormatter.format(weekNumber)}
                    </span>
                  )}
                  {days.map((day) => (
                    <span
                      key={day.toString()}
                      className={cn(
                        "flex size-9 items-center justify-center rounded-quebi-sm text-sm tabular-nums transition-colors duration-150",
                        isSelected ? "text-quebi-on-brand" : "text-quebi-fg",
                        day.month !== visibleMonth.month &&
                          (isSelected ? "text-quebi-on-brand/70" : "text-quebi-fg-subtle"),
                        isItemDisabled && !isSelected && "text-quebi-fg-subtle",
                        // Today's dot, the same marker Range Calendar uses.
                        day.compare(now) === 0 &&
                          !isSelected &&
                          "relative after:pointer-events-none after:absolute after:bottom-1 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-quebi-brand",
                      )}
                    >
                      {dayFormatter.format(day.toDate("UTC"))}
                    </span>
                  ))}
                </>
              )}
            </ListBoxItemPrimitive>
          )
        })}
      </ListBoxPrimitive>
    </div>
  )
}

export interface WeekPickerFieldProps extends Omit<WeekPickerProps, "autoFocus"> {
  /** Shown on the trigger while nothing is selected. */
  placeholder?: string
  /** Where the popover opens; `bottom start` by default. */
  placement?: "bottom" | "bottom start" | "bottom end" | "top" | "top start" | "top end"
}

/**
 * WeekPickerField — the Week Picker behind a trigger.
 *
 * The trigger reads "Week 38 · 14 – 20 Sept 2026": the number people ask for,
 * next to the dates it actually means, since a week number alone is ambiguous
 * across locales.
 */
export function WeekPickerField({
  value,
  defaultValue,
  onChange,
  placeholder = "Select week",
  placement = "bottom start",
  className,
  isDisabled,
  "aria-label": ariaLabel,
  ...props
}: WeekPickerFieldProps) {
  const { locale } = useLocale()
  const [isOpen, setIsOpen] = useState(false)
  const [uncontrolled, setUncontrolled] = useState<WeekRange | null>(defaultValue ?? null)
  const selected = value !== undefined ? (value ?? null) : uncontrolled
  const rangeFormatter = getDateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
  const numberFormatter = getNumberFormat(locale)

  const label = selected
    ? `Week ${numberFormatter.format(
        isoWeekNumber(dominantDay(startOfWeek(selected.start, locale))),
      )} · ${rangeFormatter.formatRange(
        selected.start.toDate("UTC"),
        selected.end.toDate("UTC"),
      )}`
    : placeholder

  return (
    <Popover isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button
        aria-label={ariaLabel ?? "Week"}
        intent="outline"
        size="sm"
        isDisabled={isDisabled}
        className={cn("w-72 justify-between font-normal tabular-nums", className)}
      >
        <span className={cn("truncate", !selected && "text-quebi-fg-muted")}>{label}</span>
        <ChevronDown data-slot="icon" className="text-quebi-fg-muted" />
      </Button>
      <PopoverContent placement={placement} className="w-auto max-w-none p-3">
        <WeekPicker
          {...props}
          autoFocus
          aria-label={ariaLabel ?? "Week"}
          value={selected}
          onChange={(next) => {
            if (value === undefined) setUncontrolled(next)
            onChange?.(next)
            setIsOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

interface PagerHeaderProps {
  label: string
  previousLabel: string
  nextLabel: string
  onPrevious: () => void
  onNext: () => void
  isDisabled?: boolean
}

/**
 * The prev / label / next row above the grid.
 *
 * Not `CalendarHeader` from `@/components/calendar`: its buttons are
 * `slot="previous"` / `slot="next"`, which only resolve inside a react-aria
 * Calendar. These page local state instead. `aria-live` on the label is what
 * announces the new month, since paging moves nothing into focus.
 */
function PagerHeader({
  label,
  previousLabel,
  nextLabel,
  onPrevious,
  onNext,
  isDisabled,
}: PagerHeaderProps) {
  const { direction } = useLocale()
  const Previous = direction === "rtl" ? ChevronRight : ChevronLeft
  const Next = direction === "rtl" ? ChevronLeft : ChevronRight

  return (
    <header
      data-slot="picker-header"
      className="flex w-full items-center justify-between gap-1.5 ps-1.5 pe-1 pt-1 pb-4"
    >
      <span aria-live="polite" className="font-semibold text-quebi-fg text-sm tabular-nums">
        {label}
      </span>
      <div className="flex items-center gap-1">
        <Button
          aria-label={previousLabel}
          size="sq-sm"
          className="size-8 sm:size-7 **:data-[slot=icon]:text-quebi-fg-muted"
          isCircle
          intent="ghost"
          isDisabled={isDisabled}
          onPress={onPrevious}
        >
          <Previous data-slot="icon" />
        </Button>
        <Button
          aria-label={nextLabel}
          size="sq-sm"
          className="size-8 sm:size-7 **:data-[slot=icon]:text-quebi-fg-muted"
          isCircle
          intent="ghost"
          isDisabled={isDisabled}
          onPress={onNext}
        >
          <Next data-slot="icon" />
        </Button>
      </div>
    </header>
  )
}

/**
 * The day a week row belongs to for week-numbering purposes.
 *
 * Thursday in a Monday-first locale, which is the ISO definition. Three days in
 * from whatever the locale's first day is lands on a day the row's ISO week owns
 * for every first-day-of-week in use, so one expression covers all of them.
 */
const dominantDay = (weekStart: CalendarDate) => weekStart.add({ days: 3 })

/**
 * The ISO-8601 week number containing `date`.
 *
 * Plain UTC arithmetic rather than a locale formatter on purpose: ISO weeks are
 * defined independently of locale, and `Intl` has no API for them. Nothing here
 * reads the ambient locale or time zone, so it renders the same on the server
 * and in the browser.
 */
function isoWeekNumber(date: CalendarDate): number {
  const thursday = new Date(Date.UTC(date.year, date.month - 1, date.day))
  // Monday = 1 … Sunday = 7, then step to the Thursday of the same ISO week.
  const isoDay = thursday.getUTCDay() || 7
  thursday.setUTCDate(thursday.getUTCDate() + 4 - isoDay)
  const yearStart = Date.UTC(thursday.getUTCFullYear(), 0, 1)
  return Math.ceil(((thursday.getTime() - yearStart) / 86_400_000 + 1) / 7)
}

/** True if any day of the week starting at `weekStart` is inside the bounds. */
function isWeekAvailable(weekStart: CalendarDate, minValue?: DateValue, maxValue?: DateValue) {
  if (minValue && weekStart.add({ days: 6 }).compare(minValue) < 0) return false
  if (maxValue && weekStart.compare(maxValue) > 0) return false
  return true
}
