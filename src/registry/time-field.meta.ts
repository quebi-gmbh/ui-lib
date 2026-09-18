import type { ComponentMeta } from "./types"

export const timeFieldMeta: ComponentMeta = {
  slug: "time-field",
  name: "Time Field",
  description:
    "A segmented time input (hour, minute, second, AM/PM) with keyboard-friendly editing, built on react-aria-components. shouldForceLeadingZeros pads the hour segment to two digits where the locale would not.",
  category: "Date & time",
  tags: ["form", "input", "time", "field", "segmented", "leading-zeros"],
}
