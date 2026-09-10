import type { ComponentMeta } from "./types"

export const conformStoragePickerMeta: ComponentMeta = {
  slug: "conform-storage-picker",
  name: "Conform Storage Picker",
  description:
    "A multi-select chip group of device storage sizes wired to Conform. The selected sizes are submitted as one comma-joined value through a registered control, so they repopulate after a failed submit and reset with the form; an optional react-stately list mirrors them as removable tags.",
  category: "Forms",
  tags: ["form", "conform", "storage", "multi-select", "chips", "validation"],
}
