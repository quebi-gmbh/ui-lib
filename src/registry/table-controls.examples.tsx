import { useState } from "react"
import { Button } from "@/components/button"
import { Card } from "@/components/card"
import { Checkbox } from "@/components/checkbox"
import { FormattedNumber } from "@/components/formatted-number"
import { Note } from "@/components/note"
import {
  TableBulkBar,
  TableColumnChooser,
  TableDensityToggle,
  TableFilterChips,
  TableFilterPanel,
  TablePager,
  TableSearch,
  TableToolbar,
  describeFilter,
} from "@/components/table-controls"
import type { DataTableDensity, DataTableSelection, FilterCondition } from "@/lib/data-table"
import {
  applySelection,
  defaultOperator,
  emptySelection,
  facetedOptions,
  isFilterSet,
  isRowSelected,
  matchesFilter,
} from "@/lib/data-table"
import { Money, ORDERS, STATUSES } from "./table-fixtures.examples"
import type { ComponentExample } from "./types"

/**
 * Every control on its own, which is the documentation the family was missing.
 *
 * Each of these is exactly what DataTable and ServerTable render — same file,
 * same props — with the state they normally read out of a row model or a query
 * held in a `useState` beside it instead. That is the whole argument for the
 * split: a control that takes a value and a callback can be shown alone, and a
 * control that reaches into a table cannot.
 *
 * "Alone" has one limit, and the selection example is where it bites: what is
 * selected is a statement *about rows*, so a bulk bar and a pager over an empty
 * space read as chrome for a table somebody forgot to render. That example
 * therefore draws its page as a column of checkboxes — not a component, and
 * deliberately not a table, just the rows the controls are talking about.
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
  const [filters, setFilters] = useState<FilterCondition[]>([
    { id: "status", fieldId: "status", operator: "is", variant: "enum", value: ["Paid"] },
  ])

  const apply = (
    fieldId: string,
    variant: FilterCondition["variant"],
    value: unknown,
    operator?: FilterCondition["operator"],
  ) => {
    setFilters((current) => {
      const next = current.filter((filter) => filter.fieldId !== fieldId)
      return isFilterSet(value)
        ? [
            ...next,
            {
              id: fieldId,
              fieldId,
              variant,
              operator: operator ?? defaultOperator(variant),
              value,
            },
          ]
        : next
    })
  }

  const applied = (fieldId: string) => filters.find((filter) => filter.fieldId === fieldId)
  const appliedValue = (fieldId: string) => applied(fieldId)?.value

  /**
   * The Status facet, counted the way a row model counts one: the number
   * beside a choice is of the rows the *other* filters leave, so it answers
   * "and how many would that leave", and the domain is every status there is
   * rather than the ones currently surviving. Narrow Amount to 400–500 and the
   * statuses it empties stay on the list as a disabled 0 — visible, explained,
   * and in the same place they were. `facetedOptions` is the one doing that;
   * inside DataTable it is handed `column.getFacetedUniqueValues()`.
   */
  const statusOptions = facetedOptions({
    declared: STATUSES.map((status) => ({ value: status })),
    counts: new Map(
      STATUSES.map((status) => [
        status,
        ORDERS.filter(
          (order) =>
            order.status === status &&
            filters.every(
              (filter) =>
                filter.fieldId === "status" ||
                matchesFilter(
                  order[filter.fieldId as "amount" | "date"],
                  filter.variant,
                  filter.value,
                  filter.operator,
                ),
            ),
        ).length,
      ]),
    ),
    selected: appliedValue("status") as string[] | undefined,
  })

  return (
    <div className="flex w-full flex-col gap-3">
      <TableFilterChips
        filters={filters.map((filter) => ({
          column: filter.fieldId,
          label: filter.fieldId[0].toUpperCase() + filter.fieldId.slice(1),
          // The same function the chips inside both tables are labelled with:
          // the variant decides the words, not the shape of the value — and the
          // operator is named only when it is not the one the variant implies.
          text: describeFilter(filter.variant, filter.value, filter.operator),
        }))}
        onClear={(fieldId) => apply(fieldId, undefined, undefined)}
        onClearAll={() => setFilters([])}
        presets={[{ id: "open", label: "Open orders" }]}
        onApplyPreset={() =>
          setFilters([
            {
              id: "status",
              fieldId: "status",
              operator: "is",
              variant: "enum",
              value: ["Pending", "Shipped"],
            },
          ])
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
        query. Narrow <em>Amount</em> and watch the status counts: a choice the
        range has emptied is disabled at 0 rather than gone, so you can still
        see it, and the one you have applied stays checkable whatever it counts.
        Inside a table these are mounted by the header's filter popover, one at
        a time, and there Apply dismisses it through <code>onClose</code>. Here
        nothing hosts them, so the prop is left off and the three stay side by
        side, all visible at once. There are five variants in all: text and
        boolean are the two not shown.
      </Note>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                            pager and bulk bar                              */
/* -------------------------------------------------------------------------- */

const PagerAndSelection = () => {
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [selection, setSelection] = useState<DataTableSelection>(emptySelection)
  const total = ORDERS.length
  const rowsOnPage = Math.max(0, Math.min(pageSize, total - page * pageSize))
  const rows = ORDERS.slice(page * pageSize, page * pageSize + rowsOnPage)
  const pageKeys = rows.map((order) => String(order.id))
  const selectedOnPage = pageKeys.filter((key) => isRowSelected(selection, key))

  /*
   * A table would hand this set back out of react-aria and fold it in with
   * `applySelection`; the stand-in rows below do the same call with the same
   * arguments, so a selection made on page one survives a trip to page four
   * exactly as it does in DataTable.
   */
  const selectOnPage = (keys: string[]) =>
    setSelection((current) => applySelection(current, keys, pageKeys, false))

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
      {/*
       * The rows are the point. TableControls is the chrome without the table,
       * and a selection control above nothing is a lever with no machine on the
       * end of it — "0 selected" of what? So this example draws the page it is
       * paging through, as plainly as it can: one checkbox per row, which is
       * the column DataTable puts in front of each row anyway.
       */}
      <Card className="gap-3 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Checkbox
            isSelected={rowsOnPage > 0 && selectedOnPage.length === rowsOnPage}
            isIndeterminate={selectedOnPage.length > 0 && selectedOnPage.length < rowsOnPage}
            onChange={(isSelected) => selectOnPage(isSelected ? pageKeys : [])}
          >
            Select this page
          </Checkbox>
          <span className="ms-auto text-quebi-fg-muted text-sm">
            <FormattedNumber value={selectedOnPage.length} /> of{" "}
            <FormattedNumber value={rowsOnPage} /> on this page
          </span>
        </div>
        <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((order) => {
            const key = String(order.id)
            return (
              <Checkbox
                key={key}
                isSelected={isRowSelected(selection, key)}
                onChange={(isSelected) =>
                  selectOnPage(
                    isSelected
                      ? [...selectedOnPage, key]
                      : selectedOnPage.filter((selected) => selected !== key),
                  )
                }
              >
                <span className="flex min-w-0 flex-1 items-baseline justify-between gap-3 text-sm">
                  <span className="truncate">{order.reference}</span>
                  <Money value={order.amount} />
                </span>
              </Checkbox>
            )
          })}
        </div>
      </Card>
      <TablePager
        page={page}
        pageSize={pageSize}
        rowsOnPage={rowsOnPage}
        total={total}
        // Smaller than the pager's own [10, 20, 50, 100], because here the rows
        // are actually drawn and a hundred checkboxes is a wall, not an example.
        pageSizes={[5, 10, 20]}
        onPageChange={setPage}
        onPageSizeChange={(next) => {
          setPageSize(next)
          setPage(0)
        }}
      />
      <Note intent="info">
        The checkboxes are not a component — they stand in for the rows a table
        would draw, because a selection bar over nothing is a count of an
        invisible thing. Select the whole page and the bar offers "select all{" "}
        {total} matching", which is a different claim from "these {rowsOnPage}"
        — and the only one that can be made about rows the browser has never
        seen. Take it, then uncheck one row: the model flips to{" "}
        <code>all-matching</code> with an exclusion list rather than expanding
        into {total} keys. Page forward and back and what you picked is still
        picked. Type 900 into the page jump and it says how many pages there are
        instead of showing you an empty table.
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
      "TablePager over 300 imaginary rows — which is Pagination's centred column: the range summary, the numbered page row with first/previous/next/last, and the rows-per-page select beside a labelled page jump underneath. Above it, TableBulkBar reading one selection model, and between them the rows themselves: this is the one example on the page that draws what it is paging through, because a selection control with nothing under it counts an invisible thing. The checkboxes are a stand-in for a table's rows, folded into the model by the same applySelection call a DataTable makes — select the whole page and the bar offers \"select all 300 matching\", which is the only claim that can be made about rows the browser has never seen.",
    render: () => <PagerAndSelection />,
  },
]
