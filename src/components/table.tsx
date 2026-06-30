"use client"

import { ChevronDown } from "lucide-react"
import { createContext, use } from "react"
import type {
  CellProps,
  ColumnProps,
  ColumnResizerProps,
  TableHeaderProps as HeaderProps,
  RowProps,
  TableBodyProps,
  TableProps as TablePrimitiveProps,
} from "react-aria-components"
import {
  Button,
  Cell,
  Collection,
  Column,
  ColumnResizer as ColumnResizerPrimitive,
  composeRenderProps,
  ResizableTableContainer,
  Row,
  TableBody as TableBodyPrimitive,
  TableHeader as TableHeaderPrimitive,
  Table as TablePrimitive,
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
      className="w-full min-w-full caption-bottom border-collapse text-sm text-white outline-hidden"
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
        <div
          className={cn(
            "relative overflow-hidden whitespace-nowrap rounded-quebi-md border border-cyan-500/10 bg-quebi-bg [--gutter-y:--spacing(3)] has-data-[slot=table-resizable-container]:overflow-auto",
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
          "text-start bg-quebi-bg text-quebi-fg-muted text-xs font-semibold uppercase tracking-[0.08em] py-3 px-3.5 border-b border-cyan-500/10",
          "relative allows-sorting:cursor-default dragging:cursor-grabbing outline-hidden",
          grid && "border-l border-cyan-500/10 first:border-l-0",
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
                "grid size-[1.15rem] flex-none shrink-0 place-content-center rounded-quebi-sm bg-white/[0.04] text-quebi-fg-muted *:data-[slot=icon]:size-3.5 *:data-[slot=icon]:shrink-0 *:data-[slot=icon]:transition-transform *:data-[slot=icon]:duration-200",
                values.isHovered ? "bg-white/[0.08]" : "",
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

interface TableHeaderProps<T extends object> extends HeaderProps<T> {
  ref?: React.Ref<HTMLTableSectionElement>
}

const TableHeader = <T extends object>({
  children,
  ref,
  columns,
  className,
  ...props
}: TableHeaderProps<T>) => {
  const { selectionBehavior, selectionMode, allowsDragging } = useTableOptions()
  return (
    <TableHeaderPrimitive data-slot="table-header" className={className} ref={ref} {...props}>
      {allowsDragging && (
        <Column
          data-slot="table-column"
          isRowHeader
          className="bg-quebi-bg border-b border-cyan-500/10 py-3 px-3.5 w-px"
        />
      )}
      {selectionBehavior === "toggle" && (
        <Column
          data-slot="table-column"
          isRowHeader
          className="bg-quebi-bg border-b border-cyan-500/10 py-3 px-3.5 w-px"
        >
          {selectionMode === "multiple" && <Checkbox slot="selection" />}
        </Column>
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
            "group relative cursor-default outline outline-transparent transition-colors duration-150 hover:bg-white/[0.02]",
            isFocusVisible &&
              "bg-quebi-brand/10 outline-quebi-brand ring-2 ring-quebi-brand/30",
            isDragging && "cursor-grabbing bg-quebi-brand/10 text-white outline-quebi-brand",
            isSelected && "bg-quebi-brand/10 text-white",
            striped && "even:bg-white/[0.02]",
            (props.href || props.onAction || selectionMode === "multiple") &&
              isFocusVisibleWithin &&
              "bg-quebi-brand/5 selected:bg-quebi-brand/10 text-white",
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
          "group align-middle outline-hidden py-3 px-3.5 group-has-data-focus-visible-within:text-white",
          !striped && "border-b border-cyan-500/10 group-[:last-child]:border-b-0",
          grid && "border-l border-cyan-500/10 first:border-l-0",
          allowResize && "overflow-hidden truncate",
          className,
        ),
      )}
    />
  )
}

export type { TableColumnProps, TableProps, TableRowProps }
export { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow }
