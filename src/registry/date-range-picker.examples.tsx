import { parseDate } from "@internationalized/date"
import { useState } from "react"
import type { DateValue, RangeValue } from "react-aria-components"
import { DateRangePicker, DateRangePickerTrigger } from "@/components/date-range-picker"
import { Description, FieldError, Label } from "@/components/field"
import type { ComponentExample } from "./types"

export const dateRangePickerExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "A labelled date range picker with a range-calendar overlay.",
    render: () => (
      <DateRangePicker className="max-w-sm">
        <Label>Stay dates</Label>
        <DateRangePickerTrigger />
        <Description>Pick your check-in and check-out days.</Description>
      </DateRangePicker>
    ),
  },
  {
    title: "With value",
    description: "Pre-filled via @internationalized/date.",
    render: () => (
      <DateRangePicker
        className="max-w-sm"
        defaultValue={{ start: parseDate("2026-06-30"), end: parseDate("2026-07-07") }}
      >
        <Label>Trip</Label>
        <DateRangePickerTrigger />
      </DateRangePicker>
    ),
  },
  {
    title: "Two months",
    description: "Show two months at once via visibleDuration.",
    render: () => (
      <DateRangePicker
        className="max-w-sm"
        visibleDuration={{ months: 2 }}
        defaultValue={{ start: parseDate("2026-06-30"), end: parseDate("2026-07-10") }}
      >
        <Label>Booking window</Label>
        <DateRangePickerTrigger />
      </DateRangePicker>
    ),
  },
  {
    title: "Invalid",
    description: "Validation state surfaces a red border and an error message.",
    render: () => (
      <DateRangePicker
        className="max-w-sm"
        isInvalid
        defaultValue={{ start: parseDate("2020-01-01"), end: parseDate("2020-01-05") }}
      >
        <Label>Coverage</Label>
        <DateRangePickerTrigger />
        <FieldError>Range must be in the future.</FieldError>
      </DateRangePicker>
    ),
  },
  {
    title: "Disabled",
    render: () => (
      <DateRangePicker
        className="max-w-sm"
        isDisabled
        defaultValue={{ start: parseDate("2026-06-30"), end: parseDate("2026-07-07") }}
      >
        <Label>Locked range</Label>
        <DateRangePickerTrigger />
      </DateRangePicker>
    ),
  },
  {
    title: "Controlled",
    render: () => {
      const ControlledExample = () => {
        const [value, setValue] = useState<RangeValue<DateValue> | null>({
          start: parseDate("2026-06-30"),
          end: parseDate("2026-07-07"),
        })
        return (
          <DateRangePicker className="max-w-sm" value={value} onChange={setValue}>
            <Label>Pick a range</Label>
            <DateRangePickerTrigger />
            <Description>
              {value ? `${value.start.toString()} → ${value.end.toString()}` : "No range selected"}
            </Description>
          </DateRangePicker>
        )
      }
      return <ControlledExample />
    },
  },
]
