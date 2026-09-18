import { CalendarDate, getLocalTimeZone, today } from "@internationalized/date"
import { useState } from "react"
import { FormattedDate } from "@/components/formatted-date"
import { YearPicker, YearPickerField } from "@/components/year-picker"
import type { ComponentExample } from "./types"

const ControlledYear = () => {
  const [year, setYear] = useState(new CalendarDate(today(getLocalTimeZone()).year, 1, 1))

  return (
    <div className="flex flex-col gap-4">
      <YearPicker aria-label="Founded" value={year} onChange={setYear} />
      <p className="text-quebi-fg-muted text-sm tabular-nums">
        Selected: <FormattedDate date={year.toDate("UTC")} dateStyle="long" timeZone="UTC" />
      </p>
    </div>
  )
}

export const yearPickerExamples: ComponentExample[] = [
  {
    title: "Default",
    description:
      "One calendar decade per page, with the year either side dimmed in place. The current year is ringed in brand teal.",
    render: () => <YearPicker aria-label="Year" />,
  },
  {
    title: "Preselected",
    description: "defaultValue takes any date inside the year; the grid opens on its decade.",
    render: () => <YearPicker aria-label="Year" defaultValue={new CalendarDate(2019, 6, 4)} />,
  },
  {
    title: "Bounded",
    description:
      "minValue and maxValue dim the years outside the range and make them unselectable. A year is offered if any of its days is in range.",
    render: () => (
      <YearPicker
        aria-label="Contract year"
        minValue={new CalendarDate(2021, 7, 1)}
        maxValue={new CalendarDate(2028, 2, 29)}
      />
    ),
  },
  {
    title: "Controlled",
    description: "Drive the value from state; the grid follows it to the right decade.",
    render: () => <ControlledYear />,
  },
  {
    title: "Popover field",
    description:
      "The compact shape: a trigger showing the year, with the grid in a popover that closes on selection.",
    render: () => <YearPickerField aria-label="Year" defaultValue={today(getLocalTimeZone())} />,
  },
  {
    title: "Disabled",
    description: "The whole picker dims and nothing takes focus.",
    render: () => <YearPicker aria-label="Year" isDisabled />,
  },
]
