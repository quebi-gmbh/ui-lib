import type { ComponentMeta } from "./types"

export const asyncTableMeta: ComponentMeta = {
  slug: "async-table",
  name: "Async Table",
  description:
    "A controlled, server-driven data table for async DB-based sorting and filtering. Each filterable column header opens a popover that loads its distinct values from the source (searchable, paginated on scroll) with explicit Apply/Clear, three-state sort, and active-filter chips above the table. Built on the quebi Table, Popover, and List Box.",
  category: "Display",
  tags: [
    "table",
    "data",
    "grid",
    "async",
    "server",
    "filter",
    "sort",
    "pagination",
    "search",
    "interactive",
  ],
}
