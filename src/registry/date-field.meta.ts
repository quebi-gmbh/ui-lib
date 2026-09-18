import type { ComponentMeta } from "./types"

export const dateFieldMeta: ComponentMeta = {
  slug: "date-field",
  name: "Date Field",
  description:
    "Accessible segmented date entry built on react-aria-components, styled with the quebi design system. Each date part is individually editable; the focused segment lights up with a brand-teal wash. Segment padding follows the locale — pass shouldForceLeadingZeros for two-digit day and month (30.06.2026 rather than de-DE's 30.6.2026).",
  category: "Date & time",
  tags: ["form", "input", "date", "datetime", "interactive", "leading-zeros"],
}
