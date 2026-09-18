import type { ComponentMeta } from "./types"

export const multipleSelectMeta: ComponentMeta = {
  slug: "multiple-select",
  name: "Multiple Select",
  description:
    "A multi-value picker over a local option list: chosen options are removable chips inline with a text input, typing filters the list, and the results open in a non-modal popover navigated with aria-activedescendant so focus never leaves the field. Clicking anywhere in the box opens it; Backspace on an empty input removes the last chip. Same control as Async Multiple Select — the only difference is who supplies the options. Styled with the quebi dark surface and brand-teal selection.",
  category: "Selection",
  tags: ["select", "multi-select", "combobox", "tags", "chips", "form", "input", "search", "interactive"],
}
