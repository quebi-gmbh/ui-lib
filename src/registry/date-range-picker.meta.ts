import type { ComponentMeta } from "./types"

export const dateRangePickerMeta: ComponentMeta = {
  slug: "date-range-picker",
  name: "Date Range Picker",
  description:
    "Two segmented date inputs (start → end) paired with a range-calendar overlay, built on react-aria-components and styled with the quebi design system. The trigger uses the quebi input chrome with a calendar-icon button; a popover (or modal on mobile) holds the range calendar. One shouldForceLeadingZeros pads the day and month of both inputs to two digits.",
  category: "Date & time",
  tags: [
    "form",
    "input",
    "date",
    "daterange",
    "range",
    "calendar",
    "popover",
    "interactive",
    "leading-zeros",
  ],
}
