/**
 * The chrome around the rows.
 *
 * Every case here is a defect that was visible on `/components/async-table` at
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
import { DataTable } from "../../src/components/data-table"
import type { DataTableColumn } from "../../src/lib/data-table"

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
    // The pager's own form, plus the nav buttons that sit beside it.
    const pager = screen.getByRole("button", { name: "Next page" }).closest("form")
    expect(pager).not.toBeNull()
    const controls = Array.from(
      // biome-ignore lint/style/noNonNullAssertion: asserted not null on the line above.
      pager!.querySelectorAll("button, input, [role=button]"),
    ).filter((element) => chromeHeight(element) !== null)
    // Page size, page jump, Go, and the four nav buttons.
    expect(controls.length).toBeGreaterThanOrEqual(7)
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
    expect(screen.queryByRole("button", { name: "Increase" })).toBeNull()
    expect(screen.queryByRole("button", { name: "Decrease" })).toBeNull()

    const jump = screen.getByRole("textbox", { name: "Go to page" })
    expect(jump).toHaveValue("1")
    const user = userEvent.setup()
    await user.clear(jump)
    await user.type(jump, "3")
    await user.click(screen.getByRole("button", { name: "Go" }))
    expect(screen.getByText(/Showing/).textContent).toContain("21")
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
