import { Time } from "@internationalized/date"
import { useState } from "react"
import type { TimeValue } from "react-aria-components"
import { Description, FieldError, Label } from "@/components/field"
import { TimeField, TimeInput } from "@/components/time-field"
import type { ComponentExample } from "./types"

export const timeFieldExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "A labelled time field with hour, minute, and AM/PM segments.",
    render: () => (
      <TimeField aria-label="Event time">
        <Label>Event time</Label>
        <TimeInput />
      </TimeField>
    ),
  },
  {
    title: "With description",
    description: "A hint rendered beneath the field.",
    render: () => (
      <TimeField defaultValue={new Time(9, 30)}>
        <Label>Start time</Label>
        <TimeInput />
        <Description>Times are shown in your local timezone.</Description>
      </TimeField>
    ),
  },
  {
    title: "States",
    description: "Disabled and invalid fields.",
    render: () => (
      <div className="flex flex-col gap-6">
        <TimeField defaultValue={new Time(14, 0)} isDisabled>
          <Label>Disabled</Label>
          <TimeInput />
        </TimeField>
        <TimeField defaultValue={new Time(23, 59)} isInvalid>
          <Label>Invalid</Label>
          <TimeInput />
          <FieldError>Choose a time during business hours.</FieldError>
        </TimeField>
      </div>
    ),
  },
  {
    title: "With seconds",
    description: "Use granularity to add a seconds segment.",
    render: () => (
      <TimeField defaultValue={new Time(10, 15, 30)} granularity="second">
        <Label>Precise time</Label>
        <TimeInput />
      </TimeField>
    ),
  },
  {
    title: "Controlled",
    render: () => {
      const ControlledExample = () => {
        const [value, setValue] = useState<TimeValue | null>(new Time(8, 0))
        return (
          <TimeField value={value} onChange={setValue}>
            <Label>Wake-up time</Label>
            <TimeInput />
            <Description>{value ? value.toString() : "No time selected"}</Description>
          </TimeField>
        )
      }
      return <ControlledExample />
    },
  },
]
