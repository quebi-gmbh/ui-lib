import type { ComponentMeta } from "./types"

export const monthPickerMeta: ComponentMeta = {
  slug: "month-picker",
  name: "Month Picker",
  description:
    "A grid of one year's months with a year stepper in the header, plus the popover field that wraps it. Month names are locale-formatted through the shared Intl cache, and the value is a CalendarDate on the first of the month. Gregorian unless you pass a calendar, which is how Calendar's own header keeps a thirteen-month year thirteen months long.",
  category: "Date & time",
  tags: ["calendar", "date", "month", "picker", "form", "input", "interactive"],
}
