import { DataTable } from "@/components/data-table"
import type { DataTableColumn } from "@/lib/data-table"
import { Money, type Order, SMALL_ORDERS, StatusBadge } from "./table-fixtures.examples"
import type { OgScene } from "./types"

/**
 * Five columns and four rows of the shared order fixture — the same data the
 * gallery uses, cut to what fits. The toolbar is left on: the chrome above the
 * rows is half of what separates a DataTable from a Table.
 */
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

export const dataTableOgScene: OgScene = {
  scale: 1.1,
  render: () => (
    <div className="w-192">
      <DataTable<Order>
        aria-label="Orders"
        columns={columns}
        data={SMALL_ORDERS.slice(0, 4)}
        getRowId={(order) => String(order.id)}
        defaultSorting={[{ id: "amount", desc: true }]}
        enablePagination={false}
      />
    </div>
  ),
}
