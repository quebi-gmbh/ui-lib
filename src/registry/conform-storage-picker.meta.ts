import type { ComponentMeta } from "./types"

export const conformStoragePickerMeta: ComponentMeta = {
  slug: "conform-storage-picker",
  name: "Conform Storage Picker",
  description:
    "A multi-select chip group of device storage sizes wired to Conform. Selected sizes are tracked in a react-stately list and mirrored into a hidden input for submission, with validity derived from the field metadata.",
  category: "Forms",
  tags: ["form", "conform", "storage", "multi-select", "chips", "validation"],
}
