import { CalendarDate, parseDate, toZoned } from "@internationalized/date"
import { useState } from "react"
import type { DateValue } from "react-aria-components"
import { DateField, DateInput } from "@/components/date-field"
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

export const dateFieldExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "A labelled date field with a muted hint.",
    render: () => (
      <DateField>
        <Label>Event date</Label>
        <DateInput />
        <Description>The day the event takes place.</Description>
      </DateField>
    ),
  },
  {
    title: "With value",
    description: "Pre-filled via @internationalized/date.",
    render: () => (
      <DateField defaultValue={parseDate("2026-06-30")}>
        <Label>Start date</Label>
        <DateInput />
      </DateField>
    ),
  },
  {
    title: "Invalid",
    description: "Validation state surfaces a red border and error message.",
    render: () => (
      <DateField isInvalid defaultValue={new CalendarDate(2020, 1, 1)}>
        <Label>Expiry</Label>
        <DateInput />
        <FieldError>Date must be in the future.</FieldError>
      </DateField>
    ),
  },
  {
    title: "Disabled",
    render: () => (
      <DateField isDisabled defaultValue={parseDate("2026-06-30")}>
        <Label>Locked date</Label>
        <DateInput />
      </DateField>
    ),
  },
  {
    title: "Controlled",
    render: () => {
      const ControlledExample = () => {
        const [value, setValue] = useState<DateValue | null>(parseDate("2026-06-30"))
        return (
          <DateField value={value} onChange={setValue}>
            <Label>Pick a date</Label>
            <DateInput />
            <Description>
              {value ? (
                <FormattedDate
                  date={toZoned(value, DISPLAY_TIME_ZONE).toDate()}
                  timeZone={DISPLAY_TIME_ZONE}
                  dateStyle="medium"
                />
              ) : (
                "No date selected"
              )}
            </Description>
          </DateField>
        )
      }
      return <ControlledExample />
    },
  },
]
