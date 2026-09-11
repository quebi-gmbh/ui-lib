"use client"

import { useTable } from "@tanstack/react-table"
import type { RowData } from "@tanstack/react-table"
import { ArrowDownToLine, RotateCcw } from "lucide-react"
import { type ReactNode, useMemo, useRef, useState } from "react"
import { useAsyncList } from "react-stately"
import { Button } from "@/components/button"
import {
  DataTableBulkBar,
  DataTableColumnChooser,
  DataTableDensityToggle,
  DataTableFilterChips,
  DataTableFilterPanel,
  DataTablePagination,
  DataTableSearch,
  DataTableSurface,
  DataTableToolbar,
} from "@/components/data-table"
import {
  type DataTableColumn,
  type DataTableDensity,
  type DataTableFilterOption,
  type DataTableFilterValue,
  type DataTableQuery,
  type DataTableSelection,
  type DataTableSort,
  dataTableFeatures,
  emptyQuery,
  emptySelection,
  nextSorting,
  qualifiedLabel,
  sortingToSorts,
  sortsToSorting,
  toColumnDefs,
  withTiebreak,
} from "@/lib/data-table"

/**
 * Async Table — quebi design system
 *
 * The server-driven half of the pair. Every sort, filter, search and page
 * change is a query: the component reports the whole new `DataTableQuery`
 * through one `onQueryChange` callback and draws the rows it is handed back.
 * It never sorts, filters or pages the `rows` prop — those rows are the answer
 * to the last query, and reordering them reorders a slice.
 *
 * It is DataTable with every `manual*` flag set: same column vocabulary
 * (`DataTableColumn`), same toolbar, same pagination bar, same filter panels,
 * same selection model. What differs is where the work happens, and the four
 * places that difference is real — select-all, the total count, faceted values
 * and export — are props rather than assumptions.
 */

/* Re-exported under the old names so a column definition reads the same in
   either mode; `DataTableColumn` from @/lib/data-table is the canonical one. */
export type AsyncTableColumn<T> = DataTableColumn<T>
export type AsyncTableSort = DataTableSort
export type AsyncTableQuery = DataTableQuery
export type AsyncTableFilterOption = DataTableFilterOption

export interface AsyncTableFilterPage {
  items: AsyncTableFilterOption[]
  /** Return a cursor to enable "load more" on scroll; omit when exhausted. */
  cursor?: string
}

export interface AsyncTableLoadFilterParams {
  /** The column whose distinct values are being requested. */
  column: string
  search: string
  cursor?: string
  signal: AbortSignal
}

export type AsyncTableLoadFilterValues = (
  params: AsyncTableLoadFilterParams,
) => Promise<AsyncTableFilterPage>

export interface AsyncTableProps<T extends RowData> {
  "aria-label": string
  columns: AsyncTableColumn<T>[]
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
  loadFilterValues?: AsyncTableLoadFilterValues
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
  renderRowEditor?: (row: T) => ReactNode
  editingKey?: string | null
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
  loadFilterValues: AsyncTableLoadFilterValues | undefined,
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
function AsyncFilterPanel({
  columnId,
  label,
  variant,
  value,
  loadFilterValues,
  onApply,
  onClear,
}: {
  columnId: string
  label: string
  variant: NonNullable<DataTableColumn<never>["filterVariant"]>
  value: unknown
  loadFilterValues?: AsyncTableLoadFilterValues
  onApply: (value: unknown) => void
  onClear: () => void
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
    <DataTableFilterPanel
      columnId={columnId}
      label={label}
      variant={variant}
      value={value}
      options={options}
      isLoadingOptions={facets.isLoading}
      onSearchOptions={variant === "enum" && loadFilterValues ? facets.onSearch : undefined}
      onLoadMoreOptions={variant === "enum" ? facets.onLoadMore : undefined}
      onApply={onApply}
      onClear={onClear}
    />
  )
}

export function AsyncTable<T extends RowData>({
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
  filterPresets,
  onApplyPreset,
  onSavePreset,
  selectionMode = "none",
  selection: selectionProp,
  onSelectionChange,
  bulkActions,
  renderDetail,
  renderRowEditor,
  editingKey,
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
}: AsyncTableProps<T>) {
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
      columnFilters: query.filters.map((filter) => ({ id: filter.column, value: filter.value })),
      pagination: { pageIndex: query.page, pageSize: query.pageSize },
    },
  })

  const rowModel = table.getRowModel().rows
  const activeFilters = query.filters.filter(
    (filter) =>
      filter.value != null &&
      filter.value !== "" &&
      !(Array.isArray(filter.value) && filter.value.every((v) => v == null || v === "")),
  )

  const setFilter = (columnId: string, value: unknown) => {
    const isEmpty =
      value == null ||
      value === "" ||
      (Array.isArray(value) && value.every((v) => v == null || v === ""))
    const variant = table.getColumn(columnId)?.columnDef.meta?.filterVariant
    const next: DataTableFilterValue[] = query.filters.filter((f) => f.column !== columnId)
    if (!isEmpty) next.push({ column: columnId, variant, value })
    // A narrower filter can leave you past the end of the result, so a filter
    // change always returns to the first page rather than to an empty one.
    pushQuery({ ...query, filters: next, page: 0, cursor: null })
  }

  const columnLabel = (columnId: string) =>
    table.getColumn(columnId)?.columnDef.meta?.label ?? columnId

  return (
    <div className={"flex w-full flex-col gap-2"}>
      <DataTableToolbar
        caption={caption}
        actions={
          <>
            {toolbarActions}
            {enableDensityToggle && (
              <DataTableDensityToggle
                value={density}
                onChange={(next) => {
                  setDensityState(next)
                  onDensityChange?.(next)
                }}
              />
            )}
            {enableColumnChooser && (
              <DataTableColumnChooser
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
              // `sm` / `sq-sm` is the chrome height both tables share — see
              // CHROME_SIZE in data-table.tsx, which every control the toolbar
              // borrows from there is already sized to.
              <Button intent="outline" size="sm" onPress={() => onExport(query)}>
                <ArrowDownToLine data-slot="icon" aria-hidden="true" />
                Export
              </Button>
            )}
            {onRefresh && (
              <Button intent="ghost" size="sq-sm" aria-label="Refresh" onPress={onRefresh}>
                <RotateCcw data-slot="icon" aria-hidden="true" />
              </Button>
            )}
          </>
        }
      >
        {enableGlobalSearch && (
          <DataTableSearch
            value={query.search}
            onChange={(search) => pushQuery({ ...query, search, page: 0, cursor: null })}
            placeholder="Search…"
          />
        )}
      </DataTableToolbar>

      <DataTableFilterChips
        filters={activeFilters.map((filter) => ({
          column: filter.column,
          label: columnLabel(filter.column),
          text: Array.isArray(filter.value)
            ? filter.value.filter((v) => v != null && v !== "").join(", ") || "any"
            : String(filter.value),
        }))}
        onClear={(columnId) => setFilter(columnId, undefined)}
        onClearAll={() => pushQuery({ ...query, filters: [], page: 0, cursor: null })}
        presets={filterPresets}
        onApplyPreset={onApplyPreset}
        onSavePreset={onSavePreset}
      />

      {selectionMode === "multiple" && (
        <DataTableBulkBar
          selection={selection}
          total={total}
          pageCount={rowModel.length}
          onSelectAllMatching={() => setSelection({ mode: "all-matching", excluded: [] })}
          onClear={() => setSelection(emptySelection)}
        >
          {bulkActions?.(selection)}
        </DataTableBulkBar>
      )}

      <DataTableSurface<T>
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
        renderRowEditor={renderRowEditor}
        editingKey={editingKey}
        rowClassName={rowClassName}
        showFooter={showFooter}
        hasQuery={activeFilters.length > 0 || query.search !== ""}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        error={error}
        onRetry={onRetry}
        emptyMessage={emptyMessage}
        noResultsMessage={noResultsMessage}
        activeFilters={activeFilters.map((filter) => filter.column)}
        onLoadMore={
          paginationMode === "load-more" && hasMore
            ? () => pushQuery({ ...query, page: query.page + 1, cursor: nextCursor })
            : undefined
        }
        isLoadingMore={paginationMode === "load-more" && isRefreshing}
        renderFilter={(columnId) => {
          const meta = table.getColumn(columnId)?.columnDef.meta
          if (!meta?.filterVariant) return null
          return (
            <AsyncFilterPanel
              columnId={columnId}
              label={meta.label}
              variant={meta.filterVariant}
              value={query.filters.find((filter) => filter.column === columnId)?.value}
              loadFilterValues={loadFilterValues}
              onApply={(value) => setFilter(columnId, value)}
              onClear={() => setFilter(columnId, undefined)}
            />
          )
        }}
        className={className}
      />

      {(paginationMode === "offset" || paginationMode === "cursor") && (
        <DataTablePagination
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
