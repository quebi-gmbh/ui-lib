import { useEffect, useState } from "react"
import * as v from "valibot"
import { ServerTable, type ServerTableLoadFilterParams } from "@/components/server-table"
import { Button } from "@/components/button"
import { FormattedDate } from "@/components/formatted-date"
import { FormattedNumber } from "@/components/formatted-number"
import { ConformField } from "@/components/conform-field"
import { ConformNumberField } from "@/components/conform-number-field"
import { ConformSelect } from "@/components/conform-select"
import { Note } from "@/components/note"
import { SelectItem } from "@/components/select"
import {
  type DataTableCellAddress,
  type DataTableColumn,
  type DataTableQuery,
  type DataTableSelection,
  emptyQuery,
  matchesFilter,
  queryToSearchParams,
  selectionCount,
} from "@/lib/data-table"
import {
  Money,
  ORDERS,
  type Order,
  STATUSES,
  StatusBadge,
  compareOrders,
} from "./table-fixtures.examples"
import type { ComponentExample } from "./types"

/* -------------------------------------------------------------------------- */
/*                        a stand-in for the database                         */
/* -------------------------------------------------------------------------- */

const delay = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener("abort", () => {
      clearTimeout(timer)
      reject(new DOMException("Aborted", "AbortError"))
    })
  })

interface QueryResult {
  rows: Order[]
  total: number
  hasMore: boolean
}

/**
 * What the server does. Deliberately a plain function taking the whole query:
 * filter, then order, then slice — the order a database would use, and the
 * order that makes the tiebreaker matter.
 */
async function queryOrders(
  query: DataTableQuery,
  options: { signal?: AbortSignal; countRows?: boolean } = {},
): Promise<QueryResult> {
  await delay(400, options.signal)
  const search = query.search.trim().toLowerCase()
  const matching = ORDERS.filter(
    (order) =>
      (search === "" ||
        `${order.reference} ${order.customer} ${order.country}`.toLowerCase().includes(search)) &&
      query.filters.every((filter) =>
        matchesFilter(order[filter.column as keyof Order], filter.variant, filter.value),
      ),
  )
  const ordered = [...matching]
  for (const term of [...query.sort].reverse()) {
    ordered.sort((a, b) => compareOrders(a, b, term.column, term.direction === "desc"))
  }
  const start = query.page * query.pageSize
  return {
    rows: ordered.slice(start, start + query.pageSize),
    total: matching.length,
    hasMore: start + query.pageSize < matching.length,
  }
}

/** The distinct values of one column, searchable and paged — one query each. */
async function loadFilterValues({ column, search, cursor, signal }: ServerTableLoadFilterParams) {
  await delay(250, signal)
  const counts = new Map<string, number>()
  for (const order of ORDERS) {
    const value = String(order[column as keyof Order])
    counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  const distinct = [...counts.keys()].sort()
  const needle = search.trim().toLowerCase()
  const matches = needle ? distinct.filter((v) => v.toLowerCase().includes(needle)) : distinct
  const start = cursor ? Number(cursor) : 0
  const page = matches.slice(start, start + 20)
  return {
    items: page.map((value) => ({ value, count: counts.get(value) })),
    cursor: start + 20 < matches.length ? String(start + 20) : undefined,
  }
}

const columns: DataTableColumn<Order>[] = [
  { id: "reference", header: "Reference", accessorKey: "reference", width: 130 },
  {
    id: "status",
    header: "Status",
    accessorKey: "status",
    filterVariant: "enum",
    cell: ({ row }) => <StatusBadge status={row.status} />,
  },
  { id: "country", header: "Country", accessorKey: "country", filterVariant: "enum" },
  { id: "customer", header: "Customer", accessorKey: "customer", filterVariant: "enum", truncate: true, width: 180 },
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

/** One query per change, with the request cancelled if another arrives first. */
function useOrderQuery(initial: Partial<DataTableQuery>) {
  const [query, setQuery] = useState<DataTableQuery>({ ...emptyQuery, ...initial })
  const [result, setResult] = useState<QueryResult>({ rows: [], total: 0, hasMore: false })
  const [state, setState] = useState<"initial" | "refreshing" | "idle" | "error">("initial")

  useEffect(() => {
    const controller = new AbortController()
    setState((current) => (current === "initial" ? "initial" : "refreshing"))
    queryOrders(query, { signal: controller.signal })
      .then((next) => {
        setResult(next)
        setState("idle")
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") setState("error")
      })
    return () => controller.abort()
  }, [query])

  return {
    query,
    setQuery,
    result,
    state,
    // A new object for the same query: the effect keys off identity, so this
    // re-runs the request without pretending the query changed.
    retry: () => setQuery((current) => ({ ...current })),
  }
}

/* -------------------------------------------------------------------------- */
/*                          offset pagination + total                         */
/* -------------------------------------------------------------------------- */

const ServerDriven = () => {
  const { query, setQuery, result, state, retry } = useOrderQuery({
    pageSize: 10,
    sort: [{ column: "date", direction: "desc" }],
  })
  const [selection, setSelection] = useState<DataTableSelection>({ mode: "include", keys: [] })
  const [exportUrl, setExportUrl] = useState<string | null>(null)
  const { count, isAll } = selectionCount(selection, result.total)

  return (
    <div className="flex w-full flex-col gap-3">
      <ServerTable<Order>
        aria-label="Server-driven orders"
        columns={columns}
        rows={result.rows}
        getRowId={(order) => String(order.id)}
        query={query}
        onQueryChange={setQuery}
        total={result.total}
        // Two orders on the same date have no defined order without this, and
        // page 2 would repeat a row page 1 already showed.
        tiebreakColumn="reference"
        loadFilterValues={loadFilterValues}
        selectionMode="multiple"
        selection={selection}
        onSelectionChange={setSelection}
        isLoading={state === "initial"}
        isRefreshing={state === "refreshing"}
        error={state === "error" ? "The orders service did not answer." : undefined}
        onRetry={retry}
        onRefresh={() => setQuery({ ...query })}
        // The client holds one page, so there is nothing here to write to a
        // file: export hands the query to an endpoint that can stream the rest.
        onExport={(current) => setExportUrl(`/api/orders.csv?${queryDescription(current)}`)}
        caption="Sorting, filtering, searching and paging are all one onQueryChange callback — exactly one round-trip per change."
      />
      {exportUrl && (
        <Note intent="success">
          The export button would request <code>{exportUrl}</code> — the whole
          filtered result, streamed by the server, rather than the ten rows the
          browser happens to be holding.
        </Note>
      )}
      <Note intent="info">
        {isAll ? (
          <>
            Every row matching the query is selected — including the{" "}
            <FormattedNumber value={Math.max(0, result.total - (count ?? 0))} /> the
            server has not sent yet. That is the asymmetry: a client-side
            "select all" is a set of ids, a server-side one is a predicate plus
            an exclusion list.
          </>
        ) : (
          <>
            Selected: <FormattedNumber value={count ?? 0} />. Select every row on
            the page and the bar offers "select all {result.total} matching",
            which is a different claim from "these ten".
          </>
        )}
      </Note>
    </div>
  )
}

/** The same query, as the search string a streaming export endpoint would take. */
function queryDescription(query: DataTableQuery) {
  return new URLSearchParams(queryToSearchParams(query)).toString() || "all=1"
}

/* -------------------------------------------------------------------------- */
/*                        no total, and load-more                             */
/* -------------------------------------------------------------------------- */

const NoTotal = () => {
  const { query, setQuery, result, state } = useOrderQuery({ pageSize: 10 })

  return (
    <div className="flex w-full flex-col gap-3">
      <ServerTable<Order>
        aria-label="Orders without a total"
        columns={columns.slice(0, 5)}
        rows={result.rows}
        getRowId={(order) => String(order.id)}
        query={query}
        onQueryChange={setQuery}
        // No `total`: COUNT(*) over a filtered query is often the slowest part
        // of the page, so the source reports "is there a next page" instead.
        hasMore={result.hasMore}
        tiebreakColumn="reference"
        loadFilterValues={loadFilterValues}
        enableColumnChooser={false}
        isLoading={state === "initial"}
        isRefreshing={state === "refreshing"}
      />
      <Note intent="warning">
        With no total the pager degrades honestly: "showing 11–20 of many", no
        page count, and no last-page button — rather than a page number computed
        from a count nobody asked the database for.
      </Note>
    </div>
  )
}

const LoadMore = () => {
  const [query, setQuery] = useState<DataTableQuery>({ ...emptyQuery, pageSize: 15 })
  const [rows, setRows] = useState<Order[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    queryOrders(query, { signal: controller.signal })
      .then((next) => {
        // Page 0 replaces, every later page appends: the sentinel asks for the
        // next page, it does not ask for a different one.
        setRows((current) => (query.page === 0 ? next.rows : [...current, ...next.rows]))
        setHasMore(next.hasMore)
        setIsLoading(false)
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") setIsLoading(false)
      })
    return () => controller.abort()
  }, [query])

  return (
    <div className="flex w-full flex-col gap-3">
      <ServerTable<Order>
        aria-label="Orders loaded on scroll"
        columns={columns.slice(0, 5)}
        rows={rows}
        getRowId={(order) => String(order.id)}
        query={query}
        onQueryChange={setQuery}
        paginationMode="load-more"
        hasMore={hasMore}
        tiebreakColumn="reference"
        loadFilterValues={loadFilterValues}
        height={360}
        stickyHeader
        isLoading={isLoading && rows.length === 0}
        isRefreshing={isLoading && rows.length > 0}
      />
      <Note intent="info">
        Infinite scroll is react-aria's <code>TableLoadMoreItem</code>: a
        sentinel row at the end of the collection that fires when it comes into
        view. Sorting or filtering resets to page 0, because the rows above are
        the answer to a query that no longer applies.
      </Note>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                       optimistic update and rollback                       */
/* -------------------------------------------------------------------------- */

const Optimistic = () => {
  const { query, setQuery, result, state } = useOrderQuery({ pageSize: 8 })
  const [overrides, setOverrides] = useState<Record<number, Order["status"]>>({})
  const [failed, setFailed] = useState<string | null>(null)

  const rows = result.rows.map((order) =>
    overrides[order.id] ? { ...order, status: overrides[order.id] } : order,
  )

  const markPaid = async (order: Order) => {
    setFailed(null)
    setOverrides((current) => ({ ...current, [order.id]: "Paid" }))
    await delay(700)
    // Every third reference fails, so the rollback is visible rather than
    // theoretical.
    if (order.id % 3 === 0) {
      setOverrides((current) => {
        const next = { ...current }
        delete next[order.id]
        return next
      })
      setFailed(`${order.reference} could not be marked paid — the change was rolled back.`)
    }
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <ServerTable<Order>
        aria-label="Orders with optimistic updates"
        columns={columns.slice(0, 5)}
        rows={rows}
        getRowId={(order) => String(order.id)}
        query={query}
        onQueryChange={setQuery}
        total={result.total}
        tiebreakColumn="reference"
        loadFilterValues={loadFilterValues}
        enableColumnChooser={false}
        isLoading={state === "initial"}
        isRefreshing={state === "refreshing"}
        rowActions={(order) => (
          <Button
            intent="ghost"
            size="xs"
            isDisabled={order.status === "Paid"}
            onPress={() => void markPaid(order)}
          >
            Mark paid
          </Button>
        )}
      />
      {failed && <Note intent="danger">{failed}</Note>}
      <Note intent="info">
        The row changes before the server answers and changes back if it
        refuses. The override lives beside the query result rather than in it,
        so the next query — a sort, a filter, a page — replaces the rows without
        having to reconcile them.
      </Note>
    </div>
  )
}

/* ------------------------- a cell edit is a mutation ---------------------- */

const orderSchema = v.object({
  customer: v.pipe(v.string(), v.minLength(3, "At least three characters")),
  status: v.picklist(STATUSES, "Pick a status"),
  amount: v.pipe(v.number("Enter an amount"), v.minValue(1, "At least €1")),
})

/** Three of the six columns become editable; the rest have no `editor`. */
const editors: Record<string, DataTableColumn<Order>["editor"]> = {
  customer: ({ field, label }) => <ConformField field={field} label={label} />,
  amount: ({ field, label }) => <ConformNumberField field={field} label={label} />,
  status: ({ field, label }) => (
    <ConformSelect field={field} label={label}>
      {STATUSES.map((status) => (
        <SelectItem key={status} id={status}>
          {status}
        </SelectItem>
      ))}
    </ConformSelect>
  ),
}
const editableColumns = columns.map((c) => ({ ...c, editor: editors[c.id] }))

/**
 * Editing a cell server-side is the optimistic-update problem again, one field
 * smaller. The override lives beside the query result rather than in it, just as
 * it does for "mark paid" above: the rows prop is the answer to the last query,
 * so an edit is a patch over it until the next replaces both. What is new is
 * that a commit can be refused twice — by the schema, in the cell, under the
 * control; and by the server, which is a rollback and a sentence.
 */
const EditableCells = () => {
  const { query, setQuery, result, state } = useOrderQuery({ pageSize: 6 })
  const [overrides, setOverrides] = useState<Record<number, Partial<Order>>>({})
  // The cell being saved, not a flag: a commit lands the moment the control
  // settles, so the request is routinely still in flight while the user is
  // already in a different cell.
  const [saving, setSaving] = useState<DataTableCellAddress | null>(null)
  const [failed, setFailed] = useState<string | null>(null)
  const rows = result.rows.map((order) => ({ ...order, ...overrides[order.id] }))

  const save = async (order: Order, cell: DataTableCellAddress, patch: Partial<Order>) => {
    setFailed(null)
    setOverrides((current) => ({ ...current, [order.id]: { ...current[order.id], ...patch } }))
    setSaving(cell)
    await delay(600)
    setSaving(null)
    // Every third reference fails, so the rollback is visible rather than theoretical.
    if (order.id % 3 !== 0) return
    setOverrides((current) => {
      const next = { ...current }
      delete next[order.id]
      return next
    })
    setFailed(`${order.reference} was refused by the server — the change was rolled back.`)
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <ServerTable<Order>
        aria-label="Orders with editable cells"
        columns={editableColumns}
        rows={rows}
        getRowId={(order) => String(order.id)}
        query={query}
        onQueryChange={setQuery}
        total={result.total}
        tiebreakColumn="reference"
        loadFilterValues={loadFilterValues}
        enableColumnChooser={false}
        isLoading={state === "initial"}
        isRefreshing={state === "refreshing"}
        cellEditSchema={orderSchema}
        savingCell={saving}
        onCellEdit={({ row, rowId, columnId, value }) =>
          void save(row, { rowId, columnId }, value as Partial<Order>)
        }
      />
      {failed && <Note intent="danger">{failed}</Note>}
      <Note intent="info">
        Customer, Status and Amount edit in place; the other three have no{" "}
        <code>editor</code> and Tab skips over them. Sort by Amount and then edit
        one: the row moves under the cursor as the new value re-sorts it, and
        focus follows the cell rather than falling to the body.
      </Note>
    </div>
  )
}

export const serverTableExamples: ComponentExample[] = [
  {
    title: "Server-driven orders",
    description:
      "300 orders behind a stand-in database. Sort (shift-click for a second column), filter from the header popovers — Status, Country and Customer load their distinct values with counts, searchable and paged on scroll — search, and page. Each of those is one onQueryChange and one query.",
    render: () => <ServerDriven />,
  },
  {
    title: "When the total is too expensive",
    description:
      "The same table with hasMore instead of total. The pager says \"of many\" and offers no last page, which is the honest shape when COUNT(*) over the filtered query is the slowest thing on the page.",
    render: () => <NoTotal />,
  },
  {
    title: "Infinite scroll",
    description:
      "paginationMode=\"load-more\" replaces the pager with react-aria's load-more sentinel. Scroll to the bottom of the 360px viewport to fetch the next page; sorting or filtering starts again from page 0.",
    render: () => <LoadMore />,
  },
  {
    title: "Optimistic update and rollback",
    description:
      "Mark an order paid and the row updates immediately. One in three fails on the server and rolls back with an explanation — the case a spinner-free optimistic update has to get right.",
    render: () => <Optimistic />,
  },
  {
    title: "Editing a cell, against a server",
    description:
      "A cell commit is a mutation: the value changes before the server answers, the cell shows that it is in flight, and one in three is refused and rolled back with an explanation. The schema is checked in the browser first, so a bad amount never becomes a request at all.",
    render: () => <EditableCells />,
  },
]
