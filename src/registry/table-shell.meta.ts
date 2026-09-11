import type { ComponentMeta } from "./types"

export const tableShellMeta: ComponentMeta = {
  slug: "table-shell",
  name: "Table Shell",
  description:
    "The render half of the table family: hand it a TanStack table instance and the rows to draw, and it produces a quebi Table with multi-level header bands that span their columns as one header cell, per-column filter popovers, column menus for sort/group/pin/hide, selection that survives paging, detail panels and row editors as spanning rows, a cell editor in place at the column's own width with the keyboard model that makes it a data table rather than a page of inputs, drag-reorder, row virtualization, a footer of column aggregates, and told-apart loading, empty, no-results and error states. It touches the model not at all — Data Table hands it a computed row model, Server Table hands it the page a server returned — so it is also the way to compose a table of your own when neither mode fits.",
  category: "Display",
  tags: [
    "table",
    "data",
    "grid",
    "headless",
    "composition",
    "selection",
    "virtualization",
    "tanstack",
    "interactive",
  ],
}
