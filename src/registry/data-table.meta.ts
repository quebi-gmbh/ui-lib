import type { ComponentMeta } from "./types"

export const dataTableMeta: ComponentMeta = {
  slug: "data-table",
  name: "Data Table",
  description:
    "A client-side data table over the TanStack row model: the consumer holds every row and the model does the work — sorting (three-state and multi-column), global and per-column filtering with faceted values, pagination, grouping with aggregates, row expansion and tree data, selection that survives paging, column resize, pinning, reordering and a saved layout, row virtualization, CSV export of what it actually holds, and editing bound through Conform and valibot — a whole row in a spanning panel, or one cell in place, where the control is whichever conform-* variant the column names and the keyboard is a data table's (Enter, F2 or typing opens a cell, Tab commits and moves to the next editable one, Escape restores it). Rows and chrome come from Table Shell and Table Controls; its server-driven twin, Server Table, is assembled from the same two. Which of the two you want is a question about where the rows come from, not how many there are.",
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
    "editing",
    "tanstack",
    "interactive",
  ],
}
