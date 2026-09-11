"use client"

import { useForm } from "@conform-to/react"
import type { Submission } from "@conform-to/react"
import { parseWithValibot } from "@conform-to/valibot"
import { useTable } from "@tanstack/react-table"
import type { RowData, SortingState } from "@tanstack/react-table"
import {
  AlignJustify,
  ArrowDownToLine,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  ChevronRight as ChevronRightIcon,
  Columns3,
  Copy,
  EllipsisVertical,
  Filter,
  Loader2,
  PinOff,
  RotateCcw,
  Rows2,
  Rows3,
  X,
} from "lucide-react"
import {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react"
import { useIsSSR } from "react-aria"
import type { Selection } from "react-aria-components"
import {
  Cell,
  CheckboxContext,
  Row,
  TableLayout,
  TableLoadMoreItem,
  Virtualizer,
  useDragAndDrop,
} from "react-aria-components"
import * as v from "valibot"
import { Badge } from "@/components/badge"
import { Button, buttonStyles } from "@/components/button"
import { Card, CardContent } from "@/components/card"
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
import { Note } from "@/components/note"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/popover"
import { SelectItem } from "@/components/select"
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
  type DataTableColumn,
  type DataTableDensity,
  type DataTableFilterOption,
  type DataTableFilterValue,
  type DataTableFilterVariant,
  type DataTableHeader,
  type DataTableInstance,
  type DataTableRow,
  type DataTableSelection,
  type DataTableView,
  applySelection,
  clampPage,
  dataTableFeatures,
  emptySelection,
  isRowSelected,
  nextSorting,
  pageRange,
  qualifiedLabel,
  selectedKeysFor,
  selectionCount,
  sortPriority,
  toColumnDefs,
  toCsv,
  toSortDescriptor,
} from "@/lib/data-table"
import { cn } from "@/lib/utils"

/**
 * Data Table — quebi design system
 *
 * The client-side half of the pair: the consumer holds every row and the
 * TanStack row model does the work — sorting, filtering, faceting, grouping,
 * aggregation, pagination and expansion all happen in the browser. Its
 * server-driven twin is AsyncTable, which speaks the same column vocabulary
 * (`DataTableColumn` from `@/lib/data-table`) and reuses the toolbar,
 * pagination bar, filter panels and bulk-action bar exported here.
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
 */

/* -------------------------------------------------------------------------- */
/*                          browser-side plumbing                             */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*                                 chrome                                     */
/* -------------------------------------------------------------------------- */

/**
 * One height for every control in the toolbar and the pager.
 *
 * The row used to hold four of them: a 42px field (`Input` / `SelectTrigger` /
 * `NumberInput` had no size scale, so they were all the default), a 34px
 * density group, 30px `xs` buttons and 28px `sq-xs` icon buttons. The three
 * field primitives now publish the same `xs` / `sm` / `md` scale `Button` has,
 * and `sm` is 38px on all of them — field, button and icon button alike.
 */
const CHROME_SIZE = "sm" as const
/** The square counterpart of `CHROME_SIZE`, for the icon-only controls. */
const CHROME_ICON_SIZE = "sq-sm" as const

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

export interface DataTableToolbarProps {
  /** Left-hand slot: search, filters, anything that narrows the result. */
  children?: ReactNode
  /** Right-hand slot: column chooser, density, export, refresh. */
  actions?: ReactNode
  caption?: ReactNode
  className?: string
}

/** The bar above the table. Shared by both modes so they read identically. */
export function DataTableToolbar({ children, actions, caption, className }: DataTableToolbarProps) {
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

export interface DataTableSearchProps {
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
export function DataTableSearch({
  value,
  onChange,
  debounce = 250,
  label,
  placeholder = "Search…",
  className,
}: DataTableSearchProps) {
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

export interface DataTableColumnChooserProps {
  columns: { id: string; label: string; isVisible: boolean; canHide: boolean }[]
  onChange: (id: string, isVisible: boolean) => void
  onReset?: () => void
}

/** Which columns are on screen, as a Conform checkbox group in a popover. */
export function DataTableColumnChooser({
  columns,
  onChange,
  onReset,
}: DataTableColumnChooserProps) {
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

export interface DataTableDensityToggleProps {
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

export function DataTableDensityToggle({ value, onChange }: DataTableDensityToggleProps) {
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

export interface DataTableFilterChipsProps {
  filters: { column: string; label: string; text: string }[]
  onClear: (column: string) => void
  onClearAll: () => void
  /** Saved presets: a named set of filters the user can re-apply. */
  presets?: { id: string; label: string }[]
  onApplyPreset?: (id: string) => void
  onSavePreset?: () => void
}

/** Every active filter, named and removable, with the clear-all beside them. */
export function DataTableFilterChips({
  filters,
  onClear,
  onClearAll,
  presets,
  onApplyPreset,
  onSavePreset,
}: DataTableFilterChipsProps) {
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

export interface DataTableFilterPanelProps {
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
export function DataTableFilterPanel({
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
}: DataTableFilterPanelProps) {
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
/*                              the pagination bar                            */
/* -------------------------------------------------------------------------- */

export interface DataTablePaginationProps {
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
 */
export function DataTablePagination({
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
}: DataTablePaginationProps) {
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

export interface DataTableBulkBarProps {
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
export function DataTableBulkBar({
  selection,
  total,
  pageCount,
  onSelectAllMatching,
  onClear,
  children,
}: DataTableBulkBarProps) {
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

export interface DataTableEditField {
  name: string
  label: string
  kind: "text" | "number" | "date" | "boolean" | "select"
  options?: { id: string; label: string }[]
  placeholder?: string
}

export interface DataTableRowEditorProps {
  /** The valibot schema the edited row is validated against. */
  schema: v.GenericSchema
  fields: DataTableEditField[]
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
export function DataTableRowEditor({
  schema,
  fields: editFields,
  defaultValue,
  onSave,
  onCancel,
  isSaving,
  title,
}: DataTableRowEditorProps) {
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

/* -------------------------------------------------------------------------- */
/*                                 the surface                                */
/* -------------------------------------------------------------------------- */

export interface DataTableSurfaceProps<T extends RowData> {
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
 * The render half both tables share.
 *
 * It takes a TanStack instance and the rows to draw and does nothing else with
 * the model: the client table hands it a fully computed row model, the
 * server-driven one hands it the page the server returned with every `manual*`
 * flag set. That is what makes the two modes the same table twice rather than
 * two tables that resemble each other.
 */
export function DataTableSurface<T extends RowData>({
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
}: DataTableSurfaceProps<T>) {
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
              className={cn(
                cellPadding,
                alignClass(meta?.align),
                priorityClass(meta?.priority),
                meta?.truncate && "max-w-0 truncate",
                table.getColumn(header.column.id)?.getIsPinned?.() && "bg-quebi-bg",
              )}
              style={pinStyle(header.column.id)}
            >
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
      onPointerDownCapture={handlers.onPointerDownCapture}
      onKeyDownCapture={handlers.onKeyDownCapture}
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
      {showFooter && <SurfaceFooter table={table} leafHeaders={leafHeaders} />}
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

interface SurfaceFooterProps<T extends RowData> {
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
function SurfaceFooter<T extends RowData>({ table, leafHeaders }: SurfaceFooterProps<T>) {
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

/* -------------------------------------------------------------------------- */
/*                            the client-side table                           */
/* -------------------------------------------------------------------------- */

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
  columnFilters?: DataTableFilterValue[]
  onColumnFiltersChange?: (filters: DataTableFilterValue[]) => void
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
 * is the wrong component — reach for AsyncTable, which asks the server again
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

  const controlledState = useMemo(() => {
    const slices: Record<string, unknown> = {}
    if (sortingProp) slices.sorting = sortingProp
    if (globalFilterProp != null) slices.globalFilter = globalFilterProp
    if (columnFiltersProp) {
      slices.columnFilters = columnFiltersProp.map((f) => ({ id: f.column, value: f.value }))
    }
    return Object.keys(slices).length > 0 ? slices : undefined
  }, [sortingProp, globalFilterProp, columnFiltersProp])

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
  const activeFilterIds = columnFilters.map((f) => f.id)
  const hasQuery = activeFilterIds.length > 0 || Boolean(state.globalFilter)

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

  const setColumnFilter = (columnId: string, value: unknown) => {
    const isEmpty =
      value == null || value === "" || (Array.isArray(value) && value.every((v) => v == null || v === ""))
    const next = columnFilters.filter((f) => f.id !== columnId)
    if (!isEmpty) next.push({ id: columnId, value })
    if (onColumnFiltersChange) {
      onColumnFiltersChange(next.map((f) => ({ column: f.id, value: f.value })))
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

  const chips = columnFilters.map((filter) => {
    const column = table.getColumn(filter.id)
    return {
      column: filter.id,
      label: column?.columnDef.meta?.label ?? filter.id,
      text: describeFilter(column?.columnDef.meta?.filterVariant, filter.value),
    }
  })

  const surface = (
    <DataTableSurface<T>
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
      renderRowEditor={renderRowEditor}
      editingKey={editingKey}
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
      renderFilter={(columnId) => {
        const column = table.getColumn(columnId)
        const meta = column?.columnDef.meta
        if (!column || !meta?.filterVariant) return null
        const faceted = column.getFacetedUniqueValues?.()
        const options: DataTableFilterOption[] =
          meta.filterOptions ??
          [...(faceted ?? new Map())]
            .map(([value, count]) => ({ value: String(value), count: Number(count) }))
            .sort((a, b) => a.value.localeCompare(b.value))
        const minMax = column.getFacetedMinMaxValues?.()
        return (
          <DataTableFilterPanel
            columnId={columnId}
            label={meta.label}
            variant={meta.filterVariant}
            value={columnFilters.find((f) => f.id === columnId)?.value}
            options={options}
            bounds={minMax ? [Number(minMax[0]), Number(minMax[1])] : undefined}
            onApply={(value) => setColumnFilter(columnId, value)}
            onClear={() => setColumnFilter(columnId, undefined)}
          />
        )
      }}
      className={className}
    />
  )

  return (
    <div className="flex w-full flex-col gap-2">
      <DataTableToolbar
        caption={caption}
        actions={
          <>
            {toolbarActions}
            {enableDensityToggle && (
              <DataTableDensityToggle value={density} onChange={setDensity} />
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
          <DataTableSearch
            value={String(state.globalFilter ?? "")}
            onChange={(value) =>
              onGlobalFilterChange ? onGlobalFilterChange(value) : table.setGlobalFilter(value)
            }
            label={undefined}
            placeholder="Search all columns…"
          />
        )}
      </DataTableToolbar>

      <DataTableFilterChips
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
        <DataTableBulkBar
          selection={selection}
          total={filteredCount}
          pageCount={rows.length}
          onClear={() => setSelection(emptySelection)}
        >
          {bulkActions?.(selection)}
        </DataTableBulkBar>
      )}

      {stackOnMobile ? (
        <>
          <div className="sm:hidden">
            <DataTableCards table={table} rows={rows} getRowKey={getRowId} rowActions={rowActions} />
          </div>
          <div className="hidden sm:block">{surface}</div>
        </>
      ) : (
        surface
      )}

      {paginated && (
        <DataTablePagination
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

/**
 * A filter, in a chip's worth of words. The variant decides, not the shape:
 * two selected enum values and a two-ended range are both arrays of length
 * two, and reading one as the other is how a chip ends up saying
 * "Paid – Pending".
 */
function describeFilter(variant: DataTableFilterVariant | undefined, value: unknown): string {
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
