import { useEffect, useState } from "react"
import {
  AsyncTable,
  type AsyncTableColumn,
  type AsyncTableLoadFilterParams,
  type AsyncTableSort,
} from "@/components/async-table"
import type { ComponentExample } from "./types"

interface Order {
  id: number
  reference: string
  status: string
  country: string
  customer: string
  amount: number
  date: string
}

const STATUSES = ["Pending", "Paid", "Shipped", "Cancelled", "Refunded"]
const COUNTRIES = [
  "Germany",
  "France",
  "Spain",
  "Italy",
  "Netherlands",
  "Austria",
  "Belgium",
  "Poland",
  "Sweden",
  "Denmark",
]
const CUSTOMERS = Array.from(
  { length: 40 },
  (_, i) =>
    `${["Nova", "Apex", "Vertex", "Lumen", "Orbit", "Delta", "Pixel", "Quanta"][i % 8]} ${
      ["GmbH", "AG", "SE", "Ltd", "SARL", "BV"][i % 6]
    } ${i + 1}`,
)

// A stand-in for a database of 300 orders. In a real app the queries below hit
// the server; here everything is computed in-memory behind an artificial delay.
const ALL_ORDERS: Order[] = Array.from({ length: 300 }, (_, i) => ({
  id: i + 1,
  reference: `ORD-${String(4000 + i)}`,
  status: STATUSES[i % STATUSES.length],
  country: COUNTRIES[i % COUNTRIES.length],
  customer: CUSTOMERS[i % CUSTOMERS.length],
  amount: Math.round(((i * 37) % 900) + 50 + (i % 7) * 3.5),
  date: new Date(Date.UTC(2026, i % 12, ((i * 7) % 27) + 1)).toISOString().slice(0, 10),
}))

const PAGE_SIZE = 20

const delay = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms)
    signal?.addEventListener("abort", () => {
      clearTimeout(t)
      reject(new DOMException("Aborted", "AbortError"))
    })
  })

// Simulated server query: filter, then sort.
async function queryOrders(
  sort: AsyncTableSort | null,
  filters: Record<string, string[]>,
  signal: AbortSignal,
) {
  await delay(450, signal)
  let rows = ALL_ORDERS.filter((o) =>
    Object.entries(filters).every(
      ([col, values]) => values.length === 0 || values.includes(String(o[col as keyof Order])),
    ),
  )
  if (sort) {
    const { column, direction } = sort
    rows = [...rows].sort((a, b) => {
      const av = a[column as keyof Order]
      const bv = b[column as keyof Order]
      const cmp = typeof av === "number" && typeof bv === "number"
        ? av - bv
        : String(av).localeCompare(String(bv))
      return direction === "asc" ? cmp : -cmp
    })
  }
  return rows
}

// Simulated server query for a column's distinct values (searchable, paged).
async function loadFilterValues({ column, search, cursor, signal }: AsyncTableLoadFilterParams) {
  await delay(300, signal)
  const distinct = Array.from(
    new Set(ALL_ORDERS.map((o) => String(o[column as keyof Order]))),
  ).sort()
  const q = search.trim().toLowerCase()
  const matches = q ? distinct.filter((v) => v.toLowerCase().includes(q)) : distinct
  const start = cursor ? Number(cursor) : 0
  const page = matches.slice(start, start + PAGE_SIZE)
  const nextStart = start + PAGE_SIZE
  return {
    items: page.map((v) => ({ value: v })),
    cursor: nextStart < matches.length ? String(nextStart) : undefined,
  }
}

function OrdersTable() {
  const [sort, setSort] = useState<AsyncTableSort | null>({ column: "date", direction: "desc" })
  const [filters, setFilters] = useState<Record<string, string[]>>({})
  const [rows, setRows] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Re-query whenever sort or filters change — the component only reports intent.
  useEffect(() => {
    const ctrl = new AbortController()
    setIsLoading(true)
    queryOrders(sort, filters, ctrl.signal)
      .then((result) => {
        setRows(result)
        setIsLoading(false)
      })
      .catch((e) => {
        if ((e as Error).name !== "AbortError") setIsLoading(false)
      })
    return () => ctrl.abort()
  }, [sort, filters])

  const columns: AsyncTableColumn<Order>[] = [
    { id: "reference", label: "Reference", isRowHeader: true, sortable: true, cell: (o) => o.reference },
    { id: "status", label: "Status", sortable: true, filterable: true, cell: (o) => o.status },
    { id: "country", label: "Country", sortable: true, filterable: true, cell: (o) => o.country },
    { id: "customer", label: "Customer", sortable: true, filterable: true, cell: (o) => o.customer },
    {
      id: "amount",
      label: "Amount",
      sortable: true,
      align: "end",
      cell: (o) => `$${o.amount.toFixed(2)}`,
    },
    { id: "date", label: "Date", sortable: true, cell: (o) => o.date },
  ]

  return (
    <div className="w-full max-w-4xl">
      <AsyncTable<Order>
        aria-label="Orders"
        columns={columns}
        rows={rows}
        getRowId={(o) => o.id}
        sort={sort}
        onSortChange={setSort}
        filters={filters}
        onFiltersChange={setFilters}
        loadFilterValues={loadFilterValues}
        isLoading={isLoading}
        renderEmptyState={() => (
          <div className="flex min-h-40 items-center justify-center text-quebi-fg-muted text-sm">
            No orders match these filters.
          </div>
        )}
      />
    </div>
  )
}

export const asyncTableExamples: ComponentExample[] = [
  {
    title: "Server-driven orders",
    description:
      "Sort columns (three-state: ascending → descending → off) and filter Status / Country / Customer. Each filter popover loads its distinct values from the source with search and scroll-to-load-more; Apply runs one query. Active filters show as chips above the table.",
    render: () => <OrdersTable />,
  },
]
