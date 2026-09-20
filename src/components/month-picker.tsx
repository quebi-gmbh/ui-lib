"use client"

import {
  type Calendar,
  type CalendarDate,
  type DateValue,
  endOfMonth,
  getLocalTimeZone,
  GregorianCalendar,
  startOfYear,
  toCalendar,
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
 * hand-rolled key handling. See the note on `orientation` at the ListBox for why
 * a grid that reads left-to-right is a *vertical* one as far as react-aria's
 * keyboard delegate is concerned.
 *
 * Month names come from `getDateTimeFormat` in `@/lib/intl`, never a bare
 * `toLocaleString()`: the site is prerendered, so an implicit locale is a
 * hydration bug, and the shared formatter cache is what keeps twelve names from
 * costing twelve `Intl.DateTimeFormat` constructions per render.
 *
 * The value is a `CalendarDate` on the first of the chosen month — clamped into
 * `minValue`/`maxValue` when either lands mid-month.
 *
 * The grid counts in whatever `calendar` it is handed, and Gregorian when it is
 * handed none: a standalone picker has no state above it to inherit one from,
 * while `Calendar`'s header passes `state.focusedDate.calendar` down. That is
 * why the page is a `CalendarDate` on the first of the year rather than a plain
 * number, and why the cell count is `getMonthsInYear` rather than twelve — a
 * Hebrew leap year has thirteen months, and a number cannot say which year's.
 */

export interface MonthPickerProps {
  /**
   * The calendar system the grid counts in. Gregorian by default; `Calendar`'s
   * header passes its own state's, so a Hebrew or Japanese calendar keeps
   * counting its own months and naming its own years.
   */
  calendar?: Calendar
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
  calendar: calendarProp,
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
  const calendar = calendarProp ?? GREGORIAN
  const now = toCalendar(today(getLocalTimeZone()), calendar)
  const isControlled = value !== undefined

  const [uncontrolled, setUncontrolled] = useState<CalendarDate | null>(defaultValue ?? null)
  const given = isControlled ? (value ?? null) : uncontrolled
  // A value handed in from another calendar system is still about one month;
  // converting is what lets `keyOf` compare it against the cells on screen.
  const selected = given ? toCalendar(given, calendar) : null

  // The page, as the first day of the year on screen. `startOfYear` rather than
  // "month 1" because an era can begin mid-year: in the Japanese calendar the
  // first year of an era starts at the month the era did.
  const [page, setPage] = useState(() => startOfYear(selected ?? now))
  // A locale switch can change the calendar system under a mounted picker, and
  // a page left in the old one would count its months with the new one's rules.
  const visible = page.calendar.identifier === calendar.identifier ? page : startOfYear(now)

  // Follow the value when it moves from outside; paging by hand does not go
  // through here, so the user's own navigation is never yanked back.
  const [lastSelected, setLastSelected] = useState(selected?.toString())
  if (selected?.toString() !== lastSelected) {
    setLastSelected(selected?.toString())
    if (selected) setPage(startOfYear(selected))
  }

  const monthFormatter = getDateTimeFormat(locale, { month: "short", timeZone: "UTC" })
  const longMonthFormatter = getDateTimeFormat(locale, { month: "long", timeZone: "UTC" })
  const yearFormatter = getDateTimeFormat(locale, { year: "numeric", timeZone: "UTC" })

  const months = Array.from({ length: calendar.getMonthsInYear(visible) }, (_, index) =>
    visible.set({ month: index + 1 }),
  )
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
        label={yearFormatter.format(visible.toDate("UTC"))}
        isDisabled={isDisabled}
        previousLabel="Previous year"
        nextLabel="Next year"
        onPrevious={() => setPage(startOfYear(visible.subtract({ years: 1 })))}
        onNext={() => setPage(startOfYear(visible.add({ years: 1 })))}
      />
      <ListBoxPrimitive
        aria-label={ariaLabel ?? (ariaLabelledBy ? undefined : "Month")}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        layout="grid"
        // Vertical, though the grid reads left-to-right, and this is the one
        // thing about it that is not obvious. `orientation` tells
        // `ListKeyboardDelegate` how the *collection order* maps onto the
        // layout, not which way the rows run: with `grid` + `vertical` it walks
        // left/right by collection order and up/down by comparing cell
        // geometry, which is exactly a wrapping 3-column grid. With `grid` +
        // `horizontal` it sends left/right through `findKey(..., isSameColumn)`
        // instead, and that compares every candidate against the rect it
        // started from rather than the previous one — so from any cell every
        // later cell is either in a different row or in the same column, every
        // candidate is skipped, and it returns null. Arrow keys did nothing at
        // all (task #170).
        orientation="vertical"
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
          // `era` is part of the answer: in an era calendar `year` counts from
          // the start of the era, so two different years can both be year 1.
          const isCurrent =
            month.era === now.era && month.year === now.year && month.month === now.month
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
 *
 * Both carry `slot={null}`, because this grid *is* rendered inside a react-aria
 * Calendar — `CalendarHeader`'s `select` variant opens it in a popover, and a
 * `Button` under a Calendar reads a `ButtonContext` that is a slot map. Without
 * a `slot` it throws ("A slot prop is required"); with `previous` or `next` it
 * would page the calendar's visible range instead of this grid's year.
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
          slot={null}
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
          slot={null}
          isDisabled={isDisabled}
          onPress={onNext}
        >
          <Next data-slot="icon" />
        </Button>
      </div>
    </header>
  )
}

/** What a picker with no calendar system of its own counts in. */
const GREGORIAN = new GregorianCalendar()

/**
 * A stable collection key for a month — `AD-2026-09`, not an index into a page.
 * Era-qualified for the reason `isCurrent` is: year 1 of two eras is two years.
 */
const keyOf = (date: CalendarDate) =>
  `${date.era}-${date.year}-${String(date.month).padStart(2, "0")}`

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
  // Back into `date`'s calendar on the way out: `compare` is absolute, so a
  // bound given in another system compares fine but must not be handed on raw.
  if (minValue && date.compare(minValue) < 0)
    return toCalendar(toCalendarDate(minValue), date.calendar)
  if (maxValue && date.compare(maxValue) > 0)
    return toCalendar(toCalendarDate(maxValue), date.calendar)
  return date
}
