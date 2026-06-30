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
    title: "Disabled",
    description: "The whole calendar dims and blocks interaction.",
    render: () => <Calendar aria-label="Locked calendar" isDisabled />,
  },
]
