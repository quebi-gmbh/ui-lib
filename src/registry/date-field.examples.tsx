import { CalendarDate, parseDate } from "@internationalized/date"
import { useState } from "react"
import type { DateValue } from "react-aria-components"
import { DateField, DateInput } from "@/components/date-field"
import { Description, FieldError, Label } from "@/components/field"
import type { ComponentExample } from "./types"

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
            <Description>{value ? value.toString() : "No date selected"}</Description>
          </DateField>
        )
      }
      return <ControlledExample />
    },
  },
]
