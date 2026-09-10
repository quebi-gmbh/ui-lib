import type { ComponentMeta } from "./types"

export const conformColorSwatchPickerMeta: ComponentMeta = {
  slug: "conform-color-swatch-picker",
  name: "Conform Color Swatch Picker",
  description:
    "A multi-select grid of color swatches wired to Conform. A real multi-select listbox, so every swatch reports its own aria-selected and the grid is navigable by keyboard; the selection is mirrored into a list-data binding and a hidden input, with the field name, validity and inline errors from field metadata.",
  category: "Forms",
  tags: ["form", "conform", "color", "swatch", "picker", "multi-select", "validation"],
}
