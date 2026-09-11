"use client"

import { useForm } from "@conform-to/react"
import type { Submission } from "@conform-to/react"
import { parseWithValibot } from "@conform-to/valibot"
import {
  AlignJustify,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Loader2,
  RotateCcw,
  Rows2,
  Rows3,
  X,
} from "lucide-react"
import { type ReactNode, useEffect, useId, useMemo, useRef, useState } from "react"
import * as v from "valibot"
import { Badge } from "@/components/badge"
import { Button, buttonStyles } from "@/components/button"
import { Checkbox } from "@/components/checkbox"
import { ConformCheckboxGroup } from "@/components/conform-checkbox-group"
import { ConformDateField } from "@/components/conform-date-field"
import { ConformField } from "@/components/conform-field"
import { ConformNumberField } from "@/components/conform-number-field"
import { ConformSearchField } from "@/components/conform-search-field"
import { ConformSelect } from "@/components/conform-select"
import { ConformSwitch } from "@/components/conform-switch"
import { FormattedNumber } from "@/components/formatted-number"
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/popover"
import { SelectItem } from "@/components/select"
import {
  type DataTableDensity,
  type DataTableFilterOption,
  type DataTableFilterVariant,
  type DataTableSelection,
  pageRange,
  selectionCount,
} from "@/lib/data-table"
import { cn } from "@/lib/utils"

/**
 * Table Controls — quebi design system
 *
 * Everything that sits *around* a table and is not the table: the toolbar, the
 * search box, the column chooser, the density menu, the filter chips, the
 * per-column filter panel, the pager, the bulk-action bar and the row editor.
 *
 * It is one of the two halves DataTable and ServerTable are assembled from, and
 * it is a sibling of the other: **`table-shell` renders rows, `table-controls`
 * renders chrome, and neither imports the other.** The shell asks for a filter
 * popover's body through a `renderFilter(columnId)` prop; the mode component is
 * what passes a `<TableFilterPanel>` into it. Keeping that seam is what makes
 * the family a tree rather than a cycle — and it is why this module imports no
 * table at all.
 *
 * Every control here is controlled: it takes a value and a callback and holds
 * no query of its own. That is what lets the same nine components serve a
 * client-side table whose state is a TanStack store and a server-driven one
 * whose state is a `DataTableQuery` on its way to a loader.
 *
 * The forms are real Conform forms over real valibot schemas, which is the
 * point rather than an implementation detail: a page jump past the last page
 * and a number range whose lower bound is above its upper one are field errors
 * here, instead of queries that return nothing and look like an empty table.
 */

/**
 * One height for every control in the toolbar and the pager.
 *
 * The row used to hold four of them: a 42px field (`Input` / `SelectTrigger` /
 * `NumberInput` had no size scale, so they were all the default), a 34px
 * density group, 30px `xs` buttons and 28px `sq-xs` icon buttons. The three
 * field primitives now publish the same `xs` / `sm` / `md` scale `Button` has,
 * and `sm` is 38px on all of them — field, button and icon button alike.
 *
 * It is exported because the mode components put controls of their own in the
 * same row — an export menu, a refresh button — and a second copy of the
 * string is how a row ends up two heights tall again.
 */
export const CHROME_SIZE = "sm" as const
/** The square counterpart of `CHROME_SIZE`, for the icon-only controls. */
export const CHROME_ICON_SIZE = "sq-sm" as const

/**
 * A remount token that fires on an *external* change and not on the user's own.
 *
 * The conform-* variants bind uncontrolled controls through `defaultValue`, so
 * a value that changes outside the form — a cleared filter, a reset column
 * layout — never reaches the control. Remounting is the fix, and remounting on
 * every change would take the focus away mid-interaction; so the caller says
 * which changes were its own and only the rest bump the token.
 */
function useExternalReset(signature: string) {
  const pushed = useRef(signature)
  const [token, setToken] = useState(0)
  useEffect(() => {
    if (signature === pushed.current) return
    pushed.current = signature
    setToken((current) => current + 1)
  }, [signature])
  return {
    token,
    markPushed: (next: string) => {
      pushed.current = next
    },
  }
}

/**
 * A client-only form, which is what every piece of table chrome is.
 *
 * Conform binds to a form element and this one has no route action behind it —
 * a filter panel, a page jump and a column chooser all apply in the browser.
 * That is the documented exception to the raw-element ban, and it is stated
 * once here rather than at each of the five call sites.
 */
function ChromeForm({
  id,
  onSubmit,
  className,
  children,
}: {
  id: string
  onSubmit: React.FormEventHandler<HTMLFormElement>
  className?: string
  children: ReactNode
}) {
  return (
    // biome-ignore lint/correctness/noRestrictedElements: documented exception — a form with no route action behind it. Table chrome (filters, page size, page jump, column chooser, inline edit) applies in the browser and posts nowhere; React Router's <Form> would need an action that does not exist. https://ui-lib.quebi.de/rules/no-raw-interactive-elements
    <form id={id} onSubmit={onSubmit} className={className} noValidate>
      {children}
    </form>
  )
}

export interface TableToolbarProps {
  /** Left-hand slot: search, filters, anything that narrows the result. */
  children?: ReactNode
  /** Right-hand slot: column chooser, density, export, refresh. */
  actions?: ReactNode
  caption?: ReactNode
  className?: string
}

/** The bar above the table. Shared by both modes so they read identically. */
export function TableToolbar({ children, actions, caption, className }: TableToolbarProps) {
  return (
    <div className={cn("flex flex-col gap-2 print:hidden", className)}>
      {caption && <div className="text-quebi-fg-muted text-sm">{caption}</div>}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 flex-wrap items-center gap-2">{children}</div>
        <div className="flex flex-none items-center gap-1.5">{actions}</div>
      </div>
    </div>
  )
}

const searchSchema = v.object({ q: v.optional(v.string(), "") })

export interface TableSearchProps {
  value: string
  onChange: (value: string) => void
  /** Milliseconds to wait after the last keystroke. 0 applies immediately. */
  debounce?: number
  label?: string
  placeholder?: string
  className?: string
}

/**
 * Global search, bound through Conform rather than a bare `useState`.
 *
 * The debounce is the reason the value is still lifted on every keystroke: the
 * field is the form's, the query is the table's, and the two are separated by
 * exactly the delay the consumer asked for.
 */
export function TableSearch({
  value,
  onChange,
  debounce = 250,
  label,
  placeholder = "Search…",
  className,
}: TableSearchProps) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { token, markPushed } = useExternalReset(value)
  const [form, fields] = useForm<{ q: string }>({
    id: `${useId()}-search-${token}`,
    defaultValue: { q: value },
    onValidate: ({ formData }) => parseWithValibot(formData, { schema: searchSchema }),
    onSubmit: (event) => {
      event.preventDefault()
    },
  })

  useEffect(() => () => (timer.current ? clearTimeout(timer.current) : undefined), [])

  const push = (next: string) => {
    markPushed(next)
    if (timer.current) clearTimeout(timer.current)
    if (debounce === 0) {
      onChange(next)
      return
    }
    timer.current = setTimeout(() => onChange(next), debounce)
  }

  return (
    <ChromeForm id={form.id} onSubmit={form.onSubmit} className={cn("w-56", className)}>
      <ConformSearchField
        field={fields.q}
        label={label}
        aria-label={label ?? "Search"}
        placeholder={placeholder}
        size={CHROME_SIZE}
        onChange={push}
      />
    </ChromeForm>
  )
}

export interface TableColumnChooserProps {
  columns: { id: string; label: string; isVisible: boolean; canHide: boolean }[]
  onChange: (id: string, isVisible: boolean) => void
  onReset?: () => void
}

/** Which columns are on screen, as a Conform checkbox group in a popover. */
export function TableColumnChooser({
  columns,
  onChange,
  onReset,
}: TableColumnChooserProps) {
  const visible = columns.filter((c) => c.isVisible).map((c) => c.id)
  const { token, markPushed } = useExternalReset(visible.join(","))
  const [form, fields] = useForm<{ columns: string[] }>({
    id: `${useId()}-columns-${token}`,
    defaultValue: { columns: visible },
    onValidate: ({ formData }) =>
      parseWithValibot(formData, { schema: v.object({ columns: v.optional(v.array(v.string()), []) }) }),
    onSubmit: (event) => {
      event.preventDefault()
    },
  })

  return (
    <Popover>
      <PopoverTrigger intent="outline" size={CHROME_SIZE} aria-label="Choose columns">
        <Columns3 data-slot="icon" aria-hidden="true" />
        Columns
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3">
        <ChromeForm id={form.id} onSubmit={form.onSubmit}>
          <ConformCheckboxGroup
            field={fields.columns}
            aria-label="Visible columns"
            onChange={(next) => {
              // The list this toggle is about to produce, so the effect above
              // recognises it as ours and leaves the popover's focus alone.
              markPushed(
                columns
                  .filter((column) => (column.canHide ? next.includes(column.id) : true))
                  .map((column) => column.id)
                  .join(","),
              )
              for (const column of columns) {
                const isVisible = next.includes(column.id)
                if (column.canHide && isVisible !== column.isVisible) onChange(column.id, isVisible)
              }
            }}
          >
            {columns.map((column) => (
              <Checkbox key={column.id} value={column.id} isDisabled={!column.canHide}>
                {column.label}
              </Checkbox>
            ))}
          </ConformCheckboxGroup>
        </ChromeForm>
        {onReset && (
          <Button intent="ghost" size="xs" className="mt-3 w-full" onPress={onReset}>
            <RotateCcw data-slot="icon" aria-hidden="true" />
            Reset to defaults
          </Button>
        )}
      </PopoverContent>
    </Popover>
  )
}

export interface TableDensityToggleProps {
  value: DataTableDensity
  onChange: (value: DataTableDensity) => void
}

/**
 * The three densities, each with a glyph that survives being 16px wide.
 *
 * The control was three `Rows3` at `scale-90` / none / `scale-110` in a
 * segmented group, which drew three identical icons — a 10% scale on a
 * 14px glyph is not a difference anyone can see, and nothing named the
 * setting. A menu names all three and shows which one is on; it also costs one
 * button of the standard height instead of a group whose own padding and
 * border made it 6px taller than everything beside it.
 */
const densityOptions: { id: DataTableDensity; label: string; Icon: typeof Rows3 }[] = [
  { id: "compact", label: "Compact", Icon: AlignJustify },
  { id: "normal", label: "Normal", Icon: Rows3 },
  { id: "comfortable", label: "Comfortable", Icon: Rows2 },
]

export function TableDensityToggle({ value, onChange }: TableDensityToggleProps) {
  const current = densityOptions.find((option) => option.id === value) ?? densityOptions[1]
  const CurrentIcon = current.Icon
  return (
    <Menu>
      <MenuTrigger
        aria-label={`Density: ${current.label}`}
        className={buttonStyles({ intent: "outline", size: CHROME_SIZE })}
      >
        <CurrentIcon data-slot="icon" aria-hidden="true" />
        Density
      </MenuTrigger>
      <MenuContent
        placement="bottom end"
        selectionMode="single"
        disallowEmptySelection
        selectedKeys={[value]}
        onSelectionChange={(keys) => {
          if (keys === "all") return
          const next = [...keys][0]
          if (next) onChange(String(next) as DataTableDensity)
        }}
      >
        {densityOptions.map(({ id, label, Icon }) => (
          <MenuItem key={id} id={id}>
            <Icon data-slot="icon" aria-hidden="true" />
            {label}
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  )
}

export interface TableFilterChipsProps {
  filters: { column: string; label: string; text: string }[]
  onClear: (column: string) => void
  onClearAll: () => void
  /** Saved presets: a named set of filters the user can re-apply. */
  presets?: { id: string; label: string }[]
  onApplyPreset?: (id: string) => void
  onSavePreset?: () => void
}

/** Every active filter, named and removable, with the clear-all beside them. */
export function TableFilterChips({
  filters,
  onClear,
  onClearAll,
  presets,
  onApplyPreset,
  onSavePreset,
}: TableFilterChipsProps) {
  if (filters.length === 0 && !presets?.length) return null
  return (
    <div className="flex min-h-7 flex-wrap items-center gap-1.5 print:hidden">
      {filters.map((filter) => (
        <span
          key={filter.column}
          className="inline-flex items-center gap-x-1 rounded-full border border-quebi-brand/30 bg-quebi-brand/10 py-0.5 pe-1 ps-2.5 font-medium text-quebi-brand text-xs"
        >
          <span>
            {filter.label}
            <span className="text-quebi-brand/70"> · {filter.text}</span>
          </span>
          <Button
            aria-label={`Clear ${filter.label} filter`}
            onPress={() => onClear(filter.column)}
            className="flex size-4 shrink-0 items-center justify-center rounded-full text-quebi-brand/80 outline-none transition-colors hover:bg-quebi-brand/20 hover:text-quebi-brand focus-visible:ring-2 focus-visible:ring-quebi-brand/50"
          >
            <X className="size-3" strokeWidth={2.5} aria-hidden="true" />
          </Button>
        </span>
      ))}
      {filters.length > 1 && (
        <Button intent="ghost" size="xs" onPress={onClearAll}>
          Clear all
        </Button>
      )}
      {presets && presets.length > 0 && onApplyPreset && (
        <Menu>
          <MenuTrigger aria-label="Saved filters">
            <Badge intent="neutral">Presets</Badge>
          </MenuTrigger>
          <MenuContent onAction={(key) => onApplyPreset(String(key))}>
            {presets.map((preset) => (
              <MenuItem key={preset.id} id={preset.id}>
                {preset.label}
              </MenuItem>
            ))}
          </MenuContent>
        </Menu>
      )}
      {onSavePreset && filters.length > 0 && (
        <Button intent="ghost" size="xs" onPress={onSavePreset}>
          Save as preset
        </Button>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                              the filter panel                              */
/* -------------------------------------------------------------------------- */

export interface TableFilterPanelProps {
  columnId: string
  label: string
  variant: DataTableFilterVariant
  /** Current applied value, in the shape `matchesFilter` expects for `variant`. */
  value: unknown
  onApply: (value: unknown) => void
  onClear: () => void
  /** Enum choices — faceted unique values client-side, a query result server-side. */
  options?: DataTableFilterOption[]
  /** Faceted min/max, used to label a number range. */
  bounds?: [number, number]
  isLoadingOptions?: boolean
  onSearchOptions?: (search: string) => void
  onLoadMoreOptions?: () => void
}

// A control the current variant does not render submits nothing at all, so
// every entry is optional and the array defaults are thunks — valibot only
// applies a non-function default to a *present* undefined, which a form field
// that was never rendered is not.
const panelSchemas: Record<DataTableFilterVariant, v.GenericSchema> = {
  text: v.object({ text: v.optional(v.string()) }),
  boolean: v.object({ bool: v.optional(v.string()) }),
  enum: v.object({
    search: v.optional(v.string()),
    values: v.optional(v.array(v.string()), () => []),
  }),
  number: v.pipe(
    v.object({
      min: v.optional(v.union([v.number(), v.literal("")])),
      max: v.optional(v.union([v.number(), v.literal("")])),
    }),
    v.forward(
      v.check(
        ({ min, max }) => min === "" || max === "" || min == null || max == null || min <= max,
        "The lower bound must not be above the upper one",
      ),
      ["max"],
    ),
  ),
  date: v.pipe(
    v.object({
      from: v.optional(v.union([v.string(), v.date()])),
      to: v.optional(v.union([v.string(), v.date()])),
    }),
    v.forward(
      v.check(
        ({ from, to }) => !from || !to || String(from) <= String(to),
        "The end date must not be before the start date",
      ),
      ["to"],
    ),
  ),
}

/**
 * The form behind every variant. One shape rather than five keeps the field
 * metadata typed — `useForm` infers its fields from this, and a per-variant
 * union would infer `any` and hand every conform-* control an untyped field.
 */
interface PanelValues {
  text: string
  bool: string
  values: string[]
  search: string
  min: number | string
  max: number | string
  from: string
  to: string
}

const asIsoDate = (value: unknown): string | null => {
  if (!value) return null
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value).slice(0, 10)
}

/**
 * One column's filter, as a real Conform form with a real valibot schema.
 *
 * Every variant validates before it can be applied — a number range whose
 * lower bound is above its upper one is a form error rather than a query that
 * returns nothing and looks like an empty table. Applying is an explicit
 * submit, which is what keeps a server-driven table to one round-trip per
 * change; dismissing the popover discards the pending edit.
 */
export function TableFilterPanel({
  columnId,
  label,
  variant,
  value,
  onApply,
  onClear,
  options = [],
  bounds,
  isLoadingOptions,
  onSearchOptions,
  onLoadMoreOptions,
}: TableFilterPanelProps) {
  const range: [unknown, unknown] = Array.isArray(value)
    ? (value as [unknown, unknown])
    : [null, null]
  const numberBound = (bound: unknown) => (bound == null ? "" : Number(bound))
  const [form, fields] = useForm<PanelValues>({
    id: `${useId()}-filter-${columnId}`,
    defaultValue: {
      text: variant === "text" ? ((value as string) ?? "") : "",
      bool: variant === "boolean" ? ((value as string) ?? "") : "",
      values: variant === "enum" ? ((value as string[]) ?? []) : [],
      search: "",
      min: variant === "number" ? numberBound(range[0]) : "",
      max: variant === "number" ? numberBound(range[1]) : "",
      from: variant === "date" ? (asIsoDate(range[0]) ?? "") : "",
      to: variant === "date" ? (asIsoDate(range[1]) ?? "") : "",
    },
    // The schema is chosen at runtime from the column's variant, so its parsed
    // type is not statically the form's; the switch below narrows it by hand.
    onValidate: ({ formData }) =>
      parseWithValibot(formData, {
        schema: panelSchemas[variant],
      }) as unknown as Submission<PanelValues>,
    onSubmit: (event, { submission }) => {
      event.preventDefault()
      if (submission?.status !== "success") return
      const parsed = submission.value as unknown as Record<string, unknown>
      switch (variant) {
        case "text":
          onApply(String(parsed.text ?? ""))
          break
        case "boolean":
          onApply(String(parsed.bool ?? ""))
          break
        case "enum":
          onApply((parsed.values as string[]) ?? [])
          break
        case "number":
          onApply([
            parsed.min === "" || parsed.min == null ? null : Number(parsed.min),
            parsed.max === "" || parsed.max == null ? null : Number(parsed.max),
          ])
          break
        case "date":
          onApply([asIsoDate(parsed.from), asIsoDate(parsed.to)])
          break
      }
    },
  })

  const onListScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 60) onLoadMoreOptions?.()
  }

  return (
    <ChromeForm id={form.id} onSubmit={form.onSubmit} className="flex flex-col gap-3 p-3">
      {variant === "text" && (
        <ConformField field={fields.text} label={`${label} contains`} placeholder="Type to match…" />
      )}

      {variant === "boolean" && (
        <ConformSelect field={fields.bool} label={label} aria-label={label}>
          <SelectItem id="">Any</SelectItem>
          <SelectItem id="true">Yes</SelectItem>
          <SelectItem id="false">No</SelectItem>
        </ConformSelect>
      )}

      {variant === "number" && (
        <div className="flex items-end gap-2">
          <ConformNumberField
            field={fields.min}
            label="From"
            description={bounds ? `lowest ${bounds[0]}` : undefined}
          />
          <ConformNumberField
            field={fields.max}
            label="To"
            description={bounds ? `highest ${bounds[1]}` : undefined}
          />
        </div>
      )}

      {variant === "date" && (
        <div className="flex flex-col gap-2">
          <ConformDateField field={fields.from} label="From" />
          <ConformDateField field={fields.to} label="To" />
        </div>
      )}

      {variant === "enum" && (
        <div className="flex flex-col gap-2">
          {onSearchOptions && (
            <ConformSearchField
              field={fields.search}
              aria-label={`Search ${label} values`}
              placeholder="Search values…"
              onChange={onSearchOptions}
            />
          )}
          {/* The scroll listener is what drives "load more on scroll". It adds
              no interaction of its own: every option inside is a real checkbox,
              and the list is fully reachable by keyboard without scrolling. */}
          <div className="quebi-scrollbar max-h-56 overflow-y-auto" onScroll={onListScroll}>
            <ConformCheckboxGroup field={fields.values} aria-label={`${label} values`}>
              {options.map((option) => (
                <Checkbox key={option.value} value={option.value}>
                  <span className="flex w-full items-center justify-between gap-2">
                    <span>{option.label ?? option.value}</span>
                    {option.count != null && (
                      <span className="text-quebi-fg-subtle text-xs tabular-nums">
                        <FormattedNumber value={option.count} />
                      </span>
                    )}
                  </span>
                </Checkbox>
              ))}
            </ConformCheckboxGroup>
            {options.length === 0 && (
              <div className="flex items-center justify-center gap-2 py-6 text-quebi-fg-subtle text-sm">
                {isLoadingOptions ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Loading…
                  </>
                ) : (
                  "No values"
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 border-quebi-line/10 border-t pt-3">
        <Button intent="ghost" size="xs" className="flex-1" onPress={onClear}>
          Clear
        </Button>
        <Button type="submit" intent="primary" size="xs" className="flex-1">
          Apply
        </Button>
      </div>
    </ChromeForm>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 the pager                                  */
/* -------------------------------------------------------------------------- */

export interface TablePagerProps {
  page: number
  pageSize: number
  rowsOnPage: number
  /** Rows matching the query. Undefined degrades the pager honestly. */
  total?: number
  hasMore?: boolean
  pageSizes?: number[]
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  /** Cursor mode has no page numbers, only previous/next. */
  mode?: "offset" | "cursor"
  className?: string
}

/**
 * Page size, page jump and the four navigation buttons.
 *
 * Both inputs are Conform fields with a valibot schema, which is what makes
 * "page 900 of 15" an error message instead of an empty table: the page jump
 * is validated against the page count before it becomes a query.
 *
 * Not `Pagination`, and the difference is not cosmetic. `Pagination` is
 * link-based — a URL per page, an anchor you can middle-click, for paging
 * through a document. This is a control bound to a query: it reports a page
 * index through a callback, it knows the page *size* and can change it, and it
 * degrades honestly when nobody counted the rows. A table's pager has no href
 * to offer, because the page is a parameter of a query rather than an address.
 */
export function TablePager({
  page,
  pageSize,
  rowsOnPage,
  total,
  hasMore,
  pageSizes = [10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,
  mode = "offset",
  className,
}: TablePagerProps) {
  const range = pageRange(page, pageSize, rowsOnPage, total, hasMore)
  const pageCount = range.pageCount
  // The size in use is always one of the offered sizes. `defaultPageSize={8}`
  // against the default `pageSizes` otherwise leaves the select with nothing
  // selected, which submits an empty `size` and fails the picklist — and
  // because the size and the page jump are fields of one Conform form, an
  // invalid size takes `Go` down with it and puts a schema error in the pager.
  const sizes = pageSizes.includes(pageSize)
    ? pageSizes
    : [...pageSizes, pageSize].sort((a, b) => a - b)
  const [form, fields] = useForm<{ size: string; jump: number | string }>({
    id: `${useId()}-pager-${page}-${pageSize}`,
    defaultValue: { size: String(pageSize), jump: String(page + 1) },
    onValidate: ({ formData }) =>
      parseWithValibot(formData, {
        schema: v.object({
          size: v.picklist(sizes.map(String)),
          jump: v.pipe(
            v.optional(v.union([v.number(), v.literal("")]), ""),
            v.check(
              (n) => n === "" || (Number(n) >= 1 && (pageCount == null || Number(n) <= pageCount)),
              pageCount == null ? "Enter a page number" : `Enter a page between 1 and ${pageCount}`,
            ),
          ),
        }),
      }),
    onSubmit: (event, { submission }) => {
      event.preventDefault()
      if (submission?.status !== "success") return
      const jump = (submission.value as { jump: number | "" }).jump
      if (jump !== "" && jump != null) onPageChange(Number(jump) - 1)
    },
  })

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 pt-1 print:hidden",
        className,
      )}
    >
      <p className="text-quebi-fg-muted text-sm tabular-nums" aria-live="polite">
        {rowsOnPage === 0 ? (
          "No rows"
        ) : (
          <>
            Showing <FormattedNumber value={range.from} />–
            <FormattedNumber value={range.to} />
            {range.total != null ? (
              <>
                {" of "}
                <FormattedNumber value={range.total} />
              </>
            ) : (
              // A COUNT(*) over a filtered query is often the slowest part of
              // the page. Saying "of many" is the honest alternative to
              // inventing a total nobody asked the database for.
              " of many"
            )}
          </>
        )}
      </p>

      <ChromeForm id={form.id} onSubmit={form.onSubmit} className="flex items-center gap-2">
        <ConformSelect
          field={fields.size}
          aria-label="Rows per page"
          className="w-32"
          size={CHROME_SIZE}
          onSelectionChange={(key) => onPageSizeChange(Number(key))}
        >
          {sizes.map((size) => (
            <SelectItem key={size} id={String(size)}>
              {size} / page
            </SelectItem>
          ))}
        </ConformSelect>

        {mode === "offset" && (
          <>
            {/*
              No steppers. They cost ~74px of the field's width, which left
              nothing for the digits — the number was in the DOM and off the
              screen. They would also be the wrong affordance: the value here is
              pending until `Go`, so stepping it navigates nowhere, and the
              buttons that do navigate are two elements to the right.
            */}
            <ConformNumberField
              field={fields.jump}
              aria-label="Go to page"
              className="w-20"
              size={CHROME_SIZE}
              hideStepper
            />
            <Button type="submit" intent="outline" size={CHROME_SIZE}>
              Go
            </Button>
          </>
        )}

        <div className="flex items-center gap-0.5">
          {mode === "offset" && (
            <Button
              intent="ghost"
              size={CHROME_ICON_SIZE}
              aria-label="First page"
              isDisabled={!range.hasPrevious}
              onPress={() => onPageChange(0)}
            >
              <ChevronFirst data-slot="icon" aria-hidden="true" />
            </Button>
          )}
          <Button
            intent="ghost"
            size={CHROME_ICON_SIZE}
            aria-label="Previous page"
            isDisabled={!range.hasPrevious}
            onPress={() => onPageChange(page - 1)}
          >
            <ChevronLeft data-slot="icon" aria-hidden="true" />
          </Button>
          <Button
            intent="ghost"
            size={CHROME_ICON_SIZE}
            aria-label="Next page"
            isDisabled={!range.hasNext}
            onPress={() => onPageChange(page + 1)}
          >
            <ChevronRight data-slot="icon" aria-hidden="true" />
          </Button>
          {mode === "offset" && (
            <Button
              intent="ghost"
              size={CHROME_ICON_SIZE}
              aria-label="Last page"
              // Without a total there is no last page to go to, and a button
              // that guesses one is worse than a button that is not offered.
              isDisabled={pageCount == null || page + 1 >= pageCount}
              onPress={() => pageCount && onPageChange(pageCount - 1)}
            >
              <ChevronLast data-slot="icon" aria-hidden="true" />
            </Button>
          )}
        </div>
      </ChromeForm>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                             the bulk action bar                            */
/* -------------------------------------------------------------------------- */

export interface TableBulkBarProps {
  selection: DataTableSelection
  /** Rows matching the current query, when it is known. */
  total?: number
  /** Rows on this page — offered as "select all N matching" when they are not all. */
  pageCount: number
  onSelectAllMatching?: () => void
  onClear: () => void
  children?: ReactNode
}

/**
 * What is selected, and what you can do to it.
 *
 * The count is deliberately allowed to be unknown: in `all-matching` mode over
 * a server-driven table with no `total`, the honest answer is "everything
 * matching your filters" rather than a number the page made up.
 */
export function TableBulkBar({
  selection,
  total,
  pageCount,
  onSelectAllMatching,
  onClear,
  children,
}: TableBulkBarProps) {
  const { count, isAll } = selectionCount(selection, total)
  if (!isAll && count === 0) return null
  const offerAllMatching =
    !isAll && onSelectAllMatching && count === pageCount && pageCount > 0 && total !== pageCount

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-quebi-md border border-quebi-brand/20 bg-quebi-brand/5 px-3 py-2 print:hidden">
      <p className="font-medium text-quebi-fg text-sm" aria-live="polite">
        {count == null ? (
          "Every row matching your filters is selected"
        ) : (
          <>
            <FormattedNumber value={count} />
            {count === 1 ? " row" : " rows"} selected
            {isAll && " (all matching)"}
          </>
        )}
      </p>
      {offerAllMatching && (
        <Button intent="ghost" size="xs" onPress={onSelectAllMatching}>
          Select all
          {total != null ? ` ${total}` : ""} matching
        </Button>
      )}
      <div className="ms-auto flex items-center gap-1.5">
        {children}
        <Button intent="ghost" size="xs" onPress={onClear}>
          Clear selection
        </Button>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                               the row editor                               */
/* -------------------------------------------------------------------------- */

export interface TableEditField {
  name: string
  label: string
  kind: "text" | "number" | "date" | "boolean" | "select"
  options?: { id: string; label: string }[]
  placeholder?: string
}

export interface TableRowEditorProps {
  /** The valibot schema the edited row is validated against. */
  schema: v.GenericSchema
  fields: TableEditField[]
  defaultValue: Record<string, unknown>
  onSave: (value: Record<string, unknown>) => void
  onCancel: () => void
  isSaving?: boolean
  title?: string
}

/**
 * A row edit, as the form it actually is.
 *
 * This is where the library's Conform story and its table story meet: the
 * editor is a real form with a real schema, so a bad edit is a field error
 * beside the field rather than a rejected save the user has to reconstruct.
 * The same component backs both the inline row editor and a bulk edit inside a
 * Modal — the difference is only which rows the caller writes the result to.
 */
export function TableRowEditor({
  schema,
  fields: editFields,
  defaultValue,
  onSave,
  onCancel,
  isSaving,
  title,
}: TableRowEditorProps) {
  // Conform's defaults are form values, which are strings; the schema is what
  // turns them back into numbers, dates and booleans on the way out.
  const defaults = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(defaultValue).map(([key, value]) => [
          key,
          value == null ? "" : String(value),
        ]),
      ),
    [defaultValue],
  )
  const [form, fields] = useForm<Record<string, string>>({
    id: `${useId()}-row-editor`,
    defaultValue: defaults,
    onValidate: ({ formData }) =>
      parseWithValibot(formData, { schema }) as unknown as Submission<Record<string, string>>,
    onSubmit: (event, { submission }) => {
      event.preventDefault()
      if (submission?.status !== "success") return
      onSave(submission.value as unknown as Record<string, unknown>)
    },
  })

  return (
    <ChromeForm id={form.id} onSubmit={form.onSubmit} className="flex flex-col gap-3">
      {title && <p className="font-medium text-quebi-fg text-sm">{title}</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {editFields.map((field) => {
          const meta = fields[field.name]
          if (!meta) return null
          switch (field.kind) {
            case "number":
              return (
                <ConformNumberField
                  key={field.name}
                  field={meta as never}
                  label={field.label}
                />
              )
            case "date":
              return (
                <ConformDateField key={field.name} field={meta as never} label={field.label} />
              )
            case "boolean":
              return (
                <ConformSwitch key={field.name} field={meta as never} label={field.label} />
              )
            case "select":
              return (
                <ConformSelect key={field.name} field={meta as never} label={field.label}>
                  {(field.options ?? []).map((option) => (
                    <SelectItem key={option.id} id={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </ConformSelect>
              )
            default:
              return (
                <ConformField
                  key={field.name}
                  field={meta as never}
                  label={field.label}
                  placeholder={field.placeholder}
                />
              )
          }
        })}
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" intent="primary" size="xs" isPending={isSaving}>
          Save
        </Button>
        <Button intent="ghost" size="xs" onPress={onCancel}>
          Cancel
        </Button>
      </div>
    </ChromeForm>
  )
}

/**
 * A filter, in a chip's worth of words. The variant decides, not the shape:
 * two selected enum values and a two-ended range are both arrays of length
 * two, and reading one as the other is how a chip ends up saying
 * "Paid – Pending".
 *
 * It lives here, beside `TableFilterChips`, rather than with either mode: the
 * text is a property of the filter *variant*, which both modes share, and the
 * component that renders it is in this file. Both call it, so a range now reads
 * "10 – 50" in a server-driven table too, where it used to read "10, 50".
 */
export function describeFilter(
  variant: DataTableFilterVariant | undefined,
  value: unknown,
): string {
  if (variant === "number" || variant === "date") {
    const [from, to] = Array.isArray(value) ? value : [null, null]
    if (from != null && from !== "" && to != null && to !== "") return `${from} – ${to}`
    if (from != null && from !== "") return `≥ ${from}`
    if (to != null && to !== "") return `≤ ${to}`
    return "any"
  }
  if (Array.isArray(value)) {
    return value.length === 1 ? String(value[0]) : `${value.length} selected`
  }
  if (variant === "boolean") return value === "true" ? "Yes" : value === "false" ? "No" : "any"
  return String(value)
}
