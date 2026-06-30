"use client"

import type { DateDuration } from "@internationalized/date"
import { CalendarDays } from "lucide-react"
import { useEffect, useState } from "react"
import type {
  DatePickerProps as DatePickerPrimitiveProps,
  DateValue,
  GroupProps,
  PopoverProps,
} from "react-aria-components"
import { Button, DatePicker as DatePickerPrimitive, Group } from "react-aria-components"
import { Calendar } from "@/components/calendar"
import { DateInput } from "@/components/date-field"
import { ModalContent } from "@/components/modal"
import { PopoverContent } from "@/components/popover"
import { RangeCalendar } from "@/components/range-calendar"
import { cn } from "@/lib/utils"

/**
 * Date Picker — quebi design system
 *
 * A segmented date input paired with a calendar overlay. The trigger uses the
 * quebi input chrome (translucent fill, cyan-tinted border, brand-teal focus
 * ring) with a calendar-icon button on the right; clicking it opens a Popover
 * holding the Calendar (or a Modal on mobile). Composes
 * @/components/{calendar,range-calendar,modal,popover,date-field}. Foundational
 * — the Conform date-picker / date-range-picker variants depend on it.
 */

const MOBILE_BREAKPOINT = 768

/** Inlined use-mobile hook: tracks whether the viewport is below md. */
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}

export interface DatePickerProps<T extends DateValue> extends DatePickerPrimitiveProps<T> {
  popover?: Omit<PopoverProps, "children">
}

export function DatePicker<T extends DateValue>({
  className,
  children,
  popover,
  ...props
}: DatePickerProps<T>) {
  return (
    <DatePickerPrimitive
      data-slot="control"
      className={cn("group flex w-full flex-col gap-1.5", className)}
      {...props}
    >
      {(values) => (
        <>
          {typeof children === "function" ? children(values) : children}
          <DatePickerOverlay {...popover} />
        </>
      )}
    </DatePickerPrimitive>
  )
}

export interface DatePickerOverlayProps extends Omit<PopoverProps, "children"> {
  range?: boolean
  visibleDuration?: DateDuration
  pageBehavior?: "visible" | "single"
}

export function DatePickerOverlay({
  visibleDuration = { months: 1 },
  pageBehavior = "visible",
  placement = "bottom",
  range,
  ...props
}: DatePickerOverlayProps) {
  const isMobile = useIsMobile()

  return isMobile ? (
    <ModalContent aria-label="Date picker" closeButton={false}>
      <div className="flex justify-center p-6">
        {range ? (
          <RangeCalendar pageBehavior={pageBehavior} visibleDuration={visibleDuration} />
        ) : (
          <Calendar />
        )}
      </div>
    </ModalContent>
  ) : (
    <PopoverContent
      placement={placement}
      arrow={false}
      // min/max sized for a 7×36px grid plus gutter — the calendar fits without
      // overflow.
      className={cn(
        "flex justify-center p-3",
        visibleDuration?.months === 1 ? "w-[304px] max-w-[304px]" : "max-w-none",
      )}
      {...props}
    >
      {range ? (
        <RangeCalendar pageBehavior={pageBehavior} visibleDuration={visibleDuration} />
      ) : (
        <Calendar />
      )}
    </PopoverContent>
  )
}

/**
 * DatePickerTrigger — quebi design system
 *
 * DateInput on the left + calendar-icon button on the right, styled as one
 * unified control (shared cyan-tinted border, brand-teal focus ring). The
 * wrapper owns the outer border/ring; the inner DateInput is rendered `bare`
 * so it drops its own border + ring + rounding.
 */
export function DatePickerTrigger({ className, ...props }: GroupProps) {
  return (
    <Group
      data-slot="control"
      className={cn(
        "group/dpt flex w-full items-stretch overflow-hidden rounded-quebi-sm border border-cyan-500/20 bg-white/[0.02]",
        "transition-[border-color,box-shadow] duration-200",
        "hover:border-cyan-500/40",
        "focus-within:border-quebi-brand focus-within:ring-2 focus-within:ring-quebi-brand/50",
        className,
      )}
      {...props}
    >
      <div className="flex-1">
        <DateInput bare />
      </div>
      <Button
        data-slot="date-picker-trigger"
        className={cn(
          "inline-flex cursor-pointer items-center border-cyan-500/20 border-l bg-white/[0.02] px-3 text-quebi-fg-muted",
          "transition-[border-color,color] duration-200",
          "group-hover/dpt:border-cyan-500/40 hover:text-white",
          "group-focus-within/dpt:border-quebi-brand",
          "outline-none focus-visible:outline-none",
        )}
      >
        <CalendarDays data-slot="icon" className="size-4" />
      </Button>
    </Group>
  )
}
