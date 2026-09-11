/**
 * What a press does to a cell, and when a cell reports a value.
 *
 * Two rules, and they are the same rule twice. **A press on a cell that has an
 * editor opens that editor and does nothing else** — the row underneath is
 * react-aria's, and it presses through pointerdown rather than click, so an
 * `onClick` on the cell would have fired after the row had already navigated,
 * acted or changed its selection. **A commit follows the control rather than
 * the focus** — a value you pick has settled the moment it changes, a value you
 * type has settled when you stop typing it, and where focus went in between is
 * no longer a question anyone asks. That last part is why the combo box is here:
 * its list is portalled out of the table entirely, and under the blur rule this
 * replaced, opening it looked exactly like leaving.
 */
import { describe, expect, test } from "bun:test"
import { act, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ComboBoxContent, ComboBoxItem } from "../../src/components/combo-box"
import { ConformComboBox } from "../../src/components/conform-combo-box"
import { ConformField } from "../../src/components/conform-field"
import { DataTable } from "../../src/components/data-table"
import * as v from "valibot"
import type {
  DataTableCellEdit,
  DataTableColumn,
  DataTableSelection,
} from "../../src/lib/data-table"
import {
  cell,
  EditableProducts,
  isEditing,
  type Product,
  PRODUCTS,
} from "../editable-products"

const comboSchema = v.object({
  name: v.pipe(v.string(), v.minLength(3, "At least three characters")),
  status: v.picklist(["Live", "Draft"], "Pick a status"),
})

/**
 * The same rows with a combo box in the Status cell — the control whose popover
 * is portalled out of the table *and* keeps focus in its own input, which is the
 * pair of facts the commit rule has to survive.
 */
const comboColumns: DataTableColumn<Product>[] = [
  {
    id: "name",
    header: "Name",
    accessorKey: "name",
    editor: ({ field, label }) => <ConformField field={field} label={label} />,
  },
  {
    id: "status",
    header: "Status",
    accessorKey: "status",
    editor: ({ field, label }) => (
      <ConformComboBox field={field} label={label}>
        <ComboBoxContent items={[{ id: "Live" }, { id: "Draft" }]}>
          {(item: { id: string }) => <ComboBoxItem id={item.id}>{item.id}</ComboBoxItem>}
        </ComboBoxContent>
      </ConformComboBox>
    ),
  },
]

function ComboProducts({ onCellEdit }: { onCellEdit: (edit: DataTableCellEdit<Product>) => void }) {
  return (
    <DataTable<Product>
      aria-label="Products with a combo box"
      columns={comboColumns}
      data={PRODUCTS}
      getRowId={(product) => String(product.id)}
      enablePagination={false}
      enableGlobalSearch={false}
      enableColumnChooser={false}
      cellEditSchema={comboSchema}
      onCellEdit={onCellEdit}
    />
  )
}

describe("a press on an editable cell is the editor's and nobody else's", () => {
  test("it does not fire the row action; a cell with no editor still does", async () => {
    // The row is react-aria's and presses through pointerdown, so an onClick on
    // the cell would fire after the action it was meant to replace.
    const actions: Product[] = []
    render(<EditableProducts onRowAction={(row) => actions.push(row)} />)
    const user = userEvent.setup()

    await user.click(cell("1", "name"))
    expect(isEditing("1", "name")).toBe(true)
    expect(actions).toHaveLength(0)

    await user.click(cell("2", "id"))
    expect(actions).toHaveLength(1)
    expect(actions[0].id).toBe(2)
  })

  test("it does not change the selection; a cell with no editor still does", async () => {
    const selections: DataTableSelection[] = []
    render(<EditableProducts onSelectionChange={(next) => selections.push(next)} />)
    const user = userEvent.setup()

    await user.click(cell("1", "name"))
    expect(isEditing("1", "name")).toBe(true)
    expect(selections).toHaveLength(0)

    await user.click(cell("2", "id"))
    const last = selections.at(-1)
    expect(last?.mode).toBe("include")
    expect(last?.mode === "include" ? last.keys : []).toEqual(["2"])
  })
})

describe("committing when the control settles", () => {
  test("picking from a Select commits, and stays in the cell", async () => {
    // Picking the option *is* the user being done, so nothing waits for focus
    // to leave — and nothing has to, which is the point: the listbox is
    // portalled out of the table and no blur rule could have told the
    // difference between it and the user clicking away.
    const edits: DataTableCellEdit<Product>[] = []
    render(<EditableProducts onCellEdit={(edit) => edits.push(edit)} />)
    const user = userEvent.setup()

    await user.click(cell("1", "status"))
    expect(isEditing("1", "status")).toBe(true)
    await user.click(within(cell("1", "status")).getByRole("button"))
    await user.click(screen.getByRole("option", { name: "Draft" }))

    expect(edits).toHaveLength(1)
    expect(edits[0].columnId).toBe("status")
    expect(edits[0].value).toEqual({ name: "Halo", stock: 4, status: "Draft" })
    // A commit is not a departure: a control that collects several values
    // before it is finished would otherwise close under the first click.
    expect(isEditing("1", "status")).toBe(true)
  })

  test("a stepper press commits once, and Enter after it does not commit again", async () => {
    // The double-commit this rule opens: a press changes the value and commits,
    // focus is still in the control, and Enter would commit the same row again.
    const edits: DataTableCellEdit<Product>[] = []
    render(<EditableProducts onCellEdit={(edit) => edits.push(edit)} />)
    const user = userEvent.setup()

    await user.click(cell("1", "stock"))
    const steppers = within(cell("1", "stock")).getAllByRole("button")
    await user.click(steppers[steppers.length - 1])
    expect(edits).toHaveLength(1)
    expect(edits[0].value.stock).toBe(5)

    await user.keyboard("{Enter}")
    // Enter still finishes the cell; it just does not ask the caller to write
    // the same row a second time.
    expect(edits).toHaveLength(1)
    expect(isEditing("1", "stock")).toBe(false)
  })

  test("opening a cell and pressing Enter reports nothing", async () => {
    const edits: DataTableCellEdit<Product>[] = []
    render(<EditableProducts onCellEdit={(edit) => edits.push(edit)} />)
    const user = userEvent.setup()

    await user.click(cell("2", "name"))
    await user.keyboard("{Enter}")
    expect(edits).toHaveLength(0)
    expect(isEditing("2", "name")).toBe(false)
  })

  test("leaving a text field commits what was typed into it", async () => {
    const edits: DataTableCellEdit<Product>[] = []
    render(<EditableProducts onCellEdit={(edit) => edits.push(edit)} />)
    const user = userEvent.setup()

    await user.click(cell("2", "name"))
    await user.clear(within(cell("2", "name")).getByRole("textbox"))
    await user.keyboard("Covert")
    // Away from the table entirely — "settled" for free text is when you stop
    // typing into it, wherever you went next.
    await act(async () => {
      screen.getByRole("grid", { name: "Products" }).focus()
    })

    expect(edits).toHaveLength(1)
    expect(edits[0].value.name).toBe("Covert")
  })

  test("a text field that was not touched commits nothing on the way out", async () => {
    const edits: DataTableCellEdit<Product>[] = []
    render(<EditableProducts onCellEdit={(edit) => edits.push(edit)} />)
    const user = userEvent.setup()

    await user.click(cell("2", "name"))
    await act(async () => {
      screen.getByRole("grid", { name: "Products" }).focus()
    })
    expect(edits).toHaveLength(0)
  })

  test("opening a combo box's popover commits nothing; picking from it commits", async () => {
    // The case the old blur rule existed for. A popover opening changes no
    // value, so there is nothing to report — and where focus went is no longer
    // a question anyone asks.
    const edits: DataTableCellEdit<Product>[] = []
    render(<ComboProducts onCellEdit={(edit) => edits.push(edit)} />)
    const user = userEvent.setup()

    await user.click(cell("1", "status"))
    expect(isEditing("1", "status")).toBe(true)
    await user.click(within(cell("1", "status")).getByRole("button"))
    expect(screen.getByRole("listbox")).toBeInTheDocument()
    expect(edits).toHaveLength(0)

    await user.click(screen.getByRole("option", { name: "Draft" }))
    expect(edits).toHaveLength(1)
    expect(edits[0].value.status).toBe("Draft")
  })
})
