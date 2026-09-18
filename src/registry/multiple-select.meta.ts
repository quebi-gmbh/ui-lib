import type { ComponentMeta } from "./types"

export const multipleSelectMeta: ComponentMeta = {
  slug: "multiple-select",
  name: "Multiple Select",
  description:
    "A multi-value picker that renders chosen options as removable tags and opens a searchable list-box popover to add more. The whole control box is the trigger — click it, tab into it, or press ArrowDown/Enter/Space on it — and the + button is the affordance beside the tags. Composes Tag Group, Popover, Search Field, and List Box, styled with the quebi dark surface and brand-teal selection.",
  category: "Selection",
  tags: ["select", "multi-select", "combobox", "tags", "form", "input", "search", "interactive"],
}
