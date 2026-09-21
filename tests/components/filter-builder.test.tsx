/**
 * The condition builder, where the thing to prove is that the rows are not
 * decoration.
 *
 * The sketch this replaces wired an `is` / `is not` Select that held its value
 * and updated its label while the predicate ignored it entirely: a single row
 * reading `Status is not live` returned "4 of 8" and listed exactly the four
 * *live* rows. So every assertion here reads the filtered rows, not the
 * controls — a builder whose selects all work and whose results do not is the
 * defect, and it looks correct from the outside.
 */
import { describe, expect, test } from "bun:test"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { FilterBuilder } from "../../src/components/filter-builder"
import type { FilterCondition, FilterField } from "../../src/lib/data-table"
import { facetCounts, filterRows } from "../../src/lib/data-table"

interface Kiosk {
  id: string
  title: string
  status: string
  room: string
}

const KIOSKS: Kiosk[] = [
  { id: "k1", title: "Atrium North", status: "live", room: "Atrium" },
  { id: "k2", title: "Atrium South", status: "live", room: "Atrium" },
  { id: "k3", title: "Lobby Desk", status: "draft", room: "Lobby" },
  { id: "k4", title: "Garage Exit", status: "offline", room: "Garage" },
]

const FIELDS: FilterField[] = [
  { id: "status", label: "Status", variant: "enum" },
  { id: "room", label: "Room", variant: "enum" },
  { id: "title", label: "Name", variant: "text" },
]

function Harness({ initial = [] }: { initial?: FilterCondition[] }) {
  const [conditions, setConditions] = useState<FilterCondition[]>(initial)
  const rows = filterRows(KIOSKS, FIELDS, conditions)
  const fields = FIELDS.map((field) =>
    field.variant === "enum"
      ? { ...field, options: facetCounts(KIOSKS, FIELDS, field.id, conditions) }
      : field,
  )
  return (
    <>
      <FilterBuilder
        fields={fields}
        conditions={conditions}
        onChange={setConditions}
        resultCount={rows.length}
      />
      <output data-testid="rows">{rows.map((row) => row.title).join(", ")}</output>
    </>
  )
}

const rowsText = () => screen.getByTestId("rows").textContent

const condition = (
  id: string,
  fieldId: string,
  operator: FilterCondition["operator"],
  value: unknown,
): FilterCondition => ({ id, fieldId, operator, value })

describe("the condition builder", () => {
  test('"is not" excludes, which is the thing the model could not say', async () => {
    const { unmount } = render(<Harness initial={[condition("c1", "status", "is", ["live"])]} />)
    expect(rowsText()).toBe("Atrium North, Atrium South")
    unmount()

    render(<Harness initial={[condition("c1", "status", "isNot", ["live"])]} />)
    expect(rowsText()).toBe("Lobby Desk, Garage Exit")
  })

  test("the operator select changes the predicate, not only the label", async () => {
    render(<Harness initial={[condition("c1", "status", "is", ["live"])]} />)
    const user = userEvent.setup()

    await user.click(screen.getByRole("button", { name: /Operator/ }))
    await user.click(await screen.findByRole("option", { name: "is not" }))

    expect(rowsText()).toBe("Lobby Desk, Garage Exit")
  })

  test("two conditions on one field are two rows, and both apply", () => {
    render(
      <Harness
        initial={[
          condition("c1", "title", "contains", "Atrium"),
          condition("c2", "title", "doesNotContain", "South"),
        ]}
      />,
    )
    // A field-keyed map would have kept only the second and returned both
    // Atrium rows plus everything else that is not "South".
    expect(rowsText()).toBe("Atrium North")
    expect(screen.getAllByRole("listitem")).toHaveLength(2)
  })

  test("an unfinished condition is inert, and the row says so", async () => {
    render(<Harness />)
    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: "Add a condition" }))

    expect(rowsText()).toBe("Atrium North, Atrium South, Lobby Desk, Garage Exit")
    const value = screen.getByRole("button", { name: "Value for Status" })
    expect(value).toHaveTextContent("Select…")
    // Not merely muted: the reason is on the row and reachable from the control.
    expect(value).toHaveAccessibleDescription(/not narrowing anything/)
    expect(screen.getByText(/1 condition not applied/)).toBeInTheDocument()
  })

  test("changing the field drops the value rather than carrying nonsense across", async () => {
    render(<Harness initial={[condition("c1", "status", "isNot", ["live"])]} />)
    const user = userEvent.setup()

    await user.click(screen.getByRole("button", { name: /Field/ }))
    await user.click(await screen.findByRole("option", { name: "Name" }))

    // The value is gone, so the condition is inert rather than filtering by
    // "live" as a text needle; `isNot` does not survive to a text field either.
    expect(rowsText()).toBe("Atrium North, Atrium South, Lobby Desk, Garage Exit")
    expect(screen.getByRole("button", { name: "Value for Name" })).toHaveTextContent("Select…")
    expect(screen.getByRole("button", { name: /Operator/ })).toHaveTextContent("contains")
  })

  test("a field only offers the operators its variant can answer", async () => {
    render(<Harness initial={[condition("c1", "status", "is", ["live"])]} />)
    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: /Operator/ }))
    const list = await screen.findByRole("listbox")
    expect(within(list).getAllByRole("option").map((o) => o.textContent)).toEqual([
      "is",
      "is not",
    ])
  })

  test("applying a value closes the popover it was applied in", async () => {
    render(<Harness initial={[condition("c1", "status", "isNot", [])]} />)
    const user = userEvent.setup()

    await user.click(screen.getByRole("button", { name: "Value for Status" }))
    const values = await screen.findByRole("group", { name: "Status values" })
    await user.click(within(values).getByRole("checkbox", { name: /live/ }))
    await user.click(screen.getByRole("button", { name: "Apply" }))

    // Task #188: left open, the panel covers the next condition row exactly.
    expect(screen.queryByRole("button", { name: "Apply" })).not.toBeInTheDocument()
    expect(rowsText()).toBe("Lobby Desk, Garage Exit")
  })

  test("removing a row removes its condition and leaves the others", async () => {
    render(
      <Harness
        initial={[
          condition("c1", "status", "isNot", ["live"]),
          condition("c2", "room", "is", ["Lobby"]),
        ]}
      />,
    )
    const user = userEvent.setup()
    expect(rowsText()).toBe("Lobby Desk")

    await user.click(screen.getByRole("button", { name: "Remove condition on Room" }))
    expect(rowsText()).toBe("Lobby Desk, Garage Exit")
    expect(screen.getAllByRole("listitem")).toHaveLength(1)
  })

  test("only the first row says Where; the rest say and", () => {
    render(
      <Harness
        initial={[
          condition("c1", "status", "isNot", ["live"]),
          condition("c2", "room", "is", ["Lobby"]),
        ]}
      />,
    )
    const [first, second] = screen.getAllByRole("listitem").map((row) => row.textContent ?? "")
    expect(first.startsWith("Where")).toBe(true)
    expect(second.startsWith("and")).toBe(true)
  })
})
