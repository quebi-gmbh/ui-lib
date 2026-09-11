import type { ComponentMeta } from "./types"

export const serverTableMeta: ComponentMeta = {
  slug: "server-table",
  name: "Server Table",
  description:
    "A controlled, server-driven data table: every sort, filter, search and page change is reported as one DataTableQuery through a single onQueryChange callback, so exactly one round-trip runs per change. Offset, cursor and load-more pagination with an honest pager when the total is too expensive to count; filter popovers that load a column's distinct values from the source (searchable, paged on scroll); select-all-matching with an exclusion set; and a deterministic sort tiebreaker so pagination cannot repeat or drop rows. It is assembled from Table Shell and Table Controls — the same two halves Data Table is built from — and depends on neither Data Table nor the client row model it would never run.",
  category: "Display",
  tags: [
    "table",
    "data",
    "grid",
    "server",
    "query",
    "filter",
    "sort",
    "pagination",
    "search",
    "interactive",
  ],
}
