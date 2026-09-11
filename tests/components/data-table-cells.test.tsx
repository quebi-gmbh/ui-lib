/**
 * Editable cells, and the keyboard model that makes a grid of inputs a table.
 *
 * `tests/data-table-model.test.ts` covers the order Tab walks, which is pure
 * data. What is left for a rendering test is everything that is not: that Enter
 * on a focused cell opens a control rather than triggering the row, that typing
 * opens it with the character rather than jumping to a row through typeahead,
 * that Escape puts the value back, that Tab commits and lands on the next
 * *editable* cell rather than the next focusable element in the document, that
 * an invalid value stays put with its message, and that focus comes back to the
 * cell after a commit — including when the commit re-sorted the row somewhere
 * else, which is the case a remembered DOM node gets wrong.
 *
 * What a *press* does, and when a value is reported, is the other half and has
 * its own file: `data-table-cell-commit.test.tsx`. The table both drive is in
 * `tests/editable-products.tsx`, along with the note on how a cell is addressed.
 */
import { describe, expect, test } from "bun:test"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { DataTableCellEdit } from "../../src/lib/data-table"
import { DataTable } from "../../src/components/data-table"
import {
  cell,
  columns,
  EditableProducts,
  focusCell,
  focusedCell,
  isEditing,
  type Product,
  PRODUCTS,
} from "../editable-products"

describe("opening a cell", () => {
  test("Enter on a focused cell replaces its content with the control", async () => {
    render(<EditableProducts />)
    const user = userEvent.setup()
    await focusCell("1", "name")
    expect(isEditing("1", "name")).toBe(false)

    await user.keyboard("{Enter}")
    expect(isEditing("1", "name")).toBe(true)
    // In the same cell, at the same address — not a panel somewhere else.
    expect(focusedCell()).toBe("1/name")
    expect(within(cell("1", "name")).getByRole("textbox")).toHaveValue("Halo")
  })

  test("F2 opens it too, and a column with no editor takes neither key", async () => {
    render(<EditableProducts />)
    const user = userEvent.setup()
    await focusCell("2", "stock")
    await user.keyboard("{F2}")
    expect(isEditing("2", "stock")).toBe(true)

    await focusCell("1", "id")
    await user.keyboard("{Enter}")
    await user.keyboard("{F2}")
    expect(cell("1", "id").querySelector("form")).toBeNull()
  })

  test("typing opens the cell with that character, instead of jumping a row", async () => {
    // react-aria's typeahead owns printable keys in a grid, so this is the one
    // place the shell has to take a key away from it — and it takes it only on
    // a cell that can actually be edited.
    render(<EditableProducts />)
    const user = userEvent.setup()
    await focusCell("1", "name")
    await user.keyboard("Z")
    expect(isEditing("1", "name")).toBe(true)
    expect(within(cell("1", "name")).getByRole("textbox")).toHaveValue("Z")
  })

  test("a single click opens it for a pointer", async () => {
    render(<EditableProducts />)
    const user = userEvent.setup()
    await user.click(cell("3", "name"))
    expect(isEditing("3", "name")).toBe(true)
    expect(within(cell("3", "name")).getByRole("textbox")).toHaveValue("Ridge")
  })

  test("a double-click is the click that already opened it, twice", async () => {
    // Nothing extra is needed to keep it working, and nothing may break it:
    // the second press lands inside a control that is already there.
    render(<EditableProducts />)
    const user = userEvent.setup()
    await user.dblClick(cell("3", "name"))
    expect(isEditing("3", "name")).toBe(true)
    expect(within(cell("3", "name")).getByRole("textbox")).toHaveValue("Ridge")
  })
})

describe("finishing an edit", () => {
  test("Escape restores the value and hands focus back to the cell", async () => {
    render(<EditableProducts />)
    const user = userEvent.setup()
    await focusCell("1", "name")
    await user.keyboard("{Enter}")
    await user.clear(within(cell("1", "name")).getByRole("textbox"))
    await user.keyboard("Nothing")
    await user.keyboard("{Escape}")

    expect(isEditing("1", "name")).toBe(false)
    expect(cell("1", "name").textContent).toContain("Halo")
    expect(document.activeElement).toBe(cell("1", "name"))
  })

  test("Enter commits the whole row and returns focus to the cell", async () => {
    const edits: DataTableCellEdit<Product>[] = []
    render(<EditableProducts onCellEdit={(edit) => edits.push(edit)} />)
    const user = userEvent.setup()
    await focusCell("2", "name")
    await user.keyboard("{Enter}")
    await user.clear(within(cell("2", "name")).getByRole("textbox"))
    await user.keyboard("Covert")
    await user.keyboard("{Enter}")

    expect(isEditing("2", "name")).toBe(false)
    expect(cell("2", "name").textContent).toContain("Covert")
    expect(document.activeElement).toBe(cell("2", "name"))
    // One form per row, so the commit is the row: the cell that was edited and
    // every other editable field, which is what a cross-field rule needs.
    expect(edits).toHaveLength(1)
    expect(edits[0].columnId).toBe("name")
    expect(edits[0].field).toBe("name")
    expect(edits[0].value).toEqual({ name: "Covert", stock: 9, status: "Draft" })
  })

  test("moving to another cell of the same table commits, clicking away does not", async () => {
    const edits: DataTableCellEdit<Product>[] = []
    render(<EditableProducts onCellEdit={(edit) => edits.push(edit)} />)
    const user = userEvent.setup()
    await focusCell("1", "name")
    await user.keyboard("{Enter}")
    await user.clear(within(cell("1", "name")).getByRole("textbox"))
    await user.keyboard("Halogen")

    // A portalled popover is "outside the cell" by any blur test, so the rule
    // is the narrower one: focus landed on a different cell of this table.
    await focusCell("2", "name")
    expect(edits).toHaveLength(1)
    expect(edits[0].value.name).toBe("Halogen")
    expect(isEditing("1", "name")).toBe(false)
  })

  test("an invalid value stays in the cell and says why", async () => {
    const edits: DataTableCellEdit<Product>[] = []
    render(<EditableProducts onCellEdit={(edit) => edits.push(edit)} />)
    const user = userEvent.setup()
    await focusCell("1", "name")
    await user.keyboard("{Enter}")
    await user.clear(within(cell("1", "name")).getByRole("textbox"))
    await user.keyboard("no")
    await user.keyboard("{Enter}")

    expect(edits).toHaveLength(0)
    expect(isEditing("1", "name")).toBe(true)
    // The message is the field's, rendered by the conform-* variant inside the
    // cell — which is also what wires aria-describedby from control to message.
    expect(cell("1", "name").textContent).toContain("At least three characters")
  })
})

describe("Tab", () => {
  test("commits and moves to the next editable cell, skipping the rest", async () => {
    render(<EditableProducts />)
    const user = userEvent.setup()
    await focusCell("1", "name")
    await user.keyboard("{Enter}")
    await user.keyboard("{Tab}")

    // Id has no editor, so the next editable cell is Stock — not the next
    // focusable element in the document, and not the column in between.
    expect(isEditing("1", "name")).toBe(false)
    expect(isEditing("1", "stock")).toBe(true)
    expect(focusedCell()).toBe("1/stock")
  })

  test("wraps from the last cell of a row to the first of the next", async () => {
    render(<EditableProducts />)
    const user = userEvent.setup()
    await focusCell("1", "status")
    await user.keyboard("{Enter}")
    await user.keyboard("{Tab}")
    expect(focusedCell()).toBe("2/name")
    expect(isEditing("2", "name")).toBe(true)
  })

  test("Shift+Tab goes back the same way", async () => {
    render(<EditableProducts />)
    const user = userEvent.setup()
    await focusCell("2", "name")
    await user.keyboard("{Enter}")
    await user.keyboard("{Shift>}{Tab}{/Shift}")
    expect(focusedCell()).toBe("1/status")
  })

  test("an invalid value is not a cell you can Tab out of", async () => {
    render(<EditableProducts />)
    const user = userEvent.setup()
    await focusCell("1", "name")
    await user.keyboard("{Enter}")
    await user.clear(within(cell("1", "name")).getByRole("textbox"))
    await user.keyboard("no")
    await user.keyboard("{Tab}")
    expect(isEditing("1", "name")).toBe(true)
    expect(isEditing("1", "stock")).toBe(false)
  })
})

describe("the open vocabulary", () => {
  test("a cell can hold a control the table has never heard of", async () => {
    // The point of `editor` rather than a longer `kind` enum: this is a Select,
    // and nothing in the table, the shell or the lib names one.
    render(<EditableProducts />)
    const user = userEvent.setup()
    await focusCell("1", "status")
    await user.keyboard("{Enter}")
    expect(within(cell("1", "status")).getByRole("button")).toHaveTextContent("Live")
  })
})

describe("focus after a commit", () => {
  test("follows the row when the commit re-sorts it somewhere else", async () => {
    // Sorted by stock ascending: Ridge(1), Halo(4), Cove(9). Raising Ridge's
    // stock to 20 moves it to the bottom, so the cell that had focus is now a
    // different DOM node — which a ref taken before the commit would get wrong.
    const edits: DataTableCellEdit<Product>[] = []
    render(
      <EditableProducts
        onCellEdit={(edit) => edits.push(edit)}
        defaultSorting={[{ id: "stock", desc: false }]}
      />,
    )
    const user = userEvent.setup()
    const order = () =>
      Array.from(document.querySelectorAll('[data-column-id="name"]')).map((node) =>
        node.textContent?.trim(),
      )
    expect(order()).toEqual(["Ridge", "Halo", "Cove"])

    await focusCell("3", "stock")
    await user.keyboard("{Enter}")
    await user.clear(within(cell("3", "stock")).getByRole("textbox"))
    await user.keyboard("20")
    await user.keyboard("{Enter}")

    expect(order()).toEqual(["Halo", "Cove", "Ridge"])
    expect(edits[0].value.stock).toBe(20)
    // Not the body, and not whatever row took the old position.
    expect(focusedCell()).toBe("3/stock")
    expect(document.activeElement).toBe(cell("3", "stock"))
  })
})

describe("a table with no schema", () => {
  test("has no editable cells, whatever the columns say", async () => {
    render(
      <DataTable<Product>
        aria-label="Read-only products"
        columns={columns}
        data={PRODUCTS}
        getRowId={(product) => String(product.id)}
        enablePagination={false}
      />,
    )
    const user = userEvent.setup()
    await focusCell("1", "name")
    await user.keyboard("{Enter}")
    expect(cell("1", "name").querySelector("form")).toBeNull()
    expect(screen.getByRole("grid", { name: "Read-only products" })).toBeInTheDocument()
  })
})
