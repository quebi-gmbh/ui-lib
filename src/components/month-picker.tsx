"use client"

import {
  CalendarDate,
  type DateValue,
  endOfMonth,
  getLocalTimeZone,
  toCalendarDate,
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
import { getDateTimeFormat } from "@/lib/intl"
import { cn } from "@/lib/utils"

/**
 * Month Picker — quebi design system
 *
 * A grid of the twelve months of one year, with a year stepper in the header,
 * and the popover field that wraps it. Same geometry and cell styling as Year
 * Picker, so the two read as one control in two resolutions.
 *
 * The grid is a react-aria ListBox with `layout="grid"`, so roving focus, arrow
 * keys, typeahead and the selection state come from react-aria rather than from
 * hand-rolled key handling.
 *
 * Month names come from `getDateTimeFormat` in `@/lib/intl`, never a bare
 * `toLocaleString()`: the site is prerendered, so an implicit locale is a
 * hydration bug, and the shared formatter cache is what keeps twelve names from
 * costing twelve `Intl.DateTimeFormat` constructions per render.
 *
 * The value is a `CalendarDate` on the first of the chosen month — clamped into
 * `minValue`/`maxValue` when either lands mid-month. The grid is Gregorian: a
 * standalone picker has no calendar system to inherit, unlike the month select
 * inside `Calendar`, which reads its own state's.
 */

export interface MonthPickerProps {
  /** The selected month, as a date inside it. Makes the picker controlled. */
  value?: CalendarDate | null
  /** The initially selected month, as a date inside it. */
  defaultValue?: CalendarDate | null
  /** Called with the first of the chosen month, clamped into min/max. */
  onChange?: (value: CalendarDate) => void
  /** Months ending before this are not selectable. */
  minValue?: DateValue
  /** Months starting after this are not selectable. */
  maxValue?: DateValue
  isDisabled?: boolean
  isReadOnly?: boolean
  /** Move focus into the grid on mount — what the popover field wants. */
  autoFocus?: boolean
  className?: string
  "aria-label"?: string
  "aria-labelledby"?: string
  "aria-describedby"?: string
}

export function MonthPicker({
  value,
  defaultValue,
  onChange,
  minValue,
  maxValue,
  isDisabled,
  isReadOnly,
  autoFocus,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
}: MonthPickerProps) {
  const { locale } = useLocale()
  const now = today(getLocalTimeZone())
  const isControlled = value !== undefined

  const [uncontrolled, setUncontrolled] = useState<CalendarDate | null>(defaultValue ?? null)
  const selected = isControlled ? (value ?? null) : uncontrolled

  const [visibleYear, setVisibleYear] = useState(() => (selected ?? now).year)

  // Follow the value when it moves from outside; paging by hand does not go
  // through here, so the user's own navigation is never yanked back.
  const [lastSelected, setLastSelected] = useState(selected?.toString())
  if (selected?.toString() !== lastSelected) {
    setLastSelected(selected?.toString())
    if (selected) setVisibleYear(selected.year)
  }

  const monthFormatter = getDateTimeFormat(locale, { month: "short", timeZone: "UTC" })
  const longMonthFormatter = getDateTimeFormat(locale, { month: "long", timeZone: "UTC" })
  const yearFormatter = getDateTimeFormat(locale, { year: "numeric", timeZone: "UTC" })

  const months = Array.from({ length: 12 }, (_, index) => monthStart(visibleYear, index + 1))
  // react-aria's ListBox has no `isDisabled` of its own — a disabled grid is one
  // where every cell is disabled, which is also what stops it taking focus.
  const disabledMonths = isDisabled
    ? months.map(keyOf)
    : months.filter((month) => !isMonthAvailable(month, minValue, maxValue)).map(keyOf)

  const select = (key: string) => {
    const month = months.find((candidate) => keyOf(candidate) === key)
    if (!month) return
    const next = clamp(month, minValue, maxValue)
    if (!isControlled) setUncontrolled(next)
    setLastSelected(next.toString())
    onChange?.(next)
  }

  return (
    <div data-slot="month-picker" className={cn("w-fit", isDisabled && "opacity-50", className)}>
      <PagerHeader
        label={yearFormatter.format(monthStart(visibleYear, 1).toDate("UTC"))}
        isDisabled={isDisabled}
        previousLabel="Previous year"
        nextLabel="Next year"
        onPrevious={() => setVisibleYear(visibleYear - 1)}
        onNext={() => setVisibleYear(visibleYear + 1)}
      />
      <ListBoxPrimitive
        aria-label={ariaLabel ?? (ariaLabelledBy ? undefined : "Month")}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        layout="grid"
        orientation="horizontal"
        selectionMode="single"
        disallowEmptySelection
        autoFocus={autoFocus}
        disabledKeys={disabledMonths}
        // Escape belongs to whatever is above the grid (the popover, usually);
        // the default would spend it clearing the selection instead.
        escapeKeyBehavior="none"
        selectedKeys={selected ? [keyOf(selected)] : []}
        onSelectionChange={(keys) => {
          if (isReadOnly || keys === "all") return
          const [key] = [...keys]
          if (typeof key === "string") select(key)
        }}
        className="grid grid-cols-3 gap-1 outline-hidden"
      >
        {months.map((month) => {
          const date = month.toDate("UTC")
          const isCurrent = month.year === now.year && month.month === now.month
          return (
            <ListBoxItemPrimitive
              key={keyOf(month)}
              id={keyOf(month)}
              textValue={longMonthFormatter.format(date)}
              aria-label={`${longMonthFormatter.format(date)} ${yearFormatter.format(date)}`}
              className={({ isSelected, isDisabled: isItemDisabled, isFocusVisible }) =>
                cn(
                  "flex h-10 w-20 cursor-default items-center justify-center rounded-quebi-sm text-sm text-quebi-fg tabular-nums outline-hidden transition-colors duration-150 hover:bg-quebi-surface/[0.04]",
                  isCurrent && !isSelected && "ring-1 ring-inset ring-quebi-brand-mark",
                  isSelected && "bg-quebi-brand text-quebi-on-brand hover:bg-quebi-brand-hover",
                  isItemDisabled && "text-quebi-fg-subtle hover:bg-transparent",
                  isFocusVisible &&
                    "ring-2 ring-quebi-brand-mark ring-offset-2 ring-offset-quebi-bg",
                )
              }
            >
              {monthFormatter.format(date)}
            </ListBoxItemPrimitive>
          )
        })}
      </ListBoxPrimitive>
    </div>
  )
}

export interface MonthPickerFieldProps extends Omit<MonthPickerProps, "autoFocus"> {
  /** Shown on the trigger while nothing is selected. */
  placeholder?: string
  /** Where the popover opens; `bottom start` by default. */
  placement?: "bottom" | "bottom start" | "bottom end" | "top" | "top start" | "top end"
}

/**
 * MonthPickerField — the Month Picker behind a trigger.
 *
 * A button showing the selected month and year, with the grid in a popover that
 * closes on selection. The popover has no segmented input to focus the way Date
 * Picker does, so the grid takes focus itself on open.
 */
export function MonthPickerField({
  value,
  defaultValue,
  onChange,
  placeholder = "Select month",
  placement = "bottom start",
  className,
  isDisabled,
  "aria-label": ariaLabel,
  ...props
}: MonthPickerFieldProps) {
  const { locale } = useLocale()
  const [isOpen, setIsOpen] = useState(false)
  const [uncontrolled, setUncontrolled] = useState<CalendarDate | null>(defaultValue ?? null)
  const selected = value !== undefined ? (value ?? null) : uncontrolled
  const formatter = getDateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })

  return (
    <Popover isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button
        aria-label={ariaLabel ?? "Month"}
        intent="outline"
        size="sm"
        isDisabled={isDisabled}
        className={cn("w-48 justify-between font-normal tabular-nums", className)}
      >
        <span className={cn(!selected && "text-quebi-fg-muted")}>
          {selected ? formatter.format(selected.toDate("UTC")) : placeholder}
        </span>
        <ChevronDown data-slot="icon" className="text-quebi-fg-muted" />
      </Button>
      <PopoverContent placement={placement} className="w-auto max-w-none p-3">
        <MonthPicker
          {...props}
          autoFocus
          aria-label={ariaLabel ?? "Month"}
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
 * announces the new year, since paging moves nothing into focus.
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

/** The first of `month` in `year`. */
const monthStart = (year: number, month: number) => new CalendarDate(year, month, 1)

/** A stable collection key for a month — `2026-09`, not an index into a page. */
const keyOf = (date: CalendarDate) => `${date.year}-${String(date.month).padStart(2, "0")}`

/** True if any day of `month` falls inside `[minValue, maxValue]`. */
function isMonthAvailable(month: CalendarDate, minValue?: DateValue, maxValue?: DateValue) {
  if (minValue && endOfMonth(month).compare(minValue) < 0) return false
  if (maxValue && month.compare(maxValue) > 0) return false
  return true
}

/**
 * `date` pulled inside `[minValue, maxValue]`.
 *
 * The first of a selectable month can still sit before a mid-month `minValue`,
 * and handing a consumer a value its own bounds reject is the kind of thing
 * that only shows up in their validation.
 */
function clamp(date: CalendarDate, minValue?: DateValue, maxValue?: DateValue) {
  if (minValue && date.compare(minValue) < 0) return toCalendarDate(minValue)
  if (maxValue && date.compare(maxValue) > 0) return toCalendarDate(maxValue)
  return date
}
