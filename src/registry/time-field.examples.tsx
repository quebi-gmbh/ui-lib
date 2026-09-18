import { CalendarDate, Time, toCalendarDateTime, toZoned } from "@internationalized/date"
import { useState } from "react"
import type { TimeValue } from "react-aria-components"
import { Description, FieldError, Label } from "@/components/field"
import { FormattedDate } from "@/components/formatted-date"
import { TimeField, TimeInput } from "@/components/time-field"
import type { ComponentExample } from "./types"

/**
 * A `Time` is hours and minutes and nothing else — no day, no zone — so there
 * is no instant for `Intl` to format until one is invented. `toString()` avoids
 * inventing it by emitting the ISO wire format, `08:00:00`, under a field whose
 * segments read `08:00`.
 *
 * The anchor is arbitrary and deliberately fixed: with `timeStyle` alone, only
 * the clock face is rendered, so the day cancels out — but it has to be a day
 * that does not move between the prerender and the browser, which `today()`
 * would not be. Anchor and format in the same zone, or a DST-shifted instant
 * comes back out an hour off.
 */
const DISPLAY_TIME_ZONE = "Europe/Berlin"
const TIME_ANCHOR = new CalendarDate(2026, 1, 1)

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
            <Description>
              {value ? (
                <FormattedDate
                  date={toZoned(toCalendarDateTime(TIME_ANCHOR, value), DISPLAY_TIME_ZONE).toDate()}
                  timeZone={DISPLAY_TIME_ZONE}
                  timeStyle="short"
                />
              ) : (
                "No time selected"
              )}
            </Description>
          </TimeField>
        )
      }
      return <ControlledExample />
    },
  },
]
