import { useTable } from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { Button } from "@/components/button"
import { Note } from "@/components/note"
import { TableShell } from "@/components/table-shell"
import { TableFilterPanel } from "@/components/table-controls"
import {
  type DataTableColumn,
  type DataTableSelection,
  dataTableFeatures,
  emptySelection,
  nextSorting,
  selectionCount,
  toColumnDefs,
} from "@/lib/data-table"
import { Money, type Order, SMALL_ORDERS, StatusBadge } from "./table-fixtures.examples"
import type { ComponentExample } from "./types"

/**
 * Composing a table by hand, which is the thing TableShell is for.
 *
 * Both of these build their own `useTable` and hand the shell an instance and a
 * list of rows. That is the entire contract — the shell reads header groups,
 * column meta, visibility, pinning and sizing off the instance and draws what it
 * is given, in that order, without asking where the rows came from. DataTable
 * and ServerTable are two callers of it that happen to ship with the library.
 *
 * Reach for it when neither mode fits: a table whose sort is a URL search param
 * you already parse, a row model with a feature set of your own, a page that
 * wants the header and the selection UX but not the toolbar.
 */

const columns: DataTableColumn<Order>[] = [
  { id: "reference", header: "Reference", accessorKey: "reference", width: 130 },
  { id: "customer", header: "Customer", accessorKey: "customer", truncate: true, width: 180 },
  {
    id: "status",
    header: "Status",
    accessorKey: "status",
    filterVariant: "enum",
    cell: ({ row }) => <StatusBadge status={row.status} />,
  },
  { id: "country", header: "Country", accessorKey: "country" },
  {
    id: "amount",
    header: "Amount",
    accessorKey: "amount",
    align: "end",
    cell: ({ row }) => <Money value={row.amount} />,
  },
]

/* -------------------------------------------------------------------------- */
/*                     the smallest table the shell can draw                  */
/* -------------------------------------------------------------------------- */

const Minimal = () => {
  const columnDefs = useMemo(() => toColumnDefs(columns), [])
  // Every row model off. With no sorting, filtering or pagination state, the
  // instance is a column model and nothing else — which is all the shell reads.
  const table = useTable<typeof dataTableFeatures, Order>({
    features: dataTableFeatures,
    columns: columnDefs,
    data: SMALL_ORDERS.slice(0, 6),
    getRowId: (order) => String(order.id),
  })

  return (
    <div className="flex w-full flex-col gap-3">
      <TableShell<Order>
        aria-label="Six orders, drawn by the shell alone"
        table={table}
        rows={table.getRowModel().rows}
        getRowKey={(order) => String(order.id)}
        sorting={[]}
        striped
      />
      <Note intent="info">
        Twenty lines and no chrome: a <code>useTable</code>, the rows it
        produces, and a key function. Everything the quebi Table brings — ARIA
        grid semantics, keyboard navigation, typeahead, hover and focus styling —
        arrives with it, because the shell renders through that component rather
        than around it.
      </Note>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                       a sort and a filter you own                          */
/* -------------------------------------------------------------------------- */

const OwnState = () => {
  const columnDefs = useMemo(() => toColumnDefs(columns), [])
  // The state lives here rather than in the row model, which is the case for a
  // table whose sort is a URL param or a server's ORDER BY: the shell reports
  // intent and this component decides what it means.
  const [sorting, setSorting] = useState([{ id: "amount", desc: true }])
  const [status, setStatus] = useState<string[]>([])
  const [selection, setSelection] = useState<DataTableSelection>(emptySelection)

  const rows = useMemo(() => {
    const filtered =
      status.length === 0
        ? SMALL_ORDERS
        : SMALL_ORDERS.filter((order) => status.includes(order.status))
    const term = sorting[0]
    if (!term) return filtered
    const key = term.id as keyof Order
    return [...filtered].sort((a, b) => {
      const left = a[key]
      const right = b[key]
      const cmp =
        typeof left === "number" && typeof right === "number"
          ? left - right
          : String(left).localeCompare(String(right), "en")
      return term.desc ? -cmp : cmp
    })
  }, [sorting, status])

  const table = useTable<typeof dataTableFeatures, Order>({
    features: dataTableFeatures,
    columns: columnDefs,
    data: rows,
    getRowId: (order) => String(order.id),
    // The rows arrive sorted and filtered, so the model is told not to do it
    // again — the same three flags ServerTable sets, for the same reason.
    manualSorting: true,
    manualFiltering: true,
    state: { sorting },
  })

  const { count } = selectionCount(selection, rows.length)

  return (
    <div className="flex w-full flex-col gap-3">
      <TableShell<Order>
        aria-label="Orders sorted and filtered outside the row model"
        table={table}
        rows={table.getRowModel().rows}
        getRowKey={(order) => String(order.id)}
        sorting={sorting}
        onSortIntent={(columnId, additive) =>
          setSorting(nextSorting(sorting, columnId, { additive }))
        }
        onSortColumn={(columnId, direction) =>
          setSorting(direction == null ? [] : [{ id: columnId, desc: direction === "desc" }])
        }
        selectionMode="multiple"
        selection={selection}
        onSelectionChange={setSelection}
        activeFilters={status.length > 0 ? ["status"] : []}
        // This prop is the seam between the shell and the controls: the shell
        // renders the popover and the trigger, the caller decides what is
        // inside it. Passing a TableFilterPanel is what DataTable does; passing
        // anything else is allowed, and neither module imports the other.
        renderFilter={(columnId) =>
          columnId === "status" ? (
            <TableFilterPanel
              columnId="status"
              label="Status"
              variant="enum"
              value={status}
              options={[...new Set(SMALL_ORDERS.map((order) => order.status))].sort().map(
                (value) => ({ value }),
              )}
              onApply={(value) => setStatus((value as string[]) ?? [])}
              onClear={() => setStatus([])}
            />
          ) : null
        }
        emptyMessage="No orders yet."
        noResultsMessage="No orders in that status."
        hasQuery={status.length > 0}
        striped
      />
      <div className="flex flex-wrap items-center gap-2 text-quebi-fg-muted text-sm">
        <span>
          sorting = <code>{JSON.stringify(sorting)}</code>
        </span>
        <span>
          selected = <code>{count ?? 0}</code>
        </span>
        <Button intent="ghost" size="xs" onPress={() => setSelection(emptySelection)}>
          Clear selection
        </Button>
      </div>
      <Note intent="info">
        The header press does not sort anything: it calls{" "}
        <code>onSortIntent</code> with a column id and whether shift was down,
        and this component turns that into the next state with{" "}
        <code>nextSorting</code> from <code>@/lib/data-table</code> — the same
        function both modes use. That is the seam the library is built around:
        react-aria signals intent, and whoever owns the rows decides what it
        costs.
      </Note>
    </div>
  )
}

export const tableShellExamples: ComponentExample[] = [
  {
    title: "The smallest table the shell can draw",
    description:
      "A TanStack instance with every row model switched off, six rows, and nothing else. The shell reads header groups, column meta, visibility, pinning and sizing off the instance and draws the rows it is handed — that is the whole contract, and it is why DataTable and ServerTable can both be built on it.",
    render: () => <Minimal />,
  },
  {
    title: "A sort and a filter you own",
    description:
      "The same shell over state held outside the row model, with manualSorting and manualFiltering set — the shape of a table whose sort is a URL parameter or a server's ORDER BY. The header reports intent through onSortIntent; nextSorting turns it into the next state. renderFilter is the seam: the shell draws the popover, the caller decides what goes in it, and table-shell and table-controls stay siblings rather than one importing the other.",
    render: () => <OwnState />,
  },
]
