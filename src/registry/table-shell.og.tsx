import { useTable } from "@tanstack/react-table"
import { useMemo } from "react"
import { TableShell } from "@/components/table-shell"
import { type DataTableColumn, dataTableFeatures, toColumnDefs } from "@/lib/data-table"
import { Money, type Order, SMALL_ORDERS, StatusBadge } from "./table-fixtures.examples"
import type { OgScene } from "./types"

const columns: DataTableColumn<Order>[] = [
  { id: "reference", header: "Reference", accessorKey: "reference", width: 130 },
  { id: "customer", header: "Customer", accessorKey: "customer", truncate: true, width: 170 },
  {
    id: "status",
    header: "Status",
    accessorKey: "status",
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

/**
 * Rows and nothing else — no toolbar, no pager, no search. That absence is the
 * component: the shell draws what a TanStack instance hands it, and the chrome
 * around it is TableControls' job.
 */
const Rows = () => {
  const columnDefs = useMemo(() => toColumnDefs(columns), [])
  const table = useTable<typeof dataTableFeatures, Order>({
    features: dataTableFeatures,
    columns: columnDefs,
    data: SMALL_ORDERS.slice(0, 4),
    getRowId: (order) => String(order.id),
  })

  return (
    <div className="w-192">
      <TableShell<Order>
        aria-label="Four orders, drawn by the shell alone"
        table={table}
        rows={table.getRowModel().rows}
        getRowKey={(order) => String(order.id)}
        sorting={[]}
        striped
      />
    </div>
  )
}

export const tableShellOgScene: OgScene = {
  scale: 1.5,
  render: () => <Rows />,
}
