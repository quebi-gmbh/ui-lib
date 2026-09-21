"use client"

import { useTable } from "@tanstack/react-table"
import type { RowData } from "@tanstack/react-table"
import { ArrowDownToLine, RotateCcw } from "lucide-react"
import { type ReactNode, useMemo, useRef, useState } from "react"
import type * as v from "valibot"
import { useAsyncList } from "react-stately"
import { Button } from "@/components/button"
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
  type DataTableFilterOption,
  type DataTableQuery,
  type DataTableSelection,
  type FilterCondition,
  type FilterOperator,
  dataTableFeatures,
  defaultOperator,
  emptyQuery,
  emptySelection,
  isFilterSet,
  nextSorting,
  packFilter,
  qualifiedLabel,
  sortingToSorts,
  sortsToSorting,
  toColumnDefs,
  withTiebreak,
} from "@/lib/data-table"

/**
 * Server Table — quebi design system
 *
 * The server-driven mode. Every sort, filter, search and page change is a
 * query: the component reports the whole new `DataTableQuery` through one
 * `onQueryChange` callback and draws the rows it is handed back. It never
 * sorts, filters or pages the `rows` prop — those rows are the answer to the
 * last query, and reordering them reorders a slice.
 *
 * It is `DataTable` with every `manual*` flag set: same column vocabulary
 * (`DataTableColumn` from `@/lib/data-table`), same shell, same controls, same
 * selection model. What differs is where the work happens, and the four places
 * that difference is real — select-all, the total count, faceted values and
 * export — are props rather than assumptions.
 *
 * It does not depend on `DataTable`, and that is the point of the file
 * existing. What the two modes share is the chrome and the render half, which
 * are `@/components/table-controls` and `@/components/table-shell`; both modes
 * are built on those two, and neither mode reaches for the other. Adding a
 * server-driven table to a project therefore brings a toolbar and a shell, not
 * a client row model it will never run.
 *
 * The name says where the rows come from, which is the only question that
 * chooses between the two modes. "Async" said how they arrive, which was never
 * the distinction: `DataTable` has `isLoading`, `isRefreshing`, `error` and
 * `onRetry`, and works perfectly well over a fetch — it just sorts what it was
 * given rather than asking again.
 */

export interface ServerTableFilterPage {
  /**
   * One page of the column's domain. Count each value over the rows the
   * *other* filters leave — that is what makes the number answer "and how many
   * would that leave" — and include the zeroes: the panel lists a zero as a
   * disabled choice rather than dropping it, so a value another filter has
   * emptied can still be seen and explained. A value with no count at all is
   * listed and stays selectable.
   */
  items: DataTableFilterOption[]
  /** Return a cursor to enable "load more" on scroll; omit when exhausted. */
  cursor?: string
}

export interface ServerTableLoadFilterParams {
  /** The column whose distinct values are being requested. */
  column: string
  search: string
  cursor?: string
  signal: AbortSignal
}

export type ServerTableLoadFilterValues = (
  params: ServerTableLoadFilterParams,
) => Promise<ServerTableFilterPage>

export interface ServerTableProps<T extends RowData> {
  "aria-label": string
  columns: DataTableColumn<T>[]
  /** The rows the last query returned. Not a dataset — a page of an answer. */
  rows: T[]
  getRowId: (row: T) => string

  /** Controlled query. Everything the server needs, in one object. */
  query?: DataTableQuery
  onQueryChange?: (query: DataTableQuery) => void
  defaultQuery?: Partial<DataTableQuery>

  /**
   * Rows matching the query. Leave it out when `COUNT(*)` over the filtered
   * query is too expensive, and set `hasMore` instead.
   */
  total?: number
  hasMore?: boolean
  nextCursor?: string | null
  paginationMode?: "offset" | "cursor" | "load-more" | "none"
  pageSizes?: number[]

  /**
   * A column that is unique per row — usually the primary key. It is appended
   * to every sort so the ordering is total, which is what stops page 2 from
   * repeating a row page 1 already showed.
   */
  tiebreakColumn?: string

  /** Loads a page of distinct values for a column's filter popover. */
  loadFilterValues?: ServerTableLoadFilterValues
  /**
   * Whether a column's filter popover draws an Operator select — `is not`,
   * `does not contain`, `not between` — rather than only honouring one that
   * arrived from a URL, a preset or a `FilterBuilder` (task #201).
   *
   * **Off by default, unlike `DataTable`.** Both tables report the operator the
   * same way, but only one of them answers it: `DataTable` narrows its own rows
   * with `matchesFilter`, so every operator the model can express is one it can
   * already apply. Here the answer comes from whatever `onQueryChange` reaches,
   * and a backend that only implements `contains` would return `contains` rows
   * under a header that says `does not contain` — wrong results, silently, with
   * nothing in the client able to notice. So the control appears once the host
   * says its query can answer it.
   *
   * Then it is drawn per column, and only where there is a choice: `boolean`
   * offers one operator, and its `Yes / No / Any` already says what `is not`
   * would.
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
   * The valibot schema a cell edit is validated against — the whole row.
   * Without it nothing is editable, whatever the columns say.
   */
  cellEditSchema?: v.GenericSchema
  /**
   * Reported once the schema accepted the row. Server-side this is a mutation:
   * update optimistically, roll back if the server refuses, and name the cell
   * in `savingCell` while it is in flight — the rows prop is the answer to the
   * last query, so the edit lives beside it until the next one replaces both.
   */
  onCellEdit?: (edit: DataTableCellEdit<T>) => void
  editingCell?: DataTableCellAddress | null
  onEditingCellChange?: (cell: DataTableCellAddress | null) => void
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

  /* chrome */
  caption?: ReactNode
  toolbarActions?: ReactNode
  enableGlobalSearch?: boolean
  enableColumnChooser?: boolean
  enableDensityToggle?: boolean
  onRefresh?: () => void
  /**
   * A server-side export. The client only holds a page, so there is nothing
   * here to write to a file — this hands the current query to an endpoint that
   * can stream the whole result.
   */
  onExport?: (query: DataTableQuery) => void

  /* presentation */
  density?: DataTableDensity
  onDensityChange?: (density: DataTableDensity) => void
  striped?: boolean
  grid?: boolean
  allowResize?: boolean
  stickyHeader?: boolean
  height?: number
  showFooter?: boolean

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

/** The distinct values for one column, loaded from the source as the user searches. */
function useFilterOptions(
  column: string,
  loadFilterValues: ServerTableLoadFilterValues | undefined,
) {
  const list = useAsyncList<DataTableFilterOption & { id: string }>({
    async load({ signal, cursor, filterText }) {
      if (!loadFilterValues) return { items: [] }
      const page = await loadFilterValues({
        column,
        search: filterText ?? "",
        cursor,
        signal,
      })
      return {
        items: page.items.map((option) => ({ ...option, id: option.value })),
        cursor: page.cursor,
      }
    },
  })
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  return {
    options: list.items as DataTableFilterOption[],
    isLoading: list.loadingState === "loading" || list.loadingState === "filtering",
    onSearch: (text: string) => {
      if (debounce.current) clearTimeout(debounce.current)
      debounce.current = setTimeout(() => list.setFilterText(text), 250)
    },
    onLoadMore: () => {
      if (list.loadingState === "idle" && list.items.length > 0) list.loadMore()
    },
  }
}

/**
 * The filter popover body, mounted by the popover so it reloads each time the
 * filter opens. Pending edits are a transaction: Apply commits, dismissing
 * discards — which is what keeps one round-trip per change.
 */
function ServerFilterPanel({
  columnId,
  label,
  variant,
  value,
  operator,
  editOperator,
  loadFilterValues,
  onApply,
  onClear,
  onClose,
}: {
  columnId: string
  label: string
  variant: NonNullable<DataTableColumn<never>["filterVariant"]>
  value: unknown
  operator?: FilterOperator
  editOperator?: boolean
  loadFilterValues?: ServerTableLoadFilterValues
  onApply: (value: unknown, operator: FilterOperator) => void
  onClear: () => void
  onClose?: () => void
}) {
  const facets = useFilterOptions(columnId, loadFilterValues)
  const selected = Array.isArray(value) ? (value as string[]) : []
  // Selected values that fell outside the loaded page stay listed and stay
  // checkable, whatever the search or the scroll position happens to be.
  const options = useMemo(() => {
    if (variant !== "enum") return facets.options
    const loaded = new Set(facets.options.map((option) => option.value))
    return [...selected.filter((v) => !loaded.has(v)).map((v) => ({ value: v })), ...facets.options]
  }, [facets.options, selected, variant])

  return (
    <TableFilterPanel
      columnId={columnId}
      label={label}
      variant={variant}
      value={value}
      operator={operator}
      editOperator={editOperator}
      options={options}
      isLoadingOptions={facets.isLoading}
      onSearchOptions={variant === "enum" && loadFilterValues ? facets.onSearch : undefined}
      onLoadMoreOptions={variant === "enum" ? facets.onLoadMore : undefined}
      onApply={onApply}
      onClear={onClear}
      onClose={onClose}
    />
  )
}

export function ServerTable<T extends RowData>({
  "aria-label": ariaLabel,
  columns,
  rows,
  getRowId,
  query: queryProp,
  onQueryChange,
  defaultQuery,
  total,
  hasMore,
  nextCursor,
  paginationMode = "offset",
  pageSizes,
  tiebreakColumn,
  loadFilterValues,
  enableFilterOperators = false,
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
  caption,
  toolbarActions,
  enableGlobalSearch = true,
  enableColumnChooser = true,
  enableDensityToggle = true,
  onRefresh,
  onExport,
  density: densityProp,
  onDensityChange,
  striped,
  grid,
  allowResize,
  stickyHeader,
  height,
  showFooter,
  isLoading,
  isRefreshing,
  error,
  onRetry,
  emptyMessage,
  noResultsMessage,
  className,
}: ServerTableProps<T>) {
  const [internalQuery, setInternalQuery] = useState<DataTableQuery>({
    ...emptyQuery,
    ...defaultQuery,
  })
  const query = queryProp ?? internalQuery
  const pushQuery = (next: DataTableQuery) => {
    // Every change goes out as one query, with the tiebreaker already on it —
    // so "one round-trip per interaction" is enforceable rather than hoped for.
    const withStableOrder = { ...next, sort: withTiebreak(next.sort, tiebreakColumn) }
    setInternalQuery(withStableOrder)
    onQueryChange?.(withStableOrder)
  }

  const [densityState, setDensityState] = useState<DataTableDensity>(densityProp ?? "normal")
  const density = densityProp ?? densityState
  const [selectionState, setSelectionState] = useState<DataTableSelection>(emptySelection)
  const selection = selectionProp ?? selectionState
  const setSelection = (next: DataTableSelection) => {
    setSelectionState(next)
    onSelectionChange?.(next)
  }

  const columnDefs = useMemo(() => toColumnDefs(columns), [columns])
  const sorting = useMemo(() => sortsToSorting(query.sort), [query.sort])

  /**
   * The same row model as DataTable, with every transform turned off.
   *
   * `manualSorting`, `manualFiltering` and `manualPagination` are what make
   * this the server's table: TanStack still owns the column definitions, the
   * header groups, visibility, ordering, pinning and sizing, but it is told
   * that the rows it was given are already sorted, filtered and paged.
   */
  const table = useTable<typeof dataTableFeatures, T>({
    features: dataTableFeatures,
    columns: columnDefs,
    data: rows ?? EMPTY_ROWS,
    getRowId: (row, index) => String(getRowId(row) ?? index),
    manualSorting: true,
    manualFiltering: true,
    manualPagination: true,
    manualGrouping: true,
    manualExpanding: true,
    // As in DataTable: a detail panel is expansion with no sub-rows behind it,
    // and `toggleExpanded` refuses unless the row says it can expand.
    ...(renderDetail ? { getRowCanExpand: () => true } : {}),
    rowCount: total,
    state: {
      sorting,
      globalFilter: query.search,
      // Nothing here filters — `manualFiltering` is on — but the shape still has
      // to be the one every other reader of a column filter expects, operator
      // included, or a custom `filterFn` would see a different filter from the
      // one the query reports.
      columnFilters: query.filters.map((condition) => ({
        id: condition.fieldId,
        value: packFilter(condition.variant, condition.value, condition.operator),
      })),
      pagination: { pageIndex: query.page, pageSize: query.pageSize },
    },
  })

  const rowModel = table.getRowModel().rows
  const activeFilters = query.filters.filter((condition) => isFilterSet(condition.value))

  const conditionFor = (columnId: string) =>
    query.filters.find((condition) => condition.fieldId === columnId)

  /*
   * A column header offers one condition per column, so setting one replaces
   * whatever that column had. The operator comes back from the panel, which
   * reports the one it was working under whether or not it could edit it — so
   * with `enableFilterOperators` off this is still the operator the condition
   * arrived with, and a query from a URL, a saved view or a condition builder
   * saying `is not` is not quietly reset to `is` by re-applying its value.
   */
  const setFilter = (columnId: string, value: unknown, operator?: FilterOperator) => {
    const variant = table.getColumn(columnId)?.columnDef.meta?.filterVariant
    const previous = conditionFor(columnId)
    const next: FilterCondition[] = query.filters.filter(
      (condition) => condition.fieldId !== columnId,
    )
    if (isFilterSet(value)) {
      next.push({
        id: previous?.id ?? columnId,
        fieldId: columnId,
        operator: operator ?? previous?.operator ?? defaultOperator(variant),
        variant,
        value,
      })
    }
    // A narrower filter can leave you past the end of the result, so a filter
    // change always returns to the first page rather than to an empty one.
    pushQuery({ ...query, filters: next, page: 0, cursor: null })
  }

  const columnLabel = (columnId: string) =>
    table.getColumn(columnId)?.columnDef.meta?.label ?? columnId

  const cellEditing = useTableCellEditing<T>({
    columns,
    schema: cellEditSchema,
    getEditValues,
    onCellEdit,
    editingCell,
    onEditingCellChange,
    savingCell,
  })

  return (
    <div className={"flex w-full flex-col gap-2"}>
      <TableToolbar
        caption={caption}
        actions={
          <>
            {toolbarActions}
            {enableDensityToggle && (
              <TableDensityToggle
                value={density}
                onChange={(next) => {
                  setDensityState(next)
                  onDensityChange?.(next)
                }}
              />
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
                  table.resetColumnPinning()
                }}
              />
            )}
            {onExport && (
              // The chrome height both modes share, taken from the constant
              // rather than restated: every control table-controls exports is
              // already sized to it, and a second copy of the string is how a
              // toolbar ends up two heights tall.
              <Button intent="outline" size={CHROME_SIZE} onPress={() => onExport(query)}>
                <ArrowDownToLine data-slot="icon" aria-hidden="true" />
                Export
              </Button>
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
            value={query.search}
            onChange={(search) => pushQuery({ ...query, search, page: 0, cursor: null })}
            placeholder="Search…"
          />
        )}
      </TableToolbar>

      <TableFilterChips
        filters={activeFilters.map((condition) => ({
          column: condition.fieldId,
          label: columnLabel(condition.fieldId),
          // The same words the client mode puts in a chip. Reading the value
          // by its shape instead of by its variant is how a number range used
          // to arrive here as "10, 50".
          text: describeFilter(
            condition.variant ?? table.getColumn(condition.fieldId)?.columnDef.meta?.filterVariant,
            condition.value,
            condition.operator,
          ),
        }))}
        onClear={(columnId) => setFilter(columnId, undefined)}
        onClearAll={() => pushQuery({ ...query, filters: [], page: 0, cursor: null })}
        presets={filterPresets}
        onApplyPreset={onApplyPreset}
        onSavePreset={onSavePreset}
      />

      {selectionMode === "multiple" && (
        <TableBulkBar
          selection={selection}
          total={total}
          pageCount={rowModel.length}
          onSelectAllMatching={() => setSelection({ mode: "all-matching", excluded: [] })}
          onClear={() => setSelection(emptySelection)}
        >
          {bulkActions?.(selection)}
        </TableBulkBar>
      )}

      <TableShell<T>
        aria-label={ariaLabel}
        table={table}
        rows={rowModel}
        getRowKey={getRowId}
        sorting={sorting}
        onSortIntent={(columnId, additive) =>
          pushQuery({
            ...query,
            sort: sortingToSorts(nextSorting(sorting, columnId, { additive })),
            page: 0,
            cursor: null,
          })
        }
        onSortColumn={(columnId, direction) =>
          pushQuery({
            ...query,
            sort: direction == null ? [] : [{ column: columnId, direction }],
            page: 0,
            cursor: null,
          })
        }
        density={density}
        striped={striped}
        grid={grid}
        allowResize={allowResize}
        stickyHeader={stickyHeader}
        height={height}
        selectionMode={selectionMode}
        selection={selection}
        onSelectionChange={setSelection}
        allowSelectAllMatching
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
        showFooter={showFooter}
        hasQuery={activeFilters.length > 0 || query.search !== ""}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        error={error}
        onRetry={onRetry}
        emptyMessage={emptyMessage}
        noResultsMessage={noResultsMessage}
        activeFilters={activeFilters.map((condition) => condition.fieldId)}
        onLoadMore={
          paginationMode === "load-more" && hasMore
            ? () => pushQuery({ ...query, page: query.page + 1, cursor: nextCursor })
            : undefined
        }
        isLoadingMore={paginationMode === "load-more" && isRefreshing}
        renderFilter={(columnId, close) => {
          const meta = table.getColumn(columnId)?.columnDef.meta
          if (!meta?.filterVariant) return null
          return (
            <ServerFilterPanel
              columnId={columnId}
              label={meta.label}
              variant={meta.filterVariant}
              value={conditionFor(columnId)?.value}
              operator={conditionFor(columnId)?.operator}
              editOperator={enableFilterOperators}
              loadFilterValues={loadFilterValues}
              onApply={(value, operator) => setFilter(columnId, value, operator)}
              onClear={() => setFilter(columnId, undefined)}
              onClose={close}
            />
          )
        }}
        className={className}
      />

      {(paginationMode === "offset" || paginationMode === "cursor") && (
        <TablePager
          mode={paginationMode}
          page={query.page}
          pageSize={query.pageSize}
          rowsOnPage={rowModel.length}
          total={total}
          hasMore={hasMore}
          pageSizes={pageSizes}
          onPageChange={(page) =>
            pushQuery({
              ...query,
              page,
              cursor: paginationMode === "cursor" ? (nextCursor ?? null) : null,
            })
          }
          onPageSizeChange={(pageSize) => pushQuery({ ...query, pageSize, page: 0, cursor: null })}
        />
      )}
    </div>
  )
}
