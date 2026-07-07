import type { ComponentMeta } from "./types"

export const asyncSelectMeta: ComponentMeta = {
  slug: "async-select",
  name: "Async Select",
  description:
    "A single-value combobox whose options are loaded from a remote source: an inline search input opens the dropdown on focus, typing re-queries the source live, and scrolling loads more. Picking an option shows its label and closes the menu; a trailing ✕ clears it. Styled with the quebi dark surface and brand-teal selection.",
  category: "Forms",
  tags: [
    "select",
    "single-select",
    "async",
    "combobox",
    "form",
    "input",
    "search",
    "pagination",
    "interactive",
  ],
}
