import { useState } from "react"
import { ServerTable } from "@/components/server-table"
import { type DataTableColumn, type DataTableQuery, emptyQuery } from "@/lib/data-table"
import { Money, type Order, ORDERS, StatusBadge } from "./table-fixtures.examples"
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
 * One page of an answer, and a total that says how much of it is off-screen.
 * The query is held but never re-run — there is no server behind a still life —
 * and the rows are the page, not the dataset, which is the distinction the
 * component exists to make.
 */
const OnePage = () => {
  const [query, setQuery] = useState<DataTableQuery>({ ...emptyQuery, pageSize: 4 })

  return (
    <div className="w-192">
      <ServerTable<Order>
        aria-label="Server-driven orders"
        columns={columns}
        rows={ORDERS.slice(0, 4)}
        getRowId={(order) => String(order.id)}
        query={query}
        onQueryChange={setQuery}
        total={ORDERS.length}
        tiebreakColumn="reference"
      />
    </div>
  )
}

export const serverTableOgScene: OgScene = {
  scale: 1.0,
  render: () => <OnePage />,
}
