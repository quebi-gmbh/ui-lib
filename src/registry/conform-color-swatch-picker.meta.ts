import type { ComponentMeta } from "./types"

export const conformColorSwatchPickerMeta: ComponentMeta = {
  slug: "conform-color-swatch-picker",
  name: "Conform Color Swatch Picker",
  description:
    "A multi-select grid of color swatches wired to Conform. A real multi-select listbox, so every swatch reports its own aria-selected and the grid is navigable by keyboard; the selected keys are submitted as one comma-joined value through a registered control, so they repopulate after a failed submit and reset with the form, and an optional react-stately list mirrors them as removable tags.",
  category: "Forms",
  tags: ["form", "conform", "color", "swatch", "picker", "multi-select", "validation"],
}
