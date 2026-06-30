"use client"

import { type CalendarDate, getLocalTimeZone, today } from "@internationalized/date"
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
import { cn } from "@/lib/utils"

/**
 * Calendar — quebi design system
 *
 * An accessible month calendar built on react-aria-components and
 * @internationalized/date, with month/year selects in the header. Restyled to
 * quebi tokens: the selected day fills with brand teal, today is ringed in
 * brand teal, and days hover with a faint white wash. Foundational — Range
 * Calendar and Date Picker compose this.
 */

interface CalendarProps<T extends DateValue>
  extends Omit<CalendarPrimitiveProps<T>, "visibleDuration"> {
  className?: string
}

const Calendar = <T extends DateValue>({ className, ...props }: CalendarProps<T>) => {
  const now = today(getLocalTimeZone())

  return (
    <CalendarPrimitive data-slot="calendar" {...props}>
      <CalendarHeader />
      <CalendarGrid>
        <CalendarGridHeader />
        <CalendarGridBody>
          {(date) => (
            <CalendarCell
              date={date}
              className={composeRenderProps(className, (className, { isSelected, isDisabled }) =>
                cn(
                  "relative flex h-9 w-9 cursor-default items-center justify-center rounded-quebi-sm text-sm text-white tabular-nums outline-hidden transition-colors hover:bg-white/[0.04]",
                  isSelected &&
                    "bg-quebi-brand text-quebi-bg hover:bg-quebi-brand-hover",
                  isDisabled && "text-quebi-fg-subtle",
                  date.compare(now) === 0 &&
                    !isSelected &&
                    "ring-1 ring-inset ring-quebi-brand",
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

const CalendarHeader = ({
  className,
  ...props
}: React.ComponentProps<"header"> & { isRange?: boolean }) => {
  const { direction } = useLocale()
  return (
    <header
      data-slot="calendar-header"
      className={cn("flex w-full justify-between gap-1.5 ps-1.5 pe-1 pt-1 pb-5 sm:pb-4", className)}
      {...props}
    >
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
    </header>
  )
}

interface CalendarDropdown {
  id: number
  date: CalendarDate
  formatted: string
}

const SelectMonth = () => {
  const calendarState = use(CalendarStateContext)
  const rangeCalendarState = use(RangeCalendarStateContext)
  const state = calendarState || rangeCalendarState
  const { locale } = useLocale()
  if (!state) throw new Error("SelectMonth must be used within a Calendar or RangeCalendar")
  const formatter = new Intl.DateTimeFormat(locale, {
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
  const calendarState = use(CalendarStateContext)
  const rangeCalendarState = use(RangeCalendarStateContext)
  const state = calendarState || rangeCalendarState
  const { locale } = useLocale()
  if (!state) throw new Error("SelectYear must be used within a Calendar or RangeCalendar")
  const formatter = new Intl.DateTimeFormat(locale, {
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

export type { CalendarProps }
export { Calendar, CalendarGridHeader, CalendarHeader, SelectMonth, SelectYear }
