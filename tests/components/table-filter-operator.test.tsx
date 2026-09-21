/**
 * Authoring an operator from a column header.
 *
 * The model has carried one since task #193 — a condition reading `is not`
 * filtered correctly, chipped correctly and survived a round trip through a
 * URL — but no table chrome could write one, so `is not` was something a table
 * could receive and never author (task #201). `FilterPanel`'s `editOperator`
 * is that control, and what is asserted here is the three things it has to be
 * true about:
 *
 * - it **applies**, through the same one-commit-per-Apply transaction as the
 *   value beside it, so a change of question and a change of value reach the
 *   host together and dismissing the popover discards both;
 * - it is **offered only where it means something** — not on a variant with one
 *   operator, and not on a column whose own `filterFn` is its own operator;
 * - `ServerTable` **does not offer it unasked**, because its rows come from a
 *   backend that may only implement the default and nothing in the client could
 *   notice the difference.
 */
import { describe, expect, test } from "bun:test"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { DataTable } from "../../src/components/data-table"
import { ServerTable } from "../../src/components/server-table"
import { type DataTableColumn, type DataTableQuery, emptyQuery } from "../../src/lib/data-table"

interface Order {
  id: number
  reference: string
  customer: string
  status: string
  isPriority: boolean
}

const CUSTOMERS = ["Nova Labs", "Orbit GmbH", "Nova Works", "Delta AG"]

const ORDERS: Order[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  reference: `ORD-${1000 + i}`,
  customer: CUSTOMERS[i % CUSTOMERS.length],
  status: ["Paid", "Pending", "Shipped"][i % 3],
  isPriority: i % 4 === 0,
}))

const columns: DataTableColumn<Order>[] = [
  { id: "reference", header: "Reference", accessorKey: "reference" },
  { id: "customer", header: "Customer", accessorKey: "customer", filterVariant: "text" },
  { id: "status", header: "Status", accessorKey: "status", filterVariant: "enum" },
  {
    id: "isPriority",
    header: "Priority",
    accessorKey: "isPriority",
    filterVariant: "boolean",
    cell: ({ row }) => (row.isPriority ? "Yes" : "No"),
  },
]

/**
 * The reference of every row drawn, in order. Through the DOM rather than by
 * role: react-aria hides the rest of the page from the accessibility tree
 * while a popover is open, so a role query means something different mid-test.
 */
const references = () =>
  Array.from(document.querySelectorAll("tbody tr"))
    .map((row) => row.textContent?.match(/ORD-\d+/)?.[0])
    .filter(Boolean)

const openFilter = async (user: ReturnType<typeof userEvent.setup>, column: string) =>
  user.click(screen.getByRole("button", { name: new RegExp(`Filter ${column}`) }))

const pickOperator = async (
  user: ReturnType<typeof userEvent.setup>,
  field: string,
  label: string,
) => {
  await user.click(await screen.findByRole("button", { name: new RegExp(`${field} operator`) }))
  await user.click(await screen.findByRole("option", { name: label }))
}

describe("a column header's operator select", () => {
  test("applies the operator with the value, in one commit", async () => {
    render(
      <DataTable<Order>
        aria-label="Orders"
        columns={columns}
        data={ORDERS}
        getRowId={(order) => String(order.id)}
        enablePagination={false}
      />,
    )
    const user = userEvent.setup()

    await openFilter(user, "Customer")
    await pickOperator(user, "Customer", "does not contain")
    await user.type(await screen.findByRole("textbox", { name: "Customer" }), "Nova")

    // Nothing has reached the table yet: the question and the answer are one
    // transaction, and Apply is the end of it.
    expect(references()).toHaveLength(12)

    await user.click(screen.getByRole("button", { name: "Apply" }))
    await waitFor(() => expect(screen.queryByRole("button", { name: "Apply" })).toBeNull())

    // Six of the twelve customers are a Nova; the negation keeps the rest.
    expect(references()).toHaveLength(6)
    expect(document.body.textContent).not.toContain("Nova Labs")
    // And the chip says which question was asked, not just which value.
    expect(document.body.textContent).toContain("does not contain")
  })

  test("discards a pending operator when the popover is dismissed", async () => {
    render(
      <DataTable<Order>
        aria-label="Orders"
        columns={columns}
        data={ORDERS}
        getRowId={(order) => String(order.id)}
        enablePagination={false}
      />,
    )
    const user = userEvent.setup()

    await openFilter(user, "Status")
    await user.click(
      within(await screen.findByRole("group", { name: "Status values" })).getByRole("checkbox", {
        name: /Paid/,
      }),
    )
    await user.click(screen.getByRole("button", { name: "Apply" }))
    await waitFor(() => expect(references()).toHaveLength(4))

    await openFilter(user, "Status")
    await pickOperator(user, "Status", "is not")
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("button", { name: "Apply" })).toBeNull())

    // Dismissing is a discard, so `is` is still the applied question.
    expect(references()).toHaveLength(4)

    // And re-opening starts from the applied operator, not the abandoned one.
    await openFilter(user, "Status")
    expect(await screen.findByRole("button", { name: /Status operator/ })).toHaveTextContent("is")
    expect(screen.getByRole("button", { name: /Status operator/ })).not.toHaveTextContent("is not")
  })

  test("is not drawn for a variant with only one operator", async () => {
    render(
      <DataTable<Order>
        aria-label="Orders"
        columns={columns}
        data={ORDERS}
        getRowId={(order) => String(order.id)}
        enablePagination={false}
      />,
    )
    const user = userEvent.setup()

    await openFilter(user, "Priority")
    // `Yes / No / Any` already says everything `is not` would.
    await screen.findByRole("button", { name: "Apply" })
    expect(screen.queryByRole("button", { name: /Priority operator/ })).toBeNull()
  })

  test("is not drawn for a column that answers with its own predicate", async () => {
    render(
      <DataTable<Order>
        aria-label="Orders"
        columns={columns.map((column) =>
          column.id === "customer"
            ? { ...column, filterFn: (value: unknown) => String(value).startsWith("N") }
            : column,
        )}
        data={ORDERS}
        getRowId={(order) => String(order.id)}
        enablePagination={false}
      />,
    )
    const user = userEvent.setup()

    await openFilter(user, "Customer")
    await screen.findByRole("button", { name: "Apply" })
    // The predicate is handed the operator and free to ignore it, so the header
    // does not offer to change a question only that function can answer.
    expect(screen.queryByRole("button", { name: /Customer operator/ })).toBeNull()
  })

  test("can be switched off for the whole table", async () => {
    render(
      <DataTable<Order>
        aria-label="Orders"
        columns={columns}
        data={ORDERS}
        getRowId={(order) => String(order.id)}
        enablePagination={false}
        enableFilterOperators={false}
      />,
    )
    const user = userEvent.setup()

    await openFilter(user, "Customer")
    // With no select, the panel says the question in the field's own label.
    expect(await screen.findByRole("textbox", { name: "Customer contains" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Customer operator/ })).toBeNull()
  })
})

/** A ServerTable holding its own query, so `onQueryChange` is observable. */
function ServerOrders({ enableFilterOperators }: { enableFilterOperators?: boolean }) {
  const [query, setQuery] = useState<DataTableQuery>(emptyQuery)
  return (
    <>
      <ServerTable<Order>
        aria-label="Server orders"
        columns={columns}
        rows={ORDERS}
        getRowId={(order) => String(order.id)}
        query={query}
        onQueryChange={setQuery}
        total={ORDERS.length}
        enableFilterOperators={enableFilterOperators}
      />
      <output>{query.filters.map((condition) => condition.operator).join(",")}</output>
    </>
  )
}

describe("ServerTable's operator select", () => {
  test("is off unless the host says its query can answer one", async () => {
    render(<ServerOrders />)
    const user = userEvent.setup()

    await openFilter(user, "Customer")
    await screen.findByRole("button", { name: "Apply" })
    expect(screen.queryByRole("button", { name: /Customer operator/ })).toBeNull()
  })

  test("reports the chosen operator in the query when it is on", async () => {
    render(<ServerOrders enableFilterOperators />)
    const user = userEvent.setup()

    await openFilter(user, "Customer")
    await pickOperator(user, "Customer", "does not contain")
    await user.type(await screen.findByRole("textbox", { name: "Customer" }), "Nova")
    await user.click(screen.getByRole("button", { name: "Apply" }))

    // The whole new query, operator included — the rows are the server's job.
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toBe("doesNotContain"),
    )
  })
})
