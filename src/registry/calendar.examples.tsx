import { getLocalTimeZone, today } from "@internationalized/date"
import { Calendar } from "@/components/calendar"
import type { ComponentExample } from "./types"

export const calendarExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "A month calendar with month and year selects; today is ringed in brand teal.",
    render: () => <Calendar aria-label="Event date" />,
  },
  {
    title: "Chevron steppers",
    description:
      "The stepper variant swaps the month and year dropdowns for a chevron on each side; the paging pair on the right is dropped, so the month keeps one set of controls.",
    render: () => <Calendar aria-label="Event date" variant="stepper" />,
  },
  {
    title: "Preselected date",
    description: "Set the selected day with defaultValue — it fills with brand teal.",
    render: () => (
      <Calendar aria-label="Appointment" defaultValue={today(getLocalTimeZone())} />
    ),
  },
  {
    title: "Minimum date",
    description: "Days before today are disabled and dimmed via minValue.",
    render: () => (
      <Calendar aria-label="Booking date" minValue={today(getLocalTimeZone())} />
    ),
  },
  {
    title: "Stepper within bounds",
    description:
      "The stepper chevrons respect minValue and maxValue — a step that would land outside the range disables its own button.",
    render: () => {
      const now = today(getLocalTimeZone())
      return (
        <Calendar
          aria-label="Booking date"
          variant="stepper"
          minValue={now}
          maxValue={now.add({ months: 2 })}
        />
      )
    },
  },
  {
    title: "Disabled",
    description: "The whole calendar dims and blocks interaction.",
    render: () => <Calendar aria-label="Locked calendar" isDisabled />,
  },
]
