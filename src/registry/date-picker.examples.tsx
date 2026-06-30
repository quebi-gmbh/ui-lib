import { parseDate } from "@internationalized/date"
import { useState } from "react"
import type { DateValue } from "react-aria-components"
import { DatePicker, DatePickerTrigger } from "@/components/date-picker"
import { Description, FieldError, Label } from "@/components/field"
import type { ComponentExample } from "./types"

export const datePickerExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "A labelled date picker with a calendar overlay.",
    render: () => (
      <DatePicker className="max-w-xs">
        <Label>Event date</Label>
        <DatePickerTrigger />
        <Description>Pick the day the event takes place.</Description>
      </DatePicker>
    ),
  },
  {
    title: "With value",
    description: "Pre-filled via @internationalized/date.",
    render: () => (
      <DatePicker className="max-w-xs" defaultValue={parseDate("2026-06-30")}>
        <Label>Start date</Label>
        <DatePickerTrigger />
      </DatePicker>
    ),
  },
  {
    title: "Invalid",
    description: "Validation state surfaces a red border and an error message.",
    render: () => (
      <DatePicker className="max-w-xs" isInvalid defaultValue={parseDate("2020-01-01")}>
        <Label>Expiry</Label>
        <DatePickerTrigger />
        <FieldError>Date must be in the future.</FieldError>
      </DatePicker>
    ),
  },
  {
    title: "Disabled",
    render: () => (
      <DatePicker className="max-w-xs" isDisabled defaultValue={parseDate("2026-06-30")}>
        <Label>Locked date</Label>
        <DatePickerTrigger />
      </DatePicker>
    ),
  },
  {
    title: "Controlled",
    render: () => {
      const ControlledExample = () => {
        const [value, setValue] = useState<DateValue | null>(parseDate("2026-06-30"))
        return (
          <DatePicker className="max-w-xs" value={value} onChange={setValue}>
            <Label>Pick a date</Label>
            <DatePickerTrigger />
            <Description>{value ? value.toString() : "No date selected"}</Description>
          </DatePicker>
        )
      }
      return <ControlledExample />
    },
  },
]
