import { useState } from "react"
import * as v from "valibot"
import { Button } from "@/components/button"
import { Note } from "@/components/note"
import {
  type TableEditField,
  TableBulkBar,
  TableColumnChooser,
  TableDensityToggle,
  TableFilterChips,
  TableFilterPanel,
  TablePager,
  TableRowEditor,
  TableSearch,
  TableToolbar,
  describeFilter,
} from "@/components/table-controls"
import type {
  DataTableDensity,
  DataTableFilterValue,
  DataTableSelection,
} from "@/lib/data-table"
import { emptySelection, selectionCount } from "@/lib/data-table"
import { COUNTRIES, ORDERS, STATUSES } from "./table-fixtures.examples"
import type { ComponentExample } from "./types"

/**
 * Every control on its own, which is the documentation the family was missing.
 *
 * Each of these is exactly what DataTable and ServerTable render — same file,
 * same props — with the state they normally read out of a row model or a query
 * held in a `useState` beside it instead. That is the whole argument for the
 * split: a control that takes a value and a callback can be shown alone, and a
 * control that reaches into a table cannot.
 */

/* -------------------------------------------------------------------------- */
/*                                  toolbar                                   */
/* -------------------------------------------------------------------------- */

const Toolbar = () => {
  const [search, setSearch] = useState("")
  const [density, setDensity] = useState<DataTableDensity>("normal")
  const [visible, setVisible] = useState<Record<string, boolean>>({
    reference: true,
    customer: true,
    status: true,
    amount: true,
    note: false,
  })

  const columns = Object.entries(visible).map(([id, isVisible]) => ({
    id,
    label: id[0].toUpperCase() + id.slice(1),
    isVisible,
    // Reference is the row header, so hiding it would leave the table without
    // one — the chooser offers it and refuses it, rather than omitting it.
    canHide: id !== "reference",
  }))

  return (
    <div className="flex w-full flex-col gap-3">
      <TableToolbar
        caption="The bar above the table: a left slot for anything that narrows the result, a right slot for anything that changes how it is shown."
        actions={
          <>
            <TableDensityToggle value={density} onChange={setDensity} />
            <TableColumnChooser
              columns={columns}
              onChange={(id, isVisible) =>
                setVisible((current) => ({ ...current, [id]: isVisible }))
              }
              onReset={() =>
                setVisible({
                  reference: true,
                  customer: true,
                  status: true,
                  amount: true,
                  note: false,
                })
              }
            />
          </>
        }
      >
        <TableSearch value={search} onChange={setSearch} placeholder="Search all columns…" />
      </TableToolbar>
      <Note intent="info">
        Search is <code>{search === "" ? "(empty)" : search}</code>, density is{" "}
        <code>{density}</code>, and{" "}
        <code>{columns.filter((column) => column.isVisible).length}</code> of{" "}
        <code>{columns.length}</code> columns are on. The search field lifts its
        value 250&nbsp;ms after the last keystroke, which server-side is the
        difference between one round-trip and one per character.
      </Note>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                           filter panel and chips                           */
/* -------------------------------------------------------------------------- */

const statusOptions = STATUSES.map((status) => ({
  value: status,
  count: ORDERS.filter((order) => order.status === status).length,
}))

/*
 * Counted, not guessed. Inside DataTable these come from the row model's own
 * faceting and inside ServerTable from the query behind `loadFilterValues`, so
 * a hardcoded pair is the one thing a reader should not copy out of here: the
 * panel prints them as "lowest N" / "highest N", and a number the data
 * contradicts is worse than no bound at all.
 */
const amounts = ORDERS.map((order) => order.amount)
const amountBounds: [number, number] = [Math.min(...amounts), Math.max(...amounts)]

const Filters = () => {
  const [filters, setFilters] = useState<DataTableFilterValue[]>([
    { column: "status", variant: "enum", value: ["Paid"] },
  ])

  const apply = (column: string, variant: DataTableFilterValue["variant"], value: unknown) => {
    const isEmpty =
      value == null ||
      value === "" ||
      (Array.isArray(value) && value.every((entry) => entry == null || entry === ""))
    setFilters((current) => {
      const next = current.filter((filter) => filter.column !== column)
      return isEmpty ? next : [...next, { column, variant, value }]
    })
  }

  const appliedValue = (column: string) => filters.find((filter) => filter.column === column)?.value

  return (
    <div className="flex w-full flex-col gap-3">
      <TableFilterChips
        filters={filters.map((filter) => ({
          column: filter.column,
          label: filter.column[0].toUpperCase() + filter.column.slice(1),
          // The same function the chips inside both tables are labelled with:
          // the variant decides the words, not the shape of the value.
          text: describeFilter(filter.variant, filter.value),
        }))}
        onClear={(column) => apply(column, undefined, undefined)}
        onClearAll={() => setFilters([])}
        presets={[{ id: "open", label: "Open orders" }]}
        onApplyPreset={() =>
          setFilters([{ column: "status", variant: "enum", value: ["Pending", "Shipped"] }])
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-quebi-md border border-quebi-line/10">
          <TableFilterPanel
            columnId="status"
            label="Status"
            variant="enum"
            value={appliedValue("status")}
            options={statusOptions}
            onApply={(value) => apply("status", "enum", value)}
            onClear={() => apply("status", undefined, undefined)}
          />
        </div>
        <div className="rounded-quebi-md border border-quebi-line/10">
          <TableFilterPanel
            columnId="amount"
            label="Amount"
            variant="number"
            value={appliedValue("amount")}
            bounds={amountBounds}
            onApply={(value) => apply("amount", "number", value)}
            onClear={() => apply("amount", undefined, undefined)}
          />
        </div>
        <div className="rounded-quebi-md border border-quebi-line/10">
          <TableFilterPanel
            columnId="date"
            label="Date"
            variant="date"
            value={appliedValue("date")}
            onApply={(value) => apply("date", "date", value)}
            onClear={() => apply("date", undefined, undefined)}
          />
        </div>
      </div>
      <Note intent="info">
        Each panel is a Conform form over a valibot schema, and Apply is a real
        submit. Put 900 in <em>From</em> and 100 in <em>To</em> and the error is
        on the field — a range that would have returned nothing never becomes a
        query. Inside a table these are mounted by the header's filter popover,
        one at a time; here they are side by side so all three are visible at
        once. There are five variants in all: text and boolean are the two not
        shown.
      </Note>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                            pager and bulk bar                              */
/* -------------------------------------------------------------------------- */

const PagerAndSelection = () => {
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [selection, setSelection] = useState<DataTableSelection>(emptySelection)
  const total = ORDERS.length
  const rowsOnPage = Math.max(0, Math.min(pageSize, total - page * pageSize))
  const { count, isAll } = selectionCount(selection, total)

  return (
    <div className="flex w-full flex-col gap-3">
      <TableBulkBar
        selection={selection}
        total={total}
        pageCount={rowsOnPage}
        onSelectAllMatching={() => setSelection({ mode: "all-matching", excluded: [] })}
        onClear={() => setSelection(emptySelection)}
      >
        <Button intent="ghost" size="xs">
          Export selected
        </Button>
      </TableBulkBar>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          intent="outline"
          size="sm"
          onPress={() =>
            setSelection({
              mode: "include",
              keys: ORDERS.slice(page * pageSize, page * pageSize + rowsOnPage).map((order) =>
                String(order.id),
              ),
            })
          }
        >
          Select this page
        </Button>
        <Button intent="ghost" size="sm" onPress={() => setSelection(emptySelection)}>
          Clear
        </Button>
        <span className="text-quebi-fg-muted text-sm">
          {isAll ? "every matching row" : `${count ?? 0} selected`}
        </span>
      </div>
      <TablePager
        page={page}
        pageSize={pageSize}
        rowsOnPage={rowsOnPage}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={(next) => {
          setPageSize(next)
          setPage(0)
        }}
      />
      <Note intent="info">
        Select the whole page and the bar offers "select all {total} matching",
        which is a different claim from "these {rowsOnPage}" — and the only one
        that can be made about rows the browser has never seen. Type 900 into the
        page jump and the schema says how many pages there are instead of showing
        you an empty table.
      </Note>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 row editor                                 */
/* -------------------------------------------------------------------------- */

const editSchema = v.object({
  customer: v.pipe(v.string(), v.minLength(2, "Who is this order for?")),
  country: v.picklist(COUNTRIES),
  amount: v.pipe(v.number("A number, please"), v.minValue(0, "Not less than nothing")),
  date: v.pipe(v.string(), v.minLength(1, "When was it placed?")),
  isPriority: v.optional(v.boolean(), false),
})

const editFields: TableEditField[] = [
  { name: "customer", label: "Customer", kind: "text" },
  {
    name: "country",
    label: "Country",
    kind: "select",
    options: COUNTRIES.map((country) => ({ id: country, label: country })),
  },
  { name: "amount", label: "Amount", kind: "number" },
  { name: "date", label: "Date", kind: "date" },
  { name: "isPriority", label: "Priority", kind: "boolean" },
]

const RowEditor = () => {
  const order = ORDERS[0]
  const [row, setRow] = useState({
    customer: order.customer,
    country: order.country,
    amount: order.amount,
    date: order.date,
    isPriority: order.isPriority,
  })
  const [isEditing, setIsEditing] = useState(true)
  const [saved, setSaved] = useState<Record<string, unknown> | null>(null)

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="rounded-quebi-md border border-quebi-line/10 bg-quebi-brand/5 p-3">
        {isEditing ? (
          <TableRowEditor
            // Remounting on the values is what a table does too: the editor
            // binds Conform's uncontrolled defaults, so a row that changed
            // underneath needs a new form rather than a new prop.
            key={JSON.stringify(row)}
            title={`Editing ${order.reference}`}
            schema={editSchema}
            fields={editFields}
            defaultValue={row}
            onSave={(value) => {
              setRow(value as typeof row)
              setSaved(value)
              setIsEditing(false)
            }}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <Button intent="outline" size="sm" onPress={() => setIsEditing(true)}>
            Edit {order.reference}
          </Button>
        )}
      </div>
      {saved && (
        <Note intent="success">
          Saved <code>{JSON.stringify(saved)}</code> — note the types: the form
          gave back strings, and the schema turned them into a number and a
          boolean on the way out.
        </Note>
      )}
      <Note intent="info">
        Clear the customer, or put a letter in the amount, and the error is
        beside the field rather than a rejected save you have to reconstruct.
        Inside a table this replaces the row and spans every column; it is the
        same component either way, because it takes a schema, a field list and a
        default value and knows nothing about where it is drawn — which is also
        what lets it back a bulk edit inside a Modal.
      </Note>
    </div>
  )
}

export const tableControlsExamples: ComponentExample[] = [
  {
    title: "Toolbar, search, columns and density",
    description:
      "The bar above every table in the family, with nothing underneath it. TableToolbar is two slots; TableSearch is a debounced Conform field; TableColumnChooser is a checkbox group in a popover that refuses to hide the row header; TableDensityToggle is a menu that names all three densities rather than three buttons drawn with the same glyph. All four are controlled, so what they change here is a useState instead of a row model.",
    render: () => <Toolbar />,
  },
  {
    title: "Filter panels and chips",
    description:
      "Three of the five filter variants side by side — enum with faceted counts, a two-ended number range, a date range — plus the chips that say which are applied. Each panel is a Conform form over a valibot schema and Apply is a real submit, so an inverted range is a field error instead of a query that returns nothing. In a table the header's filter popover mounts one of these at a time.",
    render: () => <Filters />,
  },
  {
    title: "Pager, selection and bulk actions",
    description:
      "TablePager over 300 imaginary rows: page size, a validated page jump, and first/previous/next/last. Beside it, TableBulkBar reading one selection model — select the whole page and it offers \"select all 300 matching\", which is the only claim that can be made about rows the browser has never seen.",
    render: () => <PagerAndSelection />,
  },
  {
    title: "The row editor on its own",
    description:
      "TableRowEditor takes a valibot schema, a field list and a default value, and gives back a parsed object. This is where the library's Conform story and its table story meet: a row edit is a form, so a bad edit is a field error beside the field. The same component backs the inline editor inside DataTable and a bulk edit inside a Modal.",
    render: () => <RowEditor />,
  },
]
