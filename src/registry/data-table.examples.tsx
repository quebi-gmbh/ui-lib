import { DataTable } from "@/components/data-table"
import { FormattedDate } from "@/components/formatted-date"
import { FormattedCurrency, FormattedNumber } from "@/components/formatted-number"
import { Meter } from "@/components/meter"
import type { DataTableColumn } from "@/lib/data-table"
import { dataTableEditingExamples } from "./data-table-editing.examples"
import { dataTableFilteringExamples } from "./data-table-filtering.examples"
import {
  Money,
  type Order,
  SMALL_ORDERS,
  StatusBadge,
  compareOrders,
} from "./table-fixtures.examples"
import { dataTableRowExamples } from "./data-table-rows.examples"
import type { ComponentExample } from "./types"

/* -------------------------------------------------------------------------- */
/*                          columns, cells and footers                        */
/* -------------------------------------------------------------------------- */

const columnShowcase: DataTableColumn<Order>[] = [
  {
    id: "order",
    header: "Order",
    // Child columns render as a header band: one cell above the two below it,
    // spanning both. One vocabulary — a column with `columns` is a group,
    // everything else is a leaf.
    columns: [
      { id: "reference", header: "Reference", accessorKey: "reference", width: 130 },
      {
        id: "status",
        header: "Status",
        accessorKey: "status",
        cell: ({ row }) => <StatusBadge status={row.status} />,
      },
    ],
  },
  {
    id: "customer",
    header: "Customer",
    columns: [
      {
        id: "customerName",
        header: "Name",
        accessorKey: "customer",
        // Truncation is the column's, not the cell's: the tooltip that makes
        // the full value reachable comes with it.
        truncate: true,
        width: 160,
      },
      { id: "country", header: "Country", accessorKey: "country" },
    ],
  },
  {
    id: "totals",
    header: "Totals",
    columns: [
      {
        id: "amount",
        header: "Net",
        accessorKey: "amount",
        align: "end",
        aggregate: "sum",
        cell: ({ row }) => <Money value={row.amount} />,
        footer: (table) => (
          <FormattedCurrency
            value={table
              .getFilteredRowModel()
              .rows.reduce((sum, row) => sum + Number(row.getValue("amount")), 0)}
          />
        ),
      },
      {
        // A derived column: no key on the row, a function that computes one.
        id: "gross",
        header: "Gross",
        accessorFn: (row) => row.amount + row.tax,
        align: "end",
        cell: ({ value }) => <Money value={Number(value)} />,
      },
      {
        id: "share",
        header: "Items",
        accessorKey: "items",
        align: "end",
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-2">
            <FormattedNumber value={row.items} />
            <Meter aria-label="Items" value={row.items} maxValue={6} className="w-16" />
          </span>
        ),
      },
    ],
  },
  {
    id: "note",
    header: "Note",
    accessorKey: "note",
    // Five of every twenty-four orders have no note. Without this they would
    // render as an empty cell, which reads as a layout bug rather than as data.
    emptyValue: "—",
    truncate: true,
    width: 170,
    priority: 2,
  },
]

const ColumnShowcase = () => (
  <DataTable<Order>
    aria-label="Orders by column type"
    columns={columnShowcase}
    data={SMALL_ORDERS}
    getRowId={(order) => String(order.id)}
    defaultPageSize={8}
    showFooter
    grid
    caption="Accessor, derived and display columns under a banded header, with a column total in the footer."
  />
)

/* -------------------------------------------------------------------------- */
/*                                  sorting                                   */
/* -------------------------------------------------------------------------- */

const sortColumns: DataTableColumn<Order>[] = [
  { id: "reference", header: "Reference", accessorKey: "reference", enableSorting: false },
  {
    id: "customer",
    header: "Customer",
    accessorKey: "customer",
    // A named built-in rather than the default: `text` compares as text with a
    // locale-aware collator instead of guessing from the first row's value.
    sortFn: "text",
  },
  {
    id: "status",
    header: "Status",
    accessorKey: "status",
    // A custom comparator: workflow order, not alphabetical order.
    sortFn: (a, b) =>
      ["Pending", "Paid", "Shipped", "Refunded", "Cancelled"].indexOf(String(a)) -
      ["Pending", "Paid", "Shipped", "Refunded", "Cancelled"].indexOf(String(b)),
    cell: ({ row }) => <StatusBadge status={row.status} />,
  },
  {
    id: "note",
    header: "Note",
    accessorFn: (row) => (row.note === "" ? undefined : row.note),
    // Blank notes go last whichever way the column is sorted, so "sort by note"
    // never means "show me the empty ones first".
    sortUndefined: "last",
    emptyValue: "—",
  },
  { id: "amount", header: "Amount", accessorKey: "amount", align: "end", cell: ({ row }) => <Money value={row.amount} /> },
  {
    id: "date",
    header: "Date",
    accessorKey: "date",
    sortFn: "datetime",
    cell: ({ row }) => <FormattedDate date={row.date} />,
  },
]

const SortingShowcase = () => (
  <DataTable<Order>
    aria-label="Orders by sort behaviour"
    columns={sortColumns}
    data={SMALL_ORDERS}
    getRowId={(order) => String(order.id)}
    defaultSorting={[{ id: "date", desc: true }]}
    defaultPageSize={8}
    enableGlobalSearch={false}
    striped
    caption="Click a header to cycle ascending → descending → off. Shift-click a second header to sort by both; the badges are the sort order."
  />
)

/* -------------------------------------------------------------------------- */

/**
 * The gallery is assembled from four files so each stays inside the
 * 500-line limit the library publishes for everyone else. One slug, one array.
 */
export const dataTableExamples: ComponentExample[] = [
  {
    title: "Columns, cells and footers",
    description:
      "Accessor columns (by key and by function), a display column, a banded header whose bands are single cells spanning the columns under them, per-column alignment and width, truncation with a tooltip, an empty-value placeholder, and a footer total that follows the filters. The band row needs the client — react-aria's server path cannot build a parent column — so the prerendered HTML carries the band name above each label and the spanned row arrives with hydration, at the same height. Money and counts go through FormattedCurrency and FormattedNumber — the site is prerendered, so an implicit locale would be a hydration bug.",
    render: () => <ColumnShowcase />,
  },
  {
    title: "Sorting, single and multi-column",
    description:
      "Three-state sort on every column but Reference, which opts out. Customer uses the locale-aware text comparator, Status a custom workflow order, Note pushes blanks last in both directions, and Date sorts as a date rather than as a string. Shift-click adds a column to the sort and the badge shows its priority.",
    render: () => <SortingShowcase />,
  },
  ...dataTableFilteringExamples,
  ...dataTableRowExamples,
  ...dataTableEditingExamples,
]

export { compareOrders }
