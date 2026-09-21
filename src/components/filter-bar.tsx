"use client"

import { useForm } from "@conform-to/react"
import type { Submission } from "@conform-to/react"
import { parseWithValibot } from "@conform-to/valibot"
import { ChevronDown, Loader2, Plus, RotateCcw, SlidersHorizontal, X } from "lucide-react"
import { type ReactNode, useEffect, useId, useRef, useState } from "react"
import * as v from "valibot"
import { Badge } from "@/components/badge"
import { Button } from "@/components/button"
import { Checkbox } from "@/components/checkbox"
import { ConformCheckboxGroup } from "@/components/conform-checkbox-group"
import { ConformDateField } from "@/components/conform-date-field"
import { ConformField } from "@/components/conform-field"
import { ConformNumberField } from "@/components/conform-number-field"
import { ConformSearchField } from "@/components/conform-search-field"
import { ConformSelect } from "@/components/conform-select"
import { FieldError } from "@/components/field"
import { FormattedNumber, useFormatNumber } from "@/components/formatted-number"
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/popover"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/select"
import { Separator } from "@/components/separator"
import {
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/sheet"
import {
  type DataTableFilterOption,
  type DataTableFilterVariant,
  defaultOperator,
  type FilterField,
  type FilterOperator,
  filterOperators,
  type FilterValues,
  isFilterSet,
  operatorLabel,
} from "@/lib/data-table"
import { cn } from "@/lib/utils"

/**
 * Filter Bar — quebi design system
 *
 * The filter model with no table under it. `matchesFilter` in `@/lib/data-table`
 * has always taken a value and a filter and known nothing about columns, which
 * is what lets the same five variants — text, number, date, boolean, enum —
 * narrow a card grid, a gallery or any other list that has no header row to
 * hang a filter popover from. What lives here is the chrome for that: the panel
 * itself, the active-filter chips, and the bar that arranges them.
 *
 * **One responsive component, not two.** A row of chip triggers and a filter
 * sheet are the same component at two widths, and the difference between them
 * is a question about the surface rather than about the filters:
 *
 * - **Wide** — one pill per field, inline above the content. Inactive is an
 *   outline chip reading `Status`; active fills and states its own value,
 *   `Status: live`, so the row is both the control and the summary and there is
 *   no second chip strip to keep in sync. Fields that do not fit wait behind a
 *   `+ Filter` menu, and a `Reset` appears once anything is set.
 * - **Narrow** — the whole set collapses to one counted `Filters (2)` button
 *   opening a `Sheet`, with `FilterChips` left on the page to say what is
 *   active. Nothing about the fields changes; only where they are drawn.
 *
 * `FilterBuilder` is the third surface over the same model, and the one this
 * bar cannot be: a list of `Where [Field] [operator] [Value]` rows. A pill is
 * one control per field, so `values` is a map keyed by field and that is all it
 * can ever hold — "is not", and two conditions on one field, need the condition
 * list instead (task #193). The two share this panel; only the operator differs,
 * and here it is always the variant's default.
 *
 * `FilterPanel` and `FilterChips` are the table's own filter chrome, renamed:
 * `table-controls` re-exports them as `TableFilterPanel` / `TableFilterChips`,
 * so `TableShell`, `DataTable` and `ServerTable` keep the names they had. A
 * column filter and a list filter were never two things — only the thing being
 * filtered was.
 *
 * The panel's own operator select (`editOperator`) is what lets a column header
 * author `is not` rather than only carry it (task #201). It is a prop and not
 * the default because three of the four surfaces over this panel already state
 * the operator somewhere else — a builder row's select, a pill's field-keyed
 * map, a rail's one-control-per-field — and a second control for the same term
 * is a control that can disagree with the first.
 */

/* -------------------------------------------------------------------------- */
/*                              the filter panel                              */
/* -------------------------------------------------------------------------- */

/**
 * A client-only form, which is what a filter panel is.
 *
 * Conform binds to a form element and this one has no route action behind it —
 * a filter applies in the browser, or turns into a query the caller sends. That
 * is the documented exception to the raw-element ban, and `table-controls`
 * carries the same note over its own copy for the rest of the table chrome.
 */
function FilterForm({
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
    // biome-ignore lint/correctness/noRestrictedElements: documented exception — a form with no route action behind it. A filter panel applies in the browser and posts nowhere; React Router's <Form> would need an action that does not exist. https://ui-lib.quebi.de/rules/no-raw-interactive-elements
    <form id={id} onSubmit={onSubmit} className={className} noValidate>
      {children}
    </form>
  )
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

/** One parsed form, read back as the value `matchesFilter` expects for a variant. */
function filterValueFrom(variant: DataTableFilterVariant, parsed: Record<string, unknown>): unknown {
  switch (variant) {
    case "text":
      return String(parsed.text ?? "")
    case "boolean":
      return String(parsed.bool ?? "")
    case "enum":
      return (parsed.values as string[]) ?? []
    case "number":
      return [
        parsed.min === "" || parsed.min == null ? null : Number(parsed.min),
        parsed.max === "" || parsed.max == null ? null : Number(parsed.max),
      ]
    default:
      return [asIsoDate(parsed.from), asIsoDate(parsed.to)]
  }
}

export interface FilterPanelProps {
  fieldId: string
  label: string
  variant: DataTableFilterVariant
  /** Current applied value, in the shape `matchesFilter` expects for `variant`. */
  value: unknown
  /**
   * The question the value answers — where the panel starts, and what it
   * reports back when nothing has changed it.
   *
   * Left alone (`editOperator` unset) the panel does not pick it and does not
   * change it: it collects a value and says the question above the box, so
   * `Name contains` never sits over a control whose result the row beside it
   * reads as `does not contain`. That is the right shape wherever something
   * else already owns the operator — a `FilterBuilder` row draws its own
   * select, a `FilterBar` pill is a field-keyed map with nowhere to put one.
   */
  operator?: FilterOperator
  /**
   * Draw an Operator select above the value control, so this panel can author
   * the question as well as answer it.
   *
   * Off by default: a host that already states the operator elsewhere would
   * otherwise show it twice, in two controls that can disagree. Drawn only
   * where there is a choice to make — `filterOperators(variant)` is one entry
   * long for `boolean`, whose `Yes / No / Any` already says everything `is not`
   * would, so the select is omitted rather than rendered with nothing to pick.
   *
   * The pending operator is held like the pending value: in `submit` mode it
   * rides out with Apply, as the second argument to `onApply`, so a change of
   * question and a change of value are still **one** commit and dismissing the
   * popover still discards both. In `live` mode it commits on change, like
   * every other control there.
   */
  editOperator?: boolean
  /**
   * The filter, committed: the value, and the operator it should be read under.
   *
   * The operator is passed whether or not this panel could edit one — it is
   * the one the panel was working under, which for a host that passed neither
   * `operator` nor `editOperator` is the variant's default, i.e. exactly what
   * such a host has always applied. A caller with its own operator is free to
   * ignore the second argument.
   */
  onApply: (value: unknown, operator: FilterOperator) => void
  onClear: () => void
  /**
   * Dismiss whatever is hosting the panel, once Apply or Clear has been acted
   * on. The panel asks; the host decides what dismissing means — a popover
   * closes, a sheet slides away, a faceted rail does nothing and leaves this
   * undefined. Reading the overlay state from context instead would be silent
   * in exactly the hosts that are not overlays. Never called in `live` mode,
   * which has no end to be the end of.
   */
  onClose?: () => void
  /** Enum choices — faceted unique values client-side, a query result server-side. */
  options?: DataTableFilterOption[]
  /** Faceted min/max, used to label a number range. */
  bounds?: [number, number]
  isLoadingOptions?: boolean
  onSearchOptions?: (search: string) => void
  onLoadMoreOptions?: () => void
  /**
   * When the value is committed.
   *
   * `submit` (the default) is the Clear / Apply pair: one commit per press,
   * which is what keeps a server-driven table to one round-trip per change, and
   * dismissing the popover discards the pending edit. `live` commits every
   * change and draws no footer — right for a rail, and for the filter sheet,
   * where five Apply buttons would be five equally loud primary actions and
   * none of them the one that dismisses the drawer.
   */
  apply?: "submit" | "live"
  className?: string
}

/**
 * One field's filter, as a real Conform form with a real valibot schema.
 *
 * Every variant validates before it can be applied — a number range whose lower
 * bound is above its upper one is a form error rather than a query that returns
 * nothing and looks like an empty list.
 *
 * Applying is also the end of the interaction, so the panel calls `onClose`
 * once it has — a host that is an overlay closes, and the result of the filter
 * is visible instead of hidden behind the panel that asked for it. Clear ends
 * it the same way. The panel does not reach for react-aria's overlay state
 * itself: it is meant to be hosted outside an overlay too, and there that
 * reach would be a silent no-op rather than a prop a host can decline.
 *
 * There is no heading: the panel is mounted by something that has already named
 * the field — a pill reading `Status`, a column header, a row in a sheet — and
 * repeating the name inside covers the first option with a word the user just
 * read.
 */
export function FilterPanel({
  fieldId,
  label,
  variant,
  value,
  operator,
  editOperator,
  onApply,
  onClear,
  onClose,
  options = [],
  bounds,
  isLoadingOptions,
  onSearchOptions,
  onLoadMoreOptions,
  apply = "submit",
  className,
}: FilterPanelProps) {
  const isLive = apply === "live"
  /*
   * The pending operator, held exactly as long as the pending value is: it is
   * state rather than a prop echo, and nothing syncs it back down. A host that
   * changes `operator` from outside while the panel is open (a preset applied
   * behind it) loses to the draft, which is what a half-typed value does too —
   * the panel is one transaction, and Apply or dismissal is the end of it.
   */
  const operatorChoices = filterOperators(variant)
  const [pendingOperator, setPendingOperator] = useState<FilterOperator>()
  const showOperator = Boolean(editOperator) && operatorChoices.length > 1
  const currentOperator = pendingOperator ?? operator ?? defaultOperator(variant)
  const range: [unknown, unknown] = Array.isArray(value)
    ? (value as [unknown, unknown])
    : [null, null]
  // An option the other filters have left nothing of is drawn, disabled, at 0:
  // the choice is visible and so is the reason it is unavailable, and picking
  // it could only empty the result. Except when it is the value already applied
  // — this panel is the only place that filter can be taken off again, so a
  // selected option stays checkable however few rows are left under it.
  const appliedValues = new Set(
    variant === "enum" && Array.isArray(value) ? (value as unknown[]).map(String) : [],
  )
  const numberBound = (bound: unknown) => (bound == null ? "" : Number(bound))
  const defaultValue: PanelValues = {
    text: variant === "text" ? ((value as string) ?? "") : "",
    bool: variant === "boolean" ? ((value as string) ?? "") : "",
    values: variant === "enum" ? ((value as string[]) ?? []) : [],
    search: "",
    min: variant === "number" ? numberBound(range[0]) : "",
    max: variant === "number" ? numberBound(range[1]) : "",
    from: variant === "date" ? (asIsoDate(range[0]) ?? "") : "",
    to: variant === "date" ? (asIsoDate(range[1]) ?? "") : "",
  }
  const [form, fields] = useForm<PanelValues>({
    id: `${useId()}-filter-${fieldId}`,
    defaultValue,
    // The schema is chosen at runtime from the field's variant, so its parsed
    // type is not statically the form's; `filterValueFrom` narrows it by hand.
    onValidate: ({ formData }) =>
      parseWithValibot(formData, {
        schema: panelSchemas[variant],
      }) as unknown as Submission<PanelValues>,
    onSubmit: (event, { submission }) => {
      event.preventDefault()
      if (submission?.status !== "success") return
      onApply(
        filterValueFrom(variant, submission.value as unknown as Record<string, unknown>),
        currentOperator,
      )
      // Only a submission that got as far as applying dismisses the host: a
      // validation error keeps the panel up, with the message on the field.
      onClose?.()
    },
  })

  /*
   * Live mode commits from the controls rather than from a submit, and that is
   * not a shortcut. Conform focuses the first field carrying an error whenever
   * it reports a failed submission, so submitting on every keystroke would pull
   * the caret out of `From` and into `To` the moment a range went briefly
   * inverted — mid-edit, which is when every range is inverted. So the draft is
   * kept here, parsed by the same schema, and applied only when it passes; a
   * range that does not passes its message to the line below instead.
   */
  const draft = useRef(defaultValue)
  const [liveError, setLiveError] = useState<string>()
  const commit = (patch: Partial<PanelValues>, nextOperator?: FilterOperator) => {
    const next = { ...draft.current, ...patch }
    draft.current = next
    const result = v.safeParse(panelSchemas[variant], next)
    if (!result.success) {
      setLiveError(result.issues[0]?.message)
      return
    }
    setLiveError(undefined)
    // The operator is passed explicitly rather than read back off state: this
    // runs in the same tick as the `setPendingOperator` that caused it.
    onApply(
      filterValueFrom(variant, result.output as Record<string, unknown>),
      nextOperator ?? currentOperator,
    )
  }
  const live = <K extends keyof PanelValues>(key: K) =>
    isLive ? (next: PanelValues[K]) => commit({ [key]: next } as Partial<PanelValues>) : undefined
  const liveNumber = (key: "min" | "max") =>
    isLive ? (next: number) => commit({ [key]: Number.isNaN(next) ? "" : next }) : undefined

  const onListScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 60) onLoadMoreOptions?.()
  }

  return (
    <FilterForm id={form.id} onSubmit={form.onSubmit} className={cn("flex flex-col gap-3 p-3", className)}>
      {/* Above the value, because it is the question the value answers and a
          reader meets them in that order — and because every variant's value
          control is a different height, so a select underneath would sit at a
          different place in each panel. */}
      {showOperator && (
        <Select
          aria-label={`${label} operator`}
          selectedKey={currentOperator}
          onSelectionChange={(key) => {
            const next = String(key) as FilterOperator
            setPendingOperator(next)
            if (isLive) commit({}, next)
          }}
        >
          <SelectTrigger />
          <SelectContent items={operatorChoices}>
            {(item) => <SelectItem id={item.id}>{item.label}</SelectItem>}
          </SelectContent>
        </Select>
      )}

      {variant === "text" && (
        <ConformField
          field={fields.text}
          /* The operator is said once. With a select above it saying `does not
             contain`, a label reading `Customer contains` is the same claim
             twice and one of them is stale. */
          label={showOperator ? label : `${label} ${operatorLabel(currentOperator)}`}
          placeholder="Type to match…"
          onChange={live("text")}
        />
      )}

      {variant === "boolean" && (
        <ConformSelect
          field={fields.bool}
          label={label}
          aria-label={label}
          onSelectionChange={isLive ? (key) => commit({ bool: String(key ?? "") }) : undefined}
        >
          <SelectItem id="">Any</SelectItem>
          <SelectItem id="true">Yes</SelectItem>
          <SelectItem id="false">No</SelectItem>
        </ConformSelect>
      )}

      {variant === "number" && (
        // Two bounds side by side while there is room for them, stacked when
        // there is not — and both halves of that are about the same ~74px.
        //
        // The stepper pair is a fixed width that a `w-full min-w-0` input
        // gives up its own width to rather than overflow, so in a ~210px-wide
        // host (this panel inside a `sm:max-w-80` sheet) the two inputs
        // measured 26px each and neither the value nor the placeholder was
        // legible (task #189). A filter bound is typed, not nudged, and ↑ / ↓
        // still step — so the pair is hidden here rather than shrunk, which is
        // exactly the width the two inputs were missing.
        //
        // The container query is the floor under that: below 16rem even a
        // stepper-less pair is too narrow to read, so the row becomes a column
        // instead of slivering again. It is a *container* query and not a
        // breakpoint because this panel's width is its host's — a 320px pill
        // popover, a sheet, a filter rail — and the viewport does not predict
        // which.
        <div className="@container">
          <div className="flex flex-col gap-2 @3xs:flex-row @3xs:items-end">
            <ConformNumberField
              field={fields.min}
              label="From"
              hideStepper
              description={bounds ? `lowest ${bounds[0]}` : undefined}
              onChange={liveNumber("min")}
            />
            <ConformNumberField
              field={fields.max}
              label="To"
              hideStepper
              description={bounds ? `highest ${bounds[1]}` : undefined}
              onChange={liveNumber("max")}
            />
          </div>
        </div>
      )}

      {variant === "date" && (
        <div className="flex flex-col gap-2">
          <ConformDateField
            field={fields.from}
            label="From"
            onChange={isLive ? (date) => commit({ from: date ? date.toString() : "" }) : undefined}
          />
          <ConformDateField
            field={fields.to}
            label="To"
            onChange={isLive ? (date) => commit({ to: date ? date.toString() : "" }) : undefined}
          />
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
            <ConformCheckboxGroup
              field={fields.values}
              aria-label={`${label} values`}
              onChange={live("values")}
            >
              {options.map((option) => (
                <Checkbox
                  key={option.value}
                  value={option.value}
                  isDisabled={option.count === 0 && !appliedValues.has(option.value)}
                >
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

      {/* Live mode has no submit to report through, so the schema's own message
          is rendered here. Outside a react-aria field `FieldError` falls back to
          rendering the text itself, which is the branch this takes. */}
      {isLive && liveError && <FieldError>{liveError}</FieldError>}

      {!isLive && (
        <div className="flex items-center gap-2 border-quebi-line/10 border-t pt-3">
          <Button
            intent="ghost"
            size="xs"
            className="flex-1"
            onPress={() => {
              onClear()
              onClose?.()
            }}
          >
            Clear
          </Button>
          <Button type="submit" intent="primary" size="xs" className="flex-1">
            Apply
          </Button>
        </div>
      )}
    </FilterForm>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 the chips                                  */
/* -------------------------------------------------------------------------- */

/** One active filter, already turned into words by `describeFilter`. */
export interface FilterChip {
  id: string
  label: string
  text: string
}

export interface FilterChipsProps {
  filters: FilterChip[]
  onClear: (id: string) => void
  onClearAll: () => void
  /** Saved presets: a named set of filters the user can re-apply. */
  presets?: { id: string; label: string }[]
  onApplyPreset?: (id: string) => void
  onSavePreset?: () => void
}

/** Every active filter, named and removable, with the clear-all beside them. */
export function FilterChips({
  filters,
  onClear,
  onClearAll,
  presets,
  onApplyPreset,
  onSavePreset,
}: FilterChipsProps) {
  if (filters.length === 0 && !presets?.length) return null
  return (
    <div className="flex min-h-7 flex-wrap items-center gap-1.5 print:hidden">
      {filters.map((filter) => (
        <span
          key={filter.id}
          className="inline-flex items-center gap-x-1 rounded-full border border-quebi-brand/30 bg-quebi-brand/10 py-0.5 pe-1 ps-2.5 font-medium text-quebi-brand-text text-xs"
        >
          <span>
            {filter.label}
            <span className="text-quebi-brand-text/70"> · {filter.text}</span>
          </span>
          {/*
            The variants are named, not fought with a className (task #187).
            A `Button` given only a `className` still takes `buttonStyles`'
            defaults — `intent="primary"` and `size="md"` — and `size-4` merges
            away only the *size*: `px-5 py-2.5` is a different group, so it
            survived and left a 16px box with 20px of padding a side. The
            content box collapsed to 0 and the × vanished inside a solid mint
            blob. `ghost` + a square size is the shape this actually wants; the
            className is then only what is particular to a chip — its 16px box,
            and mint ink instead of the muted default. `isCircle` is a variant
            for the reason button.tsx gives: `rounded-full` in a className loses
            to `rounded-quebi-sm` on sheet order. The ring loses its offset
            because a 2px halo in the page colour around a 16px button inside a
            22px pill paints over the chip's own tint.
          */}
          <Button
            intent="ghost"
            size="sq-xs"
            isCircle
            aria-label={`Clear ${filter.label} filter`}
            onPress={() => onClear(filter.id)}
            className="size-4 shrink-0 text-quebi-brand-text/80 hover:bg-quebi-brand/20 hover:text-quebi-brand-text focus-visible:ring-offset-0"
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

/**
 * A filter, in a chip's worth of words. The variant decides, not the shape:
 * two selected enum values and a two-ended range are both arrays of length
 * two, and reading one as the other is how a chip ends up saying
 * "Paid – Pending".
 *
 * It lives here, beside `FilterChips`, rather than with either table mode: the
 * text is a property of the filter *variant*, which every surface shares.
 */
export function describeFilter(
  variant: DataTableFilterVariant | undefined,
  value: unknown,
  operator?: FilterOperator,
): string {
  const text = describeFilterValue(variant, value)
  // The default operator is the one the variant has always implied, and naming
  // it turns every chip that was ever drawn into "Status is Paid". Only a
  // question the reader would otherwise get wrong is worth the words — which is
  // exactly the negated and narrowed ones.
  return operator == null || operator === defaultOperator(variant)
    ? text
    : `${operatorLabel(operator)} ${text}`
}

function describeFilterValue(variant: DataTableFilterVariant | undefined, value: unknown): string {
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

/* -------------------------------------------------------------------------- */
/*                                  the bar                                   */
/* -------------------------------------------------------------------------- */

/**
 * The width below which the bar is drawn as a sheet. `md`, the same breakpoint
 * Navbar, Sidebar, Chart and DatePicker each collapse at — a filter row is a
 * toolbar, and a toolbar that wraps to three lines has stopped being one.
 */
const COLLAPSE_BREAKPOINT = 768

/**
 * One height for every control in the bar — the pills, the `+ Filter` menu, the
 * `Reset`, the sheet's trigger, and whatever the caller puts in the start slot.
 *
 * It is the same 38px `CHROME_SIZE` pins the table toolbar to, written out
 * again rather than imported: `table-controls` imports this module, so reaching
 * back for the constant would close the loop the split exists to avoid. A row
 * of 30px chips beside a 42px search field is the defect that constant was
 * introduced for, and it does not become a different defect here.
 */
const BAR_SIZE = "sm" as const

/**
 * Inlined use-mobile hook: tracks whether the viewport is below `md`.
 *
 * `undefined` until the effect runs, which is deliberate: the server and the
 * first client render agree on the wide shape, so nothing mismatches on a
 * prerendered page, and the sheet takes over a tick later where it applies.
 */
const useIsNarrow = () => {
  const [isNarrow, setIsNarrow] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${COLLAPSE_BREAKPOINT - 1}px)`)
    const onChange = () => setIsNarrow(window.innerWidth < COLLAPSE_BREAKPOINT)
    mql.addEventListener("change", onChange)
    setIsNarrow(window.innerWidth < COLLAPSE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isNarrow
}

export interface FilterBarProps {
  fields: FilterField[]
  /** Every field's current filter, by field id. Controlled — the bar holds none. */
  values: FilterValues
  onChange: (values: FilterValues) => void
  /**
   * Rendered at the start of the bar, before the pills: a search field, almost
   * always. It stays on the page in both shapes — a search box is the one
   * control nobody wants to open a drawer to reach.
   */
  children?: ReactNode
  /**
   * How many pills the bar starts with. The rest wait behind `+ Filter`, which
   * is the answer to "many fields" on a wide screen; the sheet is the answer to
   * a narrow one. Fields carrying a value are always shown, whatever this says.
   */
  inlineLimit?: number
  /**
   * Which shape to draw. `auto` is the component — it picks by viewport width.
   * The other two are for a page that already knows: a dense admin toolbar that
   * should never collapse, a mobile-only surface that should never expand.
   */
  layout?: "auto" | "bar" | "sheet"
  /**
   * How many rows the current values select. Labels the sheet's primary button
   * — "Show 12 results" is the only thing in a drawer that says what the drawer
   * did, because the results are behind it.
   */
  resultCount?: number
  isLoadingOptions?: boolean
  onSearchOptions?: (fieldId: string, search: string) => void
  onLoadMoreOptions?: (fieldId: string) => void
  /**
   * Names the sheet — its dialog label and the heading inside it. The bar
   * itself takes no group role and no name: every pill is a button that says
   * its own field, and a `role="group"` around them would announce a wrapper
   * before each of the things it wraps without adding a fact.
   */
  "aria-label"?: string
  className?: string
}

/**
 * FilterBar — one pill per field, collapsing to a sheet.
 *
 * Controlled: it takes `values` and reports the next set through `onChange`,
 * and filtering the rows stays with the caller — `filterRows` and
 * `facetCounts` in `@/lib/data-table` are the two lines that usually is.
 */
export function FilterBar({
  fields,
  values,
  onChange,
  children,
  inlineLimit = 4,
  layout = "auto",
  resultCount,
  isLoadingOptions,
  onSearchOptions,
  onLoadMoreOptions,
  "aria-label": ariaLabel = "Filters",
  className,
}: FilterBarProps) {
  const formatCount = useFormatNumber()
  const [added, setAdded] = useState<string[]>([])
  const [openField, setOpenField] = useState<string | null>(null)
  const [isSheetOpen, setSheetOpen] = useState(false)
  /*
   * The panels in the sheet stay mounted, and a conform-* control binds through
   * `defaultValue` — so a value cleared from outside the panel (Reset all, a
   * chip's ×) never reaches the control that is still showing it. Remounting is
   * the fix, and this token is what says the change was not the panel's own.
   */
  const [resetToken, setResetToken] = useState(0)
  const isNarrow = useIsNarrow()
  const asSheet = layout === "sheet" || (layout === "auto" && isNarrow === true)

  const without = (fieldId: string): FilterValues => {
    const { [fieldId]: _dropped, ...rest } = values
    return rest
  }
  /* Emptying a field from inside its own panel is not an external change: it
     must not bump the token, or unchecking the last enum option in the sheet
     would remount the group the pointer is still in. */
  const set = (fieldId: string, value: unknown) =>
    onChange(isFilterSet(value) ? { ...values, [fieldId]: value } : without(fieldId))
  const clear = (fieldId: string) => {
    setResetToken((token) => token + 1)
    onChange(without(fieldId))
  }
  const reset = () => {
    setAdded([])
    setResetToken((token) => token + 1)
    onChange({})
  }

  const active = fields.filter((field) => isFilterSet(values[field.id]))
  const shown = fields.filter(
    (field, index) =>
      index < inlineLimit || added.includes(field.id) || isFilterSet(values[field.id]),
  )
  const addable = fields.filter((field) => !shown.includes(field))

  const panelFor = (field: FilterField, apply: "submit" | "live") => (
    <FilterPanel
      fieldId={field.id}
      label={field.label}
      variant={field.variant}
      value={values[field.id]}
      options={field.options}
      bounds={field.bounds}
      apply={apply}
      isLoadingOptions={isLoadingOptions}
      onSearchOptions={onSearchOptions && ((search) => onSearchOptions(field.id, search))}
      onLoadMoreOptions={onLoadMoreOptions && (() => onLoadMoreOptions(field.id))}
      onApply={(value) => set(field.id, value)}
      onClear={() => clear(field.id)}
      /* The popover that hosts a pill's panel closes when the panel has
         applied — otherwise it sits over the results it just produced, with
         the page scroll-locked behind it (task #188). The sheet declines: its
         panels commit live and it has one dismissal, in the footer. */
      onClose={apply === "submit" ? () => setOpenField(null) : undefined}
    />
  )

  const chips = active.map((field) => ({
    id: field.id,
    label: field.label,
    text: describeFilter(field.variant, values[field.id]),
  }))

  if (asSheet) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <div className="flex flex-wrap items-center gap-2">
          {children}
          <Button intent="outline" size={BAR_SIZE} onPress={() => setSheetOpen(true)}>
            <SlidersHorizontal data-slot="icon" aria-hidden="true" />
            {/* One text node, not "Filters (" + a number + ")": three of them
                make the accessible name "Filters ( 2 )", because the name is
                joined from the elements it is spread across. */}
            {active.length > 0 ? `Filters (${formatCount(active.length)})` : "Filters"}
          </Button>
        </div>
        <FilterChips filters={chips} onClear={clear} onClearAll={reset} />
        <SheetContent
          isOpen={isSheetOpen}
          onOpenChange={setSheetOpen}
          side="right"
          aria-label={ariaLabel}
        >
          <SheetHeader>
            <SheetTitle>{ariaLabel}</SheetTitle>
          </SheetHeader>
          {/* No card around each field and no Clear/Apply pair inside it. Five
              panels' worth of chrome was 1336px of content in a 734px drawer —
              two and a half fields on screen — and five equally loud primary
              buttons, none of which dismissed the drawer the results were
              already updating behind. The footer below is the one commit. */}
          <SheetBody className="flex flex-col gap-4">
            {fields.map((field, index) => (
              <div
                key={`${field.id}-${resetToken}`}
                className={cn(
                  "flex flex-col gap-2",
                  index > 0 && "border-quebi-line/10 border-t pt-4",
                )}
              >
                <span className="font-medium text-quebi-fg text-sm">{field.label}</span>
                {panelFor(field, "live")}
              </div>
            ))}
          </SheetBody>
          <SheetFooter>
            <Button intent="ghost" onPress={reset}>
              <RotateCcw data-slot="icon" aria-hidden="true" />
              Reset all
            </Button>
            <Button intent="primary" onPress={() => setSheetOpen(false)}>
              {resultCount == null ? (
                "Show results"
              ) : (
                <>
                  Show <FormattedNumber value={resultCount} />{" "}
                  {resultCount === 1 ? "result" : "results"}
                </>
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2 print:hidden", className)}>
      {children}
      {children && shown.length > 0 && (
        <Separator orientation="vertical" className="h-6" />
      )}
      {shown.map((field) => {
        const on = isFilterSet(values[field.id])
        return (
          <Popover
            key={field.id}
            isOpen={openField === field.id}
            onOpenChange={(isOpen) => setOpenField(isOpen ? field.id : null)}
          >
            <PopoverTrigger
              size={BAR_SIZE}
              intent={on ? "primary" : "outline"}
              isCircle
              className="font-medium"
            >
              {/* The colon is glued to the label rather than living in the value
                  span beside it: the trigger is a flex row with `gap-2`, so a
                  leading ": " in its own element renders as "Status : live". */}
              <span className="truncate">
                {field.label}
                {on && (
                  <>
                    {": "}
                    <span className="font-normal opacity-80">
                      {describeFilter(field.variant, values[field.id])}
                    </span>
                  </>
                )}
              </span>
              <ChevronDown data-slot="icon" aria-hidden="true" />
            </PopoverTrigger>
            {/* Anchored to the trigger's start edge, not centred on it. A pill
                is as wide as its own text, so a centred panel hangs left of the
                field it belongs to — and it slides sideways the moment Apply
                widens `Status` into `Status: live`. */}
            <PopoverContent placement="bottom start" className="w-80">
              {panelFor(field, "submit")}
            </PopoverContent>
          </Popover>
        )
      })}
      {addable.length > 0 && (
        <Menu>
          <Button aria-label="Add a filter" size={BAR_SIZE} intent="ghost" isCircle>
            <Plus data-slot="icon" aria-hidden="true" />
            Filter
          </Button>
          <MenuContent onAction={(key) => setAdded((current) => [...current, String(key)])}>
            {addable.map((field) => (
              <MenuItem key={field.id} id={field.id}>
                {field.label}
              </MenuItem>
            ))}
          </MenuContent>
        </Menu>
      )}
      {active.length > 0 && (
        <Button intent="ghost" size={BAR_SIZE} className="ms-auto" onPress={reset}>
          <RotateCcw data-slot="icon" aria-hidden="true" />
          Reset
        </Button>
      )}
    </div>
  )
}

export type { FilterField, FilterValues }
