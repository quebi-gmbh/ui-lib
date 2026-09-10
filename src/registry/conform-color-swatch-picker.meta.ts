import type { ComponentMeta } from "./types"

export const conformColorSwatchPickerMeta: ComponentMeta = {
  slug: "conform-color-swatch-picker",
  name: "Conform Color Swatch Picker",
  description:
    "The quebi ColorSwatchPicker wired to Conform for multi-select. The selected keys are submitted as one comma-joined value through a registered control, so they repopulate after a failed submit and reset with the form; an optional react-stately list mirrors them as removable tags.",
  category: "Forms",
  tags: ["form", "conform", "color", "swatch", "picker", "multi-select", "validation"],
}
