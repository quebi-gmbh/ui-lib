"use client"

import {
  type CalendarDate,
  getLocalTimeZone,
  maxDate,
  minDate,
  toCalendarDate,
  today,
} from "@internationalized/date"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { use } from "react"
import {
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader as CalendarGridHeaderPrimitive,
  CalendarHeaderCell,
  Calendar as CalendarPrimitive,
  type CalendarProps as CalendarPrimitiveProps,
  CalendarStateContext,
  composeRenderProps,
  type DateValue,
  Heading,
  RangeCalendarStateContext,
  useLocale,
} from "react-aria-components"
import { Button } from "@/components/button"
import { Select, SelectContent, SelectItem, SelectLabel, SelectTrigger } from "@/components/select"
import { getDateTimeFormat } from "@/lib/intl"
import { cn } from "@/lib/utils"

/**
 * Calendar — quebi design system
 *
 * An accessible month calendar built on react-aria-components and
 * @internationalized/date, with a choice of header: `variant="select"` (the
 * default) picks the month and year from dropdowns, `variant="stepper"` walks
 * them with a chevron on each side. Restyled to quebi tokens: the selected day
 * fills with brand teal, today is ringed in brand teal, and days hover with a
 * faint white wash. Foundational — Range Calendar and Date Picker compose this.
 */

/**
 * Which header the calendar draws.
 *
 * - `select` — month and year dropdowns on the left, one prev/next pair on the
 *   right that pages the visible range.
 * - `stepper` — `‹ Sep ›` and `‹ 2026 ›`. The paging pair is dropped, or the
 *   month would carry two sets of chevrons meaning slightly different things.
 */
type CalendarHeaderVariant = "select" | "stepper"

interface CalendarProps<T extends DateValue>
  extends Omit<CalendarPrimitiveProps<T>, "visibleDuration"> {
  className?: string
  /** Header treatment — dropdowns (default) or chevron steppers. */
  variant?: CalendarHeaderVariant
}

const Calendar = <T extends DateValue>({ className, variant, ...props }: CalendarProps<T>) => {
  const now = today(getLocalTimeZone())

  return (
    <CalendarPrimitive data-slot="calendar" {...props}>
      <CalendarHeader variant={variant} />
      <CalendarGrid>
        <CalendarGridHeader />
        <CalendarGridBody>
          {(date) => (
            <CalendarCell
              date={date}
              className={composeRenderProps(className, (className, { isSelected, isDisabled }) =>
                cn(
                  "relative flex h-9 w-9 cursor-default items-center justify-center rounded-quebi-sm text-sm text-quebi-fg tabular-nums outline-hidden transition-colors hover:bg-quebi-surface/[0.04]",
                  isSelected &&
                    "bg-quebi-brand text-quebi-on-brand hover:bg-quebi-brand-hover",
                  isDisabled && "text-quebi-fg-subtle",
                  date.compare(now) === 0 &&
                    !isSelected &&
                    "ring-1 ring-inset ring-quebi-brand-mark",
                  className,
                ),
              )}
            />
          )}
        </CalendarGridBody>
      </CalendarGrid>
    </CalendarPrimitive>
  )
}

interface CalendarHeaderProps extends React.ComponentProps<"header"> {
  /** Header treatment — dropdowns (default) or chevron steppers. */
  variant?: CalendarHeaderVariant
}

const CalendarHeader = ({ className, variant = "select", ...props }: CalendarHeaderProps) => {
  const { direction } = useLocale()
  return (
    <header
      data-slot="calendar-header"
      data-variant={variant}
      className={cn("flex w-full justify-between gap-1.5 ps-1.5 pe-1 pt-1 pb-5 sm:pb-4", className)}
      {...props}
    >
      {variant === "stepper" ? (
        <>
          <StepMonth />
          <Heading className="sr-only" />
          <StepYear />
        </>
      ) : (
        <>
          <div className="flex items-center gap-1.5">
            <SelectMonth />
            <SelectYear />
          </div>
          <Heading className="sr-only" />
          <div className="flex items-center gap-1">
            <Button
              size="sq-sm"
              className="size-8 sm:size-7 **:data-[slot=icon]:text-quebi-fg-muted"
              isCircle
              intent="ghost"
              slot="previous"
            >
              {direction === "rtl" ? (
                <ChevronRight data-slot="icon" />
              ) : (
                <ChevronLeft data-slot="icon" />
              )}
            </Button>
            <Button
              size="sq-sm"
              className="size-8 sm:size-7 **:data-[slot=icon]:text-quebi-fg-muted"
              isCircle
              intent="ghost"
              slot="next"
            >
              {direction === "rtl" ? (
                <ChevronLeft data-slot="icon" />
              ) : (
                <ChevronRight data-slot="icon" />
              )}
            </Button>
          </div>
        </>
      )}
    </header>
  )
}

/**
 * The Calendar or RangeCalendar state above this header, whichever is there.
 * Both contexts are read unconditionally — one of them is always null, and a
 * hook cannot be skipped — so the throw names the component that asked.
 */
const useCalendarHeaderState = (component: string) => {
  const calendarState = use(CalendarStateContext)
  const rangeCalendarState = use(RangeCalendarStateContext)
  const state = calendarState || rangeCalendarState
  if (!state) throw new Error(`${component} must be used within a Calendar or RangeCalendar`)
  return state
}

interface CalendarDropdown {
  id: number
  date: CalendarDate
  formatted: string
}

const SelectMonth = () => {
  const state = useCalendarHeaderState("SelectMonth")
  const { locale } = useLocale()
  const formatter = getDateTimeFormat(locale, {
    month: "short",
    timeZone: state.timeZone,
  })

  const months: CalendarDropdown[] = []
  const numMonths = state.focusedDate.calendar.getMonthsInYear(state.focusedDate)
  for (let i = 1; i <= numMonths; i++) {
    const date = state.focusedDate.set({ month: i })
    months.push({
      id: i,
      date,
      formatted: formatter.format(date.toDate(state.timeZone)),
    })
  }

  return (
    <Select
      className="[popover-width:8rem]"
      aria-label="Month"
      style={{ flex: 1, width: "fit-content" }}
      selectedKey={state.focusedDate.month}
      onSelectionChange={(key) => {
        if (typeof key === "number") {
          state.setFocusedDate(months[key - 1].date)
        }
      }}
    >
      <SelectTrigger className="w-22 text-sm/5 **:data-[slot=select-value]:inline-block **:data-[slot=select-value]:truncate sm:px-2.5 sm:py-1.5 sm:*:text-sm/5" />
      <SelectContent className="min-w-0" items={months}>
        {(item) => (
          <SelectItem id={item.id}>
            <SelectLabel>{item.formatted}</SelectLabel>
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  )
}

const SelectYear = () => {
  const state = useCalendarHeaderState("SelectYear")
  const { locale } = useLocale()
  const formatter = getDateTimeFormat(locale, {
    year: "numeric",
    timeZone: state.timeZone,
  })

  const years: CalendarDropdown[] = []
  for (let i = -20; i <= 20; i++) {
    const date = state.focusedDate.add({ years: i })
    years.push({
      id: years.length,
      date,
      formatted: formatter.format(date.toDate(state.timeZone)),
    })
  }
  return (
    <Select
      aria-label="Year"
      selectedKey={20}
      onSelectionChange={(key) => {
        if (typeof key === "number") {
          state.setFocusedDate(years[key].date)
        }
      }}
    >
      <SelectTrigger className="text-sm/5 sm:px-2.5 sm:py-1.5 sm:*:text-sm/5" />
      <SelectContent items={years}>
        {(item) => (
          <SelectItem id={item.id}>
            <SelectLabel>{item.formatted}</SelectLabel>
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  )
}

/**
 * The date a focus move to `date` would actually land on.
 *
 * react-aria clamps every focus move to `minValue`/`maxValue`, so a step past
 * the bound snaps back and nothing on screen changes. Asking the same question
 * up front is what lets the chevron disable itself instead — the hand-rolled
 * equivalent of the `isPreviousVisibleRangeInvalid` that the `slot="previous"`
 * button gets for free.
 */
const constrain = (
  date: CalendarDate,
  minValue?: DateValue | null,
  maxValue?: DateValue | null,
): CalendarDate => {
  let constrained = date
  if (minValue) constrained = maxDate(constrained, toCalendarDate(minValue)) ?? constrained
  if (maxValue) constrained = minDate(constrained, toCalendarDate(maxValue)) ?? constrained
  return constrained
}

/** A stepper walks one of these, and its buttons say which. */
type CalendarStepperUnit = "month" | "year"

/**
 * Do `a` and `b` fall in the same month (or the same year)? `era` is part of
 * the answer: in an era calendar `year` counts from the start of the era, so
 * two different years can both be year 1.
 */
const isSameUnit = (unit: CalendarStepperUnit, a: CalendarDate, b: CalendarDate) =>
  a.era === b.era && a.year === b.year && (unit === "year" || a.month === b.month)

interface CalendarStepperProps {
  /** Which unit a press moves, and the word the button labels use. */
  unit: CalendarStepperUnit
  /** The formatted month or year sitting between the two chevrons. */
  label: string
  /** Minimum width for the label, so a step does not resize the header. */
  labelClassName?: string
}

/**
 * `‹ label ›` — one ghost chevron on each side of a month or year, styled as
 * the header's own prev/next pair. The icons swap under RTL so "previous" stays
 * on the leading edge.
 *
 * A chevron is disabled when the step it offers would not leave the current
 * month (or year): `constrain` clamps the move to the bounds first, so at
 * `maxValue` "next month" would land back inside the month on screen — a live
 * control that does nothing, which is exactly what `isNextVisibleRangeInvalid`
 * spares the paging pair. Asking per unit rather than per date matters at a
 * bound *inside* a month: with `maxValue` ten days out, "next month" still
 * moves focus, just not out of June.
 */
const CalendarStepper = ({ unit, label, labelClassName }: CalendarStepperProps) => {
  const state = useCalendarHeaderState("CalendarStepper")
  const { direction } = useLocale()
  const step = (delta: number) =>
    constrain(
      state.focusedDate.add(unit === "year" ? { years: delta } : { months: delta }),
      state.minValue,
      state.maxValue,
    )
  const previous = step(-1)
  const next = step(1)
  const buttonClassName = "size-8 sm:size-7 **:data-[slot=icon]:text-quebi-fg-muted"

  return (
    <div className="flex items-center gap-0.5">
      {/*
        A Button under a Calendar reads react-aria's ButtonContext, which is a
        slot map — `previous` and `next`, the paging pair. Without a `slot` it
        throws ("A slot prop is required"), and with either of those names it
        would page the visible range instead of running `onPress`. `slot={null}`
        opts out of the context: this is an ordinary button that happens to live
        in the header.
      */}
      <Button
        size="sq-sm"
        className={buttonClassName}
        isCircle
        intent="ghost"
        slot={null}
        aria-label={`Previous ${unit}`}
        isDisabled={state.isDisabled || isSameUnit(unit, previous, state.focusedDate)}
        onPress={() => state.setFocusedDate(previous)}
      >
        {direction === "rtl" ? (
          <ChevronRight data-slot="icon" />
        ) : (
          <ChevronLeft data-slot="icon" />
        )}
      </Button>
      <span
        className={cn(
          "select-none px-0.5 text-center text-quebi-fg text-sm/5 tabular-nums",
          labelClassName,
        )}
      >
        {label}
      </span>
      <Button
        size="sq-sm"
        className={buttonClassName}
        isCircle
        intent="ghost"
        slot={null}
        aria-label={`Next ${unit}`}
        isDisabled={state.isDisabled || isSameUnit(unit, next, state.focusedDate)}
        onPress={() => state.setFocusedDate(next)}
      >
        {direction === "rtl" ? (
          <ChevronLeft data-slot="icon" />
        ) : (
          <ChevronRight data-slot="icon" />
        )}
      </Button>
    </div>
  )
}

const StepMonth = () => {
  const state = useCalendarHeaderState("StepMonth")
  const { locale } = useLocale()
  const formatter = getDateTimeFormat(locale, {
    month: "short",
    timeZone: state.timeZone,
  })

  return (
    <CalendarStepper
      unit="month"
      label={formatter.format(state.focusedDate.toDate(state.timeZone))}
      labelClassName="min-w-11"
    />
  )
}

const StepYear = () => {
  const state = useCalendarHeaderState("StepYear")
  const { locale } = useLocale()
  const formatter = getDateTimeFormat(locale, {
    year: "numeric",
    timeZone: state.timeZone,
  })

  return (
    <CalendarStepper
      unit="year"
      label={formatter.format(state.focusedDate.toDate(state.timeZone))}
      labelClassName="min-w-11"
    />
  )
}

const CalendarGridHeader = () => {
  return (
    <CalendarGridHeaderPrimitive>
      {(day) => (
        <CalendarHeaderCell className="w-9 pb-2 text-center font-semibold text-[11px] text-quebi-fg-muted uppercase tracking-[0.08em]">
          {day}
        </CalendarHeaderCell>
      )}
    </CalendarGridHeaderPrimitive>
  )
}

export type { CalendarHeaderProps, CalendarHeaderVariant, CalendarProps }
export {
  Calendar,
  CalendarGridHeader,
  CalendarHeader,
  SelectMonth,
  SelectYear,
  StepMonth,
  StepYear,
}
