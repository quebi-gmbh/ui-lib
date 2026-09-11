"use client"

import { ChevronDown } from "lucide-react"
import { createContext, type ReactNode, use } from "react"
import { mergeProps, useFocusRing, useObjectRef, useTableColumnHeader } from "react-aria"
import type {
  CellProps,
  ColumnProps,
  ColumnResizerProps,
  TableHeaderProps as HeaderProps,
  Key,
  RowProps,
  TableBodyProps,
  TableProps as TablePrimitiveProps,
} from "react-aria-components"
import {
  Button,
  Cell,
  Collection,
  CollectionRendererContext,
  Column,
  ColumnResizer as ColumnResizerPrimitive,
  composeRenderProps,
  createBranchComponent,
  ResizableTableContainer,
  Row,
  TableBody as TableBodyPrimitive,
  TableHeader as TableHeaderPrimitive,
  Table as TablePrimitive,
  TableStateContext,
  useTableOptions,
} from "react-aria-components"
import { Checkbox } from "@/components/checkbox"
import { cn } from "@/lib/utils"

/**
 * Table — quebi design system
 *
 * Built on react-aria-components. A borderless data table inside a rounded,
 * cyan-tinted surface. Headers use muted quebi foreground in small uppercase
 * caps; rows separate with faint cyan borders, lift to a subtle white tint on
 * hover, and fill with brand teal at low opacity when selected. Supports
 * selection, sorting, dragging, resizable columns, striping, and grid lines.
 */

interface TableProps extends Omit<TablePrimitiveProps, "className"> {
  allowResize?: boolean
  className?: string
  bleed?: boolean
  grid?: boolean
  striped?: boolean
  ref?: React.Ref<HTMLTableElement>
}

const TableContext = createContext<TableProps>({
  allowResize: false,
})

const useTableContext = () => use(TableContext)

const Root = (props: TableProps) => {
  return (
    <TablePrimitive
      className="w-full min-w-full caption-bottom border-collapse text-sm text-quebi-fg outline-hidden"
      {...props}
    />
  )
}

const Table = ({
  allowResize,
  className,
  bleed = false,
  grid = false,
  striped = false,
  ref,
  ...props
}: TableProps) => {
  return (
    <TableContext.Provider value={{ allowResize, bleed, grid, striped }}>
      <div className="flow-root">
        {/*
          The wrapper scrolls. It used to be `overflow-hidden`, switching to
          `overflow-auto` only under a resizable container — so a table with
          more columns than width clipped the last ones with no way to reach
          them, and a pinned column had no scrollport to be sticky to. Too many
          columns is not a property of column resizing, so neither is the fix.
          `overflow-hidden` was already a scroll container (that is what
          `overflow` other than `visible` means), so this changes what you can
          reach, not what sticky positioning resolves against.
        */}
        <div
          className={cn(
            "quebi-scrollbar relative overflow-auto whitespace-nowrap rounded-quebi-md border border-quebi-line/10 bg-quebi-bg [--gutter-y:--spacing(3)]",
            className,
          )}
        >
          <div className="inline-block min-w-full align-middle">
            {allowResize ? (
              <ResizableTableContainer data-slot="table-resizable-container">
                <Root ref={ref} {...props} />
              </ResizableTableContainer>
            ) : (
              <Root {...props} ref={ref} />
            )}
          </div>
        </div>
      </div>
    </TableContext.Provider>
  )
}

const ColumnResizer = ({ className, ...props }: ColumnResizerProps) => (
  <ColumnResizerPrimitive
    {...props}
    className={composeRenderProps(className, (className) =>
      cn(
        "absolute end-0 top-0 bottom-0 grid w-px touch-none place-content-center px-1 [&[data-resizable-direction=left]]:cursor-e-resize [&[data-resizable-direction=right]]:cursor-w-resize [&[data-resizable-direction=both]]:cursor-ew-resize [&[data-resizing]>div]:bg-quebi-brand",
        className,
      ),
    )}
  >
    <div className="h-full w-px bg-cyan-500/10 py-(--gutter-y)" />
  </ColumnResizerPrimitive>
)

const TableBody = <T extends object>({ renderEmptyState, ...props }: TableBodyProps<T>) => (
  <TableBodyPrimitive
    data-slot="table-body"
    renderEmptyState={(state) => (
      <>
        {renderEmptyState ? (
          renderEmptyState(state)
        ) : (
          <div className="flex min-h-56 items-center justify-center sm:min-h-96">
            <span className="text-sm text-quebi-fg-muted">No records found.</span>
          </div>
        )}
      </>
    )}
    {...props}
  />
)

interface TableColumnProps extends ColumnProps {
  isResizable?: boolean
}

const TableColumn = ({ isResizable = false, className, ...props }: TableColumnProps) => {
  const { grid } = useTableContext()
  return (
    <Column
      data-slot="table-column"
      {...props}
      className={composeRenderProps(className, (className) =>
        cn(
          "text-start bg-quebi-bg text-quebi-fg-muted text-xs font-semibold uppercase tracking-[0.08em] py-3 px-3.5 border-b border-quebi-line/10",
          "relative allows-sorting:cursor-default dragging:cursor-grabbing outline-hidden",
          grid && "border-l border-quebi-line/10 first:border-l-0",
          isResizable && "overflow-hidden truncate",
          className,
        ),
      )}
    >
      {(values) => (
        <div className="inline-flex items-center gap-2 **:data-[slot=icon]:shrink-0">
          {typeof props.children === "function" ? props.children(values) : props.children}
          {values.allowsSorting && (
            <span
              className={cn(
                "grid size-[1.15rem] flex-none shrink-0 place-content-center rounded-quebi-sm bg-quebi-surface/[0.04] text-quebi-fg-muted *:data-[slot=icon]:size-3.5 *:data-[slot=icon]:shrink-0 *:data-[slot=icon]:transition-transform *:data-[slot=icon]:duration-200",
                values.isHovered ? "bg-quebi-surface/[0.08]" : "",
              )}
            >
              <ChevronDown
                data-slot="icon"
                className={values.sortDirection === "ascending" ? "rotate-180" : ""}
              />
            </span>
          )}
          {isResizable && <ColumnResizer />}
        </div>
      )}
    </Column>
  )
}

/**
 * The band row's height, in pixels.
 *
 * A sticky header has to offset the leaf row by the height of the band row above
 * it, and a `<th>` inside a `<thead>` cannot learn that from CSS. So the band
 * cell is given exactly this height and the number is exported rather than
 * measured: two rows that agree on a constant beat a resize observer that
 * agrees with itself one frame late.
 */
const TABLE_BAND_HEIGHT = 28

interface TableColumnGroupProps {
  /** Collection key. Stable across renders, like a column's. */
  id?: Key
  /** The band's label. Leave it out for a band that only fills the row. */
  label?: ReactNode
  /** The columns — or further bands — this one spans. */
  children?: ReactNode
  className?: string
}

/**
 * A header band: one cell spanning every column nested inside it.
 *
 * react-aria-components' `Column` is built with `createLeafComponent`, so it
 * cannot contain child columns and a `TableHeader` written with it is exactly
 * one row deep. Everything *underneath* it already handles parent columns:
 * react-stately's `buildHeaderRows` turns them into a second header row with the
 * right `colSpan`, `useTableColumnHeader` emits `aria-colspan`,
 * `TableKeyboardDelegate` walks up from a leaf into its band and back down, and
 * the virtualizer's `TableLayout` measures a spanned cell across the leaf widths
 * it covers. The only missing piece is a component that declares one — and
 * `createBranchComponent`, the factory `Column` itself is built with, is a
 * public export. So a band is a real `<th colspan>` in the collection rather
 * than a div painted above the table, and it stays one under resize, pinning and
 * virtualization because the collection is what computes it.
 *
 * The span is read off the node instead of being passed in, because
 * `buildHeaderRows` is what counts the leaves — a band does not know how many
 * columns are visible today.
 *
 * One thing it cannot survive is a server render, and that is not this
 * component's doing. `buildHeaderRows` chains each header row by rewriting
 * `prevKey`/`nextKey` on the very column nodes the collection's tree is made of.
 * Harmless when the collection is committed once with every column already in it
 * — the client path. react-aria's SSR path instead appends one node and
 * re-commits, over and over, so the second commit walks a tree whose sibling
 * links now cross band boundaries: `updateColumns` reaches a column twice, the
 * duplicate makes `buildHeaderRows` link a node to itself, and the next walk
 * never ends. So a banded header is rendered only where react-aria is not using
 * that path — see `useIsSSR` in data-table.tsx — and the gate goes away when
 * react-stately stops mutating shared nodes.
 *
 * That is reported upstream as
 * [adobe/react-spectrum#10598](https://github.com/adobe/react-spectrum/issues/10598),
 * with the reproduction and the mechanism. What watches for the fix is a test in
 * `tests/components/table.test.tsx`, which asserts the corruption on a shape
 * that comes out wrong without hanging: when it fails, the gate, the fallback
 * block and `TABLE_BAND_HEIGHT` can all go.
 */
const TableColumnGroup = createBranchComponent<
  object,
  TableColumnGroupProps,
  HTMLTableCellElement
>("column", function ColumnGroup({ label, className }, forwardedRef, node) {
  const ref = useObjectRef(forwardedRef)
  const state = use(TableStateContext)
  const { isVirtualized } = use(CollectionRendererContext)
  const { grid } = useTableContext()
  // `useTableColumnHeader` is typed against react-stately's GridNode, which only
  // a private subpath exports; the collection hands out the same object typed as
  // a Node. One cast at the boundary beats a deep import — and `colSpan` is the
  // field `buildHeaderRows` writes onto it.
  const gridNode = node as Parameters<typeof useTableColumnHeader>[0]["node"]
  // biome-ignore lint/style/noNonNullAssertion: a column only renders inside a Table, which is what publishes the state.
  const { columnHeaderProps } = useTableColumnHeader({ node: gridNode, isVirtualized }, state!, ref)
  const { isFocused, isFocusVisible, focusProps } = useFocusRing()
  const props = {
    ...mergeProps(columnHeaderProps, focusProps),
    "data-slot": "table-column-group",
    "data-focused": isFocused || undefined,
    "data-focus-visible": isFocusVisible || undefined,
    style: { height: TABLE_BAND_HEIGHT },
    className: cn(
      "bg-quebi-bg px-3.5 text-center align-middle text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-quebi-fg-subtle outline-hidden",
      // The underline is what makes a band read as a band, so the cell that only
      // fills the row does not get one — the gap above an ungrouped column is
      // how you see where the band beside it stops. Side-specific border colours
      // throughout, so the grid's vertical rule and this do not merge into one
      // `border-*` class where the last one written wins.
      label != null && "border-b border-b-quebi-line/10",
      grid && "border-l border-l-quebi-line/10 first:border-l-0",
      "data-[focus-visible]:ring-2 data-[focus-visible]:ring-quebi-brand/50",
      className,
    ),
  }
  // Virtualized tables are divs, not a real table — the Virtualizer positions
  // every cell itself, and a colSpan attribute on a div means nothing.
  return isVirtualized ? (
    <div {...props} ref={ref as unknown as React.Ref<HTMLDivElement>}>
      {label}
    </div>
  ) : (
    <th {...props} ref={ref} colSpan={gridNode.colSpan ?? 1}>
      {label}
    </th>
  )
})

interface TableHeaderProps<T extends object> extends HeaderProps<T> {
  ref?: React.Ref<HTMLTableSectionElement>
  /**
   * How many band rows sit above the leaf columns — `0` for an ordinary header.
   *
   * The drag handle and the selection checkbox are columns the header adds
   * itself, so when the consumer's columns are banded these are the two left at
   * the wrong depth. A header row shorter than the table is exactly what makes
   * react-stately fill it with `placeholder` nodes, and
   * react-aria-components' renderer has no case for one — it calls `render` on
   * a node that has none. So each gutter gets this many empty bands stacked
   * above it and the header stays rectangular.
   */
  bandDepth?: number
  /** Extra classes for the bands above the gutters — the sticky offset, mostly. */
  bandClassName?: string
}

/** Stack `depth` empty bands above a gutter column, innermost last. */
function banded(column: ReactNode, depth: number, key: string, className?: string): ReactNode {
  let wrapped = column
  for (let level = 1; level <= depth; level++) {
    wrapped = (
      <TableColumnGroup id={`${key}-band-${level}`} className={className}>
        {wrapped}
      </TableColumnGroup>
    )
  }
  return wrapped
}

const TableHeader = <T extends object>({
  children,
  ref,
  columns,
  className,
  bandDepth = 0,
  bandClassName,
  ...props
}: TableHeaderProps<T>) => {
  const { selectionBehavior, selectionMode, allowsDragging } = useTableOptions()
  return (
    <TableHeaderPrimitive data-slot="table-header" className={className} ref={ref} {...props}>
      {allowsDragging &&
        banded(
          <Column
            data-slot="table-column"
            isRowHeader
            className="bg-quebi-bg border-b border-quebi-line/10 py-3 px-3.5 w-px"
          />,
          bandDepth,
          "drag",
          bandClassName,
        )}
      {selectionBehavior === "toggle" &&
        banded(
          <Column
            data-slot="table-column"
            isRowHeader
            className="bg-quebi-bg border-b border-quebi-line/10 py-3 px-3.5 w-px"
          >
            {selectionMode === "multiple" && <Checkbox slot="selection" />}
          </Column>,
          bandDepth,
          "selection",
          bandClassName,
        )}
      <Collection items={columns}>{children}</Collection>
    </TableHeaderPrimitive>
  )
}

interface TableRowProps<T extends object> extends RowProps<T> {
  ref?: React.Ref<HTMLTableRowElement>
}

const TableRow = <T extends object>({
  children,
  className,
  columns,
  id,
  ref,
  ...props
}: TableRowProps<T>) => {
  const { selectionBehavior, allowsDragging } = useTableOptions()
  const { striped } = useTableContext()
  return (
    <Row
      ref={ref}
      data-slot="table-row"
      id={id}
      {...props}
      className={composeRenderProps(
        className,
        (
          className,
          {
            isSelected,
            selectionMode,
            isFocusVisibleWithin,
            isDragging,
            isDisabled,
            isFocusVisible,
          },
        ) =>
          cn(
            "group relative cursor-default outline outline-transparent transition-colors duration-150 hover:bg-quebi-surface/[0.02]",
            isFocusVisible &&
              "bg-quebi-brand/10 outline-quebi-brand ring-2 ring-quebi-brand/30",
            isDragging && "cursor-grabbing bg-quebi-brand/10 text-quebi-fg outline-quebi-brand",
            isSelected && "bg-quebi-brand/10 text-quebi-fg",
            striped && "even:bg-quebi-surface/[0.02]",
            (props.href || props.onAction || selectionMode === "multiple") &&
              isFocusVisibleWithin &&
              "bg-quebi-brand/5 selected:bg-quebi-brand/10 text-quebi-fg",
            isDisabled && "opacity-50",
            className,
          ),
      )}
    >
      {allowsDragging && (
        <TableCell className="px-0">
          <Button
            slot="drag"
            className="grid place-content-center rounded-quebi-sm px-2 text-quebi-fg-muted outline-hidden focus-visible:ring-2 focus-visible:ring-quebi-brand/50"
          >
            <svg
              aria-hidden="true"
              data-slot="icon"
              xmlns="http://www.w3.org/2000/svg"
              width={16}
              height={16}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-grip-vertical-icon lucide-grip-vertical"
            >
              <circle cx={9} cy={12} r={1} />
              <circle cx={9} cy={5} r={1} />
              <circle cx={9} cy={19} r={1} />
              <circle cx={15} cy={12} r={1} />
              <circle cx={15} cy={5} r={1} />
              <circle cx={15} cy={19} r={1} />
            </svg>
          </Button>
        </TableCell>
      )}
      {selectionBehavior === "toggle" && (
        <TableCell className="w-px px-3.5">
          <Checkbox slot="selection" />
        </TableCell>
      )}
      <Collection items={columns}>{children}</Collection>
    </Row>
  )
}

interface TableCellProps extends CellProps {
  ref?: React.Ref<HTMLTableCellElement>
}
const TableCell = ({ className, ref, ...props }: TableCellProps) => {
  const { allowResize, grid, striped } = useTableContext()
  return (
    <Cell
      ref={ref}
      data-slot="table-cell"
      {...props}
      className={composeRenderProps(className, (className) =>
        cn(
          "group align-middle outline-hidden py-3 px-3.5 group-has-data-focus-visible-within:text-quebi-fg",
          !striped && "border-b border-quebi-line/10 group-[:last-child]:border-b-0",
          grid && "border-l border-quebi-line/10 first:border-l-0",
          allowResize && "overflow-hidden truncate",
          className,
        ),
      )}
    />
  )
}

export type { TableColumnGroupProps, TableColumnProps, TableProps, TableRowProps }
export {
  Table,
  TABLE_BAND_HEIGHT,
  TableBody,
  TableCell,
  TableColumn,
  TableColumnGroup,
  TableHeader,
  TableRow,
}
