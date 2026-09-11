"use client"

import { useForm } from "@conform-to/react"
import type { FieldMetadata, Submission } from "@conform-to/react"
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
import { Fragment, type ReactNode, useEffect, useId, useMemo, useRef, useState } from "react"
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
  type DataTableCellAddress,
  type DataTableCellEdit,
  type DataTableCellEditRenderer,
  type DataTableColumn,
  type DataTableDensity,
  type DataTableFieldContext,
  type DataTableFilterOption,
  type DataTableFilterVariant,
  type DataTableSelection,
  editValuesFor,
  isSameCell,
  leafColumns,
  pageRange,
  selectionCount,
} from "@/lib/data-table"
import { cn } from "@/lib/utils"

/**
 * Table Controls — quebi design system
 *
 * Everything that sits *around* a table and is not the table: the toolbar, the
 * search box, the column chooser, the density menu, the filter chips, the
 * per-column filter panel, the pager, the bulk-action bar, the unsaved-changes
 * bar, and the two editors — a row's and a cell's.
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
  onKeyDownCapture,
  onBlur,
  onSettle,
  ref,
  className,
  children,
}: {
  id: string
  onSubmit: React.FormEventHandler<HTMLFormElement>
  onKeyDownCapture?: React.KeyboardEventHandler<HTMLFormElement>
  onBlur?: React.FocusEventHandler<HTMLFormElement>
  /**
   * Every interaction that could have left a control holding a new value, on
   * one prop because the cell editor treats them identically — see `settle` in
   * `TableCellEditor` for why there are four of them and why none of them is
   * enough on its own.
   */
  onSettle?: (event: React.SyntheticEvent<HTMLFormElement>) => void
  ref?: React.Ref<HTMLFormElement>
  className?: string
  children: ReactNode
}) {
  return (
    // biome-ignore lint/correctness/noRestrictedElements: documented exception — a form with no route action behind it. Table chrome (filters, page size, page jump, column chooser, inline edit) applies in the browser and posts nowhere; React Router's <Form> would need an action that does not exist. https://ui-lib.quebi.de/rules/no-raw-interactive-elements
    <form
      id={id}
      ref={ref}
      onSubmit={onSubmit}
      onKeyDownCapture={onKeyDownCapture}
      onBlur={onBlur}
      onClick={onSettle}
      onPointerUp={onSettle}
      onKeyUp={onSettle}
      onChange={onSettle}
      className={className}
      noValidate
    >
      {children}
    </form>
  )
}

/**
 * Ask a form to submit itself, for the forms here that have no submit button to
 * press — a cell whose only control is the field being edited.
 *
 * A dispatched `submit` event rather than `requestSubmit()`, and deliberately:
 * the difference between the two is constraint validation and a `submitter`,
 * and these forms have neither. They carry `noValidate` because the schema is
 * what validates them, and they have no button to be the submitter — which is
 * the case `requestSubmit` is least careful about (happy-dom names the *form*
 * as the submitter, and `new FormData(form, form)` is a DOMException). Conform
 * reads the values off the form either way, so this is the same hand-off
 * without the part neither side wants.
 */
function submitForm(form: HTMLFormElement) {
  form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
}

/**
 * Everything in an open editor that can take focus, minus the hidden inputs the
 * rest of the row rides in. A cell becomes a control, and the control is what
 * the user was reaching for — so focus goes into it rather than staying on the
 * cell that used to hold text.
 */
/**
 * The cell an editor sits in. Two roles rather than one: react-aria gives every
 * row its row-header cell, and that one is a `rowheader` — the first column of
 * a table is exactly the column an editor is most likely to be in.
 */
const CELL_ROLE = '[role="gridcell"],[role="rowheader"]'

const FOCUSABLE_IN_EDITOR = [
  'input:not([type="hidden"]):not([disabled])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  "button:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",")

/**
 * A row as Conform default values, which are the strings a form submits.
 *
 * A boolean is `"on"` or nothing, and that is not a style choice: Conform's
 * valibot coercion turns exactly `"on"` into `true` and hands anything else
 * through unchanged, so a checkbox field seeded with `"true"` fails its own type
 * check — and `field.defaultChecked`, which is what `ConformSwitch` reads, is
 * derived from the same comparison. An array is comma-joined, which is the wire
 * shape `TagField` submits and a schema splits back.
 */
function toFormValues(value: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => {
      if (entry == null) return [key, ""]
      if (typeof entry === "boolean") return [key, entry ? "on" : ""]
      if (Array.isArray(entry)) return [key, entry.join(",")]
      return [key, String(entry)]
    }),
  )
}

/**
 * What the form would submit, as one comparable string.
 *
 * Read off the DOM rather than out of Conform's state, because the DOM is the
 * only place the answer is: react-aria's Select, ComboBox, DatePicker and
 * ColorPicker each keep the value they submit in a hidden control rewritten
 * from React state, without dispatching an event any listener could have heard.
 * Conform hears the same nothing, so a value change has to be *read*.
 *
 * Only the row's own fields are read, and a multi-valued one is joined, so the
 * reading has the same shape `toFormValues` produces: an unchecked checkbox
 * submits no entry at all and has to compare equal to the empty string it
 * opened with, or every cell with a checkbox in it would commit on sight.
 */
function formSignature(form: HTMLFormElement, names: string[]): string {
  const data = new FormData(form)
  return JSON.stringify(names.map((name) => data.getAll(name).map(String).join(",")))
}

const TYPED_INTO = new Set(["text", "search", "url", "tel", "email", "password", "number"])

/**
 * Whether this is something a value is typed into, character by character.
 *
 * It is the one distinction the commit rule needs. A control you *pick* from
 * has settled the moment its value changes — that is what picking is. A control
 * you *type* into changes its value on every keystroke and has settled at none
 * of them, so it commits when you leave it, or on Enter or Tab.
 *
 * The test is the element, not a list of component names: the table never
 * learns the name of a single `conform-*` variant, and this is the same promise
 * one layer down. A react-aria date segment is a `spinbutton` you type digits
 * into and is caught by the last clause; a checkbox, a radio and a colour swatch
 * are inputs you cannot type into and are not.
 */
function isTextEntry(node: EventTarget | null): boolean {
  if (!(node instanceof HTMLElement)) return false
  if (node instanceof HTMLTextAreaElement) return true
  if (node instanceof HTMLInputElement) return TYPED_INTO.has(node.type)
  return node.isContentEditable || node.getAttribute("role") === "spinbutton"
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
  /**
   * The shorthand for the common cases — and no longer the ceiling. Five kinds
   * against twenty-nine `conform-*` variants was an enum that would have had to
   * grow by one entry per variant forever; `render` below is the vocabulary,
   * this is the abbreviation of it.
   */
  kind?: "text" | "number" | "date" | "boolean" | "select"
  options?: { id: string; label: string }[]
  placeholder?: string
  /**
   * Any `conform-*` variant, bound by naming its props. Takes precedence over
   * `kind`, and is the same escape hatch `DataTableColumn.editor` opens for a
   * cell — so a row editor and a cell editor over the same schema can be
   * written with the same control.
   */
  render?: (ctx: DataTableFieldContext) => ReactNode
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
  /** "Save" by default. A bulk edit says what it is about to do instead. */
  submitLabel?: string
}

/** One field of a row editor: the escape hatch first, then the shorthand. */
function editControl(field: TableEditField, meta: FieldMetadata<never>): ReactNode {
  if (field.render) return field.render({ field: meta, label: field.label })
  switch (field.kind) {
    case "number":
      return <ConformNumberField field={meta} label={field.label} />
    case "date":
      return <ConformDateField field={meta} label={field.label} />
    case "boolean":
      return <ConformSwitch field={meta} label={field.label} />
    case "select":
      return (
        <ConformSelect field={meta} label={field.label}>
          {(field.options ?? []).map((option) => (
            <SelectItem key={option.id} id={option.id}>
              {option.label}
            </SelectItem>
          ))}
        </ConformSelect>
      )
    default:
      return <ConformField field={meta} label={field.label} placeholder={field.placeholder} />
  }
}

/**
 * A row edit, as the form it actually is.
 *
 * This is where the library's Conform story and its table story meet: the
 * editor is a real form with a real schema, so a bad edit is a field error
 * beside the field rather than a rejected save the user has to reconstruct.
 *
 * **It is not how you edit a row of a table.** A table's cells are editable —
 * `TableCellEditor` and the `editor` on a column — and putting a row into an
 * edit mode with a button is the model that replaced. What is left is the job
 * only this shape can do: applying a few fields to *several* rows at once,
 * inside a Modal raised from the selection bar. Its schema is then the one or
 * two fields being applied rather than the row's with holes in it, because a
 * bulk edit must not require the fields it is not touching. That is the example
 * in the gallery, and it is the whole of what this is for.
 */
export function TableRowEditor({
  schema,
  fields: editFields,
  defaultValue,
  onSave,
  onCancel,
  isSaving,
  title,
  submitLabel = "Save",
}: TableRowEditorProps) {
  // Conform's defaults are form values, which are strings; the schema is what
  // turns them back into numbers, dates and booleans on the way out.
  const defaults = useMemo(() => toFormValues(defaultValue), [defaultValue])
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
          return <Fragment key={field.name}>{editControl(field, meta as never)}</Fragment>
        })}
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" intent="primary" size="xs" isPending={isSaving}>
          {submitLabel}
        </Button>
        <Button intent="ghost" size="xs" onPress={onCancel}>
          Cancel
        </Button>
      </div>
    </ChromeForm>
  )
}

/* -------------------------------------------------------------------------- */
/*                              the cell editor                               */
/* -------------------------------------------------------------------------- */

export interface TableCellEditorProps {
  /** The valibot schema the whole row is validated against. */
  schema: v.GenericSchema
  /** The schema field this cell edits — the one field that is visible. */
  name: string
  /**
   * Every editable field of the row, as it was last committed. The one named
   * above is rendered; the rest ride as hidden inputs, which is what makes
   * "discount ≤ price" a rule this form can actually fail. See
   * `DataTableCellAddress` for the argument.
   */
  defaultValue: Record<string, unknown>
  /**
   * The character the edit began with, when it began by typing.
   *
   * Separate from `defaultValue` rather than folded into it, because the two
   * answer different questions: `defaultValue` is what this cell has already
   * reported and a commit equal to it is not reported again, while the seed is
   * a change that has already happened and must not be mistaken for one.
   */
  seed?: string
  /** The control. Bind it by naming props — never a `getInputProps` spread. */
  children: (field: FieldMetadata<never>) => ReactNode
  /** The whole validated row, once the schema accepted it and something changed. */
  onCommit: (value: Record<string, unknown>) => void
  /** Leave the cell. `move` is Tab (1) or Shift+Tab (-1); absent means stay. */
  onDone: (move?: 1 | -1) => void
  /** Escape: the edit is off and the cell goes back to showing its value. */
  onCancel: () => void
  isSaving?: boolean
}

/**
 * One cell, being edited — a Conform form over the whole row with one field on
 * screen.
 *
 * **What commits.** The control's own value settling, and one of three keys.
 * Which of the two applies is decided by the control rather than by the table,
 * and the whole of the distinction is `isTextEntry`: a control you *pick* from —
 * a Select, a date, a switch, a colour swatch — has settled the moment its value
 * changes, because picking the option is the user being done. A control you
 * *type* into has settled at none of its keystrokes, so it commits when you
 * leave it, or on Enter or Tab. Escape cancels either.
 *
 * That is what dissolves the problem a blur rule could only work around. A combo
 * box's popover, a date picker's calendar and a colour picker's swatch grid are
 * all portalled out of the table, so "focus left the cell" and "the user is
 * done" were never the same event — but a popover opening changes no value and
 * fires no change, and where focus went is no longer a question anyone asks.
 *
 * **A commit is not a departure.** Settling on a value leaves the cell open:
 * a control that collects several values before it is finished — a checkbox
 * group, a multiple select — would otherwise close under the first click. Enter,
 * Tab and leaving a text field are the gestures that say "and I am done here",
 * and they are the ones that close.
 *
 * **What is not reported twice.** Change-then-Enter and change-then-Tab would
 * each commit the same row twice, so every commit is measured against the last
 * one — `formSignature`, read off the DOM — and a submission that says nothing
 * new still closes the cell and still moves, it just does not ask the caller to
 * write the same row again.
 *
 * **Where the error goes.** Under the control, inside the cell, rendered by the
 * `conform-*` variant from the field metadata — which is also what wires
 * `aria-describedby` from the control to the message, so it is reachable from
 * the cell that caused it rather than summarised somewhere else on the page.
 * The cell stops truncating and grows while it is being edited; a message that
 * does not fit in 120px is the reason, and the row was going to change height
 * for the control anyway.
 *
 * **Which keys the cell takes.** Escape, Enter and Tab, on the way *down*, so
 * they reach the cell whatever the control would otherwise do with them — and
 * react-aria's formatted fields do stop Enter, which is why the bubble phase is
 * not an option here. The one exemption is an open overlay: a trigger inside
 * this form carrying `aria-expanded` means a popover is up and Escape and Enter
 * are its, to close itself or choose an option with. Press the key again once
 * it has and the cell answers.
 *
 * The cost is named rather than hidden: a control that reads Enter as "add this
 * one and keep going" — `ConformTagField` — reads it as "done with this cell"
 * here instead, and its comma and semicolon still add a tag.
 *
 * Opening a cell is the mirror of this and belongs to `table-shell`, which takes
 * a press, Enter, F2 and any printable character from the grid before react-aria
 * sees them. Between the two, every gesture that means something to a cell is
 * answered by whichever half owns the cell at the time.
 */
export function TableCellEditor({
  schema,
  name,
  defaultValue,
  seed,
  children,
  onCommit,
  onDone,
  onCancel,
  isSaving,
}: TableCellEditorProps) {
  const defaults = useMemo(() => {
    const values = toFormValues(defaultValue)
    // Typing starts the edit *with that character*, which is what a spreadsheet
    // does and what makes the keystroke worth intercepting. A control that
    // cannot read it as a value simply opens empty, and the schema refuses the
    // commit rather than the table guessing.
    return seed == null ? values : { ...values, [name]: seed }
  }, [defaultValue, name, seed])
  const fieldNames = useMemo(() => Object.keys(defaults), [defaults])
  // A callback ref rather than `useRef`, because "the form is in the document"
  // is a render apart from "this component mounted": react-aria renders a
  // cell's children through its collection, and Conform has no field metadata
  // to render until its own form is registered. Setting state when the node
  // attaches is what makes the effect below run at the moment there is
  // something to focus.
  const [formElement, setFormElement] = useState<HTMLFormElement | null>(null)
  // Where to go once the submission succeeds. Set immediately before asking the
  // form to submit, read inside the handler — a commit that fails validation
  // never reaches it, which is what keeps Tab from moving off a bad value.
  const move = useRef<1 | -1 | undefined>(undefined)
  // Whether this editor has already said its piece. Leaving takes focus with
  // it, and a deferred reading that arrives afterwards would be reading a form
  // nobody is in any more.
  const isLeaving = useRef(false)
  // What this cell has already reported, as `formSignature` sees it. Null means
  // "nothing yet", which is the state a seeded edit opens in: the keystroke that
  // opened it is a change, and there is no earlier reading to weigh it against.
  const committed = useRef<string | null>(null)
  // The three answers `commit` works out and the submit handler needs: whether
  // this submission says anything new, what the form read as when it was asked,
  // and whether the cell is being left as well as written.
  const isChange = useRef(true)
  const reading = useRef<string | null>(null)
  const stays = useRef(false)
  // A commit blurs the focused control, and a blurred text field is one of the
  // things this component commits on. Without this it would commit twice.
  const isCommitting = useRef(false)
  const [form, fields] = useForm<Record<string, string>>({
    id: `${useId()}-cell-editor`,
    defaultValue: defaults,
    onValidate: ({ formData }) =>
      parseWithValibot(formData, { schema }) as unknown as Submission<Record<string, string>>,
    onSubmit: (event, { submission }) => {
      event.preventDefault()
      if (submission?.status !== "success") return
      committed.current = reading.current
      if (isChange.current) onCommit(submission.value as unknown as Record<string, unknown>)
      if (stays.current) return
      isLeaving.current = true
      onDone(move.current)
    },
  })

  // What the cell opened with, read on the way past rather than through the
  // effect's dependencies: `ref={setFormElement}` has to stay the same function
  // across renders — a fresh callback ref is detached and re-attached on every
  // one of them, which here would reset the form's state and re-read its
  // baseline after every keystroke.
  const opened = useRef({ seed, fieldNames })
  opened.current = { seed, fieldNames }

  /**
   * Take the reading everything later is compared against, then focus the
   * control — through the cell rather than past it.
   *
   * The reading is what this cell would submit before anyone touched it, off the
   * DOM for the same reason the comparison is: that is where the controls keep
   * it. A seeded edit gets none, because the keystroke that opened it is already
   * the change.
   *
   * Focusing the control on its own is not enough when the edit arrived by Tab:
   * react-aria's grid still believes the *previous* cell is the focused one, and
   * its selectable-item effect puts focus back there — a keyboard move is
   * exactly the case where it declines to infer a new focused key from a child
   * taking focus. Touching the gridcell first is how it is told, and the control
   * then takes focus from it with the grid agreeing.
   */
  useEffect(() => {
    if (!formElement) return
    if (opened.current.seed == null) {
      committed.current = formSignature(formElement, opened.current.fieldNames)
    }
    if (formElement.contains(document.activeElement)) return
    const cell = formElement.closest<HTMLElement>(CELL_ROLE)
    if (cell && document.activeElement !== cell) cell.focus()
    formElement.querySelector<HTMLElement>(FOCUSABLE_IN_EDITOR)?.focus()
  }, [formElement])

  const field = fields[name]

  /**
   * Commit what is in the control, which first means making the control say so.
   *
   * react-aria's formatted fields — NumberField most visibly — keep the value
   * the form submits in a hidden input that is only rewritten when the field
   * *commits*: on blur, on Enter, on a stepper press. Reading the form without
   * that having happened submits the value the cell opened with. Blurring the
   * focused control is the one instruction every such field understands, and it
   * is a discrete event, so React has flushed the new hidden value by the time
   * it returns — which is also why the reading that decides whether anything
   * changed is taken after it and not before.
   */
  const commit = (element: HTMLFormElement, direction?: 1 | -1, stay?: boolean) => {
    if (isCommitting.current) return
    isCommitting.current = true
    move.current = direction
    stays.current = stay === true
    const active = document.activeElement
    const inside = active instanceof HTMLElement && element.contains(active)
    if (inside) (active as HTMLElement).blur()
    const now = formSignature(element, fieldNames)
    isChange.current = committed.current === null || now !== committed.current
    reading.current = now
    submitForm(element)
    // A commit that stays put gives the focus back. The blur above is an
    // instruction to the control, not the user leaving it, and a cell that
    // answered a click by dropping focus on the body is one the keyboard has
    // no way back into.
    if (stays.current && inside && element.isConnected) (active as HTMLElement).focus()
    isCommitting.current = false
  }

  const hasChanged = (element: HTMLFormElement) =>
    committed.current === null || formSignature(element, fieldNames) !== committed.current

  const cancel = () => {
    isLeaving.current = true
    onCancel()
  }

  /**
   * Ask, after an interaction, whether a control settled on a new value.
   *
   * Four events rather than one, because there is no single one to listen for:
   * a react-aria control writes the value it submits from React state without
   * dispatching anything, so what is observable is the gesture, not the change.
   * A press is `click` or — where a drag ends away from where it began —
   * `pointerup`; a keyboard choice is `keyup`; a plain input is `change`. They
   * all arrive here through React's own propagation, which follows the element
   * tree rather than the document's, so a combo box's listbox and a date
   * picker's calendar report here even though they are portalled out of the
   * table entirely. That is the whole of what made the old blur rule hard.
   *
   * The reading is deferred by a microtask because the value a control submits
   * is written by the render the interaction causes, and that render has not
   * happened yet while the handler is running.
   *
   * Typing is excluded here and nowhere else: it changes the value on every
   * keystroke and none of those is the user being finished.
   */
  const settle = (event: React.SyntheticEvent) => {
    if (isCommitting.current || isLeaving.current || isTextEntry(event.target)) return
    const element = formElement
    if (!element) return
    queueMicrotask(() => {
      if (isCommitting.current || isLeaving.current || !element.isConnected) return
      if (hasChanged(element)) commit(element, undefined, true)
    })
  }

  return (
    <ChromeForm
      id={form.id}
      ref={setFormElement}
      onSubmit={form.onSubmit}
      className="flex min-w-0 flex-col gap-1"
      onKeyDownCapture={(event) => {
        const element = event.currentTarget
        if (event.key !== "Escape" && event.key !== "Enter" && event.key !== "Tab") return
        // An open overlay owns Escape and Enter — closing itself, choosing an
        // option — and says so the way react-aria says it everywhere: the
        // trigger inside this form carries aria-expanded while its popover is
        // up. Press again once it is closed and the cell answers.
        if (event.key !== "Tab" && element.querySelector('[aria-expanded="true"]')) return
        event.preventDefault()
        event.stopPropagation()
        if (event.key === "Escape") cancel()
        else if (event.key === "Enter") commit(element)
        else commit(element, event.shiftKey ? -1 : 1)
      }}
      onSettle={settle}
      onBlur={(event) => {
        // Free text settles when you stop typing into it, and this is that: the
        // control the characters were going into no longer has focus, so the
        // user has left the cell and the value goes with them. Nothing else
        // commits for losing focus — a portalled popover taking it is exactly
        // the case that used to have to be argued around, and a combo box keeps
        // focus in its own input while its list is open, so it never arrives.
        //
        // Deferred for the same reason `settle` is, and one more: a react-aria
        // number field rewrites the value it submits *during* this event, so
        // reading the form inside the handler reads the value before the edit.
        if (isCommitting.current || isLeaving.current || !isTextEntry(event.target)) return
        const element = formElement
        if (!element) return
        queueMicrotask(() => {
          if (isCommitting.current || isLeaving.current || !element.isConnected) return
          if (hasChanged(element)) commit(element)
        })
      }}
    >
      <div className="relative flex min-w-0 flex-col">
        {field ? children(field as never) : null}
        {isSaving && (
          <span className="pointer-events-none absolute end-1.5 top-1.5 text-quebi-fg-subtle">
            <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
            <span className="sr-only">Saving…</span>
          </span>
        )}
      </div>
      {fieldNames
        .filter((key) => key !== name)
        .map((key) => (
          // The rest of the row, so the schema validates a row rather than a
          // field. A hidden input is not an interactive control, which is the
          // whole of this element's carve-out from the ban.
          <input
            key={key}
            type="hidden"
            name={fields[key]?.name ?? key}
            form={form.id}
            value={defaults[key]}
          />
        ))}
    </ChromeForm>
  )
}

export interface TableCellEditingOptions<T> {
  /** The same columns the table was given — bands and all. */
  columns: DataTableColumn<T>[]
  /** The schema every edit is validated against. Without it nothing is editable. */
  schema?: v.GenericSchema
  /**
   * The row as form values. Defaults to the editable columns read off the row,
   * which is the set the schema has to cover — name it when the schema needs a
   * field no column edits.
   */
  getEditValues?: (row: T) => Record<string, unknown>
  onCellEdit?: (edit: DataTableCellEdit<T>) => void
  /** Controlled. Leave it out and the table holds the open cell itself. */
  editingCell?: DataTableCellAddress | null
  onEditingCellChange?: (cell: DataTableCellAddress | null) => void
  /**
   * The cell whose commit is in flight. An address rather than a flag: commits
   * no longer wait for the cell to be left, so the cell being saved and the cell
   * on screen are routinely different ones.
   */
  savingCell?: DataTableCellAddress | null
}

export interface TableCellEditing<T> {
  editingCell: DataTableCellAddress | null
  setEditingCell: (cell: DataTableCellAddress | null) => void
  editableColumns: string[]
  renderCellEditor?: DataTableCellEditRenderer<T>
}

/**
 * The wiring between a column's `editor` and the shell's editing cell, written
 * once for both modes.
 *
 * `DataTable` and `ServerTable` differ in where their rows come from and in
 * nothing else here, so the glue that turns `columns[].editor` into a Conform
 * form lives beside the form rather than twice beside the tables. It is a hook
 * in `table-controls` and not in `table-shell` because it *renders a control*,
 * and the shell renders no chrome — the seam between the two halves is a shared
 * type in `@/lib/data-table`, not an import either way.
 */
export function useTableCellEditing<T>({
  columns,
  schema,
  getEditValues,
  onCellEdit,
  editingCell: controlledCell,
  onEditingCellChange,
  savingCell,
}: TableCellEditingOptions<T>): TableCellEditing<T> {
  const [internalCell, setInternalCell] = useState<DataTableCellAddress | null>(null)
  const editable = useMemo(
    () => leafColumns(columns).filter((column) => column.editor),
    [columns],
  )
  const editingCell = controlledCell !== undefined ? controlledCell : internalCell
  const setEditingCell = (cell: DataTableCellAddress | null) => {
    if (controlledCell === undefined) setInternalCell(cell)
    onEditingCellChange?.(cell)
  }

  if (!schema || editable.length === 0) {
    return { editingCell: null, setEditingCell, editableColumns: [] }
  }

  return {
    editingCell,
    setEditingCell,
    editableColumns: editable.map((column) => column.id),
    renderCellEditor: ({ row, rowId, columnId, seed, close, move }) => {
      const column = editable.find((candidate) => candidate.id === columnId)
      if (!column?.editor) return null
      const name = column.editField ?? column.id
      const values = getEditValues ? getEditValues(row) : editValuesFor(editable, row)
      return (
        <TableCellEditor
          schema={schema}
          name={name}
          defaultValue={values}
          seed={seed}
          isSaving={isSameCell(savingCell, { rowId, columnId })}
          onCancel={close}
          onCommit={(value) => onCellEdit?.({ row, rowId, columnId, field: name, value })}
          onDone={(delta) => (delta ? move(delta) : close())}
        >
          {(field) => column.editor?.({ row, field, label: column.header })}
        </TableCellEditor>
      )
    },
  }
}

export interface TableUnsavedBarProps {
  /** How many rows have an uncommitted change. Zero renders nothing. */
  count: number
  onSave: () => void
  onDiscard: () => void
  isSaving?: boolean
  className?: string
}

/**
 * "N unsaved changes — Save / Discard", for a table that batches.
 *
 * A cell commit is reported the moment the schema accepts it, which is the only
 * primitive that can be built on: batching is a draft the caller keeps and
 * flushes, and it is expressible over per-cell commits, while per-cell commits
 * are not expressible over a batch. This is the other half of that decision,
 * published so the batched mode is a control rather than an exercise.
 */
export function TableUnsavedBar({
  count,
  onSave,
  onDiscard,
  isSaving,
  className,
}: TableUnsavedBarProps) {
  if (count === 0) return null
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-quebi-md border border-quebi-warn/30 bg-quebi-warn/5 px-3 py-2 print:hidden",
        className,
      )}
    >
      <p className="font-medium text-quebi-fg text-sm" aria-live="polite">
        <FormattedNumber value={count} />
        {count === 1 ? " unsaved change" : " unsaved changes"}
      </p>
      <div className="ms-auto flex items-center gap-1.5">
        <Button intent="primary" size="xs" isPending={isSaving} onPress={onSave}>
          Save
        </Button>
        <Button intent="ghost" size="xs" onPress={onDiscard}>
          Discard
        </Button>
      </div>
    </div>
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
