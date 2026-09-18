import { CalendarDate, getLocalTimeZone, today } from "@internationalized/date"
import { useState } from "react"
import { FormattedDate } from "@/components/formatted-date"
import { MonthPicker, MonthPickerField } from "@/components/month-picker"
import type { ComponentExample } from "./types"

const ControlledMonth = () => {
  const now = today(getLocalTimeZone())
  const [month, setMonth] = useState(new CalendarDate(now.year, now.month, 1))

  return (
    <div className="flex flex-col gap-4">
      <MonthPicker aria-label="Reporting month" value={month} onChange={setMonth} />
      <p className="text-quebi-fg-muted text-sm tabular-nums">
        Selected: <FormattedDate date={month.toDate("UTC")} dateStyle="long" timeZone="UTC" />
      </p>
    </div>
  )
}

export const monthPickerExamples: ComponentExample[] = [
  {
    title: "Default",
    description:
      "Twelve locale-formatted month names and a year stepper. The current month is ringed in brand teal.",
    render: () => <MonthPicker aria-label="Month" />,
  },
  {
    title: "Preselected",
    description: "defaultValue takes any date inside the month; the grid opens on its year.",
    render: () => <MonthPicker aria-label="Month" defaultValue={new CalendarDate(2024, 11, 17)} />,
  },
  {
    title: "Bounded",
    description:
      "minValue and maxValue dim the months outside the range. A month is offered if any of its days is in range, and the emitted value is clamped into the bounds.",
    render: () => (
      <MonthPicker
        aria-label="Billing month"
        defaultValue={new CalendarDate(2026, 6, 1)}
        minValue={new CalendarDate(2026, 3, 15)}
        maxValue={new CalendarDate(2026, 10, 20)}
      />
    ),
  },
  {
    title: "Controlled",
    description: "Drive the value from state; the grid follows it to the right year.",
    render: () => <ControlledMonth />,
  },
  {
    title: "Popover field",
    description:
      "The compact shape: a trigger showing month and year, with the grid in a popover that closes on selection.",
    render: () => <MonthPickerField aria-label="Month" defaultValue={today(getLocalTimeZone())} />,
  },
  {
    title: "Disabled",
    description: "The whole picker dims and nothing takes focus.",
    render: () => <MonthPicker aria-label="Month" isDisabled />,
  },
]
