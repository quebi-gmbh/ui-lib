import { useState } from "react"
import { DataTable } from "@/components/data-table"
import { FormattedDate } from "@/components/formatted-date"
import { Note } from "@/components/note"
import type { DataTableColumn, FilterCondition } from "@/lib/data-table"
import { Money, ORDERS, type Order, SMALL_ORDERS, StatusBadge } from "./table-fixtures.examples"
import type { ComponentExample } from "./types"

/* -------------------------------------------------------------------------- */
/*                                  filtering                                 */
/* -------------------------------------------------------------------------- */

const filterColumns: DataTableColumn<Order>[] = [
  { id: "reference", header: "Reference", accessorKey: "reference", width: 130 },
  // Text: "contains", case-insensitively.
  { id: "customer", header: "Customer", accessorKey: "customer", filterVariant: "text", truncate: true, width: 170 },
  // Enum: the distinct values, with the count of rows behind each one. The
  // counts come from the row model's own faceting, so they narrow as you filter.
  {
    id: "status",
    header: "Status",
    accessorKey: "status",
    filterVariant: "enum",
    cell: ({ row }) => <StatusBadge status={row.status} />,
  },
  { id: "country", header: "Country", accessorKey: "country", filterVariant: "enum" },
  // Number: a two-ended range, with the faceted minimum and maximum offered as
  // the bounds so "between" is a question you can answer without guessing.
  {
    id: "amount",
    header: "Amount",
    accessorKey: "amount",
    align: "end",
    filterVariant: "number",
    cell: ({ row }) => <Money value={row.amount} />,
  },
  // Date: a from/to pair, compared as ISO strings so the answer does not depend
  // on the runtime's calendar.
  {
    id: "date",
    header: "Date",
    accessorKey: "date",
    filterVariant: "date",
    cell: ({ row }) => <FormattedDate date={row.date} />,
  },
  // Boolean: yes / no / any.
  {
    id: "isPriority",
    header: "Priority",
    accessorKey: "isPriority",
    filterVariant: "boolean",
    align: "center",
    cell: ({ row }) => (row.isPriority ? "Yes" : "No"),
    priority: 1,
  },
]

const FilterShowcase = () => (
  <DataTable<Order>
    aria-label="Orders by filter type"
    columns={filterColumns}
    data={ORDERS}
    getRowId={(order) => String(order.id)}
    defaultPageSize={10}
    exportFilename="orders.csv"
    caption="Every filter is a Conform form with a valibot schema: a range whose lower bound is above its upper one is a field error, not a query that quietly returns nothing."
  />
)

/* -------------------------------------------------------------------------- */
/*                          operators in the header                           */
/* -------------------------------------------------------------------------- */

/**
 * The operator is a control in the popover, not only a term in the model.
 *
 * The filters are lifted here for the readout below the table — the select
 * works exactly the same uncontrolled. What it commits is one condition:
 * Apply sends the operator and the value together, and dismissing the popover
 * discards both, so a server-driven table still makes one round trip per
 * change.
 */
const OperatorShowcase = () => {
  const [filters, setFilters] = useState<FilterCondition[]>([])

  return (
    <div className="flex w-full flex-col gap-3">
      <DataTable<Order>
        aria-label="Orders filtered by operator"
        columns={filterColumns}
        data={ORDERS}
        getRowId={(order) => String(order.id)}
        columnFilters={filters}
        onColumnFiltersChange={setFilters}
        defaultPageSize={8}
        enableColumnChooser={false}
        caption="Open Customer or Status: the select above the value is the question. Priority has none — its Yes / No / Any already says what “is not” would."
      />
      <p className="text-quebi-fg-muted text-sm">
        {filters.length === 0
          ? "No conditions yet."
          : filters
              .map((condition) => `${condition.fieldId} ${condition.operator}`)
              .join(" · ")}
      </p>
      <Note intent="info">
        On here, and off in <strong>Server Table</strong>, which follows the one
        question the two are named for — who owns the query. These rows are all
        of them, so every operator the model can express is one this table can
        answer. A server-driven table's answer comes from a backend that may
        only implement <code>contains</code>, and nothing in the client could
        notice the difference — so there it is{" "}
        <code>enableFilterOperators</code>, off until the host says its query
        can answer one.
      </Note>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                              saved presets                                 */
/* -------------------------------------------------------------------------- */

interface Preset {
  id: string
  label: string
  filters: FilterCondition[]
}

const BUILT_IN_PRESETS: Preset[] = [
  {
    id: "unpaid",
    label: "Unpaid, high value",
    filters: [
      { id: "status", fieldId: "status", operator: "is", variant: "enum", value: ["Pending"] },
      { id: "amount", fieldId: "amount", operator: "between", variant: "number", value: [500, null] },
    ],
  },
  {
    id: "dach",
    label: "DACH region",
    filters: [
      {
        id: "country",
        fieldId: "country",
        operator: "is",
        variant: "enum",
        value: ["Germany", "Austria"],
      },
    ],
  },
]

/**
 * Presets need the filters lifted, which is the same prop pair the URL-sync
 * example uses: `columnFilters` + `onColumnFiltersChange`. Uncontrolled, the
 * table keeps them itself and there is nothing to save.
 */
const PresetShowcase = () => {
  const [filters, setFilters] = useState<FilterCondition[]>([])
  const [presets, setPresets] = useState<Preset[]>(BUILT_IN_PRESETS)

  return (
    <div className="flex w-full flex-col gap-3">
      <DataTable<Order>
        aria-label="Orders with saved filters"
        columns={filterColumns}
        data={ORDERS}
        getRowId={(order) => String(order.id)}
        columnFilters={filters}
        onColumnFiltersChange={setFilters}
        filterPresets={presets.map(({ id, label }) => ({ id, label }))}
        onApplyPreset={(id) => setFilters(presets.find((p) => p.id === id)?.filters ?? [])}
        onSavePreset={() =>
          setPresets((current) => [
            ...current,
            {
              id: `saved-${current.length}`,
              label: `Saved view ${current.length - 1}`,
              filters,
            },
          ])
        }
        defaultPageSize={8}
        enableColumnChooser={false}
      />
      <Note intent="info">
        A preset is the filter list under a name. Because the filters are the
        consumer's state here, a preset is equally a row in a database, a query
        string, or a saved view per user — the table does not need to know which.
      </Note>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 pagination                                 */
/* -------------------------------------------------------------------------- */

const pagerColumns: DataTableColumn<Order>[] = [
  { id: "reference", header: "Reference", accessorKey: "reference" },
  { id: "customer", header: "Customer", accessorKey: "customer", truncate: true, width: 180 },
  {
    id: "status",
    header: "Status",
    accessorKey: "status",
    filterVariant: "enum",
    cell: ({ row }) => <StatusBadge status={row.status} />,
  },
  {
    id: "amount",
    header: "Amount",
    accessorKey: "amount",
    align: "end",
    cell: ({ row }) => <Money value={row.amount} />,
  },
]

const PaginationShowcase = () => (
  <div className="flex w-full flex-col gap-3">
    <DataTable<Order>
      aria-label="Paginated orders"
      columns={pagerColumns}
      data={ORDERS}
      getRowId={(order) => String(order.id)}
      defaultPageSize={10}
      pageSizes={[5, 10, 25, 50]}
      caption="Go to page 20, then filter Status down to one value: the page index is clamped to the last page that still has rows rather than showing an empty table."
    />
    <Note intent="info">
      The page size and the page jump are Conform fields. "Page 900 of 15" is a
      validation message beside the input, which is the difference between an
      error you can act on and a table that silently shows nothing.
    </Note>
  </div>
)

/* -------------------------------------------------------------------------- */
/*                              debounced search                              */
/* -------------------------------------------------------------------------- */

const SearchShowcase = () => {
  const [query, setQuery] = useState("")
  const [applied, setApplied] = useState(0)

  return (
    <div className="flex w-full flex-col gap-3">
      <DataTable<Order>
        aria-label="Orders with a debounced search"
        columns={pagerColumns}
        data={SMALL_ORDERS}
        getRowId={(order) => String(order.id)}
        globalFilter={query}
        onGlobalFilterChange={(next) => {
          setQuery(next)
          setApplied((count) => count + 1)
        }}
        defaultPageSize={8}
        enableColumnChooser={false}
        enableDensityToggle={false}
      />
      <p className="text-quebi-fg-muted text-sm">
        Queries run: {applied}. The field updates on every keystroke; the query
        is lifted 250&nbsp;ms after the last one — which server-side is the
        difference between one round-trip and one per character.
      </p>
    </div>
  )
}

export const dataTableFilteringExamples: ComponentExample[] = [
  {
    title: "Global search and per-column filters",
    description:
      "All five filter variants over 300 orders: text contains, enum with faceted counts, a number range bounded by the faceted minimum and maximum, a date range, and a boolean. Active filters appear as removable chips with a clear-all, and the column chooser and density toggle sit beside them.",
    render: () => <FilterShowcase />,
  },
  {
    title: "Operators in a column header",
    description:
      "A column's filter popover picks the question as well as the value: is not, does not contain, not between. The select is drawn only where there is a choice — boolean has one operator — and Apply commits the operator and the value as one condition, so dismissing the popover discards both.",
    render: () => <OperatorShowcase />,
  },
  {
    title: "Saved filter presets",
    description:
      "Lift the filters with columnFilters / onColumnFiltersChange and a preset is just a named list. Apply one from the Presets menu, or save the current filters as a new one.",
    render: () => <PresetShowcase />,
  },
  {
    title: "Pagination, page jump and clamping",
    description:
      "Page size selector, \"showing X–Y of Z\", first / previous / next / last, and a validated page jump. Narrowing the filters clamps the page index instead of leaving you past the end of the result.",
    render: () => <PaginationShowcase />,
  },
  {
    title: "Debounced global search",
    description:
      "The search box is a Conform field; the query it drives is debounced. Watch the counter: typing eight characters runs one query, not eight.",
    render: () => <SearchShowcase />,
  },
]
