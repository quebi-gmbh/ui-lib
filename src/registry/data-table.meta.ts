import type { ComponentMeta } from "./types"

export const dataTableMeta: ComponentMeta = {
  slug: "data-table",
  name: "Data Table",
  description:
    "A client-side data table over the TanStack row model, rendered through the quebi Table: sorting (three-state and multi-column), global and per-column filtering with faceted values, pagination, multi-level header bands that span their columns as one header cell, grouping with aggregates, row expansion and tree data, selection that survives paging, column resize, pinning, reordering and a saved layout, row virtualization, CSV export, and inline row editing bound through Conform and valibot. Its server-driven twin is Async Table; both speak the same column vocabulary from lib/data-table.",
  category: "Display",
  tags: [
    "table",
    "data",
    "grid",
    "sort",
    "filter",
    "pagination",
    "selection",
    "grouping",
    "virtualization",
    "export",
    "conform",
    "tanstack",
    "interactive",
  ],
}
