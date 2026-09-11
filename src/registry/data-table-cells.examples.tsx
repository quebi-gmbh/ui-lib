import { Check, Pencil } from "lucide-react"
import { useState } from "react"
import * as v from "valibot"
import { Badge } from "@/components/badge"
import { Button } from "@/components/button"
import { ComboBoxContent, ComboBoxItem } from "@/components/combo-box"
import { ConformColorPicker } from "@/components/conform-color-picker"
import { ConformComboBox } from "@/components/conform-combo-box"
import { ConformDatePicker } from "@/components/conform-date-picker"
import { ConformField } from "@/components/conform-field"
import { ConformNumberField } from "@/components/conform-number-field"
import { ConformSelect } from "@/components/conform-select"
import { ConformSwitch } from "@/components/conform-switch"
import { ConformTagField } from "@/components/conform-tag-field"
import { DataTable } from "@/components/data-table"
import { FormattedDate } from "@/components/formatted-date"
import { FormattedCurrency, FormattedNumber } from "@/components/formatted-number"
import { Kbd } from "@/components/keyboard"
import {
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
} from "@/components/modal"
import { Note } from "@/components/note"
import { SelectItem } from "@/components/select"
import { TableRowEditor, TableUnsavedBar } from "@/components/table-controls"
import { ToastProvider, useToast } from "@/components/toast"
import type { DataTableColumn, DataTableSelection } from "@/lib/data-table"
import { isRowSelected } from "@/lib/data-table"
import type { ComponentExample } from "./types"

/* -------------------------------------------------------------------------- */
/*                                 the rows                                   */
/* -------------------------------------------------------------------------- */

/**
 * A product, chosen because it is the shape that makes the point: a colour, a
 * tag list, a supplier picked from a long list and a launch window are all
 * ordinary columns of an ordinary table, and none of them is text, a number, a
 * date, a boolean or a select.
 */
interface Product {
  id: number
  name: string
  sku: string
  price: number
  stock: number
  category: string
  supplier: string
  launch: string
  colour: string
  tags: string[]
  isActive: boolean
}

const CATEGORIES = ["Lighting", "Seating", "Storage", "Surfaces"] as const

const SUPPLIERS = [
  { id: "nordwerk", name: "Nordwerk GmbH" },
  { id: "lumen", name: "Lumen Industries" },
  { id: "vertex", name: "Vertex SE" },
  { id: "apex", name: "Apex Manufaktur" },
  { id: "orbit", name: "Orbit BV" },
]
const SUPPLIER_IDS = SUPPLIERS.map((supplier) => supplier.id) as [string, ...string[]]
const supplierName = (id: string) => SUPPLIERS.find((s) => s.id === id)?.name ?? id

/** Deterministic, so the prerendered HTML and the hydrated page agree. */
const PRODUCTS: Product[] = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  name: ["Halo pendant", "Cove sconce", "Ridge stool", "Basin chair", "Slate shelf", "Cairn crate", "Plane desk", "Verge bench"][i],
  sku: `SKU-${1200 + i * 7}`,
  price: 89 + i * 46.5,
  stock: (i * 17) % 60,
  category: CATEGORIES[i % CATEGORIES.length],
  supplier: SUPPLIERS[i % SUPPLIERS.length].id,
  launch: new Date(Date.UTC(2026, i % 12, ((i * 5) % 26) + 1)).toISOString().slice(0, 10),
  colour: ["#0EA5E9", "#F97316", "#22C55E", "#A855F7", "#EF4444", "#14B8A6", "#EAB308", "#6366F1"][i],
  tags: [["indoor", "ceiling"], ["indoor", "wall"], ["indoor"], ["indoor", "upholstered"], ["modular"], ["outdoor", "modular"], ["office"], ["outdoor"]][i],
  isActive: i % 4 !== 3,
}))

/**
 * One schema for the whole row, not one per cell.
 *
 * That is what lets `stock` and `isActive` disagree with each other: a product
 * cannot be active with nothing in stock, and no form holding a single field
 * could say so. The cell editor submits every editable field — the one on
 * screen and the rest as hidden inputs — so the rule has both values to look at.
 */
const productSchema = v.pipe(
  v.object({
    name: v.pipe(v.string(), v.minLength(3, "At least three characters")),
    sku: v.pipe(v.string(), v.regex(/^SKU-\d{4}$/, "SKUs look like SKU-1234")),
    price: v.pipe(v.number("Enter a price"), v.minValue(1, "At least €1")),
    stock: v.pipe(v.number("Enter a count"), v.minValue(0, "Cannot be negative")),
    category: v.picklist(CATEGORIES, "Pick a category"),
    supplier: v.picklist(SUPPLIER_IDS, "Pick a supplier"),
    launch: v.date("Pick a launch date"),
    colour: v.pipe(v.string(), v.regex(/^#[0-9A-Fa-f]{6}$/, "A six-digit hex colour")),
    tags: v.pipe(
      v.string(),
      v.transform((raw) => raw.split(",").filter(Boolean)),
      v.minLength(1, "At least one tag"),
    ),
    isActive: v.optional(v.boolean(), false),
  }),
  v.forward(
    v.check(
      (product) => !product.isActive || product.stock > 0,
      "An active product needs stock — set one of the two.",
    ),
    ["stock"],
  ),
)

/* -------------------------------------------------------------------------- */
/*                          eight controls, eight cells                       */
/* -------------------------------------------------------------------------- */

/**
 * The columns. `editor` is the whole of the editing API: it hands back Conform
 * metadata and takes whatever control you bind it to, so the table never learns
 * the name of a single variant and gains every one of them — present and future.
 */
const columns: DataTableColumn<Product>[] = [
  {
    id: "name",
    header: "Product",
    accessorKey: "name",
    width: 170,
    editor: ({ field, label }) => <ConformField field={field} label={label} />,
  },
  {
    id: "sku",
    header: "SKU",
    accessorKey: "sku",
    width: 120,
    editor: ({ field, label }) => <ConformField field={field} label={label} />,
  },
  {
    id: "price",
    header: "Price",
    accessorKey: "price",
    align: "end",
    width: 130,
    cell: ({ row }) => <FormattedCurrency value={row.price} />,
    editor: ({ field, label }) => <ConformNumberField field={field} label={label} step={0.5} />,
  },
  {
    id: "stock",
    header: "Stock",
    accessorKey: "stock",
    align: "end",
    width: 110,
    cell: ({ row }) => <FormattedNumber value={row.stock} />,
    editor: ({ field, label }) => <ConformNumberField field={field} label={label} />,
  },
  {
    id: "category",
    header: "Category",
    accessorKey: "category",
    width: 150,
    editor: ({ field, label }) => (
      <ConformSelect field={field} label={label}>
        {CATEGORIES.map((category) => (
          <SelectItem key={category} id={category}>
            {category}
          </SelectItem>
        ))}
      </ConformSelect>
    ),
  },
  {
    id: "supplier",
    header: "Supplier",
    accessorKey: "supplier",
    width: 190,
    cell: ({ row }) => supplierName(row.supplier),
    editor: ({ field, label }) => (
      <ConformComboBox field={field} label={label} placeholder="Start typing…">
        <ComboBoxContent items={SUPPLIERS}>
          {(supplier) => <ComboBoxItem id={supplier.id}>{supplier.name}</ComboBoxItem>}
        </ComboBoxContent>
      </ConformComboBox>
    ),
  },
  {
    id: "launch",
    header: "Launch",
    accessorKey: "launch",
    width: 170,
    cell: ({ row }) => <FormattedDate date={row.launch} />,
    editor: ({ field, label }) => <ConformDatePicker field={field} label={label} />,
  },
  {
    id: "colour",
    header: "Colour",
    accessorKey: "colour",
    width: 150,
    cell: ({ row }) => (
      <span className="inline-flex items-center gap-2">
        <span
          aria-hidden="true"
          className="size-3.5 rounded-quebi-sm border border-quebi-line/20"
          style={{ background: row.colour }}
        />
        <span className="font-mono text-xs">{row.colour}</span>
      </span>
    ),
    editor: ({ field, label }) => <ConformColorPicker field={field} label={label} />,
  },
  {
    id: "tags",
    header: "Tags",
    accessorKey: "tags",
    width: 200,
    cell: ({ row }) => (
      <span className="inline-flex flex-wrap gap-1">
        {row.tags.map((tag) => (
          <Badge key={tag} intent="neutral">
            {tag}
          </Badge>
        ))}
      </span>
    ),
    editor: ({ field, label }) => <ConformTagField field={field} label={label} />,
  },
  {
    id: "isActive",
    header: "Active",
    accessorKey: "isActive",
    width: 110,
    cell: ({ row }) =>
      row.isActive ? <Check aria-label="Active" className="size-4 text-quebi-success" /> : "—",
    editor: ({ field, label }) => <ConformSwitch field={field} label={label} />,
  },
]

/** The schema fields a commit hands back, applied to the row it came from. */
function applyEdit(product: Product, value: Record<string, unknown>): Product {
  return {
    ...product,
    ...(value as unknown as Omit<Product, "id" | "launch">),
    launch: (value.launch as Date).toISOString().slice(0, 10),
  }
}

function EditableProducts() {
  const toast = useToast()
  const [rows, setRows] = useState<Product[]>(PRODUCTS)
  // The draft is what makes this the batched commit model rather than the
  // immediate one: every cell commit lands here, and the bar below the table is
  // the only thing that writes. Both are built on the same per-cell callback.
  const [draft, setDraft] = useState<Record<number, Product>>({})
  const visible = rows.map((product) => draft[product.id] ?? product)

  return (
    <div className="flex w-full flex-col gap-3">
      <DataTable<Product>
        aria-label="Editable products"
        columns={columns}
        data={visible}
        getRowId={(product) => String(product.id)}
        enablePagination={false}
        enableColumnChooser={false}
        allowResize
        cellEditSchema={productSchema}
        onCellEdit={({ row, value }) =>
          setDraft((current) => ({ ...current, [row.id]: applyEdit(row, value) }))
        }
        rowClassName={(product) => (draft[product.id] ? "bg-quebi-warn/5" : undefined)}
        caption="Double-click a cell, or focus one and press Enter, F2, or just start typing. Tab commits and moves to the next editable cell; Escape puts the value back."
      />
      <TableUnsavedBar
        count={Object.keys(draft).length}
        onSave={() => {
          setRows(visible)
          setDraft({})
          toast.success("Saved every change")
        }}
        onDiscard={() => setDraft({})}
      />
      <Note intent="info">
        Ten columns, ten different controls, one <code>editor</code> callback
        each — text, number, select, combo box, date picker, colour picker, tag
        field and switch. Set a product active with nothing in stock to see the
        cross-field rule fire: the form behind a cell is the whole row, so
        "active needs stock" is a rule it can actually check.
      </Note>
      <p className="text-quebi-fg-subtle text-sm">
        <Kbd>Enter</Kbd> or <Kbd>F2</Kbd> edits · <Kbd>Tab</Kbd> commits and
        moves · <Kbd>Esc</Kbd> cancels · arrows move between cells, and move the
        caret once a cell is open.
      </p>
    </div>
  )
}

const CellEditingShowcase = () => (
  <ToastProvider>
    <EditableProducts />
  </ToastProvider>
)

/* -------------------------------------------------------------------------- */
/*                                 bulk edit                                  */
/* -------------------------------------------------------------------------- */

/**
 * A bulk edit is the row editor over a smaller schema.
 *
 * Not the row's schema with holes in it: "apply this category to every selected
 * product" asks for one field and must not require the other nine, so the
 * schema is the one field. That is also why this needs no component of its own —
 * `TableRowEditor` in a modal is the whole of it.
 */
const bulkSchema = v.object({
  category: v.picklist(CATEGORIES, "Pick a category"),
  isActive: v.optional(v.boolean(), false),
})

function BulkEditProducts() {
  const toast = useToast()
  const [rows, setRows] = useState<Product[]>(PRODUCTS)
  const [selection, setSelection] = useState<DataTableSelection>({ mode: "include", keys: [] })
  const [isOpen, setIsOpen] = useState(false)
  const selected = rows.filter((product) => isRowSelected(selection, String(product.id)))

  return (
    <div className="flex w-full flex-col gap-3">
      <DataTable<Product>
        aria-label="Products to bulk edit"
        columns={columns.slice(0, 5)}
        data={rows}
        getRowId={(product) => String(product.id)}
        enablePagination={false}
        enableColumnChooser={false}
        selectionMode="multiple"
        selection={selection}
        onSelectionChange={setSelection}
        bulkActions={() => (
          <Button intent="outline" size="xs" onPress={() => setIsOpen(true)}>
            <Pencil data-slot="icon" aria-hidden="true" />
            Edit {selected.length} rows
          </Button>
        )}
      />
      {/* State opens this one — a bulk action raised from the selection bar —
          so the content owns the open state and there is no trigger to pair
          with. A <Modal> wrapper here would put the panel in the trigger slot. */}
      <ModalContent isOpen={isOpen} onOpenChange={setIsOpen}>
        <ModalHeader>
          <ModalTitle>Edit {selected.length} products</ModalTitle>
          <ModalDescription>
            Every selected row gets these values, through the same schema a
            single cell is validated against.
          </ModalDescription>
        </ModalHeader>
        <ModalBody>
          <TableRowEditor
            schema={bulkSchema}
            submitLabel={`Apply to ${selected.length} rows`}
            fields={[
              {
                name: "category",
                label: "Category",
                kind: "select",
                options: CATEGORIES.map((category) => ({ id: category, label: category })),
              },
              { name: "isActive", label: "Active", kind: "boolean" },
            ]}
            defaultValue={{ category: selected[0]?.category ?? CATEGORIES[0], isActive: true }}
            onCancel={() => setIsOpen(false)}
            onSave={(value) => {
              const keys = new Set(selected.map((product) => product.id))
              setRows((current) =>
                current.map((product) =>
                  keys.has(product.id) ? { ...product, ...(value as Partial<Product>) } : product,
                ),
              )
              setIsOpen(false)
              toast.success(`Updated ${keys.size} products`)
            }}
          />
        </ModalBody>
      </ModalContent>
      <Note intent="info">
        The component that draws this modal is the one that draws the inline row
        editor, and the argument for it being the same component is the schema:
        one valibot object decides what a valid product is, whether you are
        editing one cell, one row, or five rows at once.
      </Note>
    </div>
  )
}

const BulkEditShowcase = () => (
  <ToastProvider>
    <BulkEditProducts />
  </ToastProvider>
)

export const dataTableCellExamples: ComponentExample[] = [
  {
    title: "Editable cells: any conform-* control, and the keyboard to match",
    description:
      "Each column carries an `editor` callback that is handed Conform field metadata, so the control in a cell is whichever conform-* variant you bind — here ten columns and eight kinds of control, including the four no enum would ever have had room for. The keyboard is the part that makes it a data table rather than a page of inputs: Enter, F2 or typing opens a cell, Tab commits and moves to the next editable one (wrapping to the next row, not leaving for the next focusable element on the page), Escape restores the value, arrows move between cells and then move the caret. Commits land per cell and are batched by the Save bar, which is what per-cell commits compose into — the other direction does not.",
    render: () => <CellEditingShowcase />,
  },
  {
    title: "Bulk edit, through the same schema",
    description:
      "Select rows and edit them together. The modal is TableRowEditor — the same component the inline row editor uses — over a schema holding only the fields being applied, because a bulk edit must not require the fields it is not touching.",
    render: () => <BulkEditShowcase />,
  },
]
