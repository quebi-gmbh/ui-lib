/**
 * The two tables, rendered.
 *
 * `tests/data-table-model.test.ts` covers the headless core. What is left for a
 * rendering test is the seam between the model and react-aria: that a press on
 * a header becomes a sort in the row model rather than a decoration, that a
 * filter popover's Conform form narrows the rows, that the selection model
 * survives a page change, and that AsyncTable reports one query per change and
 * sorts nothing itself.
 */
import { describe, expect, test } from "bun:test"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { AsyncTable } from "../../src/components/async-table"
import { DataTable } from "../../src/components/data-table"
import type { DataTableColumn, DataTableQuery } from "../../src/lib/data-table"
import { emptyQuery } from "../../src/lib/data-table"

interface Order {
  id: number
  reference: string
  status: string
  amount: number
}

const ORDERS: Order[] = Array.from({ length: 24 }, (_, i) => ({
  id: i + 1,
  reference: `ORD-${1000 + i}`,
  status: ["Paid", "Pending", "Shipped"][i % 3],
  amount: (i * 13) % 500,
}))

const columns: DataTableColumn<Order>[] = [
  { id: "reference", header: "Reference", accessorKey: "reference" },
  { id: "status", header: "Status", accessorKey: "status", filterVariant: "enum" },
  { id: "amount", header: "Amount", accessorKey: "amount", align: "end" },
]

/** Text anywhere in the document, for messages assembled from several nodes. */
const bodyText = () => document.body.textContent ?? ""

/**
 * The reference of every row currently drawn, in order. Queried through the
 * DOM rather than by role: react-aria hides the rest of the page from the
 * accessibility tree while a popover is open, which is correct behaviour and
 * would make a role query mean something different mid-test.
 */
const references = () =>
  Array.from(document.querySelectorAll("tbody tr"))
    .map((row) => row.textContent?.match(/ORD-\d+/)?.[0])
    .filter(Boolean)

describe("DataTable", () => {
  test("renders an ARIA grid with the columns it was given", () => {
    render(
      <DataTable<Order>
        aria-label="Orders"
        columns={columns}
        data={ORDERS}
        getRowId={(order) => String(order.id)}
        defaultPageSize={5}
      />,
    )
    expect(screen.getByRole("grid", { name: "Orders" })).toBeInTheDocument()
    for (const name of ["Reference", "Status", "Amount"]) {
      expect(screen.getByRole("columnheader", { name: new RegExp(name) })).toBeInTheDocument()
    }
    expect(references()).toHaveLength(5)
  })

  test("a press on a header sorts the rows and announces the direction", async () => {
    render(
      <DataTable<Order>
        aria-label="Sortable orders"
        columns={columns}
        data={ORDERS}
        getRowId={(order) => String(order.id)}
        defaultPageSize={5}
      />,
    )
    const user = userEvent.setup()
    await user.click(screen.getByText("Amount"))
    // The affordance is react-aria's — aria-sort is how a screen reader is told
    // the column is sorted at all — and the ordering is the row model's.
    expect(
      screen.getByRole("columnheader", { name: /Amount/ }).getAttribute("aria-sort"),
    ).toBe("ascending")
    expect(references()[0]).toBe("ORD-1000")

    await user.click(screen.getByText("Amount"))
    expect(
      screen.getByRole("columnheader", { name: /Amount/ }).getAttribute("aria-sort"),
    ).toBe("descending")
  })

  test("shift-click adds a second sort column and shows its priority", async () => {
    render(
      <DataTable<Order>
        aria-label="Multi-sorted orders"
        columns={columns}
        data={ORDERS}
        getRowId={(order) => String(order.id)}
        defaultPageSize={5}
      />,
    )
    const user = userEvent.setup()
    await user.click(screen.getByText("Status"))
    await user.keyboard("{Shift>}")
    await user.click(screen.getByText("Amount"))
    await user.keyboard("{/Shift}")
    // react-aria's onSortChange carries no modifier, so the shift key is read
    // in the capture phase. If that ever stops working the badges vanish.
    expect(screen.getByRole("columnheader", { name: /Status/ }).textContent).toContain("1")
    expect(screen.getByRole("columnheader", { name: /Amount/ }).textContent).toContain("2")
  })

  test("a column filter is a Conform form, and applying it narrows the rows", async () => {
    render(
      <DataTable<Order>
        aria-label="Filterable orders"
        columns={columns}
        data={ORDERS}
        getRowId={(order) => String(order.id)}
        enablePagination={false}
      />,
    )
    const user = userEvent.setup()
    expect(references()).toHaveLength(24)
    await user.click(screen.getByRole("button", { name: /Filter Status/ }))
    const values = await screen.findByRole("group", { name: "Status values" })
    await user.click(within(values).getByRole("checkbox", { name: /Paid/ }))
    // Nothing has happened yet: the pending edit is a transaction, which is
    // what keeps a server-driven table to one round-trip per change.
    expect(references()).toHaveLength(24)

    await user.click(screen.getByRole("button", { name: "Apply" }))
    expect(references()).toHaveLength(8)
    // The chip names the value rather than counting it, for a single choice.
    expect(bodyText()).toContain("Status · Paid")
  })

  test("the selection survives a page change", async () => {
    render(
      <DataTable<Order>
        aria-label="Selectable orders"
        columns={columns}
        data={ORDERS}
        getRowId={(order) => String(order.id)}
        defaultPageSize={5}
        selectionMode="multiple"
      />,
    )
    const user = userEvent.setup()
    const [firstRow] = screen.getAllByRole("row").slice(1)
    await user.click(within(firstRow).getByRole("checkbox"))
    expect(bodyText()).toContain("1 row selected")

    await user.click(screen.getByRole("button", { name: "Next page" }))
    // react-aria reported a set with none of page 1 in it; the model keeps it.
    expect(bodyText()).toContain("1 row selected")
    await user.click(screen.getByRole("button", { name: "Previous page" }))
    const checkbox = within(screen.getAllByRole("row")[1]).getByRole("checkbox")
    expect((checkbox as HTMLInputElement).checked).toBe(true)
  })

  test("an empty dataset and an empty result say different things", async () => {
    const { rerender } = render(
      <DataTable<Order>
        aria-label="Empty orders"
        columns={columns}
        data={[]}
        getRowId={(order) => String(order.id)}
        emptyMessage="No orders yet."
        noResultsMessage="No orders match your filters."
      />,
    )
    expect(screen.getByText("No orders yet.")).toBeInTheDocument()

    rerender(
      <DataTable<Order>
        aria-label="Empty orders"
        columns={columns}
        data={ORDERS}
        getRowId={(order) => String(order.id)}
        columnFilters={[{ column: "reference", value: "nothing-matches" }]}
        onColumnFiltersChange={() => undefined}
        emptyMessage="No orders yet."
        noResultsMessage="No orders match your filters."
      />,
    )
    expect(await screen.findByText("No orders match your filters.")).toBeInTheDocument()
  })

  test("an expanded row adds a detail row that cannot be selected", async () => {
    render(
      <DataTable<Order>
        aria-label="Expandable orders"
        columns={columns}
        data={ORDERS.slice(0, 3)}
        getRowId={(order) => String(order.id)}
        enablePagination={false}
        selectionMode="multiple"
        renderDetail={(order) => <span>Detail for {order.reference}</span>}
      />,
    )
    const user = userEvent.setup()
    await user.click(screen.getAllByRole("button", { name: "Expand row" })[0])
    const detail = screen.getByText("Detail for ORD-1000")
    expect(detail).toBeInTheDocument()
    // One spanning cell, and no selection checkbox of its own.
    const detailRow = detail.closest("tr")
    expect(detailRow).not.toBeNull()
    expect(within(detailRow as HTMLElement).queryByRole("checkbox")).toBeNull()
  })
})

describe("AsyncTable", () => {
  /** Records every query the table asks for; never sorts the rows it is given. */
  function Harness({ onQuery }: { onQuery: (query: DataTableQuery) => void }) {
    const [query, setQuery] = useState<DataTableQuery>({ ...emptyQuery, pageSize: 5 })
    const page = ORDERS.slice(query.page * query.pageSize, (query.page + 1) * query.pageSize)
    return (
      <AsyncTable<Order>
        aria-label="Server orders"
        columns={columns}
        rows={page}
        getRowId={(order) => String(order.id)}
        query={query}
        onQueryChange={(next) => {
          onQuery(next)
          setQuery(next)
        }}
        total={ORDERS.length}
        tiebreakColumn="reference"
        selectionMode="multiple"
      />
    )
  }

  test("a sort is reported as a query, with the tiebreaker attached", async () => {
    const queries: DataTableQuery[] = []
    render(<Harness onQuery={(query) => queries.push(query)} />)
    const user = userEvent.setup()
    const before = references()

    await user.click(screen.getByText("Amount"))
    expect(queries).toHaveLength(1)
    expect(queries[0].sort).toEqual([
      { column: "amount", direction: "asc" },
      // Without this, page 2 of a sort with ties can repeat a row from page 1.
      { column: "reference", direction: "asc" },
    ])
    // The component reordered nothing: the rows are still the ones it was given.
    expect(references()).toEqual(before)
    expect(
      screen.getByRole("columnheader", { name: /Amount/ }).getAttribute("aria-sort"),
    ).toBe("ascending")
  })

  test("paging is one query, and the pager says where it is", async () => {
    const queries: DataTableQuery[] = []
    render(<Harness onQuery={(query) => queries.push(query)} />)
    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: "Next page" }))
    expect(queries).toHaveLength(1)
    expect(queries[0].page).toBe(1)
    expect(screen.getByText(/Showing/).textContent).toContain("6")
    expect(screen.getByText(/Showing/).textContent).toContain("24")
  })

  test("select-all means every row matching the query, not every row on screen", async () => {
    render(<Harness onQuery={() => undefined} />)
    const user = userEvent.setup()
    const header = screen.getAllByRole("row")[0]
    await user.click(within(header).getByRole("checkbox"))
    expect(bodyText()).toContain("all matching")
    // All 24, not the 5 the browser is holding.
    expect(bodyText()).toContain("24 rows selected")
  })
})
