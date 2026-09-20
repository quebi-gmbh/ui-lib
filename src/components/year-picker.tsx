"use client"

import {
  CalendarDate,
  type DateValue,
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
 * Year Picker — quebi design system
 *
 * A decade grid for picking a year, and the popover field that wraps it. The
 * page is a calendar decade (2020–2029) plus the year either side, dimmed the
 * way a calendar dims its outside-month days, so the boundary years are one
 * click away rather than one page away.
 *
 * The grid is a react-aria ListBox with `layout="grid"`, so roving focus, arrow
 * keys, typeahead and the selection state come from react-aria rather than from
 * hand-rolled key handling. See the note on `orientation` at the ListBox for why
 * a grid that reads left-to-right is a *vertical* one as far as react-aria's
 * keyboard delegate is concerned. It is the primitive rather than
 * `@/components/list-box` on purpose: that wrapper is the dropdown surface (its
 * own border, glow and a check icon per item), and a calendar cell is not a
 * menu item.
 *
 * The value is a `CalendarDate` on January 1 of the chosen year — clamped into
 * `minValue`/`maxValue` when either of those lands mid-year — so it composes
 * with the rest of the Date & time category. Sibling of Month Picker and Week
 * Picker; the three share their cell styling with Calendar.
 */

/** Cells per page: the ten years of a decade, plus the one either side. */
const YEARS_PER_PAGE = 12

/** The first year of the calendar decade `year` falls in. */
const decadeOf = (year: number) => Math.floor(year / 10) * 10

export interface YearPickerProps {
  /** The selected year, as a date inside it. Makes the picker controlled. */
  value?: CalendarDate | null
  /** The initially selected year, as a date inside it. */
  defaultValue?: CalendarDate | null
  /** Called with January 1 of the chosen year, clamped into min/max. */
  onChange?: (value: CalendarDate) => void
  /** Years ending before this are not selectable. */
  minValue?: DateValue
  /** Years starting after this are not selectable. */
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

export function YearPicker({
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
}: YearPickerProps) {
  const { locale } = useLocale()
  const now = today(getLocalTimeZone())
  const isControlled = value !== undefined

  const [uncontrolled, setUncontrolled] = useState<CalendarDate | null>(defaultValue ?? null)
  const selected = isControlled ? (value ?? null) : uncontrolled

  const [decadeStart, setDecadeStart] = useState(() => decadeOf((selected ?? now).year))

  // Follow the value when it moves from outside — a parent that sets the year
  // to 1998 means the page showing 2020–2029 is now showing the wrong decade.
  // Paging by hand does not go through here, so the user's own navigation is
  // never yanked back.
  const [lastSelectedYear, setLastSelectedYear] = useState(selected?.year)
  if (selected?.year !== lastSelectedYear) {
    setLastSelectedYear(selected?.year)
    if (selected) setDecadeStart(decadeOf(selected.year))
  }

  const formatter = getDateTimeFormat(locale, { year: "numeric", timeZone: "UTC" })
  const label = `${formatter.format(yearStart(decadeStart).toDate("UTC"))} – ${formatter.format(
    yearStart(decadeStart + 9).toDate("UTC"),
  )}`

  const years = Array.from({ length: YEARS_PER_PAGE }, (_, index) => decadeStart - 1 + index)
  // react-aria's ListBox has no `isDisabled` of its own — a disabled grid is one
  // where every cell is disabled, which is also what stops it taking focus.
  const disabledYears = isDisabled
    ? years
    : years.filter((year) => !isYearAvailable(year, minValue, maxValue))

  const select = (year: number) => {
    const next = clamp(yearStart(year), minValue, maxValue)
    if (!isControlled) setUncontrolled(next)
    // A boundary year lives on the page of its own decade; follow it there so
    // the selection stays visible after the click.
    setDecadeStart(decadeOf(year))
    setLastSelectedYear(next.year)
    onChange?.(next)
  }

  return (
    <div
      data-slot="year-picker"
      className={cn("w-fit", isDisabled && "opacity-50", className)}
    >
      <PagerHeader
        label={label}
        isDisabled={isDisabled}
        previousLabel="Previous decade"
        nextLabel="Next decade"
        onPrevious={() => setDecadeStart(decadeStart - 10)}
        onNext={() => setDecadeStart(decadeStart + 10)}
      />
      <ListBoxPrimitive
        aria-label={ariaLabel ?? (ariaLabelledBy ? undefined : "Year")}
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
        disabledKeys={disabledYears}
        // Escape belongs to whatever is above the grid (the popover, usually);
        // the default would spend it clearing the selection instead.
        escapeKeyBehavior="none"
        selectedKeys={selected ? [selected.year] : []}
        onSelectionChange={(keys) => {
          if (isReadOnly || keys === "all") return
          const [key] = [...keys]
          if (typeof key === "number") select(key)
        }}
        className="grid grid-cols-3 gap-1 outline-hidden"
      >
        {years.map((year) => {
          const isOutsideDecade = year < decadeStart || year > decadeStart + 9
          return (
            <ListBoxItemPrimitive
              key={year}
              id={year}
              textValue={formatter.format(yearStart(year).toDate("UTC"))}
              className={({ isSelected, isDisabled: isItemDisabled, isFocusVisible }) =>
                cn(
                  "flex h-10 w-20 cursor-default items-center justify-center rounded-quebi-sm text-sm text-quebi-fg tabular-nums outline-hidden transition-colors duration-150 hover:bg-quebi-surface/[0.04]",
                  isOutsideDecade && "text-quebi-fg-subtle",
                  year === now.year && !isSelected && "ring-1 ring-inset ring-quebi-brand-mark",
                  isSelected && "bg-quebi-brand text-quebi-on-brand hover:bg-quebi-brand-hover",
                  isItemDisabled && "text-quebi-fg-subtle hover:bg-transparent",
                  isFocusVisible &&
                    "ring-2 ring-quebi-brand-mark ring-offset-2 ring-offset-quebi-bg",
                )
              }
            >
              {formatter.format(yearStart(year).toDate("UTC"))}
            </ListBoxItemPrimitive>
          )
        })}
      </ListBoxPrimitive>
    </div>
  )
}

export interface YearPickerFieldProps extends Omit<YearPickerProps, "autoFocus"> {
  /** Shown on the trigger while nothing is selected. */
  placeholder?: string
  /** Where the popover opens; `bottom start` by default. */
  placement?: "bottom" | "bottom start" | "bottom end" | "top" | "top start" | "top end"
}

/**
 * YearPickerField — the Year Picker behind a trigger.
 *
 * The compact shape: a button showing the selected year, and the grid in a
 * popover that closes on selection. The popover has no segmented input to focus
 * the way Date Picker does, so the grid takes focus itself on open.
 */
export function YearPickerField({
  value,
  defaultValue,
  onChange,
  placeholder = "Select year",
  placement = "bottom start",
  className,
  isDisabled,
  "aria-label": ariaLabel,
  ...props
}: YearPickerFieldProps) {
  const { locale } = useLocale()
  const [isOpen, setIsOpen] = useState(false)
  const [uncontrolled, setUncontrolled] = useState<CalendarDate | null>(defaultValue ?? null)
  const selected = value !== undefined ? (value ?? null) : uncontrolled
  const formatter = getDateTimeFormat(locale, { year: "numeric", timeZone: "UTC" })

  return (
    <Popover isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button
        aria-label={ariaLabel ?? "Year"}
        intent="outline"
        size="sm"
        isDisabled={isDisabled}
        className={cn("w-40 justify-between font-normal tabular-nums", className)}
      >
        <span className={cn(!selected && "text-quebi-fg-muted")}>
          {selected ? formatter.format(selected.toDate("UTC")) : placeholder}
        </span>
        <ChevronDown data-slot="icon" className="text-quebi-fg-muted" />
      </Button>
      <PopoverContent placement={placement} className="w-auto max-w-none p-3">
        <YearPicker
          {...props}
          autoFocus
          aria-label={ariaLabel ?? "Year"}
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
 * announces the new decade, since paging moves nothing into focus.
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

/** January 1 of `year`. */
const yearStart = (year: number) => new CalendarDate(year, 1, 1)

/** True if any day of `year` falls inside `[minValue, maxValue]`. */
function isYearAvailable(year: number, minValue?: DateValue, maxValue?: DateValue) {
  if (minValue && new CalendarDate(year, 12, 31).compare(minValue) < 0) return false
  if (maxValue && yearStart(year).compare(maxValue) > 0) return false
  return true
}

/**
 * `date` pulled inside `[minValue, maxValue]`.
 *
 * January 1 of a selectable year can still sit before a mid-year `minValue`,
 * and handing a consumer a value its own bounds reject is the kind of thing
 * that only shows up in their validation.
 */
function clamp(date: CalendarDate, minValue?: DateValue, maxValue?: DateValue) {
  if (minValue && date.compare(minValue) < 0) return toCalendarDate(minValue)
  if (maxValue && date.compare(maxValue) > 0) return toCalendarDate(maxValue)
  return date
}
