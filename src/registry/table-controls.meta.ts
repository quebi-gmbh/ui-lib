import type { ComponentMeta } from "./types"

export const tableControlsMeta: ComponentMeta = {
  slug: "table-controls",
  name: "Table Controls",
  description:
    "Everything that sits around a table and is not the table: a toolbar, a debounced search field, a column chooser, a density menu, removable filter chips with saved presets, a per-column filter panel covering all five variants, a pager, a bulk-action bar that can mean \"every row matching the query\", and a row editor. Each is controlled — a value and a callback, no query of its own — which is what lets Data Table and Server Table share them. The forms are real Conform forms over valibot schemas, so a page jump past the last page and an inverted number range are field errors rather than queries that return nothing.",
  category: "Display",
  tags: [
    "table",
    "toolbar",
    "filter",
    "pagination",
    "pager",
    "search",
    "conform",
    "chrome",
    "interactive",
  ],
}
