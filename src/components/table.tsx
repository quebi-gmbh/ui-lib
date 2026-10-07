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
import { IconTile } from "@/components/icon-tile"
import { cn } from "@/lib/utils"

/**
 * Table — quebi design system
 *
 * Built on react-aria-components. A ruled table in the shape of the design's
 * index list: a strong rule across the top, column headers as mono labels over
 * a second strong rule, hairlines between rows. Rows lift to the raised ground
 * on hover and sit on the pressed ground when selected. `variant="plain"` drops
 * the top rule and the page fill. Supports selection, sorting, dragging,
 * resizable columns, striping, and grid lines.
 */

interface TableProps extends Omit<TablePrimitiveProps, "className"> {
  allowResize?: boolean
  className?: string
  /**
   * `surface` (default) opens the table with a strong top rule on the page
   * ground — for a table that stands alone on a page. `plain` draws neither: a
   * header rule and row dividers on whatever is behind it. Use `plain` under a
   * heading in a page section, and inside a Card or a dashboard widget, where
   * the Card's own edge already frames it.
   */
  variant?: "surface" | "plain"
  /**
   * Take the inline padding off the first and last columns, so their text
   * lines up with the heading and prose around the table instead of sitting
   * one gutter in.
   */
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
  variant = "surface",
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
          data-slot="table-surface"
          data-variant={variant}
          className={cn(
            "quebi-scrollbar quebi-scrollbar-corners relative overflow-auto whitespace-nowrap [--gutter-y:--spacing(3)]",
            variant === "surface" && "border-t border-quebi-rule bg-quebi-bg",
            // The header cells are filled with the page ground so that a sticky
            // header hides the rows scrolling under it. On the page that fill is
            // invisible; on a raised inset it is a strip of the wrong ground. A
            // plain table's header takes the colour of what is behind it instead.
            variant === "plain" && "[&_th]:bg-transparent",
            // On the header cells and body cells alike, and on the checkbox and
            // drag gutters too when they are the first column: the edge is the
            // table's, whatever column happens to be at it.
            bleed &&
              "[&_:is(th,td):first-child]:ps-0 [&_:is(th,td):last-child]:pe-0",
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
        "absolute end-0 top-0 bottom-0 grid w-px touch-none place-content-center px-1 [&[data-resizable-direction=left]]:cursor-e-resize [&[data-resizable-direction=right]]:cursor-w-resize [&[data-resizable-direction=both]]:cursor-ew-resize [&[data-resizing]>div]:bg-quebi-action",
        className,
      ),
    )}
  >
    <div className="h-full w-px bg-quebi-hairline py-(--gutter-y)" />
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
            <span className="text-quebi-body-s text-quebi-fg-muted">No records found.</span>
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
          "text-start bg-quebi-bg font-mono text-quebi-label uppercase text-quebi-fg-subtle py-3 px-3.5 border-b border-b-quebi-rule",
          "relative allows-sorting:cursor-default dragging:cursor-grabbing outline-hidden",
          // Side-specific colours: a plain `border-quebi-hairline` here would
          // merge with the header rule and repaint it as a hairline.
          grid && "border-l border-l-quebi-hairline first:border-l-0",
          isResizable && "overflow-hidden truncate",
          className,
        ),
      )}
    >
      {(values) => (
        <div className="inline-flex items-center gap-2 **:data-[slot=icon]:shrink-0">
          {typeof props.children === "function" ? props.children(values) : props.children}
          {values.allowsSorting && (
            // The sort affordance is an IconTile at the inline `2xs` size
            // rather than a private copy of its recipe. The hover fill is the
            // one thing the tile does not own (it is not interactive; the
            // *column* is), so it overrides the fill.
            <IconTile
              size="2xs"
              className={cn(
                "*:data-[slot=icon]:transition-transform *:data-[slot=icon]:duration-200",
                values.isHovered ? "bg-quebi-pressed" : "",
              )}
            >
              <ChevronDown
                data-slot="icon"
                className={values.sortDirection === "ascending" ? "rotate-180" : ""}
              />
            </IconTile>
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
 * that path — see `useIsSSR` in table-shell.tsx.
 *
 * Expect that gate to stay. It was reported with the mechanism and a repro as
 * [adobe/react-spectrum#10598](https://github.com/adobe/react-spectrum/issues/10598)
 * and closed on 2026-09-12 — not as wrong, but as out of scope. A contributor
 * edited his first reply to concede the diagnosis ("we should be making mutable
 * clones of nodes before passing them into `buildHeaderRows`"); a maintainer
 * then closed it on the grounds that react-aria-components' table collection
 * does not support nested columns at all. That is
 * [#5263](https://github.com/adobe/react-spectrum/issues/5263), open since 2023,
 * and the advice attached to it is that an application wanting a branch column
 * "will probably have to create your own table collection".
 *
 * Which is to say this component stands on a shape upstream has not committed
 * to. Everything underneath it works regardless — `buildHeaderRows` computes the
 * span, `useTableColumnHeader` emits the ARIA, the keyboard delegate walks it and
 * `TableLayout` measures it — and the single place the missing commitment shows
 * is that one server-rendering path. `tests/components/table.test.tsx` keeps
 * asserting both upstream bugs anyway, so if #5263 is ever taken up and they go
 * with it, those tests fail and say so; then the gate, the fallback block and
 * `TABLE_BAND_HEIGHT` can all go. Nobody is waiting for that.
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
      "bg-quebi-bg px-3.5 text-center align-middle font-mono text-quebi-label uppercase text-quebi-fg-subtle outline-hidden",
      // The underline is what makes a band read as a band, so the cell that only
      // fills the row does not get one — the gap above an ungrouped column is
      // how you see where the band beside it stops. Side-specific border colours
      // throughout, so the grid's vertical rule and this do not merge into one
      // `border-*` class where the last one written wins.
      label != null && "border-b border-b-quebi-hairline",
      grid && "border-l border-l-quebi-hairline first:border-l-0",
      "data-[focus-visible]:ring-2 data-[focus-visible]:ring-quebi-focus data-[focus-visible]:ring-inset",
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
   *
   * That is the second half of
   * [adobe/react-spectrum#10598](https://github.com/adobe/react-spectrum/issues/10598),
   * which was closed as out of scope along with the first — nested columns are
   * not a supported shape upstream
   * ([#5263](https://github.com/adobe/react-spectrum/issues/5263)), so neither
   * half is being fixed on its own. `tests/components/table.test.tsx` watches it
   * the same way it watches the first: a test that renders the shape *without*
   * this prop and asserts the throw. If that test ever fails, this prop,
   * `banded()` and `bandClassName` can all go — but this half needs a change in
   * react-aria-components' renderer rather than in react-stately, so it could
   * still go first.
   */
  bandDepth?: number
  /** Extra classes for the bands above the gutters — the sticky offset, mostly. */
  bandClassName?: string
  /**
   * One more column, after the consumer's — the row-actions column, in practice.
   *
   * It is a gutter like the drag handle and the selection checkbox, only at the
   * other end of the row, so it is banded exactly like them: a leaf sitting at
   * the wrong depth is what makes react-stately fill the header row with
   * `placeholder` nodes. The difference is that the two leading gutters are the
   * header's own doing and this one is not — what goes in it is a render prop
   * the caller owns — so it arrives as a node rather than as a flag.
   */
  trailing?: ReactNode
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
  trailing,
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
            className="bg-quebi-bg border-b border-quebi-rule py-3 px-3.5 w-px"
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
            className="bg-quebi-bg border-b border-quebi-rule py-3 px-3.5 w-px"
          >
            {selectionMode === "multiple" && <Checkbox slot="selection" />}
          </Column>,
          bandDepth,
          "selection",
          bandClassName,
        )}
      <Collection items={columns}>{children}</Collection>
      {trailing && banded(trailing, bandDepth, "trailing", bandClassName)}
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
            "group relative cursor-default outline outline-transparent transition-colors duration-150 hover:bg-quebi-raised",
            striped && "even:bg-quebi-raised",
            (props.href || props.onAction || selectionMode === "multiple") &&
              isFocusVisibleWithin &&
              "bg-quebi-raised text-quebi-fg",
            isFocusVisible && "bg-quebi-raised ring-2 ring-quebi-focus ring-inset",
            isSelected && "bg-quebi-pressed text-quebi-fg",
            isDragging && "cursor-grabbing bg-quebi-pressed text-quebi-fg",
            isDisabled && "opacity-50",
            className,
          ),
      )}
    >
      {allowsDragging && (
        <TableCell className="px-0">
          <Button
            slot="drag"
            className="grid place-content-center px-2 text-quebi-fg-subtle outline-hidden focus-visible:ring-2 focus-visible:ring-quebi-focus focus-visible:ring-inset"
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
  /**
   * Data attributes, passed through to the `<td>`.
   *
   * react-aria's `filterDOMProps` already forwards every `data-*` prop; what is
   * missing is a type that says so, and the reason to want one is the editable
   * table: `table-shell` addresses a cell by `data-row-key` / `data-column-id`
   * so that focus can be handed back to it after a commit re-sorted the row
   * somewhere else. A ref taken before the commit points at whichever row took
   * its place.
   */
  [dataAttribute: `data-${string}`]: unknown
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
          !striped && "border-b border-quebi-hairline group-[:last-child]:border-b-0",
          grid && "border-l border-quebi-hairline first:border-l-0",
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
