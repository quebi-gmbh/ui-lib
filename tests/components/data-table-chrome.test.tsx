/**
 * The chrome around the rows.
 *
 * Every case here is a defect that was visible on `/components/server-table` at
 * ~780px and invisible to every test that existed: a page-jump field with no
 * room left for the number, four control heights in one row, a table that
 * clipped its last columns with no way to scroll to them, two chevrons in
 * every sortable header, and three density buttons drawn with the same glyph.
 *
 * `data-table.test.tsx` next door covers the seam between the model and
 * react-aria; this file is only about the controls around it.
 */
import { describe, expect, test } from "bun:test"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { DataTable } from "../../src/components/data-table"
import { ServerTable } from "../../src/components/server-table"
import { type DataTableColumn, type DataTableQuery, emptyQuery } from "../../src/lib/data-table"

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

describe("table chrome", () => {
  /**
   * The height each control resolves to, read off the classes that set it —
   * happy-dom has no layout, so the class is the only place the height exists.
   * `py-2` with `text-sm` and `size-9.5` are both 38px; the numbers matter less
   * than that every control in a row agrees on one of them.
   */
  const SIZE_TOKENS: Record<string, string> = {
    "py-1.5": "xs",
    "py-2": "sm",
    "py-2.5": "md",
    "size-7.5": "sq-xs",
    "size-9.5": "sq-sm",
    "size-11.5": "sq-md",
    // A pagination page number sets its height outright rather than deriving it
    // from padding: it carries no border and the nav targets beside it do, so
    // the same `py-*` would leave the two 2px apart. Listed here so the numbers
    // are inside the assertion below rather than quietly excused from it — they
    // used to be a hard-coded 32px, which is neither `xs` (30) nor `sm` (38).
    "h-7.5": "xs",
    "h-9.5": "sm",
  }

  const chromeHeight = (element: Element): string | null => {
    for (const token of (element.getAttribute("class") ?? "").split(/\s+/)) {
      if (token in SIZE_TOKENS) return SIZE_TOKENS[token]
    }
    return null
  }

  test("every control in the pager is one height", () => {
    render(
      <DataTable<Order>
        aria-label="Orders"
        columns={columns}
        data={ORDERS}
        getRowId={(order) => String(order.id)}
        defaultPageSize={5}
      />,
    )
    // The whole pager, not one of its forms: the page size and the page jump
    // are separate forms, so that a page size the schema rejects cannot take
    // `Go` down with it.
    const pager = screen.getByRole("button", { name: "Next page" }).closest("[data-slot=table-pager]")
    expect(pager).not.toBeNull()
    const controls = Array.from(
      // biome-ignore lint/style/noNonNullAssertion: asserted not null on the line above.
      pager!.querySelectorAll("button, input, [role=button]"),
    ).filter((element) => chromeHeight(element) !== null)
    // Page size, page jump, Go, the four nav targets, and a page number for
    // each of the five pages 24 rows make at 5 a page.
    expect(controls.length).toBeGreaterThanOrEqual(12)
    expect([...new Set(controls.map(chromeHeight))].sort()).toEqual(["sm", "sq-sm"])
  })

  test("every control in the toolbar is that same height", () => {
    render(
      <DataTable<Order>
        aria-label="Orders"
        columns={columns}
        data={ORDERS}
        getRowId={(order) => String(order.id)}
        defaultPageSize={5}
        exportFilename="orders"
        onRefresh={() => undefined}
      />,
    )
    for (const name of ["Density: Normal", "Choose columns", "Export", "Refresh"]) {
      const control = screen.getByRole("button", { name })
      expect([name, chromeHeight(control)]).toEqual([name, name === "Refresh" ? "sq-sm" : "sm"])
    }
    const search = screen.getByRole("searchbox")
    expect(chromeHeight(search)).toBe("sm")
  })

  test("the page jump shows its number instead of two steppers", async () => {
    render(
      <DataTable<Order>
        aria-label="Orders"
        columns={columns}
        data={ORDERS}
        getRowId={(order) => String(order.id)}
        defaultPageSize={10}
      />,
    )
    // The steppers were ~74px of a 96px field, so the input — `w-full min-w-0`
    // in a flex row — collapsed to nothing and the value never reached a pixel.
    //
    // By label and not by role + name: a stepper's accessible *name* computes
    // to nothing once the field is inside this much markup, so the role query
    // finds no button called "Increase" whether or not one is drawn, and the
    // assertion holds vacuously. `aria-label` is what the button carries and
    // is what is actually being asserted here.
    expect(screen.queryAllByLabelText("Increase")).toHaveLength(0)
    expect(screen.queryAllByLabelText("Decrease")).toHaveLength(0)

    const jump = screen.getByRole("textbox", { name: "Go to page" })
    expect(jump).toHaveValue("1")
    const user = userEvent.setup()
    await user.clear(jump)
    await user.type(jump, "3")
    await user.click(screen.getByRole("button", { name: "Go" }))
    expect(screen.getByText(/Showing/).textContent).toContain("21")
  })

  test("a number filter's two bounds show their numbers, and stack when the host is narrow", async () => {
    render(
      <DataTable<Order>
        aria-label="Orders"
        columns={[
          ...columns.slice(0, 2),
          {
            id: "amount",
            header: "Amount",
            accessorKey: "amount",
            align: "end",
            filterVariant: "number",
          },
        ]}
        data={ORDERS}
        getRowId={(order) => String(order.id)}
        defaultPageSize={5}
      />,
    )
    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: /Filter Amount/ }))
    const from = await screen.findByRole("textbox", { name: "From" })
    const to = screen.getByRole("textbox", { name: "To" })

    // Same ~74px as the page jump, twice over: in a panel ~210px wide (this
    // one inside a `sm:max-w-80` sheet) the two steppers left 26px of input
    // each and neither the value nor the placeholder was legible. A filter
    // bound is typed rather than nudged, and ↑ / ↓ still step.
    expect(screen.queryAllByLabelText("Increase")).toHaveLength(0)
    expect(screen.queryAllByLabelText("Decrease")).toHaveLength(0)

    // The floor under that, and the reason it is a container query: the
    // panel's width is its host's, not the viewport's. happy-dom has no
    // layout, so the classes are the only place the rule exists.
    let row: HTMLElement | null = from.parentElement
    while (row && !row.contains(to)) row = row.parentElement
    expect(row).not.toBeNull()
    expect(row?.className).toContain("flex-col")
    expect(row?.className).toContain("@3xs:flex-row")
    expect(row?.parentElement?.className).toContain("@container")
  })

  test("the pager numbers its pages, and a number is somewhere to press", async () => {
    render(
      <DataTable<Order>
        aria-label="Orders"
        columns={columns}
        data={ORDERS}
        getRowId={(order) => String(order.id)}
        defaultPageSize={5}
      />,
    )
    // 24 rows at 5 a page is 5 pages, which all fit in the window.
    const pager = screen.getByRole("navigation", { name: "Pagination" })
    expect(
      within(pager)
        .getAllByRole("button")
        .map((target) => target.textContent)
        .filter((text) => text !== ""),
    ).toEqual(["1", "2", "3", "4", "5"])

    // The page you are on says so, and is not a press.
    expect(within(pager).getByRole("button", { name: "1" })).toHaveAttribute(
      "aria-current",
      "page",
    )

    await userEvent.setup().click(within(pager).getByRole("button", { name: "3" }))
    expect(screen.getByText(/Showing/).textContent).toContain("11")
    expect(within(pager).getByRole("button", { name: "3" })).toHaveAttribute(
      "aria-current",
      "page",
    )
    // A page is a query parameter here, not an address: no target offers one.
    expect(within(pager).queryAllByRole("link")).toHaveLength(0)
  })

  test("a page count nobody knows is not numbered, and still pages", async () => {
    function Unknown() {
      const [query, setQuery] = useState<DataTableQuery>({ ...emptyQuery, pageSize: 5 })
      return (
        <ServerTable<Order>
          aria-label="Orders"
          columns={columns}
          rows={ORDERS.slice(query.page * 5, query.page * 5 + 5)}
          getRowId={(order) => String(order.id)}
          query={query}
          onQueryChange={setQuery}
          // No `total`: a COUNT(*) nobody ran. There is nothing to number, and
          // a guessed page count is worse than none.
          hasMore
        />
      )
    }
    render(<Unknown />)

    const pager = screen.getByRole("navigation", { name: "Pagination" })
    expect(
      within(pager)
        .getAllByRole("button")
        .map((target) => target.textContent)
        .filter((text) => text !== ""),
    ).toEqual([])
    expect(screen.getByText(/Showing/).textContent).toContain("of many")

    // Previous/next still work, which is what this pager always offered.
    await userEvent.setup().click(within(pager).getByRole("button", { name: "Next page" }))
    expect(screen.getByText(/Showing/).textContent).toContain("6")
    // And the jump stays: not knowing how many pages there are is exactly when
    // typing one helps.
    expect(screen.getByRole("textbox", { name: "Go to page" })).toHaveValue("2")
  })

  test("the page jump follows the page you navigated to", async () => {
    render(
      <DataTable<Order>
        aria-label="Orders"
        columns={columns}
        data={ORDERS}
        getRowId={(order) => String(order.id)}
        defaultPageSize={10}
      />,
    )
    const user = userEvent.setup()
    // Re-queried every time. The field is controlled now and does not remount,
    // but a reference held across a navigation would still pass on a detached
    // node if it ever went back to remounting.
    const jump = () => screen.getByRole("textbox", { name: "Go to page" })

    expect(jump()).toHaveValue("1")
    await user.click(screen.getByRole("button", { name: "Next page" }))
    expect(screen.getByText(/Showing/).textContent).toContain("11")
    // The whole bug: the table moved and the number box stayed on page 1,
    // because `defaultValue` on an uncontrolled NumberField is read at mount
    // and the Conform form id changing is not a mount.
    expect(jump()).toHaveValue("2")

    await user.click(screen.getByRole("button", { name: "Last page" }))
    expect(jump()).toHaveValue("3")
    await user.click(screen.getByRole("button", { name: "First page" }))
    expect(jump()).toHaveValue("1")
  })

  test("the page jump keeps the number you typed, and the focus", async () => {
    render(
      <DataTable<Order>
        aria-label="Orders"
        columns={columns}
        data={ORDERS}
        getRowId={(order) => String(order.id)}
        defaultPageSize={10}
      />,
    )
    const user = userEvent.setup()
    const jump = screen.getByRole("textbox", { name: "Go to page" })
    await user.clear(jump)
    await user.type(jump, "3")
    await user.click(screen.getByRole("button", { name: "Go" }))

    expect(screen.getByText(/Showing/).textContent).toContain("21")
    // The user's own jump is not an external change: remounting here would
    // re-seed the field to the page it already shows and throw the focus away
    // mid-interaction, which is what `markPushed` exists to prevent.
    expect(screen.getByRole("textbox", { name: "Go to page" })).toBe(jump)
    expect(jump).toHaveValue("3")
  })

  test("the page jump says what it is, and is not offered for one page", () => {
    const { unmount } = render(
      <DataTable<Order>
        aria-label="Orders"
        columns={columns}
        data={ORDERS}
        getRowId={(order) => String(order.id)}
        defaultPageSize={10}
      />,
    )
    // A visible label, not only an aria-label: the reported row was a bare
    // number box next to a button reading "Go".
    expect(screen.getByText("Go to page")).toBeInTheDocument()
    unmount()

    render(
      <DataTable<Order>
        aria-label="Orders"
        columns={columns}
        data={ORDERS}
        getRowId={(order) => String(order.id)}
        defaultPageSize={50}
      />,
    )
    // One page: "Enter a page between 1 and 1" is the only thing the field
    // could ever say, so it is not there to say it.
    expect(screen.queryByRole("textbox", { name: "Go to page" })).toBeNull()
    expect(screen.queryByRole("button", { name: "Go" })).toBeNull()
  })

  test("a page size outside the offered list is still offered, so Go works", async () => {
    render(
      <DataTable<Order>
        aria-label="Orders"
        columns={columns}
        data={ORDERS}
        getRowId={(order) => String(order.id)}
        // Not one of the default pageSizes — the shape half the gallery's
        // examples use. The select had nothing to select, so the pager's
        // Conform form was permanently invalid and the jump beside it dead.
        defaultPageSize={8}
      />,
    )
    expect(screen.getByRole("button", { name: /Rows per page/ }).textContent).toContain("8 / page")

    const user = userEvent.setup()
    const jump = screen.getByRole("textbox", { name: "Go to page" })
    await user.clear(jump)
    await user.type(jump, "2")
    await user.click(screen.getByRole("button", { name: "Go" }))
    expect(screen.getByText(/Showing/).textContent).toContain("9")
    expect(document.body.textContent).not.toContain("Invalid type")
  })

  test("the table scrolls its overflow rather than clipping it", () => {
    render(
      <DataTable<Order>
        aria-label="Orders"
        columns={columns}
        data={ORDERS}
        getRowId={(order) => String(order.id)}
        defaultPageSize={5}
      />,
    )
    const table = document.querySelector("table")
    expect(table).not.toBeNull()
    // The surface used to be `overflow-hidden` unless `allowResize` was set,
    // which put the last columns — and any pinned column's scrollport — out of
    // reach on a narrow viewport.
    const scroller = table?.closest(".overflow-auto")
    expect(scroller).not.toBeNull()
    for (let node = table?.parentElement; node; node = node.parentElement) {
      expect(node.className).not.toContain("overflow-hidden")
      if (node === scroller) break
    }
  })

  test("a sortable header carries one chevron, and the menu is not another", () => {
    render(
      <DataTable<Order>
        aria-label="Orders"
        columns={columns}
        data={ORDERS}
        getRowId={(order) => String(order.id)}
        defaultPageSize={5}
      />,
    )
    const header = screen.getByRole("columnheader", { name: /Reference/ })
    // One chevron: the sort indicator. The column menu's trigger used to be a
    // second, near-identical one right beside it.
    expect(header.querySelectorAll(".lucide-chevron-down")).toHaveLength(1)
    const menu = within(header).getByRole("button", { name: /Options for Reference/ })
    expect(menu.querySelector(".lucide-ellipsis-vertical")).not.toBeNull()
  })

  test("density is a named menu of three, not three identical glyphs", async () => {
    render(
      <DataTable<Order>
        aria-label="Orders"
        columns={columns}
        data={ORDERS}
        getRowId={(order) => String(order.id)}
        defaultPageSize={5}
      />,
    )
    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: "Density: Normal" }))
    const items = screen.getAllByRole("menuitemradio")
    expect(items.map((item) => item.textContent)).toEqual(["Compact", "Normal", "Comfortable"])
    await user.click(screen.getByRole("menuitemradio", { name: "Compact" }))
    expect(screen.getByRole("button", { name: "Density: Compact" })).toBeInTheDocument()
  })
})
