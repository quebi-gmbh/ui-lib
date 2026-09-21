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
 *
 * So the pagination stays and everything else in the chrome goes: search,
 * Density and Columns are what a DataTable has too, and this picture only has
 * room for the half that makes it a *server* table. `load-more` rather than the
 * default offset pager for the same reason — at this width that one stacks into
 * three rows of controls, a first/prev/1/2/…/100/next/last strip and a
 * rows-per-page box, which is more chrome than table.
 */
const OnePage = () => {
  const [query, setQuery] = useState<DataTableQuery>({ ...emptyQuery, pageSize: 3 })

  return (
    <div className="w-176">
      <ServerTable<Order>
        aria-label="Server-driven orders"
        columns={columns}
        rows={ORDERS.slice(0, 3)}
        getRowId={(order) => String(order.id)}
        query={query}
        onQueryChange={setQuery}
        total={ORDERS.length}
        paginationMode="load-more"
        hasMore
        tiebreakColumn="reference"
        enableGlobalSearch={false}
        enableColumnChooser={false}
        enableDensityToggle={false}
      />
    </div>
  )
}

export const serverTableOgScene: OgScene = {
  scale: 1.5,
  render: () => <OnePage />,
}
