import { Plus, Trash2, Undo2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router"
import * as v from "valibot"
import { Button } from "@/components/button"
import { ConformField } from "@/components/conform-field"
import { ConformNumberField } from "@/components/conform-number-field"
import { ConformSelect } from "@/components/conform-select"
import { DataTable } from "@/components/data-table"
import { FormattedDate } from "@/components/formatted-date"
import { FormattedNumber } from "@/components/formatted-number"
import { Note } from "@/components/note"
import { SelectItem } from "@/components/select"
import { Skeleton } from "@/components/skeleton"
import { ToastProvider, useToast } from "@/components/toast"
import {
  type DataTableCellAddress,
  type DataTableColumn,
  type DataTableFilterValue,
  type DataTableQuery,
  emptyQuery,
  queryFromSearchParams,
  queryToSearchParams,
  sortsToSorting,
  sortingToSorts,
} from "@/lib/data-table"
import { Money, ORDERS, type Order, SMALL_ORDERS, StatusBadge, STATUSES } from "./table-fixtures.examples"
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

/**
 * The same four fields, one control each — which is the whole of the editing
 * API. A column with no `editor` cannot be edited and Tab skips it, which is why
 * Date is read-only here without a flag saying so.
 */
const editors: Record<string, DataTableColumn<Order>["editor"]> = {
  reference: ({ field, label }) => <ConformField field={field} label={label} />,
  customer: ({ field, label }) => <ConformField field={field} label={label} />,
  status: ({ field, label }) => (
    <ConformSelect field={field} label={label}>
      {STATUSES.map((status) => (
        <SelectItem key={status} id={status}>
          {status}
        </SelectItem>
      ))}
    </ConformSelect>
  ),
  amount: ({ field, label }) => <ConformNumberField field={field} label={label} />,
}

const editableColumns = columns.map((column) => ({ ...column, editor: editors[column.id] }))

function EditableOrders() {
  const toast = useToast()
  const [rows, setRows] = useState<Order[]>(() => SMALL_ORDERS.slice(0, 8))
  // Controlled, because "Add row" has something to say about which cell is
  // open: a new row arrives with its first editable cell already waiting.
  const [editingCell, setEditingCell] = useState<DataTableCellAddress | null>(null)
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
        columns={editableColumns}
        data={rows}
        getRowId={(order) => String(order.id)}
        enablePagination={false}
        cellEditSchema={rowSchema}
        editingCell={editingCell}
        onEditingCellChange={setEditingCell}
        onCellEdit={({ row, value }) => {
          commit(
            rows.map((candidate) =>
              candidate.id === row.id ? { ...candidate, ...(value as Partial<Order>) } : candidate,
            ),
          )
          toast.success(`Saved ${String(value.reference)}`)
        }}
        rowActions={(order) => (
          <Button
            intent="ghost"
            size="sq-xs"
            aria-label={`Delete ${order.reference}`}
            onPress={() => commit(rows.filter((candidate) => candidate.id !== order.id))}
          >
            <Trash2 data-slot="icon" aria-hidden="true" />
          </Button>
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
                setEditingCell({ rowId: String(id), columnId: "reference" })
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
        caption="Click a cell to edit it. A value you pick commits itself; a value you type commits on Enter, Tab or when you leave the cell. Escape puts it back."
      />
      <Note intent="info">
        Every cell is a real Conform form over a valibot schema, so a reference
        that does not match <code>ORD-1234</code> is an error under the control
        rather than a rejected save you have to reconstruct — and because the
        form is the whole row, a rule that compares two fields has both. Nothing
        here is batched: <code>onCellEdit</code> fires the moment the schema
        accepts the row, and Undo is a history stack built on top of it.
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
    title: "Editing cells, add, delete and undo",
    description:
      "One click opens a cell as a Conform form over a valibot schema. Add prepends a row with its first cell already open, Delete is a row action, and every commit is undoable — dirty state is a history stack, not a flag. Editing a table is editing its cells; there is no row mode to enter.",
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
