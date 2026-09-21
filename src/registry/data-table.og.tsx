import { DataTable } from "@/components/data-table"
import type { DataTableColumn } from "@/lib/data-table"
import { Money, type Order, SMALL_ORDERS, StatusBadge } from "./table-fixtures.examples"
import type { OgScene } from "./types"

/**
 * Four columns and three rows of the shared order fixture — the same data the
 * gallery uses, cut to what fits. One control is left on above the rows: the
 * search is what separates a DataTable from a Table, and Density and Columns
 * are two more 12px words in a picture that already had four too many.
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
  scale: 1.5,
  render: () => (
    <div className="w-176">
      <DataTable<Order>
        aria-label="Orders"
        columns={columns}
        data={SMALL_ORDERS.slice(0, 3)}
        getRowId={(order) => String(order.id)}
        defaultSorting={[{ id: "amount", desc: true }]}
        enablePagination={false}
        enableColumnChooser={false}
        enableDensityToggle={false}
      />
    </div>
  ),
}
