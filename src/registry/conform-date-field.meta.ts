import type { ComponentMeta } from "./types"

export const conformDateFieldMeta: ComponentMeta = {
  slug: "conform-date-field",
  name: "Conform Date Field",
  description:
    "The quebi DateField wired to Conform. Binds a date field's name, required, default, and validity from field metadata and renders inline errors. Every DateField display prop passes through, shouldForceLeadingZeros (two-digit day and month) included; the wire value is an ISO string either way.",
  category: "Conform",
  tags: ["form", "conform", "date", "date-field", "validation", "leading-zeros"],
}
