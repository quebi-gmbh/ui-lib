import { getLocalTimeZone, today } from "@internationalized/date"
import { RangeCalendar } from "@/components/range-calendar"
import type { ComponentExample } from "./types"

export const rangeCalendarExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "Pick a start and end date; the endpoints fill with brand teal.",
    render: () => <RangeCalendar aria-label="Trip dates" />,
  },
  {
    title: "Preselected range",
    description:
      "Set the range with defaultValue — the days in-between get a faint brand wash.",
    render: () => {
      const start = today(getLocalTimeZone())
      return (
        <RangeCalendar
          aria-label="Stay"
          defaultValue={{ start, end: start.add({ days: 5 }) }}
        />
      )
    },
  },
  {
    title: "Two months",
    description: "Show two months side by side with visibleDuration.",
    render: () => <RangeCalendar aria-label="Booking range" visibleDuration={{ months: 2 }} />,
  },
  {
    title: "Minimum date",
    description: "Days before today are disabled and dimmed via minValue.",
    render: () => (
      <RangeCalendar aria-label="Reservation" minValue={today(getLocalTimeZone())} />
    ),
  },
  {
    title: "Disabled",
    description: "The whole calendar dims and blocks interaction.",
    render: () => <RangeCalendar aria-label="Locked range" isDisabled />,
  },
]
