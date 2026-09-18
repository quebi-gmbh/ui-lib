import type { ComponentMeta } from "./types"

export const datePickerMeta: ComponentMeta = {
  slug: "date-picker",
  name: "Date Picker",
  description:
    "A segmented date input paired with a calendar overlay, built on react-aria-components and styled with the quebi design system. The trigger uses the quebi input chrome with a calendar-icon button; a popover (or modal on mobile) holds the calendar. The trigger's segments format like DateField's — pass shouldForceLeadingZeros for two-digit day and month.",
  category: "Date & time",
  tags: ["form", "input", "date", "datetime", "calendar", "popover", "interactive", "leading-zeros"],
}
