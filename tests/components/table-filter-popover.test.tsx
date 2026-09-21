/**
 * The seam between a filter panel and the overlay hosting it.
 *
 * `TableFilterPanel` is a form and nothing else: it cannot close the popover
 * it happens to be inside, because it is meant to be mounted outside one too.
 * `TableShell` owns that popover's open state and hands `renderFilter` a way
 * to close it; `DataTable` and `ServerTable` pass it through as the panel's
 * `onClose`. What is asserted here is the end of that chain — pressing Apply
 * puts the rows it produced in front of the user rather than behind the panel
 * that asked for them, and holds react-aria's scroll lock no longer than the
 * interaction lasts.
 */
import { describe, expect, test } from "bun:test"
import { render, screen, waitFor, within } from "@testing-library/react"
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
  { id: "amount", header: "Amount", accessorKey: "amount", align: "end", filterVariant: "number" },
]

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

const table = () => (
  <DataTable<Order>
    aria-label="Filterable orders"
    columns={columns}
    data={ORDERS}
    getRowId={(order) => String(order.id)}
    enablePagination={false}
  />
)

describe("a column filter popover", () => {
  test("closes when the filter it holds is applied", async () => {
    render(table())
    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: /Filter Status/ }))
    await user.click(
      within(await screen.findByRole("group", { name: "Status values" })).getByRole("checkbox", {
        name: /Paid/,
      }),
    )
    // Still open, and nothing applied: the pending edit is a transaction.
    expect(references()).toHaveLength(24)

    await user.click(screen.getByRole("button", { name: "Apply" }))
    await waitFor(() => expect(screen.queryByRole("button", { name: "Apply" })).toBeNull())
    expect(references()).toHaveLength(8)
    // react-aria locks the page while an overlay is up; the result of the
    // filter is not reachable by scrolling until the overlay lets go.
    expect(document.documentElement.style.overflow).not.toBe("hidden")
  })

  test("closes when the filter it holds is cleared", async () => {
    render(table())
    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: /Filter Status/ }))
    await user.click(
      within(await screen.findByRole("group", { name: "Status values" })).getByRole("checkbox", {
        name: /Paid/,
      }),
    )
    await user.click(screen.getByRole("button", { name: "Apply" }))
    await waitFor(() => expect(references()).toHaveLength(8))

    await user.click(screen.getByRole("button", { name: /Filter Status/ }))
    await user.click(await screen.findByRole("button", { name: "Clear" }))
    await waitFor(() => expect(screen.queryByRole("button", { name: "Clear" })).toBeNull())
    expect(references()).toHaveLength(24)
  })

  test("stays open when the filter it holds does not validate", async () => {
    render(table())
    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: /Filter Amount/ }))
    await user.type(await screen.findByRole("textbox", { name: "From" }), "900")
    await user.type(screen.getByRole("textbox", { name: "To" }), "100")
    await user.click(screen.getByRole("button", { name: "Apply" }))

    // Nothing was applied, so there is nothing to get out of the way of: the
    // message is on the field, in the panel still open to show it.
    expect(document.body.textContent).toContain("The lower bound must not be above the upper one")
    expect(screen.getByRole("button", { name: "Apply" })).toBeInTheDocument()
    expect(references()).toHaveLength(24)
  })
})
