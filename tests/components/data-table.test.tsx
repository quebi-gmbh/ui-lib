/**
 * The two tables, rendered.
 *
 * `tests/data-table-model.test.ts` covers the headless core. What is left for a
 * rendering test is the seam between the model and react-aria: that a press on
 * a header becomes a sort in the row model rather than a decoration, that a
 * filter popover's Conform form narrows the rows, that the selection model
 * survives a page change, and that ServerTable reports one query per change and
 * sorts nothing itself.
 */
import { describe, expect, test } from "bun:test"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { renderToString } from "react-dom/server"
import { DataTable } from "../../src/components/data-table"
import { ServerTable } from "../../src/components/server-table"
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

/**
 * The same columns with the first two under a band, and Amount left outside it.
 * A band over some but not all of the columns is the shape that has to stay
 * rectangular; see the assertions in the banded-header test.
 */
const bandedColumns: DataTableColumn<Order>[] = [
  {
    id: "order",
    header: "Order",
    columns: [columns[0], columns[1]],
  },
  columns[2],
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

  test("a grouped column renders one band spanning its leaves, not a label per leaf", () => {
    render(
      <DataTable<Order>
        aria-label="Banded orders"
        columns={bandedColumns}
        data={ORDERS}
        getRowId={(order) => String(order.id)}
        defaultPageSize={5}
        selectionMode="multiple"
      />,
    )
    // Two header rows, because a band is a row of the collection and not an
    // extra line of text inside each leaf header.
    const headerRows = document.querySelectorAll<HTMLTableRowElement>("thead tr")
    expect(headerRows).toHaveLength(2)

    // Once, and spanning both of its leaves — the bug this replaces drew
    // "Order" above Reference and again above Status.
    const bands = screen.getAllByRole("columnheader", { name: "Order" })
    expect(bands).toHaveLength(1)
    expect(bands[0].getAttribute("colspan")).toBe("2")
    expect(bands[0].getAttribute("aria-colspan")).toBe("2")
    expect(bands[0].closest("tr")).toBe(headerRows[0])

    // The leaf row is still the leaf row: every column, each once.
    for (const name of ["Reference", "Status", "Amount"]) {
      const leaf = screen.getByRole("columnheader", { name: new RegExp(name) })
      expect(leaf.closest("tr")).toBe(headerRows[1])
    }

    // A rectangular header is not cosmetic: react-stately fills a short header
    // row with `placeholder` nodes that react-aria-components cannot render, so
    // the ungrouped Amount column and the selection gutter each need a cell of
    // their own above them. Three bands across, spanning four columns.
    const bandCells = headerRows[0].querySelectorAll("th")
    expect(bandCells).toHaveLength(3)
    const spanned = Array.from(bandCells).reduce((total, cell) => total + (cell.colSpan || 1), 0)
    expect(spanned).toBe(4)
    expect(headerRows[1].querySelectorAll("th")).toHaveLength(4)
  })

  test("a band does not take the sort, and the leaf under it still does", async () => {
    render(
      <DataTable<Order>
        aria-label="Sortable banded orders"
        columns={bandedColumns}
        data={ORDERS}
        getRowId={(order) => String(order.id)}
        defaultPageSize={5}
      />,
    )
    const user = userEvent.setup()
    const band = screen.getByRole("columnheader", { name: "Order" })
    expect(band.getAttribute("aria-sort")).toBeNull()
    await user.click(band)
    expect(references()[0]).toBe("ORD-1000")

    await user.click(screen.getByText("Reference"))
    expect(
      screen.getByRole("columnheader", { name: /Reference/ }).getAttribute("aria-sort"),
    ).toBe("ascending")
  })

  test("bands nest as deep as the columns do", () => {
    render(
      <DataTable<Order>
        aria-label="Deeply banded orders"
        columns={[{ id: "all", header: "All", columns: bandedColumns }]}
        data={ORDERS}
        getRowId={(order) => String(order.id)}
        defaultPageSize={5}
        selectionMode="multiple"
      />,
    )
    // Three header rows, and each band spans what is actually under it — the
    // span comes from the collection, so there is no depth the renderer knows
    // about and the model does not.
    expect(document.querySelectorAll("thead tr")).toHaveLength(3)
    expect(screen.getByRole("columnheader", { name: "All" }).getAttribute("colspan")).toBe("3")
    expect(screen.getByRole("columnheader", { name: "Order" }).getAttribute("colspan")).toBe("2")
  })

  test("a band survives resize and virtualization, which measure it themselves", () => {
    const { unmount } = render(
      <DataTable<Order>
        aria-label="Resizable banded orders"
        columns={bandedColumns}
        data={ORDERS}
        getRowId={(order) => String(order.id)}
        allowResize
        defaultPageSize={5}
      />,
    )
    expect(screen.getByRole("columnheader", { name: "Order" }).getAttribute("colspan")).toBe("2")
    unmount()

    // Virtualized, the table is divs rather than a real <table>: the Virtualizer
    // positions every cell from TableLayout, which sums the leaf widths a
    // spanned cell covers. So the band is still one cell, with no colspan to
    // put on a div.
    render(
      <DataTable<Order>
        aria-label="Virtualized banded orders"
        columns={bandedColumns}
        data={ORDERS}
        getRowId={(order) => String(order.id)}
        virtualize
        height={300}
        enablePagination={false}
      />,
    )
    expect(screen.getAllByRole("columnheader", { name: "Order" })).toHaveLength(1)
  })

  test("a server render has one header row, and the band name above each label", () => {
    // Not a style choice: react-stately's buildHeaderRows rewrites the sibling
    // links of the column nodes it chains, and react-aria's SSR path re-commits
    // the collection after every appended column — so the second commit walks a
    // corrupted tree and never finishes (adobe/react-spectrum#10598). This test
    // is the reason the band row is gated on useIsSSR; if it ever hangs, the gate
    // has been removed too early. The test in table.test.tsx is the other half:
    // it fails when the upstream fix ships, which is when this one should become
    // an assertion that the server HTML has two header rows.
    const html = renderToString(
      <DataTable<Order>
        aria-label="Server-rendered banded orders"
        columns={bandedColumns}
        data={ORDERS.slice(0, 2)}
        getRowId={(order) => String(order.id)}
        selectionMode="multiple"
      />,
    )
    const thead = html.slice(html.indexOf("<thead"), html.indexOf("</thead>"))
    expect(thead.match(/<tr/g) ?? []).toHaveLength(1)
    expect(thead).not.toContain("colspan=\"2\"")
    // The band still says which columns it covers, so the gate opening adds a
    // row rather than information.
    expect(thead).toContain("Order")
    expect(thead).toContain("Reference")
  })
})

describe("ServerTable", () => {
  /** Records every query the table asks for; never sorts the rows it is given. */
  function Harness({ onQuery }: { onQuery: (query: DataTableQuery) => void }) {
    const [query, setQuery] = useState<DataTableQuery>({ ...emptyQuery, pageSize: 5 })
    const page = ORDERS.slice(query.page * query.pageSize, (query.page + 1) * query.pageSize)
    return (
      <ServerTable<Order>
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
