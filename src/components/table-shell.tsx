"use client"

import type { RowData, SortingState } from "@tanstack/react-table"
import {
  ChevronRight as ChevronRightIcon,
  EllipsisVertical,
  Filter,
  Loader2,
  PinOff,
  RotateCcw,
} from "lucide-react"
import { type ReactNode, use, useEffect, useMemo, useRef, useState } from "react"
import { useIsSSR } from "react-aria"
import type { Selection } from "react-aria-components"
import {
  Cell,
  CheckboxContext,
  Row,
  TableLayout,
  TableLoadMoreItem,
  TableStateContext,
  Virtualizer,
  useDragAndDrop,
} from "react-aria-components"
import { Badge } from "@/components/badge"
import { Button } from "@/components/button"
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/menu"
import { Note } from "@/components/note"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/popover"
import { Skeleton } from "@/components/skeleton"
import {
  Table,
  TABLE_BAND_HEIGHT,
  TableBody,
  TableCell,
  TableColumn,
  TableColumnGroup,
  TableHeader,
  TableRow,
} from "@/components/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/tooltip"
import {
  type DataTableCellAddress,
  type DataTableCellEditRenderer,
  type DataTableDensity,
  type DataTableHeader,
  type DataTableInstance,
  type DataTableRow,
  type DataTableSelection,
  applySelection,
  editableCells,
  emptySelection,
  isSameCell,
  nextEditableCell,
  selectedKeysFor,
  sortPriority,
  toSortDescriptor,
} from "@/lib/data-table"
import { cn } from "@/lib/utils"

/**
 * Table Shell — quebi design system
 *
 * The render half of the table family: a TanStack instance and the rows to
 * draw go in, a quebi Table with a banded header, per-column filter popovers,
 * column menus, selection, detail panels, row editors, drag-reorder,
 * virtualization and the four empty states comes out.
 *
 * It does nothing to the model. The client-side `DataTable` hands it a fully
 * computed row model; the server-driven `ServerTable` hands it the page the
 * server returned with every `manual*` flag set. That is what makes the two
 * modes the same table twice rather than two tables that resemble each other —
 * and what makes this component usable on its own, over a TanStack instance you
 * built yourself, when neither mode is the shape you want.
 *
 * **It renders no chrome and imports none.** The toolbar, the pager and the
 * filter panels live in `table-controls`, which is this module's sibling and
 * not its dependency: the shell asks for a filter popover's body through
 * `renderFilter(columnId)` and the caller decides what goes in it. Keeping the
 * arrow out in both directions is what makes the family a tree.
 *
 * TanStack supplies the model; react-aria supplies the view. Rendering goes
 * through the quebi Table, so ARIA grid semantics, keyboard navigation,
 * typeahead, selection UX, column resize, drag & drop and virtualization are
 * react-aria's — see the ownership table in `@/lib/data-table`.
 *
 * That includes the header: a column with child columns becomes a real spanned
 * header cell through `TableColumnGroup`, so the band is part of the grid rather
 * than a line of text repeated above each leaf. What makes that possible, and
 * why every leaf ends up with a band above it, is in that component's doc.
 *
 * The one keyboard model it does *not* leave to react-aria is the one that makes
 * an editable table a data table rather than a page of inputs — see
 * `useCellEditKeyboard` below for which half of it is react-aria's and which
 * half had to be built, and why the seam falls where it does.
 */

/*
 * Re-exported rather than moved. `TABLE_BAND_HEIGHT` is the height
 * `TableColumnGroup` sets on its own cell, so it has to be defined beside that
 * element — a second copy here would be a constant free to drift from the thing
 * it describes. What the re-export buys is that code composing its own shell
 * needs one import for the sticky-offset problem instead of two.
 */
export { TABLE_BAND_HEIGHT } from "@/components/table"

/**
 * Whether the shift key was down when the current press started.
 *
 * react-aria's `onSortChange` reports the column and the direction and nothing
 * else — there is no modifier in the event, by design, because sorting is
 * meant to be a statement of intent rather than a description of an input
 * device. Multi-column sort needs that one bit anyway, so it is captured on
 * the way down, in the capture phase, before the press handler runs.
 */
function useSortModifier() {
  const additive = useRef(false)
  const handlers = useMemo(
    () => ({
      onPointerDownCapture: (event: React.PointerEvent) => {
        additive.current = event.shiftKey
      },
      onKeyDownCapture: (event: React.KeyboardEvent) => {
        if (event.key === "Enter" || event.key === " ") additive.current = event.shiftKey
      },
    }),
    [],
  )
  return { additive, handlers }
}

const densityCell: Record<DataTableDensity, string> = {
  compact: "py-1.5",
  normal: "py-3",
  comfortable: "py-4",
}

const alignClass = (align: string | undefined) =>
  align === "center" ? "text-center" : align === "end" ? "text-end" : "text-start"

/** Columns below the breakpoint their priority names are hidden, not dropped. */
const priorityClass = (priority: number | undefined) =>
  priority == null || priority === 0
    ? undefined
    : priority === 1
      ? "hidden sm:table-cell"
      : priority === 2
        ? "hidden lg:table-cell"
        : "hidden xl:table-cell"

/**
 * The cell element for an address, found by its data attributes rather than
 * held in a ref.
 *
 * A commit can re-sort the row out from under the cursor, which is exactly the
 * case a ref captured before the commit gets wrong: the node is still in the
 * document, at a different index, and a stale ref points at whichever row took
 * its place. Attribute matching rather than a CSS selector because a row id is
 * arbitrary text and `CSS.escape` is not everywhere this renders.
 */
function findCell(
  container: HTMLElement | null,
  cell: DataTableCellAddress,
): HTMLElement | null {
  if (!container) return null
  const nodes = container.querySelectorAll<HTMLElement>("[data-row-key][data-column-id]")
  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index]
    if (node.dataset.rowKey === cell.rowId && node.dataset.columnId === cell.columnId) return node
  }
  return null
}

/**
 * A character that should start an edit, rather than a key the grid owns.
 *
 * Space is left to react-aria: it toggles the row's selection, and a table that
 * started editing on it would have no keyboard way to select a row. Every
 * modifier combination is left alone too — `Ctrl+C` on a cell is a copy.
 */
function isTypingKey(event: React.KeyboardEvent): boolean {
  return (
    event.key.length === 1 &&
    event.key !== " " &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey
  )
}

/**
 * Arrow keys belong to the caret while a cell is being edited.
 *
 * react-aria's `useGridCell` intercepts ArrowLeft/ArrowRight in the capture
 * phase and turns them into "move to the next focusable thing, then the next
 * cell" — correct for a cell holding buttons, and fatal for one holding a text
 * field, where it means the caret can never move. The hook checks one flag
 * before it does any of that, `isKeyboardNavigationDisabled`, which react-stately
 * puts on the table state with a setter beside it; column resizing already uses
 * it for the same reason. So the flag is held down for exactly as long as an
 * editor is mounted, and the grid's own arrow navigation comes back the instant
 * it is not.
 *
 * It is a component rather than a hook call in the shell because the state is
 * published by react-aria's Table, which only its own descendants can reach —
 * and the editing cell is one.
 */
function GridKeyboardOff() {
  // The raw useState setter from react-stately's useTableState: stable across
  // renders, which is what keeps this effect from thrashing the flag.
  const setDisabled = use(TableStateContext)?.setKeyboardNavigationDisabled
  useEffect(() => {
    setDisabled?.(true)
    return () => setDisabled?.(false)
  }, [setDisabled])
  return null
}

/**
 * The half of the editing keyboard model react-aria does not already own.
 *
 * What it does own, and what is therefore not here: arrow keys between cells,
 * Home/End, page keys, typeahead, the roving tab stop that makes the whole
 * table one Tab away from the rest of the page, and the ARIA grid semantics
 * underneath all of it. What is here is the part that only exists once a cell
 * can become a control:
 *
 * - **Starting an edit is the grid's key being taken away**, so it is handled in
 *   the *capture* phase, before react-aria sees it: Enter and F2 open the
 *   editor, and any printable character opens it with that character as the
 *   value — which has to beat typeahead, since typing "P" on an editable cell
 *   cannot both jump to a row starting with P and start typing "P" into it.
 *   Only cells that actually have an editor take the key; every other cell
 *   keeps react-aria's behaviour exactly.
 * - **Finishing an edit belongs to the editor**, not here: Escape, Enter and Tab
 *   are `TableCellEditor`'s in `table-controls`, which is the half that knows
 *   whether the schema accepted the row and therefore whether there is anything
 *   to move on from. It reads them on the way down too, and for a reason worth
 *   reading there — react-aria's formatted fields stop Enter before it could
 *   ever bubble.
 * - **Tab commits and moves to the next editable cell**, wrapping to the next
 *   row rather than leaving for the next focusable element in the document; the
 *   order it walks is `editableCells`, which is the rows on screen crossed with
 *   the editable columns, in the order they are drawn.
 * - **Focus comes back to the cell**, never to the body — including when the
 *   commit re-sorted the row somewhere else, because the cell is found again by
 *   its address rather than remembered as a node.
 */
function useCellEditKeyboard({
  editingCell,
  onEditingCellChange,
  order,
  enabled,
}: {
  editingCell: DataTableCellAddress | null
  onEditingCellChange: ((cell: DataTableCellAddress | null) => void) | undefined
  order: DataTableCellAddress[]
  enabled: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [seed, setSeed] = useState<(DataTableCellAddress & { text: string }) | null>(null)
  const rowId = editingCell?.rowId
  const columnId = editingCell?.columnId
  // The address the last render was editing, so a close knows which cell to
  // give focus back to. A ref rather than state: nothing renders from it.
  const previous = useRef<DataTableCellAddress | null>(null)
  // Read only when an editor closes, and it changes on every commit — a ref
  // keeps it out of the effect's dependencies without lying about them.
  const orderRef = useRef(order)
  orderRef.current = order

  const start = (cell: DataTableCellAddress, text?: string) => {
    setSeed(text == null ? null : { ...cell, text })
    onEditingCellChange?.(cell)
  }

  useEffect(() => {
    const container = containerRef.current
    const was = previous.current
    previous.current = rowId != null && columnId != null ? { rowId, columnId } : null
    if (!container) return
    if (rowId != null && columnId != null) {
      // Putting focus *into* the control is the editor's own job: react-aria
      // renders a cell's children through its collection, so at this point the
      // cell is here and what goes in it is one commit away.
      return
    }
    if (!was) return
    // The editor has gone; something has to hold the focus it had. The cell it
    // was in first, then any cell left in the same column — the row may have
    // been filtered away by the very edit that just committed — and the grid
    // itself last, so focus never lands on the body.
    const sameColumn = orderRef.current.find((candidate) => candidate.columnId === was.columnId)
    const cell = findCell(container, was) ?? (sameColumn ? findCell(container, sameColumn) : null)
    if (cell) cell.focus()
    else container.querySelector<HTMLElement>('[role="grid"]')?.focus()
  }, [rowId, columnId])

  const onKeyDownCapture = (event: React.KeyboardEvent) => {
    if (!enabled) return
    const target = event.target as HTMLElement | null
    const cell = target?.closest?.<HTMLElement>("[data-editable-cell]")
    // Only when the cell itself has focus. Once an editor is open the target is
    // a control inside it, and those keys are the editor's to answer.
    if (!cell || cell !== target) return
    const address = { rowId: cell.dataset.rowKey ?? "", columnId: cell.dataset.columnId ?? "" }
    if (event.key === "Enter" || event.key === "F2") {
      event.preventDefault()
      event.stopPropagation()
      start(address)
      return
    }
    if (isTypingKey(event)) {
      event.preventDefault()
      event.stopPropagation()
      start(address, event.key)
    }
  }

  return {
    containerRef,
    onKeyDownCapture,
    start,
    close: () => onEditingCellChange?.(null),
    move: (from: DataTableCellAddress, delta: 1 | -1) =>
      onEditingCellChange?.(nextEditableCell(order, from, delta) ?? null),
    seedFor: (cell: DataTableCellAddress) => (isSameCell(seed, cell) ? seed?.text : undefined),
  }
}

export interface TableShellProps<T extends RowData> {
  "aria-label": string
  /** The TanStack instance. Client-side it owns the model; server-side it is manual. */
  table: DataTableInstance<T>
  /** The rows to draw — already sorted, filtered, grouped, expanded and paged. */
  rows: DataTableRow<T>[]
  getRowKey: (row: T) => string
  sorting: SortingState
  /** Called with a column id and whether the shift key was down. */
  onSortIntent?: (columnId: string, additive: boolean) => void
  /**
   * Sort explicitly, from the column menu. Separate from `onSortIntent`
   * because a server-driven table's sort is a query and never a store write —
   * calling `table.setSorting` on a controlled slice does nothing at all.
   */
  onSortColumn?: (columnId: string, direction: "asc" | "desc" | null) => void
  /** Offer "group by this column" in the column menu. Client-side only. */
  allowGrouping?: boolean
  density?: DataTableDensity
  striped?: boolean
  grid?: boolean
  allowResize?: boolean
  stickyHeader?: boolean
  /** A pixel height turns the table into its own scroll container. */
  height?: number
  /** Row virtualization, through react-aria's Virtualizer + TableLayout. */
  virtualize?: boolean
  rowHeight?: number
  selectionMode?: "none" | "single" | "multiple"
  selection?: DataTableSelection
  onSelectionChange?: (selection: DataTableSelection) => void
  allowSelectAllMatching?: boolean
  isRowDisabled?: (row: T) => boolean
  getRowHref?: (row: T) => string | undefined
  onRowAction?: (row: T) => void
  rowActions?: (row: T) => ReactNode
  /** A detail panel, rendered as an extra row with one spanning cell. */
  renderDetail?: (row: T) => ReactNode
  /** Replaces the row entirely while it is being edited. */
  renderRowEditor?: (row: T) => ReactNode
  editingKey?: string | null
  /**
   * The cell being edited, or null. Controlled, and deliberately one cell: two
   * open editors would be two forms over the same row disagreeing about it.
   */
  editingCell?: DataTableCellAddress | null
  onEditingCellChange?: (cell: DataTableCellAddress | null) => void
  /**
   * Column ids whose cells can be edited. Plain data because the shell needs it
   * before it renders anything — to draw the affordance, to decide what Enter
   * means on a focused cell, and to know where Tab goes next.
   */
  editableColumns?: string[]
  /** The control for the editing cell, rendered inside the same `<td>`. */
  renderCellEditor?: DataTableCellEditRenderer<T>
  /** Extra classes for a row — conditional formatting lives here. */
  rowClassName?: (row: T) => string | undefined
  /** Per-column filter popover content. Return null for an unfilterable column. */
  renderFilter?: (columnId: string) => ReactNode
  /** Which columns currently have a filter applied, for the header badge. */
  activeFilters?: string[]
  isLoading?: boolean
  isRefreshing?: boolean
  hasQuery?: boolean
  emptyMessage?: string
  noResultsMessage?: string
  error?: ReactNode
  onRetry?: () => void
  onLoadMore?: () => void
  isLoadingMore?: boolean
  onRowReorder?: (keys: string[], targetKey: string, position: "before" | "after") => void
  showFooter?: boolean
  className?: string
}

const skeletonRowIds = ["s1", "s2", "s3", "s4", "s5"]

/**
 * Content inside a Table that is not part of the Table.
 *
 * react-aria's Table publishes a CheckboxContext whose only slot is
 * `selection`, so any Checkbox rendered inside it — a filter list in a column
 * popover, a form in an expanded row — throws "a slot prop is required" rather
 * than rendering. Clearing the context is what says "this checkbox is not the
 * table's"; the panels are React children of the header even when they are
 * portalled out of it.
 */
function OutsideTheCollection({ children }: { children: ReactNode }) {
  return <CheckboxContext.Provider value={null}>{children}</CheckboxContext.Provider>
}

/**
 * A row that is one cell wide — a detail panel, or a row being edited.
 *
 * react-aria's own Row is used rather than the library's because the library's
 * adds the drag handle and the selection checkbox from the table's context,
 * and neither belongs on a row that is not a record. The colSpan then has to
 * cover those gutters too, which is what `columnCount` counts.
 */
function SpanningRow({
  id,
  columnCount,
  className,
  children,
}: {
  id: string
  columnCount: number
  className?: string
  children: ReactNode
}) {
  return (
    <Row id={id} className="group border-quebi-line/10 border-b last:border-b-0">
      <Cell colSpan={columnCount} className={cn("outline-hidden", className)}>
        <OutsideTheCollection>{children}</OutsideTheCollection>
      </Cell>
    </Row>
  )
}

/**
 * The render half both modes share, and the one to reach for when neither mode
 * fits.
 *
 * It takes a TanStack instance and the rows to draw and does nothing else with
 * the model: `DataTable` hands it a fully computed row model, `ServerTable`
 * hands it the page the server returned with every `manual*` flag set. That is
 * what makes the two modes the same table twice rather than two tables that
 * resemble each other — and it means a third caller with a `useTable` of its
 * own gets the same header, selection, expansion and empty states by handing
 * over the same two props.
 */
export function TableShell<T extends RowData>({
  "aria-label": ariaLabel,
  table,
  rows,
  getRowKey,
  sorting,
  onSortIntent,
  onSortColumn,
  allowGrouping,
  density = "normal",
  striped,
  grid,
  allowResize,
  stickyHeader,
  height,
  virtualize,
  rowHeight = 44,
  selectionMode = "none",
  selection = emptySelection,
  onSelectionChange,
  allowSelectAllMatching = false,
  isRowDisabled,
  getRowHref,
  onRowAction,
  rowActions,
  renderDetail,
  renderRowEditor,
  editingKey,
  editingCell = null,
  onEditingCellChange,
  editableColumns,
  renderCellEditor,
  rowClassName,
  renderFilter,
  activeFilters = [],
  isLoading,
  isRefreshing,
  hasQuery,
  emptyMessage = "No records yet.",
  noResultsMessage = "No rows match your filters.",
  error,
  onRetry,
  onLoadMore,
  isLoadingMore,
  onRowReorder,
  showFooter,
  className,
}: TableShellProps<T>) {
  const { additive, handlers } = useSortModifier()
  const headerGroups = table.getHeaderGroups()
  const leafHeaders = headerGroups.at(-1)?.headers ?? []
  const hasBands = headerGroups.length > 1
  // The same signal react-aria's own collection uses to pick its SSR path, and
  // for the same reason: a band is a parent column, and parent columns do not
  // survive that path (adobe/react-spectrum#10598). `TableColumnGroup` has the
  // whole story. Until the gate opens — one render after hydration — the band
  // name rides above each leaf label instead, in a block the band row's own
  // height, so nothing moves when the real row arrives.
  const isSSR = useIsSSR()
  const showBands = hasBands && !isSSR
  const leafColumns = table.getVisibleLeafColumns()
  const columnCount = leafColumns.length + (selectionMode === "multiple" ? 1 : 0) + (onRowReorder ? 1 : 0)
  // The same key each row is rendered with — a grouped row is its own id, not
  // the id of whichever leaf TanStack put in `original`.
  const pageKeys = useMemo(
    () => rows.map((row) => (row.getIsGrouped?.() ? row.id : getRowKey(row.original))),
    [rows, getRowKey],
  )

  /**
   * The editable columns, in the order they are drawn. A column the chooser has
   * hidden is not editable — Tab cannot move to a cell nobody can see.
   */
  const editableColumnIds = useMemo(
    () =>
      renderCellEditor && editableColumns
        ? leafHeaders
            .map((header) => header.column.id)
            .filter((id) => editableColumns.includes(id))
        : [],
    [renderCellEditor, editableColumns, leafHeaders],
  )
  /**
   * Every editable cell on screen, row-major — the list Tab walks.
   *
   * Three kinds of row are left out, each because it has no cell to land on: a
   * grouped row shows an aggregate of the rows underneath and there is no single
   * row for a form to be over; a disabled row is not the user's to change; and
   * the row a *row* editor has taken over has been replaced by one spanning
   * cell, so Tab would aim at a `<td>` that is not drawn.
   */
  const editableRowKeys = useMemo(
    () =>
      editableColumnIds.length === 0
        ? new Set<string>()
        : new Set(
            rows
              .filter(
                (row) =>
                  !row.getIsGrouped?.() &&
                  !isRowDisabled?.(row.original) &&
                  getRowKey(row.original) !== editingKey,
              )
              .map((row) => getRowKey(row.original)),
          ),
    [rows, getRowKey, editableColumnIds, isRowDisabled, editingKey],
  )
  const editOrder = useMemo(
    () => editableCells([...editableRowKeys], editableColumnIds),
    [editableRowKeys, editableColumnIds],
  )
  const cellEdit = useCellEditKeyboard({
    editingCell,
    onEditingCellChange,
    order: editOrder,
    enabled: editableColumnIds.length > 0,
  })

  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys) => [...keys].map((key) => ({ "text/plain": String(key) })),
    onReorder: (event) => {
      onRowReorder?.(
        [...event.keys].map(String),
        String(event.target.key),
        event.target.dropPosition === "before" ? "before" : "after",
      )
    },
  })

  const cellPadding = densityCell[density]

  /** Sticky offset for a pinned column. Needs an explicit width to be exact. */
  const pinStyle = (columnId: string): React.CSSProperties | undefined => {
    const column = table.getColumn(columnId)
    const pinned = column?.getIsPinned?.()
    if (!pinned) return undefined
    return pinned === "start"
      ? { position: "sticky", insetInlineStart: column?.getStart?.("start") ?? 0, zIndex: 12 }
      : { position: "sticky", insetInlineEnd: column?.getAfter?.("end") ?? 0, zIndex: 12 }
  }

  const detailKeys: string[] = []
  const disabledKeys: string[] = []
  const bodyRows: ReactNode[] = []

  for (const row of rows) {
    const key = row.getIsGrouped?.() ? row.id : getRowKey(row.original)
    if (row.getIsGrouped?.()) disabledKeys.push(key)
    if (isRowDisabled?.(row.original)) disabledKeys.push(key)
    const isEditing = editingKey != null && editingKey === key

    if (isEditing && renderRowEditor) {
      disabledKeys.push(key)
      bodyRows.push(
        <SpanningRow
          key={key}
          id={key}
          columnCount={columnCount}
          className={cn("bg-quebi-brand/5 px-3.5", cellPadding)}
        >
          {renderRowEditor(row.original)}
        </SpanningRow>,
      )
      continue
    }

    bodyRows.push(
      <TableRow
        key={key}
        id={key}
        href={getRowHref?.(row.original)}
        onAction={onRowAction ? () => onRowAction(row.original) : undefined}
        className={cn(rowClassName?.(row.original))}
      >
        {leafHeaders.map((header, index) => {
          const cell = row.getAllCells().find((c) => c.column.id === header.column.id)
          const meta = header.column.columnDef.meta
          const isFirst = index === 0
          const value = cell?.getValue()
          const isEmpty = value == null || value === ""
          const address = { rowId: key, columnId: header.column.id }
          const canEdit = editableRowKeys.has(key) && editableColumnIds.includes(header.column.id)
          const isEditingThisCell = canEdit && isSameCell(editingCell, address)
          const content = row.getIsGrouped?.()
            ? cell?.getIsGrouped?.()
              ? groupedCellContent(row, String(value))
              : cell?.getIsAggregated?.()
                ? renderTemplate(cell.column.columnDef.aggregatedCell, cell)
                : cell?.getIsPlaceholder?.()
                  ? null
                  : renderTemplate(cell?.column.columnDef.cell, cell)
            : cell?.column.columnDef.cell
              ? renderTemplate(cell.column.columnDef.cell, cell)
              : isEmpty
                ? (meta?.emptyValue ?? "—")
                : String(value)
          return (
            <TableCell
              key={header.column.id}
              data-row-key={key}
              data-column-id={header.column.id}
              data-editable-cell={canEdit || undefined}
              onDoubleClick={canEdit ? () => cellEdit.start(address) : undefined}
              className={cn(
                cellPadding,
                alignClass(meta?.align),
                priorityClass(meta?.priority),
                // An editing cell is the control's, at the column's width: it
                // keeps the padding and loses the truncation, because a message
                // under a field is the one thing in a cell that has to wrap.
                meta?.truncate && !isEditingThisCell && "max-w-0 truncate",
                canEdit &&
                  !isEditingThisCell &&
                  "cursor-text decoration-quebi-line/40 decoration-dotted underline-offset-4 hover:underline",
                isEditingThisCell && "bg-quebi-brand/5 align-top whitespace-normal",
                table.getColumn(header.column.id)?.getIsPinned?.() && "bg-quebi-bg",
              )}
              style={pinStyle(header.column.id)}
            >
              {isEditingThisCell && renderCellEditor ? (
                // The label a `conform-*` variant renders is the control's
                // accessible name and the column header is already the visible
                // one, so it is hidden here rather than left off there — a
                // control in a cell with no name at all is the worse trade.
                <span className="flex flex-col gap-1 text-start [&_label]:sr-only">
                  <GridKeyboardOff />
                  {renderCellEditor({
                    row: row.original,
                    rowId: key,
                    columnId: header.column.id,
                    seed: cellEdit.seedFor(address),
                    close: cellEdit.close,
                    move: (delta) => cellEdit.move(address, delta),
                  })}
                </span>
              ) : (
                <span
                  className={cn("flex items-center gap-2", meta?.align === "end" && "justify-end")}
                  style={isFirst && row.depth > 0 ? { paddingInlineStart: row.depth * 16 } : undefined}
                >
                  {isFirst && (row.getCanExpand?.() || (renderDetail && !row.getIsGrouped?.())) && (
                    <Button
                      intent="ghost"
                      size="sq-xs"
                      aria-label={row.getIsExpanded?.() ? "Collapse row" : "Expand row"}
                      onPress={() => row.toggleExpanded?.()}
                      className="-my-1 shrink-0"
                    >
                      <ChevronRightIcon
                        data-slot="icon"
                        aria-hidden="true"
                        className={cn("transition-transform", row.getIsExpanded?.() && "rotate-90")}
                      />
                    </Button>
                  )}
                  {meta?.truncate ? (
                    <Tooltip>
                      <TooltipTrigger className="truncate text-start">
                        <span className="truncate">{content}</span>
                      </TooltipTrigger>
                      <TooltipContent>{isEmpty ? (meta?.emptyValue ?? "—") : String(value)}</TooltipContent>
                    </Tooltip>
                  ) : (
                    content
                  )}
                  {isFirst && rowActions && (
                    <span className="ms-auto ps-2">{rowActions(row.original)}</span>
                  )}
                </span>
              )}
            </TableCell>
          )
        })}
      </TableRow>,
    )

    if (renderDetail && row.getIsExpanded?.() && !row.getIsGrouped?.() && row.subRows.length === 0) {
      const detailKey = `${key}--detail`
      detailKeys.push(detailKey)
      bodyRows.push(
        // A detail panel is not a sub-row: it has one cell, spanning the table,
        // and nothing to select. It is in the collection so keyboard navigation
        // reaches it, and in disabledKeys so selection does not.
        <SpanningRow
          key={detailKey}
          id={detailKey}
          columnCount={columnCount}
          className="bg-quebi-surface/[0.02] px-4 py-3"
        >
          {renderDetail(row.original)}
        </SpanningRow>,
      )
    }
  }

  const allDisabled = [...disabledKeys, ...detailKeys]

  const onRacSelectionChange = (keys: Selection) => {
    onSelectionChange?.(
      applySelection(
        selection,
        keys === "all" ? "all" : ([...keys] as Iterable<unknown>),
        pageKeys,
        allowSelectAllMatching,
      ),
    )
  }

  const showSkeleton = isLoading && rows.length === 0

  /** One leaf column: the label, the sort badge, the filter popover, the menu. */
  const renderLeafColumn = (header: DataTableHeader<T>) => {
    const column = header.column
    const meta = column.columnDef.meta
    const priority = sortPriority(sorting, column.id)
    const filter = renderFilter?.(column.id)
    const isFiltered = activeFilters.includes(column.id)
    return (
      <TableColumn
        key={column.id}
        id={column.id}
        // react-aria throws unless exactly one column is the row
        // header, so it is the first visible one rather than a choice.
        isRowHeader={column.id === leafHeaders[0]?.column.id}
        allowsSorting={column.getCanSort()}
        isResizable={allowResize && column.getCanResize()}
        width={allowResize ? column.getSize() : undefined}
        minWidth={column.columnDef.minSize}
        maxWidth={column.columnDef.maxSize}
        className={cn(
          alignClass(meta?.align),
          priorityClass(meta?.priority),
          stickyHeader && "sticky z-20",
          column.getIsPinned?.() && "bg-quebi-bg",
        )}
        style={{
          ...pinStyle(column.id),
          // A sticky leaf row starts below the band row, which sticks at 0.
          ...(stickyHeader ? { top: showBands ? TABLE_BAND_HEIGHT : 0 } : null),
        }}
      >
        <span className="flex flex-col items-start">
          {hasBands && !showBands && (
            // py-3 + TABLE_BAND_HEIGHT + label line + py-3 is exactly the banded
            // header's two rows, so the gate opening does not shift the page.
            <span
              className="flex items-center text-[0.625rem] text-quebi-fg-subtle leading-none tracking-[0.12em]"
              style={{ height: TABLE_BAND_HEIGHT }}
            >
              {meta?.group ?? "\u00a0"}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            {meta?.label ?? column.id}
            {priority != null && sorting.length > 1 && (
              <span className="grid size-4 place-content-center rounded-full bg-quebi-brand/20 font-semibold text-[10px] text-quebi-brand tabular-nums">
                {priority}
              </span>
            )}
            {filter && (
              <Popover>
                <PopoverTrigger
                  intent="ghost"
                  size="sq-xs"
                  isCircle
                  aria-label={isFiltered ? `Filter ${meta?.label} (active)` : `Filter ${meta?.label}`}
                  className={cn("relative", isFiltered && "text-quebi-brand")}
                >
                  <Filter data-slot="icon" aria-hidden="true" />
                </PopoverTrigger>
                <PopoverContent className="w-72 p-0">
                  <OutsideTheCollection>{filter}</OutsideTheCollection>
                </PopoverContent>
              </Popover>
            )}
            <ColumnMenu column={column} onSort={onSortColumn} allowGrouping={allowGrouping} />
          </span>
        </span>
      </TableColumn>
    )
  }

  /**
   * A header cell and everything under it.
   *
   * TanStack's header groups are already rectangular: a leaf with no band of
   * its own gets a placeholder header at every level above it, each holding
   * exactly one child. Recursing through them therefore puts every leaf at the
   * same depth in react-aria's collection, which is the condition for
   * `buildHeaderRows` to produce header rows that can be rendered — a row
   * shorter than the table gets filled with `placeholder` nodes
   * react-aria-components has no case for. So a placeholder header is drawn
   * too, as a band with no label.
   */
  function renderHeaderCell(header: DataTableHeader<T>): ReactNode {
    if (header.subHeaders.length === 0) return renderLeafColumn(header)
    const meta = header.column.columnDef.meta
    return (
      <TableColumnGroup
        key={header.id}
        id={`band:${header.id}`}
        label={header.isPlaceholder ? null : (meta?.label ?? header.column.id)}
        className={cn(stickyHeader && "sticky top-0 z-20")}
      >
        {header.subHeaders.map(renderHeaderCell)}
      </TableColumnGroup>
    )
  }

  const tableElement = (
    <Table
      aria-label={ariaLabel}
      allowResize={allowResize}
      striped={striped}
      grid={grid}
      selectionMode={selectionMode}
      selectionBehavior={selectionMode === "none" ? undefined : "toggle"}
      disabledBehavior="selection"
      disabledKeys={allDisabled}
      selectedKeys={selectionMode === "none" ? undefined : selectedKeysFor(selection, pageKeys)}
      onSelectionChange={selectionMode === "none" ? undefined : onRacSelectionChange}
      sortDescriptor={toSortDescriptor(sorting)}
      onSortChange={(descriptor) =>
        onSortIntent?.(String(descriptor.column), additive.current)
      }
      dragAndDropHooks={onRowReorder ? dragAndDropHooks : undefined}
      // Virtualization measures the Table element itself, so that element has
      // to be the scroll container — a wrapper with the height around it
      // measures as zero and renders no rows at all.
      style={virtualize ? { height: height ?? 400, overflow: "auto" } : undefined}
      className={cn(
        isRefreshing && "opacity-60 transition-opacity",
        virtualize && "overflow-visible",
        className,
      )}
    >
      <TableHeader
        bandDepth={showBands ? headerGroups.length - 1 : 0}
        bandClassName={cn(stickyHeader && "sticky top-0 z-20")}
      >
        {/* The banded header is a tree: the walk starts at the top header group
            and ends at a leaf column. Ungated it would also cover the unbanded
            case, where the top group *is* the leaf row — but not the gated one,
            where there are bands the collection must not be told about. */}
        {showBands
          ? (headerGroups[0]?.headers ?? []).map(renderHeaderCell)
          : leafHeaders.map(renderLeafColumn)}
      </TableHeader>

      <TableBody
        renderEmptyState={() => (
          <div className="flex min-h-40 flex-col items-center justify-center gap-2 px-4 py-8 text-center">
            {error ? (
              <>
                <Note intent="danger" className="max-w-md text-start">
                  {error}
                </Note>
                {onRetry && (
                  <Button intent="outline" size="xs" onPress={onRetry}>
                    <RotateCcw data-slot="icon" aria-hidden="true" />
                    Try again
                  </Button>
                )}
              </>
            ) : (
              // Two different problems, two different sentences: an empty
              // dataset is a state of the world, an empty result is a state of
              // the filters — and only one of them has a next step.
              <p className="text-quebi-fg-muted text-sm">
                {hasQuery ? noResultsMessage : emptyMessage}
              </p>
            )}
          </div>
        )}
      >
        {showSkeleton
          ? skeletonRowIds.map((id) => (
              <TableRow key={id} id={id}>
                {leafHeaders.map((header) => (
                  <TableCell key={header.column.id} className={cellPadding}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          : bodyRows}
        {onLoadMore && rows.length > 0 && (
          <TableLoadMoreItem
            onLoadMore={onLoadMore}
            isLoading={isLoadingMore}
            className="border-quebi-line/10 border-t"
          >
            <div className="flex items-center justify-center gap-2 py-3 text-quebi-fg-subtle text-sm">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Loading more…
            </div>
          </TableLoadMoreItem>
        )}
      </TableBody>
    </Table>
  )

  return (
    <div
      className="relative"
      ref={cellEdit.containerRef}
      onPointerDownCapture={handlers.onPointerDownCapture}
      onKeyDownCapture={(event) => {
        handlers.onKeyDownCapture(event)
        cellEdit.onKeyDownCapture(event)
      }}
    >
      {virtualize ? (
        <Virtualizer layout={TableLayout} layoutOptions={{ rowHeight, headingHeight: 40 }}>
          {tableElement}
        </Virtualizer>
      ) : height ? (
        <div className="quebi-scrollbar overflow-auto rounded-quebi-md" style={{ maxHeight: height }}>
          {tableElement}
        </div>
      ) : (
        tableElement
      )}
      {isRefreshing && rows.length > 0 && (
        // A background refresh keeps the rows on screen and says so. Swapping
        // them for a skeleton would be a different, louder claim: that there is
        // nothing to look at, when in fact there is — it is just one query old.
        <span className="pointer-events-none absolute end-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-quebi-bg/90 px-2 py-1 text-quebi-fg-subtle text-xs">
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          Refreshing…
        </span>
      )}
      {showFooter && <ShellFooter table={table} leafHeaders={leafHeaders} />}
    </div>
  )
}

/** Call a TanStack cell/header template, which may be a string or a function. */
function renderTemplate(template: unknown, context: unknown): ReactNode {
  if (template == null) return null
  if (typeof template === "function") return (template as (ctx: unknown) => ReactNode)(context)
  return template as ReactNode
}

function groupedCellContent<T extends RowData>(row: DataTableRow<T>, value: string): ReactNode {
  return (
    <span className="inline-flex items-center gap-2 font-medium text-quebi-fg">
      {value}
      <Badge intent="neutral">{row.subRows.length}</Badge>
    </span>
  )
}

interface ColumnMenuProps<T extends RowData> {
  column: ReturnType<DataTableInstance<T>["getAllLeafColumns"]>[number]
  onSort?: (columnId: string, direction: "asc" | "desc" | null) => void
  allowGrouping?: boolean
}

/** Sort, group, pin and hide — the things a column can do to itself. */
function ColumnMenu<T extends RowData>({ column, onSort, allowGrouping }: ColumnMenuProps<T>) {
  const canSort = Boolean(onSort) && column.getCanSort?.()
  const canGroup = Boolean(allowGrouping) && column.getCanGroup?.()
  const canPin = column.getCanPin?.()
  const canHide = column.getCanHide?.()
  if (!canSort && !canGroup && !canPin && !canHide) return null
  return (
    <Menu>
      {/*
        Not a chevron. `TableColumn` draws its own chevron as the sort
        indicator whenever the column sorts, so a second one here read as a
        duplicate of it — `REFERENCE ⌄ ⌄` — when the two are not the same kind
        of thing at all: the sort chevron is a passive indicator on a header
        whose whole surface is the press target, this is a button.
      */}
      <MenuTrigger
        aria-label={`Options for ${column.columnDef.meta?.label ?? column.id}`}
        className="rounded-quebi-sm p-0.5 text-quebi-fg-subtle hover:text-quebi-fg"
      >
        <EllipsisVertical data-slot="icon" aria-hidden="true" className="size-3.5" />
      </MenuTrigger>
      <MenuContent
        placement="bottom start"
        onAction={(key) => {
          switch (key) {
            case "asc":
              onSort?.(column.id, "asc")
              break
            case "desc":
              onSort?.(column.id, "desc")
              break
            case "clear-sort":
              onSort?.(column.id, null)
              break
            case "group":
              column.toggleGrouping?.()
              break
            case "pin-start":
              column.pin?.("start")
              break
            case "pin-end":
              column.pin?.("end")
              break
            case "unpin":
              column.pin?.(false)
              break
            case "hide":
              column.toggleVisibility?.(false)
              break
          }
        }}
      >
        {canSort && <MenuItem id="asc">Sort ascending</MenuItem>}
        {canSort && <MenuItem id="desc">Sort descending</MenuItem>}
        {canSort && <MenuItem id="clear-sort">Clear sort</MenuItem>}
        {canGroup && (
          <MenuItem id="group">
            {column.getIsGrouped?.() ? "Ungroup" : "Group by this column"}
          </MenuItem>
        )}
        {canPin && <MenuItem id="pin-start">Pin to start</MenuItem>}
        {canPin && <MenuItem id="pin-end">Pin to end</MenuItem>}
        {canPin && column.getIsPinned?.() && (
          <MenuItem id="unpin">
            <PinOff data-slot="icon" aria-hidden="true" />
            Unpin
          </MenuItem>
        )}
        {canHide && <MenuItem id="hide">Hide column</MenuItem>}
      </MenuContent>
    </Menu>
  )
}

interface ShellFooterProps<T extends RowData> {
  table: DataTableInstance<T>
  leafHeaders: DataTableHeader<T>[]
}

/**
 * Column totals, rendered beside the table rather than inside it.
 *
 * react-aria's Table has no `<tfoot>` wrapper, and the element ban sends you to
 * the primitive rather than to a component for exactly this gap. A grid of the
 * same columns keeps the aggregate readable without inventing a row that the
 * collection would then have to treat as data.
 */
function ShellFooter<T extends RowData>({ table, leafHeaders }: ShellFooterProps<T>) {
  const cells = leafHeaders.filter((header) => header.column.columnDef.footer)
  if (cells.length === 0) return null
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 rounded-quebi-md border border-quebi-line/10 bg-quebi-surface/[0.02] px-3.5 py-2 text-sm">
      {cells.map((header) => (
        <span key={header.column.id} className="inline-flex items-center gap-2">
          <span className="text-quebi-fg-subtle text-xs uppercase tracking-[0.08em]">
            {header.column.columnDef.meta?.label ?? header.column.id}
          </span>
          <span className="font-medium text-quebi-fg tabular-nums">
            {renderTemplate(header.column.columnDef.footer, { table })}
          </span>
        </span>
      ))}
    </div>
  )
}
