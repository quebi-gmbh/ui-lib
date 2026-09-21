"use client"

import { useTable } from "@tanstack/react-table"
import type { RowData, SortingState } from "@tanstack/react-table"
import { ArrowDownToLine, Copy, RotateCcw } from "lucide-react"
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react"
import type * as v from "valibot"
import { Button, buttonStyles } from "@/components/button"
import { Card, CardContent } from "@/components/card"
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/menu"
import {
  CHROME_ICON_SIZE,
  CHROME_SIZE,
  TableBulkBar,
  TableColumnChooser,
  TableDensityToggle,
  TableFilterChips,
  TableFilterPanel,
  TablePager,
  TableSearch,
  TableToolbar,
  describeFilter,
  useTableCellEditing,
} from "@/components/table-controls"
import { TableShell } from "@/components/table-shell"
import {
  type DataTableCellAddress,
  type DataTableCellEdit,
  type DataTableColumn,
  type DataTableDensity,
  type DataTableInstance,
  type DataTableRow,
  type DataTableSelection,
  type FilterCondition,
  type FilterOperator,
  clampPage,
  copyToClipboard,
  dataTableFeatures,
  defaultOperator,
  downloadCsv,
  emptySelection,
  facetDomains,
  facetedOptions,
  isFilterSet,
  isRowSelected,
  leafColumns,
  packFilter,
  unpackFilter,
  nextSorting,
  qualifiedLabel,
  readView,
  toColumnDefs,
  toCsv,
  writeView,
} from "@/lib/data-table"

/**
 * Data Table — quebi design system
 *
 * The client-side mode: the consumer holds every row and the TanStack row model
 * does the work — sorting, filtering, faceting, grouping, aggregation,
 * pagination and expansion all happen in the browser.
 *
 * This file is one of the two modes and nothing else. The rows are drawn by
 * `TableShell` and the controls around them come from `table-controls`; both
 * are modules of their own, so the thing that makes this one *the client mode* —
 * a `useTable` with every row model switched on, a CSV export of rows it
 * actually holds, faceted filter options taken from the model — is all that is
 * left here. Its server-driven twin is `ServerTable`, which speaks the same
 * column vocabulary (`DataTableColumn` from `@/lib/data-table`) and assembles
 * itself from the same two halves.
 *
 * Which of the two you want is a question about where the rows come from, not
 * about how many there are: if the `data` prop is the whole answer, this is the
 * component; if it is a page of an answer, sorting it reorders a slice and
 * `ServerTable` is the component.
 */

export interface DataTableProps<T extends RowData> {
  "aria-label": string
  columns: DataTableColumn<T>[]
  data: T[]
  getRowId: (row: T) => string
  /** Tree data: the children of a row, rendered indented under it. */
  getSubRows?: (row: T) => T[] | undefined

  /* toolbar */
  caption?: ReactNode
  toolbarActions?: ReactNode
  enableGlobalSearch?: boolean
  enableColumnChooser?: boolean
  enableDensityToggle?: boolean
  exportFilename?: string
  onRefresh?: () => void

  /* model */
  enablePagination?: boolean
  pageSizes?: number[]
  defaultPageSize?: number
  enableMultiSort?: boolean
  defaultSorting?: SortingState
  defaultColumnVisibility?: Record<string, boolean>
  defaultGrouping?: string[]
  /** Controlled sort — pass both to keep the sort in the URL. */
  sorting?: SortingState
  onSortingChange?: (sorting: SortingState) => void
  globalFilter?: string
  onGlobalFilterChange?: (value: string) => void
  /**
   * Controlled column filters, as conditions. The operator rides with the value
   * — a condition reading `is not` filters as `is not` here, exactly as it does
   * in `ServerTable` and in `filterRows`, because all three run `matchesFilter`.
   */
  columnFilters?: FilterCondition[]
  onColumnFiltersChange?: (filters: FilterCondition[]) => void
  /**
   * Whether a column's filter popover draws an Operator select — `is not`,
   * `does not contain`, `not between` — rather than only honouring one that
   * arrived from a URL, a preset or a `FilterBuilder` (task #201).
   *
   * On here, and off in `ServerTable`, and the asymmetry follows the one
   * question the two are named for — who owns the query. These rows are all of
   * them and `matchesFilter` is what narrows them, so every operator the model
   * can express is one this table can already answer. A server-driven table's
   * answer comes from a server that may only implement `contains`, and a
   * control it cannot honour is worse than a missing one.
   *
   * The select is drawn per column, and only where offering it is true: a
   * variant with one operator (`boolean`, whose `Yes / No / Any` already says
   * what `is not` would) has nothing to pick, and a column carrying its own
   * `filterFn` *is* its own operator — the predicate is handed one and is free
   * to ignore it, so the header does not offer to change a question only that
   * function can answer.
   */
  enableFilterOperators?: boolean
  /** Named filter sets, offered beside the chips. */
  filterPresets?: { id: string; label: string }[]
  onApplyPreset?: (id: string) => void
  onSavePreset?: () => void

  /* selection */
  selectionMode?: "none" | "single" | "multiple"
  selection?: DataTableSelection
  onSelectionChange?: (selection: DataTableSelection) => void
  bulkActions?: (selection: DataTableSelection) => ReactNode

  /* rows */
  renderDetail?: (row: T) => ReactNode

  /* editing a cell */
  /**
   * The valibot schema a cell edit is validated against — the whole row, not
   * the one field, because that is what a cross-field rule needs. Without it
   * nothing is editable, whatever the columns say.
   */
  cellEditSchema?: v.GenericSchema
  /** Reported once the schema accepted the row. Write it back yourself. */
  onCellEdit?: (edit: DataTableCellEdit<T>) => void
  /** Controlled. Leave it out and the table holds the open cell itself. */
  editingCell?: DataTableCellAddress | null
  onEditingCellChange?: (cell: DataTableCellAddress | null) => void
  /** The row as form values. Defaults to the editable columns read off the row. */
  getEditValues?: (row: T) => Record<string, unknown>
  /**
   * The cell whose commit is in flight, if one is. An address rather than a
   * boolean, because commits no longer wait for the cell to be left: a control
   * commits when its value settles, so by the time the save is running the open
   * cell is routinely a different one, and one flag for the whole table draws
   * the spinner wherever the user happens to be rather than where the edit was.
   */
  savingCell?: DataTableCellAddress | null
  rowActions?: (row: T) => ReactNode
  getRowHref?: (row: T) => string | undefined
  onRowAction?: (row: T) => void
  isRowDisabled?: (row: T) => boolean
  rowClassName?: (row: T) => string | undefined
  onRowReorder?: (keys: string[], targetKey: string, position: "before" | "after") => void

  /* presentation */
  density?: DataTableDensity
  onDensityChange?: (density: DataTableDensity) => void
  striped?: boolean
  grid?: boolean
  allowResize?: boolean
  stickyHeader?: boolean
  height?: number
  virtualize?: boolean
  rowHeight?: number
  showFooter?: boolean
  /**
   * Collapse to one card per row below `sm`. The breakpoint is CSS, so both
   * layouts are rendered — reach for it on a table you can afford twice.
   */
  stackOnMobile?: boolean
  /** localStorage key for the column layout — order, visibility, sizing, density. */
  storageKey?: string

  /* states */
  isLoading?: boolean
  isRefreshing?: boolean
  error?: ReactNode
  onRetry?: () => void
  emptyMessage?: string
  noResultsMessage?: string
  className?: string
}

const EMPTY_ROWS: never[] = []

/**
 * DataTable — every row is already in the browser, and the row model does the work.
 *
 * Sorting, filtering, faceting, grouping, aggregation, pagination and expansion
 * are TanStack's; the rendering, the selection UX, the keyboard model and the
 * ARIA grid are react-aria's. If the rows are a page of a larger answer, this
 * is the wrong component — reach for ServerTable, which asks the server again
 * instead of reordering what it was handed.
 */
export function DataTable<T extends RowData>({
  "aria-label": ariaLabel,
  columns,
  data,
  getRowId,
  getSubRows,
  caption,
  toolbarActions,
  enableGlobalSearch = true,
  enableColumnChooser = true,
  enableDensityToggle = true,
  exportFilename,
  onRefresh,
  enablePagination = true,
  pageSizes,
  defaultPageSize = 20,
  enableMultiSort = true,
  defaultSorting = [],
  defaultColumnVisibility,
  defaultGrouping,
  sorting: sortingProp,
  onSortingChange,
  globalFilter: globalFilterProp,
  onGlobalFilterChange,
  columnFilters: columnFiltersProp,
  onColumnFiltersChange,
  enableFilterOperators = true,
  filterPresets,
  onApplyPreset,
  onSavePreset,
  selectionMode = "none",
  selection: selectionProp,
  onSelectionChange,
  bulkActions,
  renderDetail,
  cellEditSchema,
  onCellEdit,
  editingCell,
  onEditingCellChange,
  getEditValues,
  savingCell,
  rowActions,
  getRowHref,
  onRowAction,
  isRowDisabled,
  rowClassName,
  onRowReorder,
  density: densityProp,
  onDensityChange,
  striped,
  grid,
  allowResize,
  stickyHeader,
  height,
  virtualize,
  rowHeight,
  showFooter,
  stackOnMobile,
  storageKey,
  isLoading,
  isRefreshing,
  error,
  onRetry,
  emptyMessage,
  noResultsMessage,
  className,
}: DataTableProps<T>) {
  const columnDefs = useMemo(() => toColumnDefs(columns), [columns])
  const saved = useMemo(() => (storageKey ? readView(storageKey) : undefined), [storageKey])

  const [densityState, setDensityState] = useState<DataTableDensity>(
    densityProp ?? saved?.density ?? "normal",
  )
  const density = densityProp ?? densityState
  const setDensity = (next: DataTableDensity) => {
    setDensityState(next)
    onDensityChange?.(next)
    if (storageKey) writeView(storageKey, { ...readView(storageKey), density: next })
  }

  const [selectionState, setSelectionState] = useState<DataTableSelection>(emptySelection)
  const selection = selectionProp ?? selectionState
  const setSelection = (next: DataTableSelection) => {
    setSelectionState(next)
    onSelectionChange?.(next)
  }

  /**
   * Each filterable column's variant, which is what decides an operator's
   * default and therefore whether a condition has anything to carry into
   * TanStack's one-value-per-column filter slot at all.
   */
  const filterVariants = useMemo(
    () => new Map(leafColumns(columns).map((column) => [column.id, column.filterVariant])),
    [columns],
  )

  /**
   * The columns answering their filter with a predicate of their own. Kept here
   * rather than on `DataTableColumnMeta` because it is not presentation: the
   * meta is what a header, a chooser, a CSV row and a breakpoint all read, and
   * this is one question the filter popover asks about the column definition it
   * came from. It decides whether that popover offers an operator at all —
   * `filterFn` is handed one and free to ignore it, and a select that changes
   * nothing is worse than no select.
   */
  const customFilterColumns = useMemo(
    () =>
      new Set(
        leafColumns(columns)
          .filter((column) => column.filterFn)
          .map((column) => column.id),
      ),
    [columns],
  )

  const controlledState = useMemo(() => {
    const slices: Record<string, unknown> = {}
    if (sortingProp) slices.sorting = sortingProp
    if (globalFilterProp != null) slices.globalFilter = globalFilterProp
    if (columnFiltersProp) {
      slices.columnFilters = columnFiltersProp.map((condition) => ({
        id: condition.fieldId,
        value: packFilter(
          condition.variant ?? filterVariants.get(condition.fieldId),
          condition.value,
          condition.operator,
        ),
      }))
    }
    return Object.keys(slices).length > 0 ? slices : undefined
  }, [sortingProp, globalFilterProp, columnFiltersProp, filterVariants])

  const table = useTable<typeof dataTableFeatures, T>({
    features: dataTableFeatures,
    columns: columnDefs,
    data: data ?? EMPTY_ROWS,
    getRowId: (row, index, parent) =>
      parent ? `${parent.id}.${getRowId(row)}` : String(getRowId(row) ?? index),
    getSubRows,
    enableMultiSort,
    maxMultiSortColCount: 3,
    // A detail panel is expansion without sub-rows, and `toggleExpanded` is a
    // no-op unless the row says it can expand — so a table with a detail
    // renderer says every row can.
    ...(renderDetail ? { getRowCanExpand: () => true } : {}),
    autoResetPageIndex: true,
    initialState: {
      sorting: defaultSorting,
      grouping: defaultGrouping ?? [],
      expanded: defaultGrouping?.length ? true : {},
      columnVisibility: { ...defaultColumnVisibility, ...saved?.columnVisibility },
      columnOrder: saved?.columnOrder ?? [],
      columnSizing: saved?.columnSizing ?? {},
      columnPinning: {
        start: saved?.columnPinning?.start ?? [],
        end: saved?.columnPinning?.end ?? [],
      },
      pagination: { pageIndex: 0, pageSize: defaultPageSize },
    },
    // Only the slices the consumer actually controls are named here. A slice
    // named with an undefined value is still controlled, and a controlled
    // slice with no setter behind it is a frozen one.
    state: controlledState,
    // Naming a handler at all makes the slice controlled: TanStack's own
    // default setter is replaced by whatever is here, so `onSortingChange:
    // undefined` is not "no override", it is "this slice has no setter" and
    // `table.setSorting` silently stops working. Hence the spread.
    ...(onSortingChange
      ? {
          onSortingChange: (updater: SortingState | ((old: SortingState) => SortingState)) =>
            onSortingChange(
              typeof updater === "function" ? updater(sortingProp ?? []) : updater,
            ),
        }
      : {}),
    ...(onGlobalFilterChange
      ? {
          onGlobalFilterChange: (updater: unknown) =>
            onGlobalFilterChange(
              String(
                typeof updater === "function"
                  ? (updater as (old: string) => string)(globalFilterProp ?? "")
                  : updater,
              ),
            ),
        }
      : {}),
  })

  const setSorting = (next: SortingState) => {
    if (onSortingChange) onSortingChange(next)
    else table.setSorting(next)
  }

  const state = table.state
  const sorting = state.sorting ?? []
  const columnFilters = state.columnFilters ?? []
  /** The active filters as conditions — the operator unpacked back out of the slot. */
  const conditions: FilterCondition[] = columnFilters.map((filter) => {
    const { value, operator } = unpackFilter(filter.value)
    const variant = filterVariants.get(filter.id)
    return {
      id: filter.id,
      fieldId: filter.id,
      operator: operator ?? defaultOperator(variant),
      value,
      variant,
    }
  })
  const activeFilterIds = columnFilters.map((f) => f.id)
  const hasQuery = activeFilterIds.length > 0 || Boolean(state.globalFilter)

  // What every enum filter *could* offer, read from the rows before any filter
  // ran. The counts beside those choices come from the faceted row model and
  // move with the other filters; the choices themselves must not, or a value
  // another column has zeroed disappears from the panel that would switch to
  // it. A column that declares its own `filterOptions` already has a domain.
  //
  // Memoised on the pre-filtered rows, whose identity TanStack keeps until
  // `data` changes, so this pass over every row happens once per dataset
  // rather than once per render of a header.
  const facetColumnIds = useMemo(
    () =>
      leafColumns(columns)
        .filter((column) => column.filterVariant === "enum" && !column.filterOptions)
        .map((column) => column.id),
    [columns],
  )
  const preFilteredRows = table.getPreFilteredRowModel().flatRows
  const domains = useMemo(
    () => facetDomains(preFilteredRows, facetColumnIds),
    [preFilteredRows, facetColumnIds],
  )

  const persist = useCallback(() => {
    if (!storageKey) return
    writeView(storageKey, {
      ...readView(storageKey),
      columnOrder: table.state.columnOrder,
      columnVisibility: table.state.columnVisibility,
      columnSizing: table.state.columnSizing,
      columnPinning: table.state.columnPinning,
    })
  }, [storageKey, table])

  useEffect(() => {
    persist()
  }, [persist])

  const setColumnFilter = (columnId: string, value: unknown, operator?: FilterOperator) => {
    const next = columnFilters.filter((f) => f.id !== columnId)
    if (isFilterSet(value)) {
      next.push({ id: columnId, value: packFilter(filterVariants.get(columnId), value, operator) })
    }
    if (onColumnFiltersChange) {
      onColumnFiltersChange(
        next.map((filter) => {
          const unpacked = unpackFilter(filter.value)
          const variant = filterVariants.get(filter.id)
          return {
            id: filter.id,
            fieldId: filter.id,
            operator: unpacked.operator ?? defaultOperator(variant),
            value: unpacked.value,
            variant,
          }
        }),
      )
    } else {
      table.setColumnFilters(next)
    }
  }

  const paginated = enablePagination
  // `getRowModel()` is the *final* model, pagination included — so switching
  // pagination off means asking for the model one step earlier rather than
  // asking the same question and hoping.
  const rows = paginated ? table.getPaginatedRowModel().rows : table.getExpandedRowModel().rows
  const filteredCount = table.getFilteredRowModel().rows.length
  const pagination = state.pagination ?? { pageIndex: 0, pageSize: defaultPageSize }

  const exportCsv = (scope: "visible" | "all") => {
    const cols = (scope === "visible" ? table.getVisibleLeafColumns() : table.getAllLeafColumns())
      .filter((column) => !column.columnDef.meta?.noExport)
    const source = scope === "visible" ? rows : table.getFilteredRowModel().rows
    const csv = toCsv(
      cols.map((column) => column.columnDef.meta?.label ?? column.id),
      source.map((row) => cols.map((column) => row.getValue(column.id))),
    )
    downloadCsv(exportFilename ?? "table.csv", csv)
  }

  /** The selected rows if there are any, otherwise the page — as CSV, to the clipboard. */
  const copySelection = async () => {
    const cols = table.getVisibleLeafColumns().filter((c) => !c.columnDef.meta?.noExport)
    const selected = rows.filter((row) => isRowSelected(selection, row.id))
    await copyToClipboard(
      toCsv(
        cols.map((column) => column.columnDef.meta?.label ?? column.id),
        (selected.length > 0 ? selected : rows).map((row) =>
          cols.map((column) => row.getValue(column.id)),
        ),
      ),
    )
  }

  const cellEditing = useTableCellEditing<T>({
    columns,
    schema: cellEditSchema,
    getEditValues,
    onCellEdit,
    editingCell,
    onEditingCellChange,
    savingCell,
  })

  const chips = conditions.map((condition) => {
    const column = table.getColumn(condition.fieldId)
    return {
      column: condition.fieldId,
      label: column?.columnDef.meta?.label ?? condition.fieldId,
      text: describeFilter(
        column?.columnDef.meta?.filterVariant,
        condition.value,
        condition.operator,
      ),
    }
  })

  const shell = (
    <TableShell<T>
      aria-label={ariaLabel}
      table={table}
      rows={rows}
      getRowKey={getRowId}
      sorting={sorting}
      onSortIntent={(columnId, additive) =>
        setSorting(nextSorting(sorting, columnId, { additive: additive && enableMultiSort }))
      }
      onSortColumn={(columnId, direction) =>
        setSorting(direction == null ? [] : [{ id: columnId, desc: direction === "desc" }])
      }
      allowGrouping
      density={density}
      striped={striped}
      grid={grid}
      allowResize={allowResize}
      stickyHeader={stickyHeader}
      height={height}
      virtualize={virtualize}
      rowHeight={rowHeight}
      selectionMode={selectionMode}
      selection={selection}
      onSelectionChange={setSelection}
      allowSelectAllMatching={false}
      isRowDisabled={isRowDisabled}
      getRowHref={getRowHref}
      onRowAction={onRowAction}
      rowActions={rowActions}
      renderDetail={renderDetail}
      editingCell={cellEditing.editingCell}
      onEditingCellChange={cellEditing.setEditingCell}
      editableColumns={cellEditing.editableColumns}
      renderCellEditor={cellEditing.renderCellEditor}
      rowClassName={rowClassName}
      onRowReorder={onRowReorder}
      showFooter={showFooter}
      hasQuery={hasQuery}
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      error={error}
      onRetry={onRetry}
      emptyMessage={emptyMessage}
      noResultsMessage={noResultsMessage}
      activeFilters={activeFilterIds}
      renderFilter={(columnId, close) => {
        const column = table.getColumn(columnId)
        const meta = column?.columnDef.meta
        if (!column || !meta?.filterVariant) return null
        const condition = conditions.find((entry) => entry.fieldId === columnId)
        const applied = condition?.value
        const options = facetedOptions({
          declared: meta.filterOptions,
          domain: domains.get(columnId),
          counts: column.getFacetedUniqueValues?.(),
          selected: Array.isArray(applied) ? applied.map(String) : undefined,
        })
        const minMax = column.getFacetedMinMaxValues?.()
        return (
          <TableFilterPanel
            columnId={columnId}
            label={meta.label}
            variant={meta.filterVariant}
            value={applied}
            /* Where the panel starts, and — with no select drawn — what it
               reports straight back, so re-applying a value never quietly
               resets a controlled `is not` to `is`. */
            operator={condition?.operator}
            /* A column with its own `filterFn` is its own operator: the
               predicate is handed one and may ignore it, and a select that
               changes nothing is a worse answer than no select. */
            editOperator={enableFilterOperators && !customFilterColumns.has(columnId)}
            options={options}
            bounds={minMax ? [Number(minMax[0]), Number(minMax[1])] : undefined}
            onApply={(value, operator) => setColumnFilter(columnId, value, operator)}
            onClear={() => setColumnFilter(columnId, undefined)}
            onClose={close}
          />
        )
      }}
      className={className}
    />
  )

  return (
    <div className="flex w-full flex-col gap-2">
      <TableToolbar
        caption={caption}
        actions={
          <>
            {toolbarActions}
            {enableDensityToggle && (
              <TableDensityToggle value={density} onChange={setDensity} />
            )}
            {enableColumnChooser && (
              <TableColumnChooser
                columns={table.getAllLeafColumns().map((column) => ({
                  id: column.id,
                  label: qualifiedLabel(column.columnDef.meta, column.id),
                  isVisible: column.getIsVisible(),
                  canHide: column.getCanHide(),
                }))}
                onChange={(id, isVisible) => table.getColumn(id)?.toggleVisibility(isVisible)}
                onReset={() => {
                  table.resetColumnVisibility()
                  table.resetColumnOrder()
                  table.resetColumnSizing()
                  table.resetColumnPinning()
                }}
              />
            )}
            {exportFilename && (
              <Menu>
                {/* MenuTrigger already renders the button; taking the look
                    from buttonStyles is what keeps it from nesting one. */}
                <MenuTrigger
                  aria-label="Export"
                  className={buttonStyles({ intent: "outline", size: CHROME_SIZE })}
                >
                  <ArrowDownToLine data-slot="icon" aria-hidden="true" />
                  Export
                </MenuTrigger>
                <MenuContent
                  placement="bottom end"
                  onAction={(key) => {
                    if (key === "copy") void copySelection()
                    else exportCsv(key === "visible" ? "visible" : "all")
                  }}
                >
                  <MenuItem id="visible">Visible columns, this page</MenuItem>
                  <MenuItem id="all">All columns, every filtered row</MenuItem>
                  <MenuItem id="copy">
                    <Copy data-slot="icon" aria-hidden="true" />
                    Copy selection
                  </MenuItem>
                </MenuContent>
              </Menu>
            )}
            {onRefresh && (
              <Button
                intent="ghost"
                size={CHROME_ICON_SIZE}
                aria-label="Refresh"
                onPress={onRefresh}
              >
                <RotateCcw data-slot="icon" aria-hidden="true" />
              </Button>
            )}
          </>
        }
      >
        {enableGlobalSearch && (
          <TableSearch
            value={String(state.globalFilter ?? "")}
            onChange={(value) =>
              onGlobalFilterChange ? onGlobalFilterChange(value) : table.setGlobalFilter(value)
            }
            label={undefined}
            placeholder="Search all columns…"
          />
        )}
      </TableToolbar>

      <TableFilterChips
        filters={chips}
        onClear={(columnId) => setColumnFilter(columnId, undefined)}
        onClearAll={() =>
          onColumnFiltersChange ? onColumnFiltersChange([]) : table.resetColumnFilters()
        }
        presets={filterPresets}
        onApplyPreset={onApplyPreset}
        onSavePreset={onSavePreset}
      />

      {selectionMode === "multiple" && (
        <TableBulkBar
          selection={selection}
          total={filteredCount}
          pageCount={rows.length}
          onClear={() => setSelection(emptySelection)}
        >
          {bulkActions?.(selection)}
        </TableBulkBar>
      )}

      {stackOnMobile ? (
        <>
          <div className="sm:hidden">
            <DataTableCards table={table} rows={rows} getRowKey={getRowId} rowActions={rowActions} />
          </div>
          <div className="hidden sm:block">{shell}</div>
        </>
      ) : (
        shell
      )}

      {paginated && (
        <TablePager
          page={pagination.pageIndex}
          pageSize={pagination.pageSize}
          rowsOnPage={rows.length}
          total={filteredCount}
          pageSizes={pageSizes}
          onPageChange={(page) =>
            table.setPageIndex(clampPage(page, pagination.pageSize, filteredCount))
          }
          onPageSizeChange={(size) => table.setPageSize(size)}
        />
      )}
    </div>
  )
}

interface DataTableCardsProps<T extends RowData> {
  table: DataTableInstance<T>
  rows: DataTableRow<T>[]
  getRowKey: (row: T) => string
  rowActions?: (row: T) => ReactNode
}

/**
 * One card per row, for the width where a table stops being readable.
 *
 * Columns are ordered by their `priority`, so the narrow layout shows the same
 * fields in the same order the wide one drops them in — the responsive story
 * is one decision on the column, not two.
 */
function DataTableCards<T extends RowData>({
  table,
  rows,
  getRowKey,
  rowActions,
}: DataTableCardsProps<T>) {
  const columns = [...table.getVisibleLeafColumns()].sort(
    (a, b) => (a.columnDef.meta?.priority ?? 0) - (b.columnDef.meta?.priority ?? 0),
  )
  if (rows.length === 0) {
    return <p className="py-8 text-center text-quebi-fg-muted text-sm">No rows.</p>
  }
  return (
    <ul className="flex flex-col gap-2">
      {rows.map((row) => (
        <li key={getRowKey(row.original)}>
          <Card>
            <CardContent className="flex flex-col gap-1.5 p-3">
              {columns.map((column) => (
                <div key={column.id} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-quebi-fg-subtle text-xs uppercase tracking-[0.08em]">
                    {column.columnDef.meta?.label ?? column.id}
                  </span>
                  <span className="text-end text-quebi-fg">
                    {String(row.getValue(column.id) ?? column.columnDef.meta?.emptyValue ?? "—")}
                  </span>
                </div>
              ))}
              {rowActions && <div className="pt-1">{rowActions(row.original)}</div>}
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  )
}
