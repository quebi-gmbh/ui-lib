import type { ComponentMeta } from "./types"

export const asyncMultipleSelectMeta: ComponentMeta = {
  slug: "async-multiple-select",
  name: "Async Multiple Select",
  description:
    "A tokenizer combobox whose options are loaded from a remote source: an inline search input opens the dropdown on focus or on a click anywhere in the box, typing re-queries the source live, and scrolling loads more. Selected options render as removable chips beside the input. Same control as Multiple Select — the only difference is who supplies the options: a remote load here, a local collection there. Styled with the quebi dark surface and brand-teal selection.",
  category: "Selection",
  tags: [
    "select",
    "multi-select",
    "async",
    "combobox",
    "tags",
    "form",
    "input",
    "search",
    "pagination",
    "interactive",
  ],
}
