/**
 * The headless half of the table family — one column vocabulary, one query
 * shape, one selection model, shared by the client-side table (DataTable), the
 * server-driven one (ServerTable) and the two modules they are both assembled
 * from (`@/components/table-shell` and `@/components/table-controls`).
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
 * - **Editing is Conform's, one form per row.** The control in a cell is a
 *   `conform-*` variant bound by naming its props, and the form behind it
 *   carries the whole row — see `DataTableColumn.editor` and
 *   `DataTableCellEdit` for why the boundary is the row rather than the cell.
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
import type { FieldMetadata } from "@conform-to/react"
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
  /**
   * The multi-level header band this column sits under.
   *
   * The band itself is rendered from the header groups — this is the name as
   * data, for the places that list a column outside the table and would
   * otherwise offer two columns called "Net".
   */
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

/**
 * One cell of a header group: a leaf column, or a band spanning several.
 *
 * TanStack names the type `Header`, which would read as "the header" beside
 * `DataTableRow` when it is one cell of one header row.
 */
export type DataTableHeader<T extends RowData> =
  ReturnType<DataTableInstance<T>["getHeaderGroups"]>[number]["headers"][number]

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
  /**
   * Child columns — rendered as a multi-level header band: one header cell
   * spanning them, in a row of its own above theirs.
   *
   * The spanned cell needs the client. react-stately builds the band row by
   * rewriting the sibling links of the column nodes it chains, which react-aria's
   * server-rendering path cannot survive (adobe/react-spectrum#10598), so a
   * server render puts the band name above each column's label instead and the
   * real row arrives with hydration. The two are the same height, so nothing
   * moves. Treat that as how banded headers work rather than as a bug in flight:
   * upstream closed the report as out of scope, because nested columns are not a
   * supported shape there at all. `TableColumnGroup` in `@/components/table` has
   * the detail.
   */
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
  /**
   * The enum filter's domain, in the order you want it listed. Leave it out and
   * the domain is read from the rows instead. Either way the counts beside the
   * choices come from the row model's faceting, so a declared option needs no
   * count of its own — and one the other filters have zeroed is listed at 0
   * rather than dropped. See `facetedOptions`.
   */
  filterOptions?: DataTableFilterOption[]
  /**
   * Custom predicate; overrides the one implied by `filterVariant`.
   *
   * The operator is passed for a predicate that wants to honour it, and is
   * `undefined` for a filter nobody attached one to. A predicate that ignores
   * it is its own operator, which is the usual case — that is what writing one
   * instead of picking a variant means.
   */
  filterFn?: (value: unknown, filter: unknown, row: T, operator?: FilterOperator) => boolean
  noExport?: boolean
  /**
   * The control shown in this cell while it is being edited — and the reason
   * editing is not a list of five kinds.
   *
   * `field` is Conform metadata, so the body is a `conform-*` variant bound by
   * naming its props: `editor: ({ field, label }) => <ConformColorPicker field={field}
   * label={label} />`. Every variant the library publishes works here, and so
   * does the next one, because the table never learns their names. A cell
   * without an `editor` cannot be edited and Tab skips over it.
   *
   * The label is visually hidden in the cell — the column header is already
   * the accessible name in a grid — but it has to be passed for the control to
   * have a name at all when a screen reader reads the cell on its own.
   *
   * **The cell sizes the control, so an editor names no size.** An open cell is
   * the same box as a closed one — same height, same width, same alignment, and
   * no +/- steppers — and that is the cell's doing rather than the callback's:
   * see `DataTableEditorContext.size`.
   *
   * The one thing it cannot do for you is the *format*. A column whose `cell`
   * renders `<FormattedCurrency>` should hand the editor the same options —
   * `<ConformNumberField field={field} label={label} formatOptions={…} />` —
   * so the cell still reads €1,234.00 once it opens. react-aria submits the
   * parsed number either way, so the format is presentation only.
   */
  editor?: (ctx: DataTableEditorContext<T>) => ReactNode
  /**
   * The schema field this column edits. Defaults to the column id, which is
   * what it is whenever the two agree — name it when they do not, e.g. a
   * `customerName` column over a `customer` field.
   */
  editField?: string
}

/* -------------------------------------------------------------------------- */
/*                              editing a cell                                */
/* -------------------------------------------------------------------------- */

/**
 * Where the form boundary is, decided once here rather than per call site.
 *
 * **One Conform form per row, with one field visible.** The alternative — a
 * form per cell — is smaller and cannot express the rule that made anyone want
 * a schema in the first place: "discount ≤ price" needs both values in the same
 * submission, and a form holding one field has one value. So the editor mounts
 * a form over the whole row, renders the edited column's control, and carries
 * every other editable field as a hidden input. The submission is therefore the
 * whole row, validated whole, and `DataTableCellEdit.value` hands it back that
 * way — which is also what makes the cell editor and `TableRowEditor` the same
 * shape over the same schema instead of two dialects of one idea.
 *
 * The cost is stated rather than hidden: a cross-field rule can mark the *other*
 * field invalid, and that field is not on screen. The editor reports its message
 * against the cell being edited, so the commit is refused with a reason rather
 * than refused silently.
 */
export interface DataTableCellAddress {
  rowId: string
  columnId: string
}

/** The context a column's `editor` is called with. */
export interface DataTableEditorContext<T> extends DataTableFieldContext {
  row: T
  /**
   * How much room the cell has, as the field scale names it — derived from the
   * table's density, `xs` for `compact` and `sm` for the rest.
   *
   * The library's own controls already have it: an editing cell states the size
   * around the control it holds and `Input`, `NumberInput`, `SelectTrigger` and
   * `DateInput` read it, which is what lets `({ field, label }) =>
   * <ConformField field={field} label={label} />` be the whole of an editor and
   * still not change the row's height when it opens. It is handed over as data
   * as well for the control that is *not* one of them — a bare element, or a
   * third-party widget, which has to be told.
   *
   * The union is spelled out rather than imported from `@/lib/field-size`: a
   * lib module is shipped with `registryDependencies: []`, so it may not import
   * a sibling.
   */
  size: "xs" | "sm" | "md"
  /** The column's alignment. The cell already applies it; this is it as data. */
  align: DataTableAlign
}

/** Conform metadata plus the label a control in a cell would otherwise lack. */
export interface DataTableFieldContext {
  /**
   * Conform field metadata. Bind it by naming props — `field={field}` on a
   * `conform-*` variant — never by spreading `getInputProps`.
   */
  field: FieldMetadata<never>
  label: string
}

/** One committed cell edit, reported once the row validated. */
export interface DataTableCellEdit<T> {
  row: T
  rowId: string
  columnId: string
  /** The schema field the column edits — its `editField`, or its id. */
  field: string
  /** The whole validated row, not just this cell. See `DataTableCellAddress`. */
  value: Record<string, unknown>
}

/**
 * What the render half asks the control half for when a cell is being edited.
 *
 * It is declared here, in the vocabulary both halves speak, because neither may
 * import the other: `table-shell` calls this, `table-controls` supplies it, and
 * a shared type is the only thing that can sit between them without closing the
 * loop.
 */
export interface DataTableCellEditContext<T> {
  row: T
  rowId: string
  columnId: string
  /**
   * The cell's presentation, passed on to the column's `editor` — see
   * `DataTableEditorContext`. The render half owns it because density is its
   * prop, and the control half is where the editor is called.
   */
  size: "xs" | "sm" | "md"
  align: DataTableAlign
  /** The character that started the edit, when the user started it by typing. */
  seed?: string
  /** Leave the cell without moving — a commit that stays put, or a cancel. */
  close: () => void
  /** The commit landed: move to the next (1) or previous (-1) editable cell. */
  move: (delta: 1 | -1) => void
}

export type DataTableCellEditRenderer<T> = (ctx: DataTableCellEditContext<T>) => ReactNode

/** Every leaf column, with the header bands flattened away. */
export function leafColumns<T>(columns: DataTableColumn<T>[]): DataTableColumn<T>[] {
  return columns.flatMap((column) => (column.columns ? leafColumns(column.columns) : [column]))
}

/**
 * Every editable cell, in reading order: each row's editable columns, then the
 * next row's. Tab walks this list, which is why it is built row-major — the
 * wrap at the end of a row is the next row rather than the next element in the
 * document.
 */
export function editableCells(rowIds: string[], columnIds: string[]): DataTableCellAddress[] {
  return rowIds.flatMap((rowId) => columnIds.map((columnId) => ({ rowId, columnId })))
}

export function isSameCell(
  a: DataTableCellAddress | null | undefined,
  b: DataTableCellAddress | null | undefined,
): boolean {
  return a != null && b != null && a.rowId === b.rowId && a.columnId === b.columnId
}

/**
 * The cell Tab moves to, wrapping past the last one back to the first.
 *
 * Wrapping rather than stopping is the point: a grid of inputs where Tab falls
 * out of the table at the end of a row is the behaviour this exists to replace.
 * A cell that is no longer in the list — its row filtered away by the commit
 * that just landed — has no neighbour to offer, and the caller closes instead.
 */
export function nextEditableCell(
  cells: DataTableCellAddress[],
  current: DataTableCellAddress,
  delta: 1 | -1,
): DataTableCellAddress | undefined {
  const index = cells.findIndex((cell) => isSameCell(cell, current))
  if (index < 0 || cells.length === 0) return undefined
  return cells[(index + delta + cells.length) % cells.length]
}

/**
 * The row as the edit form's default values: every editable column, under the
 * name its schema field has.
 *
 * A column with an `accessorFn` is read through it, so a derived column edits
 * the value it displays; everything else is read off the row by `accessorKey`
 * or, failing that, by the field name.
 */
export function editValuesFor<T>(
  columns: DataTableColumn<T>[],
  row: T,
): Record<string, unknown> {
  const values: Record<string, unknown> = {}
  for (const column of columns) {
    const name = column.editField ?? column.id
    values[name] = column.accessorFn
      ? column.accessorFn(row)
      : (row as Record<string, unknown>)[column.accessorKey ?? name]
  }
  return values
}

/**
 * A column's name for a list that has no header row to sit under — the column
 * chooser, a filter summary. Qualified by its band where it has one, because
 * "Net" and "Gross" only mean something under "Totals".
 */
export function qualifiedLabel(meta: DataTableColumnMeta | undefined, fallback: string): string {
  const label = meta?.label ?? fallback
  return meta?.group ? `${meta.group} · ${label}` : label
}

/* -------------------------------------------------------------------------- */
/*                               the operator                                 */
/* -------------------------------------------------------------------------- */

/*
 * The question a filter asks, separate from the value it asks it about.
 *
 * Until this existed, a variant *was* its question: `enum` meant "is one of",
 * `text` meant "contains", and neither could be inverted — so no surface built
 * on this model could express "is not", however convincingly it drew the
 * select. That is not a missing control, it is a missing term in the
 * vocabulary, and it has to be added here rather than in a component: the whole
 * premise of `matchesFilter` is that a client filter and a server query answer
 * the same question for the same filter, and an operator only the client
 * understood would be the end of that. So it travels with the value —
 * through `FilterCondition`, through `DataTableQuery.filters`, through the URL.
 *
 * The set is deliberately small and scoped per variant. A variant offers the
 * operators that are *answerable* over its value shape and no more: a date has
 * no "contains", an enum has no "starts with", and a boolean that already reads
 * "Yes / No / Any" has nothing "is not" would add. Each variant's first
 * operator is the one `matchesFilter` has always applied, so every existing
 * filter means exactly what it meant before.
 */

export type FilterOperator =
  | "is"
  | "isNot"
  | "contains"
  | "doesNotContain"
  | "startsWith"
  | "between"
  | "notBetween"

/** Each variant's operators, in menu order. The first is its default. */
const variantOperators: Record<DataTableFilterVariant, FilterOperator[]> = {
  text: ["contains", "doesNotContain", "is", "startsWith"],
  number: ["between", "notBetween"],
  date: ["between", "notBetween"],
  boolean: ["is"],
  enum: ["is", "isNot"],
}

const operatorLabels: Record<FilterOperator, string> = {
  is: "is",
  isNot: "is not",
  contains: "contains",
  doesNotContain: "does not contain",
  startsWith: "starts with",
  between: "between",
  notBetween: "not between",
}

/** The operators a variant offers, as a list a Select can render. */
export function filterOperators(
  variant: DataTableFilterVariant | undefined,
): { id: FilterOperator; label: string }[] {
  return (variantOperators[variant ?? "text"] ?? variantOperators.text).map((id) => ({
    id,
    label: operatorLabels[id],
  }))
}

/**
 * The operator a variant means when nobody said — i.e. exactly what
 * `matchesFilter` did before there was an operator to say.
 */
export function defaultOperator(variant: DataTableFilterVariant | undefined): FilterOperator {
  return (variantOperators[variant ?? "text"] ?? variantOperators.text)[0]
}

/** An operator in words, for a chip, a row or a menu item. */
export function operatorLabel(operator: FilterOperator): string {
  return operatorLabels[operator] ?? operator
}

/** True when `operator` is one of the ones `variant` offers. */
export function isOperatorFor(
  variant: DataTableFilterVariant | undefined,
  operator: string | undefined,
): operator is FilterOperator {
  return (
    operator != null &&
    (variantOperators[variant ?? "text"] ?? variantOperators.text).includes(
      operator as FilterOperator,
    )
  )
}

/**
 * A filter value carrying its own operator, for a row model whose slot per
 * field holds exactly one thing.
 *
 * TanStack's `columnFilters` is `{ id, value }` and its `filterFn` is handed
 * the value and nothing else, so an operator has nowhere to travel except
 * inside the value. `packFilter` only wraps when there is something to say —
 * a filter at its variant's default operator is passed through untouched, so
 * every filter written before this existed, and every custom `filterFn`
 * reading one, sees exactly what it saw before.
 */
export interface PackedFilter {
  operator: FilterOperator
  value: unknown
}

export function packFilter(
  variant: DataTableFilterVariant | undefined,
  value: unknown,
  operator: FilterOperator | undefined,
): unknown {
  return operator == null || operator === defaultOperator(variant) ? value : { operator, value }
}

export function unpackFilter(filter: unknown): { value: unknown; operator?: FilterOperator } {
  return isPackedFilter(filter) ? { value: filter.value, operator: filter.operator } : { value: filter }
}

function isPackedFilter(filter: unknown): filter is PackedFilter {
  return (
    typeof filter === "object" &&
    filter !== null &&
    !Array.isArray(filter) &&
    "operator" in filter &&
    "value" in filter
  )
}

/**
 * The one predicate every surface shares, so a client filter and a server query
 * answer the same question for the same value, operator and variant.
 *
 * An unset filter matches everything, whatever the operator — the negated
 * operators are the reason that has to be stated rather than fallen into. "Not
 * between" over a range with neither bound set would otherwise reject every
 * row, so a condition nobody has finished filling in would empty the list
 * instead of being inert; `isFilterSet` is the single answer to "is there a
 * filter here at all", asked here and by the chrome that decides whether to
 * draw a chip.
 *
 * A value that is not a number is outside *both* a numeric range and its
 * complement: "not between 10 and 100" is a claim about an amount, and a row
 * that has no amount does not make it true.
 */
export function matchesFilter(
  value: unknown,
  variant: DataTableFilterVariant | undefined,
  filter: unknown,
  operator?: FilterOperator,
): boolean {
  if (!isFilterSet(filter)) return true
  const op = operator ?? defaultOperator(variant)
  switch (variant) {
    case "enum": {
      const isOneOf = (filter as unknown[]).map(String).includes(String(value))
      return op === "isNot" ? !isOneOf : isOneOf
    }
    case "boolean": {
      const equals = String(value) === String(filter)
      return op === "isNot" ? !equals : equals
    }
    case "number": {
      const [min, max] = filter as [number | null, number | null]
      const n = Number(value)
      if (Number.isNaN(n)) return false
      const within =
        (min == null || min === ("" as unknown) || n >= min) &&
        (max == null || max === ("" as unknown) || n <= max)
      return op === "notBetween" ? !within : within
    }
    case "date": {
      const [from, to] = filter as [string | null, string | null]
      const d = String(value ?? "")
      const within = (!from || d >= from) && (!to || d <= to)
      return op === "notBetween" ? !within : within
    }
    default: {
      const haystack = String(value ?? "").toLowerCase()
      const needle = String(filter).toLowerCase()
      switch (op) {
        case "is":
          return haystack === needle
        case "startsWith":
          return haystack.startsWith(needle)
        case "doesNotContain":
          return !haystack.includes(needle)
        default:
          return haystack.includes(needle)
      }
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                           faceted filter options                           */
/* -------------------------------------------------------------------------- */

/**
 * Every value each of `columnIds` takes across `rows` — the *domain* of an
 * enum filter, the choices the data can offer at all.
 *
 * Read from the unfiltered rows on purpose. TanStack's faceted unique values
 * are the other half of a counted facet, and they are a map of what the
 * *current* filters leave: a value another column has filtered away has no
 * entry there at all. A list built from that map alone therefore drops the
 * option rather than showing it at zero — so the choice you wanted to switch
 * to is missing from the panel that would switch to it, and the rows below it
 * jump up under the cursor as the counts change.
 *
 * `getUniqueValues` rather than `getValue`, because that is what TanStack
 * counts with: a column of arrays (tags) contributes one entry per element,
 * and the domain has to be keyed the same way or the counts will not land.
 */
export function facetDomains<T extends RowData>(
  rows: DataTableRow<T>[],
  columnIds: string[],
): Map<string, string[]> {
  const domains = new Map(columnIds.map((columnId) => [columnId, new Set<string>()]))
  for (const row of rows) {
    for (const columnId of columnIds) {
      for (const value of row.getUniqueValues(columnId) ?? []) {
        // A blank is the absence of a value rather than one of the choices —
        // an empty checkbox labelled nothing, which no filter could apply.
        if (value == null || value === "") continue
        domains.get(columnId)?.add(String(value))
      }
    }
  }
  return new Map([...domains].map(([columnId, values]) => [columnId, [...values]]))
}

/**
 * One enum filter's option list: the domain, with the faceted counts written
 * onto it and a zero for every value the other filters leave nothing of.
 *
 * A zero is a listed, disabled row rather than an absent one — you can see
 * that the choice exists, see that picking it would empty the table, and the
 * list stops rearranging itself while you read it. That last part is why a
 * zero keeps its place rather than sinking to the bottom: the order is the
 * domain's own (declared, else alphabetical), so changing another filter
 * changes the numbers on this list and never its shape.
 *
 * A *selected* value is always listed, whatever the counts say, because this
 * panel is the only place that filter can be taken off again.
 *
 * `counts` absent means nobody counted — every option keeps whatever count it
 * arrived with, and none is fabricated as zero.
 */
export function facetedOptions({
  declared,
  domain,
  counts,
  selected,
}: {
  /** The caller's own domain, in the caller's order — `meta.filterOptions`. */
  declared?: DataTableFilterOption[]
  /** Values read from the unfiltered rows; the domain when none is declared. */
  domain?: Iterable<string>
  /** TanStack's faceted unique values, keyed by the raw cell value. */
  counts?: Map<unknown, number>
  /** The values this column's filter currently applies. */
  selected?: readonly string[]
}): DataTableFilterOption[] {
  const counted = new Map<string, number>()
  for (const [value, count] of counts ?? []) counted.set(String(value), Number(count))

  // A count lands on an option by its value, which for a declared list is only
  // true when those values are the cell values — a column with a `filterFn` of
  // its own may name something else, and zeroing the whole list would disable
  // every choice it has. Counts that name nothing on the list are not this
  // list's counts, so they are left off rather than read as absence. An empty
  // map is different: it means no rows are left, and every zero is honest.
  const lands =
    counts != null &&
    (counted.size === 0 || !declared || declared.some((option) => counted.has(option.value)))

  const options: DataTableFilterOption[] = []
  const listed = new Set<string>()
  const push = (option: DataTableFilterOption) => {
    if (listed.has(option.value)) return
    listed.add(option.value)
    options.push({ ...option, count: lands ? (counted.get(option.value) ?? 0) : option.count })
  }

  if (declared) for (const option of declared) push(option)
  else for (const value of [...(domain ?? [])].sort((a, b) => a.localeCompare(b))) push({ value })
  // Last, and whatever the domain says: a selected value nothing matches has to
  // be on the list, or applying it makes it unremovable from the only panel
  // that removes it.
  for (const value of selected ?? []) push({ value })
  return options
}

/* -------------------------------------------------------------------------- */
/*                       the filter model without a table                     */
/* -------------------------------------------------------------------------- */

/*
 * `matchesFilter` above takes a value and a filter and has never known what a
 * column is — which is what makes the five variants usable over a card grid, a
 * gallery or any other list that has no header row to hang a filter popover
 * from. What was missing was the other half: a way to say *which* fields are
 * filterable without writing a `DataTableColumn` for something that is not a
 * column. That is `FilterField`, and the three functions under it are the whole
 * of what a list surface needs on top of the predicate.
 */

/**
 * A filterable field on a surface that has no columns.
 *
 * Deliberately not a `DataTableColumn`: a column carries an accessor, a cell
 * template, a width, a sort function and a pin state, none of which a filter
 * reads. What is left when you take those away is this — an id, a name for a
 * human, and the variant that decides both the control and the predicate.
 */
export interface FilterField {
  /** Also the property read off a row, unless the caller passes its own getter. */
  id: string
  label: string
  variant: DataTableFilterVariant
  /** Enum choices. `facetCounts` computes them from the rows; a server sends them. */
  options?: DataTableFilterOption[]
  /** Faceted min/max, used to label a number range. */
  bounds?: [number, number]
  /**
   * The granularity of a bounded range, for a surface that draws it as a
   * slider rather than as two typed bounds — `FilterRail` does. 1 is right for
   * a price in whole euros and useless for one in cents over a million, which
   * is why it is the field's to say and not the control's to guess.
   */
  step?: number
}

/* -------------------------------------------------------------------------- */
/*                              the condition                                 */
/* -------------------------------------------------------------------------- */

/**
 * One condition: a field, an operator, and a value in the shape that field's
 * variant expects. The unit of the filter model.
 *
 * The map below it is older and smaller, and the difference between them is
 * exactly the difference between a toolbar and a query. A `Record<fieldId,
 * value>` can hold one filter per field at one implied operator, which is all a
 * one-control-per-field surface can *show* — a pill, a facet, a column popover.
 * It cannot hold `Status is not live`, and it cannot hold two conditions on one
 * field at all: the second overwrites the first. A list of conditions holds
 * both, which is why the list is the model and the map is a projection of it.
 *
 * `id` is what makes the second condition on a field a second row rather than a
 * replacement, and what a React key and a remove button address. It is opaque:
 * generate it however you like, keep it stable while the condition is on
 * screen.
 *
 * `variant` is carried only where the reader has no field list to look it up in
 * — `DataTableQuery.filters` crossing to a server, a condition parsed out of a
 * URL. Everywhere a `FilterField[]` is in hand it is redundant and may be left off.
 */
export interface FilterCondition {
  id: string
  fieldId: string
  operator: FilterOperator
  value: unknown
  variant?: DataTableFilterVariant
}

/**
 * Every field's current filter, by field id, in the shape its variant expects
 * — one condition per field at its variant's default operator, which is the
 * expressiveness a one-control-per-field surface has.
 *
 * `FilterBar`, `FilterRail` and both tables speak this; anything that can
 * express negation, or two conditions on one field, carries `FilterCondition[]`
 * instead. Every function below takes either.
 */
export type FilterValues = Record<string, unknown>

/** Either filter shape — the list, or the map that is one condition per field. */
export type FilterState = FilterValues | FilterCondition[]

/** A fresh, valueless condition on a field, at its variant's default operator. */
export function newCondition(field: FilterField, id: string): FilterCondition {
  return {
    id,
    fieldId: field.id,
    operator: defaultOperator(field.variant),
    value: field.variant === "enum" ? [] : "",
  }
}

/**
 * Move a condition to another field.
 *
 * The value never survives: a text needle is not a set of enum keys and not a
 * pair of dates, and carrying it across would either throw or filter by
 * nonsense. The operator survives only where the new variant offers it — `is`
 * means the same thing on an enum as on a text — and otherwise falls back to
 * the new variant's default rather than being silently kept as a term that
 * variant cannot answer.
 */
export function conditionOnField(condition: FilterCondition, field: FilterField): FilterCondition {
  return {
    ...newCondition(field, condition.id),
    operator: isOperatorFor(field.variant, condition.operator)
      ? condition.operator
      : defaultOperator(field.variant),
  }
}

/**
 * True when the condition would narrow anything.
 *
 * A condition with no value yet is *inert* — `matchesFilter` lets every row
 * through it — and a surface that draws one has to say so, because a row
 * reading `Where Status is …` looks exactly as applied as the one beside it
 * that is.
 */
export function isConditionSet(condition: FilterCondition): boolean {
  return isFilterSet(condition.value)
}

/** The map as a list: one condition per field that has a value, in field order. */
export function toConditions(values: FilterValues, fields: FilterField[]): FilterCondition[] {
  return fields
    .filter((field) => isFilterSet(values[field.id]))
    .map((field) => ({
      id: field.id,
      fieldId: field.id,
      operator: defaultOperator(field.variant),
      value: values[field.id],
      variant: field.variant,
    }))
}

/**
 * The list as the map — what a one-control-per-field surface can show of it.
 *
 * Lossy on purpose and in one direction only: a negated condition arrives as a
 * plain value, and the last of two conditions on one field wins. Both are
 * facts about the surface rather than about the conditions, which is why the
 * conversion is explicit at its edge and never implicit in the model.
 */
export function toFilterValues(conditions: FilterCondition[]): FilterValues {
  const values: FilterValues = {}
  for (const condition of conditions) {
    if (isConditionSet(condition)) values[condition.fieldId] = condition.value
  }
  return values
}

/** Normalise either shape to the list the predicates actually run over. */
function asConditions(state: FilterState, fields: FilterField[]): FilterCondition[] {
  return Array.isArray(state) ? state : toConditions(state, fields)
}

function variantsById(fields: FilterField[]): Map<string, DataTableFilterVariant> {
  return new Map(fields.map((field) => [field.id, field.variant]))
}

/**
 * True when a filter would narrow anything — i.e. when it is worth a chip.
 *
 * The empty cases differ by variant and all four have to read the same: no
 * value at all, the empty string, no enum choices selected, and a range with
 * neither end set. `matchesFilter` lets all four through; this is the same
 * question asked from the outside, by the chrome that has to decide whether to
 * draw a chip and count a filter.
 */
export function isFilterSet(value: unknown): boolean {
  if (value == null || value === "") return false
  if (Array.isArray(value)) return value.some((entry) => entry != null && entry !== "")
  return true
}

/** Read a field off a row by its id. The default when no getter is supplied. */
function fieldValue(row: unknown, fieldId: string): unknown {
  return (row as Record<string, unknown>)[fieldId]
}

/**
 * The rows every field's filter accepts — the list-shaped counterpart of the
 * `filteredRowModel` a table gets from TanStack.
 *
 * `getValue` is the escape hatch for a row whose shape is not flat: by default
 * a field's id *is* the property, which is what makes the common case a
 * one-liner.
 */
export function filterRows<T>(
  rows: T[],
  fields: FilterField[],
  filter: FilterState,
  getValue: (row: T, fieldId: string) => unknown = fieldValue,
): T[] {
  const conditions = asConditions(filter, fields)
  const variants = variantsById(fields)
  return rows.filter((row) =>
    conditions.every((condition) =>
      matchesFilter(
        getValue(row, condition.fieldId),
        condition.variant ?? variants.get(condition.fieldId),
        condition.value,
        condition.operator,
      ),
    ),
  )
}

/**
 * One field's choices, counted over the rows the *other* fields leave — what
 * `facetDomains` + `facetedOptions` do for a table, for a plain array.
 *
 * Counting against the other filters rather than against the result is what
 * makes a facet answer "and how many would that leave" instead of "how many of
 * what you are already looking at" — the latter shows every unselected option
 * at zero the moment one is picked.
 *
 * Only the counting is done here. The list itself is assembled by
 * `facetedOptions` above, so a list and a table make the same two promises from
 * the same code: a value the other filters have zeroed keeps its place at 0
 * rather than vanishing, and a selected value is listed whatever the counts say
 * — because this is the only place it can be taken off again.
 */
export function facetCounts<T>(
  rows: T[],
  fields: FilterField[],
  fieldId: string,
  filter: FilterState,
  getValue: (row: T, fieldId: string) => unknown = fieldValue,
): DataTableFilterOption[] {
  const variants = variantsById(fields)
  const conditions = asConditions(filter, fields)
  const others = conditions.filter((condition) => condition.fieldId !== fieldId)
  // A field that declares its own options keeps them: they carry the labels
  // (`live` shown as "Live") and the order the caller chose, and reading the
  // domain off the rows instead would throw both away and re-sort the list
  // alphabetically. Counts land on them by value, which is `facetedOptions`'
  // own rule — a declared list whose values name something else is left
  // uncounted rather than zeroed.
  const declared = fields.find((field) => field.id === fieldId)?.options
  const counts = new Map<unknown, number>()
  for (const row of rows) {
    const raw = getValue(row, fieldId)
    if (raw == null || raw === "") continue
    const key = String(raw)
    const kept = others.every((condition) =>
      matchesFilter(
        getValue(row, condition.fieldId),
        condition.variant ?? variants.get(condition.fieldId),
        condition.value,
        condition.operator,
      ),
    )
    counts.set(key, (counts.get(key) ?? 0) + (kept ? 1 : 0))
  }
  // Which options to keep listed however few rows are left under them. A
  // condition list can hold more than one condition on this field; every value
  // any of them selected has to stay checkable, since the panel is the only
  // place any of them can be taken off again.
  const selected = conditions
    .filter((condition) => condition.fieldId === fieldId)
    .flatMap((condition) => (Array.isArray(condition.value) ? condition.value : []))
  return facetedOptions({
    declared: declared && declared.length > 0 ? declared : undefined,
    domain: [...counts.keys()].map(String),
    counts,
    selected: selected.map(String),
  })
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
    filterFn: (row: DataTableRow<T>, id: string, filter: unknown) => {
      const { value, operator } = unpackFilter(filter)
      return col.filterFn
        ? col.filterFn(row.getValue(id), value, row.original, operator)
        : matchesFilter(row.getValue(id), col.filterVariant, value, operator)
    },
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

/**
 * A filter on its way to a server, which is a `FilterCondition` and nothing
 * more — the operator included.
 *
 * That is the whole of step three: `matchesFilter` promises that a client
 * filter and a server query answer the same question for the same filter, so
 * an operator the client applied and never reported would be a client-side
 * table and a server-side one disagreeing about what the user asked for. The
 * `variant` rides along because the server has no `FilterField[]` to look it
 * up in.
 */
export type DataTableFilterValue = FilterCondition

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

/**
 * A page to offer, or the run of pages that was skipped to get to the next one.
 * Page indices here are zero-based like `page` everywhere else in this module;
 * the pager adds the 1 when it draws the label.
 */
export type DataTablePageItem = number | "gap"

export interface PageItemsOptions {
  /** Pages offered either side of the current one. */
  siblings?: number
  /** Pages pinned at each end, so the first and last are always one press away. */
  boundaries?: number
}

/**
 * The page numbers a pager should draw, and where the gaps fall.
 *
 * `pageRange` says how many pages there are; this says which of them fit. The
 * window is the two ends plus a run of pages around the current one, and
 * anything skipped between them collapses to a `"gap"` — except a run of
 * exactly one, which is drawn instead: an ellipsis and a single page number
 * cost the same width, and the number is reachable.
 *
 * A truncated window is always the same length. The run around the current
 * page is clipped at either end of the range — page 1 of 15 has no page 0 to
 * its left, and its siblings are the boundary it is already standing on — so a
 * window that kept the run at `siblings` either side would be four items wide
 * at the ends and seven in the middle. The row is centred, so those three
 * missing items are ~120px that appear from under the reader's cursor on the
 * press that moves them: the next arrow they were aiming at is somewhere else
 * by the time they aim again. So the run grows away from the edge that clipped
 * it, into the pages that edge was hiding: page 1 of 24 offers 1–5 rather than
 * 1–2, and the width those pages hold is width the reader can press.
 *
 * An unknown `pageCount` yields no items at all rather than a guess. That is
 * the cursor-mode and no-total case, where the honest pager is previous/next
 * and there is nothing to number.
 */
export function pageItems(
  page: number,
  pageCount: number | undefined,
  { siblings = 1, boundaries = 1 }: PageItemsOptions = {},
): DataTablePageItem[] {
  if (pageCount == null || pageCount < 1) return []
  // The widest a truncated window can get: both ends, the band, the current
  // page, and the two gaps. At or under it the gaps would hide fewer pages
  // than they cost, so every page is drawn — "1 2 … 5" for five pages is a
  // truncation that saves nothing.
  const widest = boundaries * 2 + siblings * 2 + 3
  if (pageCount <= widest) return Array.from({ length: pageCount }, (_, index) => index)

  const current = Math.min(Math.max(page, 0), pageCount - 1)
  // The run of consecutive pages the window centres on. A range longer than
  // `widest` keeps the two boundary neighbourhoods apart, so the run is clipped
  // by at most one edge; when it is, it reaches that edge and takes the slots
  // the other side of the row would have spent on a gap and a boundary. Either
  // way the run plus one gap per side plus the boundaries is `widest` items.
  const clippedAtStart = current - siblings <= boundaries
  const clippedAtEnd = current + siblings >= pageCount - 1 - boundaries
  const reach = widest - boundaries - 2
  const runStart = clippedAtStart ? 0 : clippedAtEnd ? pageCount - 1 - reach : current - siblings
  const runEnd = clippedAtStart ? reach : clippedAtEnd ? pageCount - 1 : current + siblings

  const items: DataTablePageItem[] = []
  const skip = (from: number, to: number) => {
    // A run of exactly one is the page itself; anything longer is the gap.
    if (to > from) items.push(to - from === 1 ? from : "gap")
  }
  for (let index = 0; index < boundaries && index < runStart; index++) items.push(index)
  skip(boundaries, runStart)
  for (let index = runStart; index <= runEnd; index++) items.push(index)
  skip(runEnd + 1, pageCount - boundaries)
  for (let index = Math.max(pageCount - boundaries, runEnd + 1); index < pageCount; index++) {
    items.push(index)
  }
  return items
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
  const byField = new Map<string, string[]>()
  for (const condition of query.filters) {
    if (!isFilterSet(condition.value)) continue
    const value = Array.isArray(condition.value)
      ? condition.value.map((entry) => escapePart(entry)).join(",")
      : escapePart(condition.value)
    const isDefault = condition.operator === defaultOperator(condition.variant)
    const part = isDefault ? value : `${condition.operator}:${value}`
    byField.set(condition.fieldId, [...(byField.get(condition.fieldId) ?? []), part])
  }
  for (const [fieldId, parts] of byField) params[`f.${fieldId}`] = parts.join(";")
  return params
}

/*
 * `f.<field>` is one or more conditions, `;`-separated, each of them
 * `operator:value` — with the `operator:` left off when it is the field's
 * default, and the whole `;` apparatus left off when the field carries one
 * condition. So every URL this wrote before there were operators is still
 * exactly what it writes today, and the two new separators cost nothing to a
 * view that uses neither.
 *
 * `:` and `;` are escaped inside a value, `%` with them so the escape itself
 * round-trips; unescaping takes them in that order for the same reason. `,`
 * deliberately is not — it is the separator *within* a value, it predates this,
 * and an enum key or a date containing one has never survived this trip.
 * Reading the operator is also guarded twice: a prefix is only an operator if
 * the field's variant offers it, which is what keeps `f.link=https://example.com`
 * a link and not a filter whose operator is "https".
 */
const escapePart = (value: unknown): string =>
  value == null
    ? ""
    : String(value).replaceAll("%", "%25").replaceAll(":", "%3A").replaceAll(";", "%3B")

const unescapePart = (part: string): string =>
  part.replaceAll("%3A", ":").replaceAll("%3B", ";").replaceAll("%25", "%")

export function queryFromSearchParams(
  params: URLSearchParams,
  columns: { id: string; variant?: DataTableFilterVariant }[],
  defaults: DataTableQuery = emptyQuery,
): DataTableQuery {
  const sortParam = params.get("sort")
  const filters: FilterCondition[] = []
  for (const { id, variant } of columns) {
    const raw = params.get(`f.${id}`)
    if (raw == null) continue
    const parts = raw.split(";")
    parts.forEach((part, index) => {
      const colon = part.indexOf(":")
      const head = colon < 0 ? undefined : part.slice(0, colon)
      const named = isOperatorFor(variant, head)
      const body = named ? part.slice(colon + 1) : part
      const value =
        variant === "enum"
          ? body.split(",").filter(Boolean).map(unescapePart)
          : variant === "number" || variant === "date"
            ? body.split(",").map((entry) => (entry === "" ? null : unescapePart(entry)))
            : unescapePart(body)
      filters.push({
        id: parts.length > 1 ? `${id}~${index}` : id,
        fieldId: id,
        operator: named && head ? head : defaultOperator(variant),
        variant,
        value,
      })
    })
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

/* -------------------------------------------------------------------------- */
/*                          browser-side plumbing                             */
/* -------------------------------------------------------------------------- */

/*
 * The four functions below are the only ones here that touch the browser, and
 * they are here rather than in a component because they have no React in them:
 * a route loader that wants to read a saved layout, or a server-side export
 * route that wants the same CSV the toolbar writes, can call them without
 * pulling a rendering module in behind it. Each one is a no-op off the browser
 * rather than a throw, so that stays true on a prerendered page.
 */

/** Read a saved column layout. Returns undefined on the server or on any error. */
export function readView(storageKey: string): DataTableView | undefined {
  if (typeof window === "undefined") return undefined
  try {
    const raw = window.localStorage.getItem(storageKey)
    return raw ? (JSON.parse(raw) as DataTableView) : undefined
  } catch {
    return undefined
  }
}

export function writeView(storageKey: string, view: DataTableView): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(view))
  } catch {
    /* private mode, quota, no storage: a saved layout is not worth throwing over. */
  }
}

/** Hand a generated CSV to the browser's own download machinery. */
export function downloadCsv(filename: string, csv: string): void {
  if (typeof document === "undefined") return
  // The BOM is what makes Excel read the file as UTF-8 rather than as the
  // system code page, which is where accented names turn to mojibake.
  const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }))
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function copyToClipboard(text: string): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.clipboard) return
  await navigator.clipboard.writeText(text)
}
