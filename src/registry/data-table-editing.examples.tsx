import { Plus, Trash2, Undo2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router"
import * as v from "valibot"
import { Button } from "@/components/button"
import { DataTable, DataTableRowEditor } from "@/components/data-table"
import { FormattedDate } from "@/components/formatted-date"
import { FormattedNumber } from "@/components/formatted-number"
import { Note } from "@/components/note"
import { Skeleton } from "@/components/skeleton"
import { ToastProvider, useToast } from "@/components/toast"
import {
  type DataTableColumn,
  type DataTableFilterValue,
  type DataTableQuery,
  emptyQuery,
  queryFromSearchParams,
  queryToSearchParams,
  sortsToSorting,
  sortingToSorts,
} from "@/lib/data-table"
import { Money, ORDERS, type Order, SMALL_ORDERS, StatusBadge, STATUSES } from "./data-table-fixtures.examples"
import type { ComponentExample } from "./types"

const columns: DataTableColumn<Order>[] = [
  { id: "reference", header: "Reference", accessorKey: "reference", width: 130 },
  { id: "customer", header: "Customer", accessorKey: "customer", truncate: true, width: 180, filterVariant: "text" },
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
    filterVariant: "number",
    cell: ({ row }) => <Money value={row.amount} />,
  },
  {
    id: "date",
    header: "Date",
    accessorKey: "date",
    filterVariant: "date",
    cell: ({ row }) => <FormattedDate date={row.date} />,
  },
]

/* -------------------------------------------------------------------------- */
/*                                  editing                                   */
/* -------------------------------------------------------------------------- */

const rowSchema = v.object({
  reference: v.pipe(
    v.string(),
    v.regex(/^ORD-\d{4}$/, "References look like ORD-1234"),
  ),
  customer: v.pipe(v.string(), v.minLength(3, "At least three characters")),
  status: v.picklist(STATUSES),
  amount: v.pipe(v.number("Enter an amount"), v.minValue(0, "Cannot be negative")),
})

const editFields = [
  { name: "reference", label: "Reference", kind: "text" as const },
  { name: "customer", label: "Customer", kind: "text" as const },
  {
    name: "status",
    label: "Status",
    kind: "select" as const,
    options: STATUSES.map((status) => ({ id: status, label: status })),
  },
  { name: "amount", label: "Amount", kind: "number" as const },
]

function EditableOrders() {
  const toast = useToast()
  const [rows, setRows] = useState<Order[]>(() => SMALL_ORDERS.slice(0, 8))
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [history, setHistory] = useState<Order[][]>([])

  const commit = (next: Order[]) => {
    setHistory((past) => [...past, rows])
    setRows(next)
  }

  const undo = () => {
    const previous = history.at(-1)
    if (!previous) return
    setHistory((past) => past.slice(0, -1))
    setRows(previous)
    toast.info("Reverted the last change")
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <DataTable<Order>
        aria-label="Editable orders"
        columns={columns}
        data={rows}
        getRowId={(order) => String(order.id)}
        enablePagination={false}
        editingKey={editingKey}
        renderRowEditor={(order) => (
          <DataTableRowEditor
            title={`Editing ${order.reference}`}
            schema={rowSchema}
            fields={editFields}
            defaultValue={{
              reference: order.reference,
              customer: order.customer,
              status: order.status,
              amount: order.amount,
            }}
            onCancel={() => setEditingKey(null)}
            onSave={(value) => {
              commit(
                rows.map((candidate) =>
                  candidate.id === order.id ? { ...candidate, ...(value as Partial<Order>) } : candidate,
                ),
              )
              setEditingKey(null)
              toast.success(`Saved ${String(value.reference)}`)
            }}
          />
        )}
        rowActions={(order) => (
          <span className="inline-flex items-center gap-1">
            <Button intent="ghost" size="xs" onPress={() => setEditingKey(String(order.id))}>
              Edit
            </Button>
            <Button
              intent="ghost"
              size="sq-xs"
              aria-label={`Delete ${order.reference}`}
              onPress={() => commit(rows.filter((candidate) => candidate.id !== order.id))}
            >
              <Trash2 data-slot="icon" aria-hidden="true" />
            </Button>
          </span>
        )}
        toolbarActions={
          <>
            <Button
              intent="outline"
              size="xs"
              onPress={() => {
                const id = Math.max(0, ...rows.map((order) => order.id)) + 1
                commit([
                  { ...SMALL_ORDERS[0], id, reference: `ORD-${4900 + id}`, customer: "New customer" },
                  ...rows,
                ])
                setEditingKey(String(id))
              }}
            >
              <Plus data-slot="icon" aria-hidden="true" />
              Add row
            </Button>
            <Button intent="ghost" size="xs" isDisabled={history.length === 0} onPress={undo}>
              <Undo2 data-slot="icon" aria-hidden="true" />
              Undo ({history.length})
            </Button>
          </>
        }
      />
      <Note intent="info">
        The editor is a real Conform form over a valibot schema, so a reference
        that does not match <code>ORD-1234</code> is an error beside the field
        rather than a rejected save you have to reconstruct.
      </Note>
    </div>
  )
}

const EditingShowcase = () => (
  <ToastProvider>
    <EditableOrders />
  </ToastProvider>
)

/* -------------------------------------------------------------------------- */
/*                              URL-synced state                              */
/* -------------------------------------------------------------------------- */

const filterableColumns = columns
  .filter((column) => column.filterVariant)
  .map((column) => ({ id: column.id, variant: column.filterVariant }))

const UrlStateShowcase = () => {
  const [params, setParams] = useSearchParams()
  const query = useMemo(
    () => queryFromSearchParams(params, filterableColumns, { ...emptyQuery, pageSize: 10 }),
    [params],
  )

  const push = (next: DataTableQuery) => {
    setParams(new URLSearchParams(queryToSearchParams(next)), { preventScrollReset: true })
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <DataTable<Order>
        aria-label="Orders with URL-synced state"
        columns={columns}
        data={ORDERS}
        getRowId={(order) => String(order.id)}
        sorting={sortsToSorting(query.sort)}
        onSortingChange={(sorting) => push({ ...query, sort: sortingToSorts(sorting) })}
        globalFilter={query.search}
        onGlobalFilterChange={(search) => push({ ...query, search })}
        columnFilters={query.filters}
        onColumnFiltersChange={(filters: DataTableFilterValue[]) => push({ ...query, filters })}
        defaultPageSize={10}
      />
      <Note intent="info">
        Sort, search and filters are in the address bar. That makes a filtered
        view a link someone can send and a back button that works — and on a
        prerendered site it is the only place the state can live and still match
        the served HTML.
      </Note>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                              large dataset                                 */
/* -------------------------------------------------------------------------- */

const BIG = Array.from({ length: 10_000 }, (_, i) => ({
  ...ORDERS[i % ORDERS.length],
  id: i + 1,
  reference: `ORD-${String(100_000 + i)}`,
}))

/**
 * Ten thousand rows are the browser's problem, not the prerender's.
 *
 * Virtualization measures a viewport, and a build step has none — so on the
 * server this renders a placeholder and the table is built after mount.
 * Without that, the prerender writes all 10,000 rows into the HTML, which is
 * both enormous and exactly the thing virtualization exists to avoid.
 */
const VirtualShowcase = () => {
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => setIsMounted(true), [])
  if (!isMounted) {
    return (
      <div className="flex h-[440px] w-full flex-col gap-2">
        {["a", "b", "c", "d", "e", "f"].map((row) => (
          <Skeleton key={row} className="h-10 w-full" />
        ))}
      </div>
    )
  }
  return <VirtualTable />
}

const VirtualTable = () => (
  <div className="flex w-full flex-col gap-3">
    <DataTable<Order>
      aria-label="Ten thousand orders"
      columns={columns}
      data={BIG}
      getRowId={(order) => String(order.id)}
      enablePagination={false}
      virtualize
      height={440}
      rowHeight={44}
      exportFilename="all-orders.csv"
      caption="10,000 rows, no pagination. Sort and filter stay instant because the row model is memoized and only the visible rows are in the DOM."
    />
    <Note intent="info">
      Virtualization is react-aria's <code>Virtualizer</code> with{" "}
      <code>TableLayout</code>, which keeps the ARIA grid and the keyboard model
      intact. Note what it does not do: the collection is still complete, so the
      cell renderers run for every row — which is why <code>stackOnMobile</code>
      is off here and on the ten-row example instead.
    </Note>
  </div>
)

/* -------------------------------------------------------------------------- */
/*                                  states                                    */
/* -------------------------------------------------------------------------- */

const StatesShowcase = () => {
  const [mode, setMode] = useState<"loading" | "refresh" | "empty" | "filtered" | "error">(
    "loading",
  )
  const modes = ["loading", "refresh", "empty", "filtered", "error"] as const

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        {modes.map((candidate) => (
          <Button
            key={candidate}
            size="xs"
            intent={mode === candidate ? "primary" : "outline"}
            onPress={() => setMode(candidate)}
          >
            {candidate}
          </Button>
        ))}
      </div>
      <DataTable<Order>
        aria-label="Table states"
        columns={columns}
        data={mode === "refresh" ? SMALL_ORDERS.slice(0, 5) : []}
        getRowId={(order) => String(order.id)}
        enablePagination={false}
        enableColumnChooser={false}
        isLoading={mode === "loading"}
        isRefreshing={mode === "refresh"}
        columnFilters={
          mode === "filtered" ? [{ column: "customer", value: "nothing matches this" }] : []
        }
        onColumnFiltersChange={() => undefined}
        error={mode === "error" ? "The orders service did not answer in time." : undefined}
        onRetry={mode === "error" ? () => setMode("refresh") : undefined}
        emptyMessage="No orders yet. They will appear here as soon as one is placed."
        noResultsMessage="No orders match your filters. Try widening the date range."
        onRefresh={() => setMode("refresh")}
      />
      <Note intent="info">
        Four different sentences for four different situations. An initial load
        is skeleton rows; a background refresh keeps the rows and says so;
        "nothing here yet" and "nothing matched" are different problems and only
        one has a next step; an error offers a retry.
      </Note>
      <div className="flex items-center gap-2 text-quebi-fg-subtle text-xs">
        <Skeleton className="h-3 w-24" />
        <span>
          Skeleton rows are the same height as real ones — <FormattedNumber value={44} />
          px — so nothing jumps when the data lands.
        </span>
      </div>
    </div>
  )
}

export const dataTableEditingExamples: ComponentExample[] = [
  {
    title: "Inline row editing, add, delete and undo",
    description:
      "Press Edit and the row becomes a Conform form over a valibot schema, spanning the table. Save writes it back, Add prepends a row already in edit mode, and every change is undoable — dirty state is a history stack, not a flag.",
    render: () => <EditingShowcase />,
  },
  {
    title: "Sort, search and filters in the URL",
    description:
      "queryToSearchParams / queryFromSearchParams from @/lib/data-table put the whole query in the address bar through React Router's useSearchParams. The lib module has no React in it, so the same two functions parse the query in a loader.",
    render: () => <UrlStateShowcase />,
  },
  {
    title: "Ten thousand rows, virtualized",
    description:
      "The whole dataset in the browser with row virtualization and no pagination, plus CSV export of the visible columns or of every filtered row.",
    render: () => <VirtualShowcase />,
  },
  {
    title: "Loading, empty, no-results and error",
    description:
      "The four states a table is in when it has nothing to show, told apart. Switch between them to compare.",
    render: () => <StatesShowcase />,
  },
]
