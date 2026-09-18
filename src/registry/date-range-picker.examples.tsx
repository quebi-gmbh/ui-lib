import { parseDate, toZoned } from "@internationalized/date"
import { useState } from "react"
import type { DateValue, RangeValue } from "react-aria-components"
import { DateRangePicker, DateRangePickerTrigger } from "@/components/date-range-picker"
import { Description, FieldError, Label } from "@/components/field"
import { FormattedDate } from "@/components/formatted-date"
import type { ComponentExample } from "./types"

/**
 * A `CalendarDate` has no time of day and no time zone, so rendering one
 * through `Intl` means choosing both. `toString()` dodges the choice by
 * emitting the ISO 8601 wire format — which is what the reader sees sitting a
 * few pixels under a trigger that spells the same day `30.6.2026`.
 *
 * `FormattedDate` is the library's answer, and it formats in `Europe/Berlin`
 * unless told otherwise. So the date has to be *anchored* in that same zone:
 * `toZoned(value, getLocalTimeZone())` would build the instant in the viewer's
 * zone, and for a viewer west of Berlin that instant lands on the previous
 * Berlin day — the description would then disagree with the segments by one.
 * One constant, used on both sides, is what keeps them in step.
 */
const DISPLAY_TIME_ZONE = "Europe/Berlin"

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
    title: "Two digits",
    description:
      "shouldForceLeadingZeros pads the day and month segments of both inputs to two digits (30.06.2026 rather than the 30.6.2026 de-DE asks for).",
    render: () => (
      <DateRangePicker
        className="max-w-sm"
        defaultValue={{ start: parseDate("2026-06-30"), end: parseDate("2026-07-07") }}
        shouldForceLeadingZeros
      >
        <Label>Trip</Label>
        <DateRangePickerTrigger />
        <Description>Padded regardless of what the locale would do.</Description>
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
              {value ? (
                <>
                  <FormattedDate
                    date={toZoned(value.start, DISPLAY_TIME_ZONE).toDate()}
                    timeZone={DISPLAY_TIME_ZONE}
                    dateStyle="medium"
                  />
                  {" → "}
                  <FormattedDate
                    date={toZoned(value.end, DISPLAY_TIME_ZONE).toDate()}
                    timeZone={DISPLAY_TIME_ZONE}
                    dateStyle="medium"
                  />
                </>
              ) : (
                "No range selected"
              )}
            </Description>
          </DateRangePicker>
        )
      }
      return <ControlledExample />
    },
  },
]
