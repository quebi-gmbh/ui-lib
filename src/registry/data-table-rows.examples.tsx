import { Trash2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/button"
import { DataTable } from "@/components/data-table"
import { DescriptionDetails, DescriptionList, DescriptionTerm } from "@/components/description-list"
import { FormattedDate } from "@/components/formatted-date"
import { FormattedCurrency, FormattedNumber } from "@/components/formatted-number"
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/menu"
import { Note } from "@/components/note"
import { type DataTableColumn, type DataTableSelection, selectionCount } from "@/lib/data-table"
import { Money, ORDERS, type Order, SMALL_ORDERS, StatusBadge } from "./table-fixtures.examples"
import type { ComponentExample } from "./types"

const base: DataTableColumn<Order>[] = [
  { id: "reference", header: "Reference", accessorKey: "reference", width: 130 },
  { id: "customer", header: "Customer", accessorKey: "customer", truncate: true, width: 170 },
  {
    id: "status",
    header: "Status",
    accessorKey: "status",
    filterVariant: "enum",
    cell: ({ row }) => <StatusBadge status={row.status} />,
  },
  {
    id: "amount",
    header: "Amount",
    accessorKey: "amount",
    align: "end",
    aggregate: "sum",
    cell: ({ row }) => <Money value={row.amount} />,
    aggregatedCell: ({ value }) => <FormattedCurrency value={Number(value)} />,
  },
]

/* -------------------------------------------------------------------------- */
/*                                 selection                                  */
/* -------------------------------------------------------------------------- */

const SelectionShowcase = () => {
  const [selection, setSelection] = useState<DataTableSelection>({ mode: "include", keys: [] })
  const { count } = selectionCount(selection, ORDERS.length)

  return (
    <div className="flex w-full flex-col gap-3">
      <DataTable<Order>
        aria-label="Orders with selection"
        columns={base}
        data={ORDERS}
        getRowId={(order) => String(order.id)}
        selectionMode="multiple"
        selection={selection}
        onSelectionChange={setSelection}
        // Cancelled orders cannot be acted on in bulk, so they are not
        // selectable. `disabledBehavior="selection"` keeps them focusable.
        isRowDisabled={(order) => order.status === "Cancelled"}
        rowClassName={(order) => (order.isPriority ? "bg-amber-500/5" : undefined)}
        bulkActions={() => (
          <Button intent="outline" size="xs">
            <Trash2 data-slot="icon" aria-hidden="true" />
            Archive
          </Button>
        )}
        defaultPageSize={8}
      />
      <Note intent="info">
        Selected: <FormattedNumber value={count ?? 0} />. Select rows, page
        forward, select more, page back — the selection survives, because it is a
        model this table owns rather than the set of keys react-aria can see.
        Shift-click extends a range; the header checkbox is indeterminate while
        only some of the page is selected.
      </Note>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                       expansion, trees and grouping                        */
/* -------------------------------------------------------------------------- */

interface Account extends Order {
  children?: Account[]
}

const TREE: Account[] = SMALL_ORDERS.slice(0, 6).map((order, i) => ({
  ...order,
  children:
    i % 2 === 0
      ? SMALL_ORDERS.slice(12 + i, 14 + i).map((child) => ({ ...child, id: child.id + 1000 }))
      : undefined,
}))

const ExpansionShowcase = () => (
  <div className="flex w-full flex-col gap-6">
    <DataTable<Order>
      aria-label="Orders with detail panels"
      columns={base}
      data={SMALL_ORDERS.slice(0, 8)}
      getRowId={(order) => String(order.id)}
      enablePagination={false}
      renderDetail={(order) => (
        <DescriptionList>
          <DescriptionTerm>Country</DescriptionTerm>
          <DescriptionDetails>{order.country}</DescriptionDetails>
          <DescriptionTerm>Channel</DescriptionTerm>
          <DescriptionDetails>{order.channel}</DescriptionDetails>
          <DescriptionTerm>Placed</DescriptionTerm>
          <DescriptionDetails>
            <FormattedDate date={order.date} />
          </DescriptionDetails>
          <DescriptionTerm>Note</DescriptionTerm>
          <DescriptionDetails>{order.note || "—"}</DescriptionDetails>
        </DescriptionList>
      )}
      caption="A detail panel is one extra row with a single spanning cell — keyboard-reachable, and not selectable."
    />

    <DataTable<Account>
      aria-label="Orders as a tree"
      columns={base}
      data={TREE}
      getRowId={(order) => String(order.id)}
      getSubRows={(order) => order.children}
      enablePagination={false}
      enableGlobalSearch={false}
      caption="Sub-rows come from getSubRows and arrive pre-flattened with a depth, which is what the indent in the first cell is."
    />

    <DataTable<Order>
      aria-label="Orders grouped by country"
      columns={[
        { ...base[0], enableGrouping: false },
        { id: "country", header: "Country", accessorKey: "country", enableGrouping: true },
        base[2],
        base[3],
      ]}
      data={SMALL_ORDERS}
      getRowId={(order) => String(order.id)}
      defaultGrouping={["country"]}
      enablePagination={false}
      showFooter
      caption="Grouping is expansion in the row model, which is why one owner holds both. The Amount column aggregates with sum; the group header shows the row count."
    />
  </div>
)

/* -------------------------------------------------------------------------- */
/*                      actions, links, reordering, density                   */
/* -------------------------------------------------------------------------- */

const ActionsShowcase = () => {
  const [rows, setRows] = useState(() => SMALL_ORDERS.slice(0, 10))

  return (
    <div className="flex w-full flex-col gap-3">
      <DataTable<Order>
        aria-label="Orders with row actions"
        columns={base}
        data={rows}
        getRowId={(order) => String(order.id)}
        enablePagination={false}
        striped
        // Below `sm` the same ten rows render as cards, ordered by each
        // column's `priority`. Both layouts are in the DOM — the breakpoint is
        // CSS — so this is for a table you can afford to render twice.
        stackOnMobile
        // Conditional formatting: the row says what it is, in a class the
        // consumer chooses rather than one the table invents.
        rowClassName={(order) =>
          order.amount > 700 ? "bg-emerald-500/5" : order.status === "Refunded" ? "bg-red-500/5" : undefined
        }
        onRowReorder={(keys, targetKey, position) =>
          setRows((current) => {
            const moving = current.filter((order) => keys.includes(String(order.id)))
            const rest = current.filter((order) => !keys.includes(String(order.id)))
            const index = rest.findIndex((order) => String(order.id) === targetKey)
            const at = position === "before" ? index : index + 1
            return [...rest.slice(0, at), ...moving, ...rest.slice(at)]
          })
        }
        rowActions={(order) => (
          <Menu>
            <MenuTrigger
              aria-label={`Actions for ${order.reference}`}
              className="text-quebi-fg-subtle hover:text-quebi-fg"
            >
              ⋯
            </MenuTrigger>
            <MenuContent placement="bottom end">
              <MenuItem id="open">Open</MenuItem>
              <MenuItem id="duplicate">Duplicate</MenuItem>
              <MenuItem id="delete" intent="danger">
                Delete
              </MenuItem>
            </MenuContent>
          </Menu>
        )}
        caption="Drag the grip to reorder. The action menu lives in the first cell, so it does not cost a column. Narrow the window past sm and the rows become cards."
      />
      <Note intent="info">
        Whole-row navigation is <code>getRowHref</code>, which puts a real link
        on the row — never an <code>onClick</code> that calls a router, because
        a control that changes the URL has to be an anchor.
      </Note>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 column UX                                  */
/* -------------------------------------------------------------------------- */

const wideColumns: DataTableColumn<Order>[] = [
  { id: "reference", header: "Reference", accessorKey: "reference", width: 140, enablePinning: true },
  { id: "customer", header: "Customer", accessorKey: "customer", width: 200, truncate: true },
  { id: "country", header: "Country", accessorKey: "country", width: 140, filterVariant: "enum" },
  { id: "channel", header: "Channel", accessorKey: "channel", width: 120 },
  {
    id: "status",
    header: "Status",
    accessorKey: "status",
    width: 140,
    cell: ({ row }) => <StatusBadge status={row.status} />,
  },
  { id: "items", header: "Items", accessorKey: "items", width: 100, align: "end" },
  {
    id: "amount",
    header: "Amount",
    accessorKey: "amount",
    width: 140,
    align: "end",
    cell: ({ row }) => <Money value={row.amount} />,
  },
  {
    id: "date",
    header: "Date",
    accessorKey: "date",
    width: 140,
    cell: ({ row }) => <FormattedDate date={row.date} />,
  },
]

const ColumnUxShowcase = () => (
  <div className="flex w-full flex-col gap-3">
    <DataTable<Order>
      aria-label="Orders with resizable, pinnable columns"
      columns={wideColumns}
      // Pagination is off so the scroller is the only thing bounding the table,
      // which means the row count is the example's to keep sensible.
      data={ORDERS.slice(0, 40)}
      getRowId={(order) => String(order.id)}
      allowResize
      stickyHeader
      height={420}
      enablePagination={false}
      storageKey="ui-lib.demo.orders"
      caption="Drag a column edge to resize. Each header's ⌄ menu pins it to the start or the end, or hides it; the Columns popover brings it back. The layout is saved to localStorage under storageKey, so it survives a reload."
    />
    <Note intent="info">
      Pinning positions a column with a sticky offset, so a pinned column needs
      an explicit <code>width</code> for that offset to be exact. Reset to
      defaults is at the bottom of the Columns popover.
    </Note>
  </div>
)

export const dataTableRowExamples: ComponentExample[] = [
  {
    title: "Selection, bulk actions and disabled rows",
    description:
      "Multiple selection with a checkbox column, shift-click ranges, an indeterminate header checkbox, and rows that cannot be selected. The count and the bulk-action bar read from one selection model, which is what makes the selection survive paging and filtering.",
    render: () => <SelectionShowcase />,
  },
  {
    title: "Detail panels, tree data and grouping",
    description:
      "Three shapes of expansion, all owned by the row model: a detail panel as an extra spanning row, sub-rows indented by depth, and grouping with a sum aggregate and a per-group count.",
    render: () => <ExpansionShowcase />,
  },
  {
    title: "Row actions, drag-reorder and conditional formatting",
    description:
      "A per-row action menu, drag handles that reorder through onRowReorder, and row classes driven by the data. Striping, hover, focus and selection styling come from the quebi Table underneath.",
    render: () => <ActionsShowcase />,
  },
  {
    title: "Resize, pin, hide and a saved layout",
    description:
      "Eight columns in a 420px-tall scroller with a sticky header. Resize from the column edge, pin from the header menu, hide from the Columns popover — and the arrangement is written to localStorage.",
    render: () => <ColumnUxShowcase />,
  },
]
