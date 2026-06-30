"use client"

import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid"
import { type CalendarDate, getLocalTimeZone, today } from "@internationalized/date"
import { useDateFormatter } from "@react-aria/i18n"
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
import { twMerge } from "tailwind-merge"
import { Button } from "./button"
import { Select, SelectContent, SelectItem, SelectLabel, SelectTrigger } from "./select"

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
                twMerge(
                  // Cellestial DS — 36×36 cell, body-s text, ink-800, rounded-xs
                  // (4px). Arbitrary sizes because our @theme overrode s-11/s-9
                  // to 80/48px.
                  "relative flex w-[36px] h-[36px] cursor-default items-center justify-center rounded-xs text-[14px] text-ink-800 tabular-nums outline-hidden hover:bg-ink-50",
                  isSelected && "bg-brand-500 text-white! hover:bg-brand-600",
                  isDisabled && "text-ink-300",
                  date.compare(now) === 0 &&
                    "after:pointer-events-none after:absolute after:start-1/2 after:bottom-1 after:z-10 after:size-[4px] after:-translate-x-1/2 after:rounded-full after:bg-brand-500 selected:after:bg-white",
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
  isRange,
  className,
  ...props
}: React.ComponentProps<"header"> & { isRange?: boolean }) => {
  const { direction } = useLocale()
  return (
    <header
      data-slot="calendar-header"
      className={twMerge(
        "flex w-full justify-between gap-1.5 ps-1.5 pe-1 pt-1 pb-5 sm:pb-4",
        className,
      )}
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
          className="size-8 **:data-[slot=icon]:text-fg sm:size-7"
          isCircle
          intent="plain"
          slot="previous"
        >
          {direction === "rtl" ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </Button>
        <Button
          size="sq-sm"
          className="size-8 **:data-[slot=icon]:text-fg sm:size-7"
          isCircle
          intent="plain"
          slot="next"
        >
          {direction === "rtl" ? <ChevronLeftIcon /> : <ChevronRightIcon />}
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
  if (!state) throw new Error("SelectMonth must be used within a Calendar or RangeCalendar")
  const formatter = useDateFormatter({
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
      value={state.focusedDate.month}
      onChange={(key) => {
        if (typeof key === "number") {
          state.setFocusedDate(months[key - 1].date)
        }
      }}
    >
      <SelectTrigger className="w-22 text-sm/5 **:data-[slot=select-value]:inline-block **:data-[slot=select-value]:truncate sm:px-2.5 sm:py-1.5 sm:*:text-sm/5" />
      <SelectContent className="min-w-0" items={months}>
        {(item) => (
          <SelectItem>
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
  if (!state) throw new Error("SelectYear must be used within a Calendar or RangeCalendar")
  const formatter = useDateFormatter({
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
      value={20}
      onChange={(key) => {
        if (typeof key === "number") {
          state.setFocusedDate(years[key].date)
        }
      }}
    >
      <SelectTrigger className="text-sm/5 sm:px-2.5 sm:py-1.5 sm:*:text-sm/5" />
      <SelectContent items={years}>
        {(item) => (
          <SelectItem>
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
        <CalendarHeaderCell className="pb-2 w-[36px] text-center font-semibold text-ink-500 text-[11px] uppercase tracking-[0.08em]">
          {day}
        </CalendarHeaderCell>
      )}
    </CalendarGridHeaderPrimitive>
  )
}

export type { CalendarProps }
export { Calendar, CalendarGridHeader, CalendarHeader, SelectMonth, SelectYear }
