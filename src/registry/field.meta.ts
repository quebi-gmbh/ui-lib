import type { ComponentMeta } from "./types"

export const fieldMeta: ComponentMeta = {
  slug: "field",
  name: "Field",
  description:
    "Accessible form field primitives built on react-aria-components, styled with the quebi design system. Includes Label, Description, FieldError, plus Field, FieldRow, FieldGroup, Fieldset and Legend wrappers. Field owns the label → control → hint stack every field in the library uses; FieldRow puts fields side by side on one subgrid so their labels, controls and hints share three baselines and a field going invalid cannot push the page down; FieldGroup stacks fields and rows down a form.",
  category: "Inputs",
  tags: ["form", "label", "field", "description", "error", "fieldset", "layout", "subgrid"],
}
