/**
 * The editable table two test files drive, in one place.
 *
 * `data-table-cells.test.tsx` is about the keyboard and the transitions between
 * a cell's text and a cell's control; `data-table-cell-commit.test.tsx` is about
 * what a press does and when a value is reported. They are the same table asked
 * two different questions, and a second copy of it would be a fixture free to
 * drift from the one the other file trusts.
 *
 * Cells are addressed the way the component addresses them, by `data-row-key`
 * and `data-column-id`: a role query would find the `<td>` only while it holds
 * text and the control only while it holds one, and the point of these tests is
 * the transition between the two.
 */
import { act, useState } from "react"
import * as v from "valibot"
import { ConformField } from "../src/components/conform-field"
import { ConformNumberField } from "../src/components/conform-number-field"
import { ConformSelect } from "../src/components/conform-select"
import { DataTable } from "../src/components/data-table"
import { SelectItem } from "../src/components/select"
import type {
  DataTableCellEdit,
  DataTableColumn,
  DataTableSelection,
} from "../src/lib/data-table"

export interface Product {
  id: number
  name: string
  stock: number
  status: string
}

export const PRODUCTS: Product[] = [
  { id: 1, name: "Halo", stock: 4, status: "Live" },
  { id: 2, name: "Cove", stock: 9, status: "Draft" },
  { id: 3, name: "Ridge", stock: 1, status: "Live" },
]

export const schema = v.object({
  name: v.pipe(v.string(), v.minLength(3, "At least three characters")),
  stock: v.pipe(v.number("Enter a count"), v.minValue(0, "Cannot be negative")),
  status: v.picklist(["Live", "Draft"], "Pick a status"),
})

export const columns: DataTableColumn<Product>[] = [
  {
    id: "name",
    header: "Name",
    accessorKey: "name",
    editor: ({ field, label }) => <ConformField field={field} label={label} />,
  },
  // No editor: the column Tab has to skip over.
  { id: "id", header: "Id", accessorKey: "id" },
  {
    id: "stock",
    header: "Stock",
    accessorKey: "stock",
    editor: ({ field, label }) => <ConformNumberField field={field} label={label} />,
  },
  {
    id: "status",
    header: "Status",
    accessorKey: "status",
    editor: ({ field, label }) => (
      <ConformSelect field={field} label={label}>
        <SelectItem id="Live">Live</SelectItem>
        <SelectItem id="Draft">Draft</SelectItem>
      </ConformSelect>
    ),
  },
]

/** Put focus on a cell the way arrowing to it would, inside `act`. */
export async function focusCell(rowId: string, columnId: string) {
  await act(async () => {
    cell(rowId, columnId).focus()
  })
}

/** The `<td>` for one cell, by the address the component gives it. */
export function cell(rowId: string, columnId: string): HTMLElement {
  const found = document.querySelector<HTMLElement>(
    `[data-row-key="${rowId}"][data-column-id="${columnId}"]`,
  )
  if (!found) throw new Error(`No cell ${rowId}/${columnId} is rendered`)
  return found
}

/** Which cell holds the element that currently has focus, if any. */
export function focusedCell(): string | null {
  const owner = (document.activeElement as HTMLElement | null)?.closest<HTMLElement>(
    "[data-row-key][data-column-id]",
  )
  return owner ? `${owner.dataset.rowKey}/${owner.dataset.columnId}` : null
}

export const isEditing = (rowId: string, columnId: string) =>
  cell(rowId, columnId).querySelector("form") != null

export interface TableProps {
  onCellEdit?: (edit: DataTableCellEdit<Product>) => void
  defaultSorting?: { id: string; desc: boolean }[]
  onRowAction?: (row: Product) => void
  onSelectionChange?: (selection: DataTableSelection) => void
}

/** The table under test, holding its own rows so a commit is visible. */
export function EditableProducts({
  onCellEdit,
  defaultSorting,
  onRowAction,
  onSelectionChange,
}: TableProps) {
  const [rows, setRows] = useState(PRODUCTS)
  return (
    <DataTable<Product>
      aria-label="Products"
      columns={columns}
      data={rows}
      getRowId={(product) => String(product.id)}
      enablePagination={false}
      enableGlobalSearch={false}
      enableColumnChooser={false}
      defaultSorting={defaultSorting}
      onRowAction={onRowAction}
      selectionMode={onSelectionChange ? "multiple" : "none"}
      onSelectionChange={onSelectionChange}
      cellEditSchema={schema}
      onCellEdit={(edit) => {
        onCellEdit?.(edit)
        setRows((current) =>
          current.map((product) =>
            product.id === edit.row.id
              ? { ...product, ...(edit.value as unknown as Omit<Product, "id">) }
              : product,
          ),
        )
      }}
    />
  )
}
