/**
 * The headless half of DataTable and AsyncTable — one column vocabulary, one
 * query shape, one selection model, shared by the client-side and the
 * server-driven table.
 *
 * TanStack Table is the row model; react-aria-components is the view. Nothing
 * here renders: no JSX, no `cn`, no `@/components/*` import. That is a hard
 * constraint — the API generator ships `@/lib/*` modules as `registry:lib`
 * items with `registryDependencies: []`, so a lib module importing a sibling
 * would land in a consumer's project with a dangling import.
 *
 * Who owns what, decided once here rather than twice in the render layers:
 *
 * - **TanStack owns** accessors, sorting, filtering, faceting, the global
 *   filter, pagination, grouping, aggregation, expansion, and the column
 *   visibility / order / pinning / sizing state.
 * - **react-aria owns** selection UX, keyboard navigation, ARIA grid
 *   semantics, column resize, drag & drop, virtualization, load-more.
 * - **Sorting is the seam.** react-aria's `sortDescriptor` / `onSortChange`
 *   signal intent and never sort data; `nextSorting` turns that intent into
 *   the next `SortingState`, which TanStack applies.
 * - **Expansion is TanStack's.** Both can express it, and choosing react-aria's
 *   `expandedKeys` would put the expanded shape outside the row model:
 *   pagination would count collapsed rows while the DOM showed expanded ones,
 *   and grouping — which *is* expansion in TanStack — would need a second owner
 *   that disagreed with the first. So sub-rows arrive pre-flattened with a
 *   `depth`, and a detail panel is an extra row with one spanning cell.
 * - **Selection is react-aria's UX over a model this file owns**, because
 *   "every row matching the query" is not a `Set<Key>`. See `DataTableSelection`.
 */
import {
  aggregationFns,
  createExpandedRowModel,
  createFacetedMinMaxValues,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createGroupedRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFns,
  sortFns,
  stockFeatures,
  tableFeatures,
} from "@tanstack/react-table"
import type { ColumnDef, Row, RowData, SortingState, Table } from "@tanstack/react-table"
import type { ReactNode } from "react"

export type DataTableAlign = "start" | "center" | "end"
export type DataTableDensity = "compact" | "normal" | "comfortable"
export type DataTableFilterVariant = "text" | "number" | "date" | "boolean" | "enum"

/** A value a column can be filtered by, with its faceted count where known. */
export interface DataTableFilterOption {
  value: string
  label?: string
  count?: number
}

/**
 * Presentation carried alongside a column definition. Plain data only — the
 * cell renderer stays on TanStack's own `cell` template so it keeps its value
 * type, and everything here is read by a header, a chooser menu, a CSV row and
 * a responsive breakpoint alike.
 */
export interface DataTableColumnMeta {
  /** Plain-text label: the column chooser, the CSV header, the accessible name. */
  label: string
  align?: DataTableAlign
  truncate?: boolean
  /** Rendered in place of a null, undefined or empty accessor value. */
  emptyValue?: string
  /** Lower shows first when the table collapses to a stacked card layout. */
  priority?: number
  filterVariant?: DataTableFilterVariant
  filterOptions?: DataTableFilterOption[]
  /** The multi-level header band this column sits under. */
  group?: string
  /** Left out of a CSV export — an action column, a checkbox gutter. */
  noExport?: boolean
}

/** Every stock feature, every row model, and the column meta type above. */
export const dataTableFeatures = tableFeatures({
  ...stockFeatures,
  sortedRowModel: createSortedRowModel(),
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  expandedRowModel: createExpandedRowModel(),
  groupedRowModel: createGroupedRowModel(),
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  facetedMinMaxValues: createFacetedMinMaxValues(),
  sortFns,
  filterFns,
  aggregationFns,
  columnMeta: {} as DataTableColumnMeta,
})

export type DataTableFeatures = typeof dataTableFeatures
export type DataTableInstance<T extends RowData> = Table<DataTableFeatures, T>
export type DataTableRow<T extends RowData> = Row<DataTableFeatures, T>
export type DataTableColumnDef<T extends RowData> = ColumnDef<DataTableFeatures, T, unknown>

/** The context a cell renderer is called with. */
export interface DataTableCellContext<T> {
  row: T
  value: unknown
  /** Depth in a tree or grouped row model; 0 for a flat table. */
  depth: number
  table: DataTableInstance<T & RowData>
}

/**
 * One column, in the vocabulary both tables speak. `accessorKey`/`accessorFn`
 * make it an accessor column — sortable, filterable, groupable, exportable;
 * neither makes it a display column (actions, a row-number gutter); `columns`
 * makes it a header band.
 */
export interface DataTableColumn<T> {
  id: string
  /** Plain-text header label. Also the accessible name and the CSV header. */
  header: string
  accessorKey?: string
  accessorFn?: (row: T) => unknown
  /** Child columns — rendered as a multi-level header band. */
  columns?: DataTableColumn<T>[]
  cell?: (ctx: DataTableCellContext<T>) => ReactNode
  /** Footer aggregate, e.g. a column total. */
  footer?: (table: DataTableInstance<T & RowData>) => ReactNode
  aggregate?: "sum" | "mean" | "median" | "min" | "max" | "count" | "uniqueCount" | "extent"
  aggregatedCell?: (ctx: DataTableCellContext<T>) => ReactNode
  align?: DataTableAlign
  width?: number
  minWidth?: number
  maxWidth?: number
  truncate?: boolean
  emptyValue?: string
  priority?: number
  isRowHeader?: boolean
  enableSorting?: boolean
  enableHiding?: boolean
  enableGrouping?: boolean
  enableResizing?: boolean
  enablePinning?: boolean
  /** A named built-in (`text`, `datetime`, `basic`, …) or your own comparator. */
  sortFn?: keyof typeof sortFns | ((a: unknown, b: unknown) => number)
  /** Where null and undefined land. `last` by default, in both directions. */
  sortUndefined?: "first" | "last" | false
  filterVariant?: DataTableFilterVariant
  filterOptions?: DataTableFilterOption[]
  /** Custom predicate; overrides the one implied by `filterVariant`. */
  filterFn?: (value: unknown, filter: unknown, row: T) => boolean
  noExport?: boolean
}

/** The one predicate both modes share, so a client filter and a server query
 * answer the same question for the same `DataTableFilterValue`. */
export function matchesFilter(
  value: unknown,
  variant: DataTableFilterVariant | undefined,
  filter: unknown,
): boolean {
  if (filter == null || filter === "" || (Array.isArray(filter) && filter.length === 0)) return true
  switch (variant) {
    case "enum":
      return (filter as string[]).includes(String(value))
    case "boolean":
      return String(value) === String(filter)
    case "number": {
      const [min, max] = filter as [number | null, number | null]
      const n = Number(value)
      if (Number.isNaN(n)) return false
      return (min == null || n >= min) && (max == null || n <= max)
    }
    case "date": {
      const [from, to] = filter as [string | null, string | null]
      const d = String(value ?? "")
      return (!from || d >= from) && (!to || d <= to)
    }
    default:
      return String(value ?? "")
        .toLowerCase()
        .includes(String(filter).toLowerCase())
  }
}

/** Translate the shared vocabulary into TanStack column definitions. */
export function toColumnDefs<T extends RowData>(
  columns: DataTableColumn<T>[],
): DataTableColumnDef<T>[] {
  return columns.map((col) => toColumnDef(col, undefined))
}

function toColumnDef<T extends RowData>(
  col: DataTableColumn<T>,
  group: string | undefined,
): DataTableColumnDef<T> {
  // TanStack's CellContext/HeaderContext are generic over each column's own
  // value type, which a runtime loop cannot name. DataTableCellContext is the
  // typed surface; row and value are re-typed on the way into it.
  // biome-ignore lint/suspicious/noExplicitAny: see above.
  type Ctx = any
  const meta: DataTableColumnMeta = {
    label: col.header,
    align: col.align,
    truncate: col.truncate,
    emptyValue: col.emptyValue,
    priority: col.priority,
    filterVariant: col.filterVariant,
    filterOptions: col.filterOptions,
    group,
    noExport: col.noExport,
  }
  const cellContext = (ctx: Ctx): DataTableCellContext<T> => ({
    row: ctx.row.original,
    value: ctx.getValue(),
    depth: ctx.row.depth,
    table: ctx.table,
  })
  const base = {
    id: col.id,
    header: col.header,
    meta,
    enableSorting: col.enableSorting ?? !col.columns,
    enableHiding: col.enableHiding ?? true,
    enableGrouping: col.enableGrouping ?? false,
    enableResizing: col.enableResizing ?? true,
    enablePinning: col.enablePinning ?? true,
    size: col.width,
    minSize: col.minWidth,
    maxSize: col.maxWidth,
    sortUndefined: col.sortUndefined ?? "last",
    aggregationFn: col.aggregate,
    sortFn: col.sortFn,
    filterFn: (row: DataTableRow<T>, id: string, value: unknown) =>
      col.filterFn
        ? col.filterFn(row.getValue(id), value, row.original)
        : matchesFilter(row.getValue(id), col.filterVariant, value),
    cell: col.cell ? (ctx: Ctx) => col.cell?.(cellContext(ctx)) : undefined,
    aggregatedCell: col.aggregatedCell
      ? (ctx: Ctx) => col.aggregatedCell?.(cellContext(ctx))
      : undefined,
    footer: col.footer ? (ctx: Ctx) => col.footer?.(ctx.table) : undefined,
  }
  // The column-def union (group / accessor-fn / accessor-key / display) is
  // picked at runtime, which no narrowing follows.
  // biome-ignore lint/suspicious/noExplicitAny: see above.
  const def = (shape: object) => shape as any
  if (col.columns) {
    return def({ ...base, columns: col.columns.map((c) => toColumnDef(c, col.header)) })
  }
  if (col.accessorFn) return def({ ...base, accessorFn: (row: T) => col.accessorFn?.(row) })
  if (col.accessorKey) return def({ ...base, accessorKey: col.accessorKey })
  return def(base)
}

export type DataTableSortDirection = "asc" | "desc"

export interface DataTableSort {
  column: string
  direction: DataTableSortDirection
}

/** react-aria's SortDescriptor, restated so this module imports no view code. */
export interface DataTableSortDescriptor {
  column: string
  direction: "ascending" | "descending"
}

/** The primary sort, as react-aria's Table wants to draw it. */
export function toSortDescriptor(sorting: SortingState): DataTableSortDescriptor | undefined {
  const first = sorting[0]
  return first ? { column: first.id, direction: first.desc ? "descending" : "ascending" } : undefined
}

/**
 * The next sorting state for a press on `columnId`. react-aria reports "the
 * user asked to sort this column" and nothing else, so the three-state cycle
 * (ascending → descending → off) and the multi-column stack live here.
 * `additive` is the shift key: it appends rather than replaces, and cycling
 * past descending drops the column out of the stack.
 */
export function nextSorting(
  sorting: SortingState,
  columnId: string,
  { additive = false, maxCount = 3 }: { additive?: boolean; maxCount?: number } = {},
): SortingState {
  const existing = sorting.find((s) => s.id === columnId)
  if (!additive) {
    if (!existing) return [{ id: columnId, desc: false }]
    return existing.desc ? [] : [{ id: columnId, desc: true }]
  }
  if (!existing) return [...sorting, { id: columnId, desc: false }].slice(-maxCount)
  if (!existing.desc) return sorting.map((s) => (s.id === columnId ? { ...s, desc: true } : s))
  return sorting.filter((s) => s.id !== columnId)
}

/** 1-based position of a column in the sort stack, or null. */
export function sortPriority(sorting: SortingState, columnId: string): number | null {
  const index = sorting.findIndex((s) => s.id === columnId)
  return index < 0 ? null : index + 1
}

export function sortingToSorts(sorting: SortingState): DataTableSort[] {
  return sorting.map((s) => ({ column: s.id, direction: s.desc ? "desc" : "asc" }))
}

export function sortsToSorting(sorts: DataTableSort[]): SortingState {
  return sorts.map((s) => ({ id: s.column, desc: s.direction === "desc" }))
}

/**
 * Selection, in the only shape that survives pagination. Client-side, "select
 * all" means "these rows, I have them" and a `Set` would do. Server-side it
 * means "every row matching a query I have never seen", which no set of ids
 * can express — so all-matching is a mode of its own with an exclusion list,
 * and a bulk action is told which of the two it got.
 */
export type DataTableSelection =
  | { mode: "include"; keys: string[] }
  | { mode: "all-matching"; excluded: string[] }

export const emptySelection: DataTableSelection = { mode: "include", keys: [] }

export function isRowSelected(selection: DataTableSelection, key: string): boolean {
  return selection.mode === "include"
    ? selection.keys.includes(key)
    : !selection.excluded.includes(key)
}

/** How many rows are selected, and whether that is "all of them". `total` is
 * the number matching the current query, when it is known at all. */
export function selectionCount(
  selection: DataTableSelection,
  total: number | undefined,
): { count: number | undefined; isAll: boolean } {
  if (selection.mode === "include") return { count: selection.keys.length, isAll: false }
  return {
    count: total == null ? undefined : Math.max(0, total - selection.excluded.length),
    isAll: true,
  }
}

/** The keys react-aria should draw as selected, for the rows now on screen. */
export function selectedKeysFor(
  selection: DataTableSelection,
  pageKeys: string[],
): "all" | Set<string> {
  if (selection.mode === "all-matching" && selection.excluded.length === 0) return "all"
  return new Set(pageKeys.filter((key) => isRowSelected(selection, key)))
}

/**
 * Fold react-aria's report of the on-screen selection back into the model. It
 * only knows the rows in its collection, so a `Set` it hands back is a
 * statement about *this page*: it must not drop a selection made two pages
 * ago, and in all-matching mode it is an exclusion rather than a set.
 */
export function applySelection(
  previous: DataTableSelection,
  next: "all" | Iterable<unknown>,
  pageKeys: string[],
  allowSelectAllMatching: boolean,
): DataTableSelection {
  if (next === "all") {
    return allowSelectAllMatching
      ? { mode: "all-matching", excluded: [] }
      : {
          mode: "include",
          keys: unique([...(previous.mode === "include" ? previous.keys : []), ...pageKeys]),
        }
  }
  const onScreen = new Set([...next].map(String))
  if (previous.mode === "all-matching") {
    const excluded = previous.excluded.filter((key) => !onScreen.has(key))
    for (const key of pageKeys) if (!onScreen.has(key)) excluded.push(key)
    return { mode: "all-matching", excluded: unique(excluded) }
  }
  const kept = previous.keys.filter((key) => !pageKeys.includes(key))
  return { mode: "include", keys: unique([...kept, ...onScreen]) }
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
}

export interface DataTableFilterValue {
  column: string
  variant?: DataTableFilterVariant
  value: unknown
}

/**
 * Everything a server-driven table knows, in one object. One callback rather
 * than six is the point: `onQueryChange` fires once per user change, so
 * "exactly one round-trip per interaction" is a property a consumer can hold
 * to instead of a convention nobody can check.
 */
export interface DataTableQuery {
  sort: DataTableSort[]
  filters: DataTableFilterValue[]
  search: string
  /** 0-based. Ignored in cursor mode. */
  page: number
  pageSize: number
  /** Cursor mode only: the cursor the previous page returned. */
  cursor?: string | null
}

export interface DataTableQueryResult<T> {
  rows: T[]
  /**
   * Rows matching the query. Omit it when `COUNT(*)` over the filtered query
   * is too expensive to pay on every keystroke, and set `hasMore` instead: the
   * pager then degrades to "showing 21–40" with a next button and no last
   * page, which is honest, rather than inventing a page count.
   */
  total?: number
  hasMore?: boolean
  nextCursor?: string | null
}

export const emptyQuery: DataTableQuery = {
  sort: [],
  filters: [],
  search: "",
  page: 0,
  pageSize: 20,
}

/**
 * Append a deterministic tiebreaker to a sort. Two rows equal on the sort
 * column have no defined order, so page 2 of an unstable sort can repeat a row
 * page 1 already showed and drop another entirely. Every paginated query gets
 * the row id appended for that reason.
 */
export function withTiebreak(sort: DataTableSort[], tiebreak: string | undefined): DataTableSort[] {
  if (!tiebreak || sort.some((s) => s.column === tiebreak)) return sort
  return [...sort, { column: tiebreak, direction: sort[0]?.direction ?? "asc" }]
}

/** "Showing 21–40 of 300", and what the pager may honestly offer. */
export interface DataTablePageRange {
  from: number
  to: number
  total: number | undefined
  pageCount: number | undefined
  hasPrevious: boolean
  hasNext: boolean
}

export function pageRange(
  page: number,
  pageSize: number,
  rowsOnPage: number,
  total: number | undefined,
  hasMore: boolean | undefined,
): DataTablePageRange {
  const pageCount = total == null ? undefined : Math.max(1, Math.ceil(total / pageSize))
  return {
    from: rowsOnPage === 0 ? 0 : page * pageSize + 1,
    to: rowsOnPage === 0 ? 0 : page * pageSize + rowsOnPage,
    total,
    pageCount,
    hasPrevious: page > 0,
    hasNext: pageCount == null ? (hasMore ?? rowsOnPage === pageSize) : page + 1 < pageCount,
  }
}

/** Filters that shrink the result must not leave you on a page past the end. */
export function clampPage(page: number, pageSize: number, total: number | undefined): number {
  if (total == null) return Math.max(0, page)
  return Math.min(Math.max(0, page), Math.max(0, Math.ceil(total / pageSize) - 1))
}

/**
 * The sort/filter/page triple as search params, so a filtered view is a link
 * someone can send and a back button that works — and, on a prerendered site,
 * the only place this state can live and still match the served HTML.
 */
export function queryToSearchParams(query: DataTableQuery): Record<string, string> {
  const params: Record<string, string> = {}
  if (query.sort.length > 0) {
    params.sort = query.sort.map((s) => `${s.column}:${s.direction}`).join(",")
  }
  if (query.search) params.q = query.search
  if (query.page > 0) params.page = String(query.page + 1)
  if (query.pageSize !== emptyQuery.pageSize) params.size = String(query.pageSize)
  for (const filter of query.filters) {
    if (filter.value == null || filter.value === "") continue
    params[`f.${filter.column}`] = Array.isArray(filter.value)
      ? filter.value.map((v) => (v == null ? "" : String(v))).join(",")
      : String(filter.value)
  }
  return params
}

export function queryFromSearchParams(
  params: URLSearchParams,
  columns: { id: string; variant?: DataTableFilterVariant }[],
  defaults: DataTableQuery = emptyQuery,
): DataTableQuery {
  const sortParam = params.get("sort")
  const filters: DataTableFilterValue[] = []
  for (const { id, variant } of columns) {
    const raw = params.get(`f.${id}`)
    if (raw == null) continue
    const value =
      variant === "enum"
        ? raw.split(",").filter(Boolean)
        : variant === "number" || variant === "date"
          ? raw.split(",").map((part) => (part === "" ? null : part))
          : raw
    filters.push({ column: id, variant, value })
  }
  return {
    sort: sortParam
      ? sortParam.split(",").map((part) => {
          const [column, direction] = part.split(":")
          return { column, direction: direction === "desc" ? "desc" : "asc" }
        })
      : defaults.sort,
    filters,
    search: params.get("q") ?? "",
    page: Math.max(0, Number(params.get("page") ?? 1) - 1),
    pageSize: Number(params.get("size") ?? defaults.pageSize),
  }
}

/** A column layout the user arranged, small enough to keep between visits. */
export interface DataTableView {
  columnOrder?: string[]
  columnVisibility?: Record<string, boolean>
  columnSizing?: Record<string, number>
  columnPinning?: { start?: string[]; end?: string[] }
  density?: DataTableDensity
}

/** RFC 4180 quoting: a field with a comma, quote or newline in it is quoted. */
export function csvCell(value: unknown): string {
  const text = value == null ? "" : String(value)
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")
}
