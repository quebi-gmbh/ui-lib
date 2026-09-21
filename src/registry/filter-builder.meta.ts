import type { ComponentMeta } from "./types"

export const filterBuilderMeta: ComponentMeta = {
  slug: "filter-builder",
  name: "Filter Builder",
  description:
    "Where [Field] [operator] [Value], one row per condition — the only filter surface that reads as a query rather than as a toolbar, and the only one that can express negation or two conditions on one field. A pill bar or a faceted rail draws one control per field, so a field-keyed map says everything they can; a condition list says the rest. Each row is a field Select, an operator Select scoped to that field's variant (enum: is / is not; text: contains / does not contain / is / starts with; number and date: between / not between), and a value button opening the same FilterPanel every other filter surface uses. A condition with no value yet is inert, and the row says so in words instead of looking applied. The rows share grid tracks so the columns line up as a property rather than by hardcoded widths, and each row becomes its own bordered card below 42rem of container width. Controlled, over FilterField and FilterCondition from lib/data-table — the same list ServerTable reports through onQueryChange and queryToSearchParams writes into a URL.",
  category: "Display",
  tags: ["filter", "condition", "query", "operator", "segment", "saved-view", "interactive"],
}
