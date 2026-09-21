"use client"

import { type CalendarDate, parseDate } from "@internationalized/date"
import { RotateCcw } from "lucide-react"
import { type ReactNode, useId, useState } from "react"
import { Button } from "@/components/button"
import { Checkbox, CheckboxGroup } from "@/components/checkbox"
import { DateField, DateInput } from "@/components/date-field"
import { FieldError, Label } from "@/components/field"
import { describeFilter, FilterChips } from "@/components/filter-bar"
import { FormattedNumber } from "@/components/formatted-number"
import { NumberField, NumberInput } from "@/components/number-field"
import { Radio, RadioGroup } from "@/components/radio"
import { SearchField, SearchInput } from "@/components/search-field"
import { Slider, SliderFill, SliderOutput, SliderThumb, SliderTrack } from "@/components/slider"
import { type FilterField, type FilterValues, isFilterSet } from "@/lib/data-table"
import { cn } from "@/lib/utils"

/**
 * Filter Rail — quebi design system
 *
 * The browse-and-discover half of the filter model. `FilterBar` is chrome
 * *above* a working list — you know what you are looking for and you narrow it.
 * A rail is for a gallery, a catalogue, a search result, where the question is
 * not "narrow this" but "what is in here, and what would each choice leave me",
 * and it is the only surface that answers that **without opening anything**:
 * every facet on screen at once, every option carrying its live count.
 *
 * That premise is what makes this a sibling of `FilterPanel` rather than a
 * stack of them. A panel is a thing you open, so it can afford a scroll box, a
 * heading of its own and a Clear/Apply footer; a rail is a thing that is always
 * open, so it has none of the three. Every control here is drawn naked under
 * the group's own heading, every commit is immediate, and the two variants that
 * can *show* a domain — an enum and a bounded number — are drawn as the domain
 * rather than as a control that hides it: a counted checkbox column, and a
 * two-thumb slider between the bounds.
 *
 * Three parts, because a rail is a page layout as much as a control:
 *
 * - `FilterRail` — the facets. Sticky and independently scrolled beside the
 *   content at `lg`, a full-width stack above it below that.
 * - `FilterRailSummary` — the active filters as chips, next to the results.
 *   At the widths where the rail sits above the fold it is the only thing on
 *   screen saying *why* the list is short.
 * - `FilterRailLayout` — the two columns, and the container query that makes
 *   the results column work at every width. See its own note: that query is
 *   this pattern's real cost, and a viewport breakpoint cannot pay it.
 *
 * Controlled, like `FilterBar`: it takes `values` and reports the next set, and
 * `filterRows` / `facetCounts` in `@/lib/data-table` are the two lines that turn
 * them into rows and into the counts the rail draws.
 */

/* -------------------------------------------------------------------------- */
/*                               the geometry                                 */
/* -------------------------------------------------------------------------- */

/**
 * Everything about the rail's geometry, in one place, and none of it keyed to
 * the viewport. That is the point rather than a preference.
 *
 * A fixed-width rail and a viewport-breakpointed results grid disagree about
 * how wide the results are, and the disagreement is worst in the middle: at a
 * 700px viewport a 224px rail leaves a 293px results column, which a
 * `sm:grid-cols-4` grid still splits four ways — 67px cards, titles wrapping to
 * two lines, prices wrapping. The 639px *stacked* layout was far more readable
 * than the 700px side-by-side one, which is the tell: the viewport is the same
 * 700px whether the rail is taking 224px of it or not, so every `sm:` / `md:`
 * column count in there is wrong by exactly one rail.
 *
 * So the three questions this pattern asks are all asked of an element:
 *
 * - *Is there room for a sidebar beside a grid?* — of the layout, which is the
 *   width the two have to share. 48rem, so the whole 641–900px band that broke
 *   is stacked unless the layout really is that wide. A page with its own
 *   sidebar already gets the right answer here and a viewport query does not.
 * - *How many columns of facets?* — of the rail: one at its 224px sidebar
 *   width, two when it is stacked across the page. The same component, and no
 *   breakpoint that has to know which of the two it is in.
 * - *How many columns of cards?* — of the results column, by the caller. See
 *   `FilterRailLayout`.
 */
const RAIL_WIDTH = "@3xl/rail-layout:w-56 @3xl/rail-layout:shrink-0"

export interface FilterRailLayoutProps {
  /** The rail itself — a `FilterRail`, or a sheet trigger standing in for one. */
  rail: ReactNode
  /**
   * The results column — a summary, then the grid. Its own width is a
   * container, so the grid sizes itself from the space it actually has:
   * `grid gap-4 @sm:grid-cols-2 @2xl:grid-cols-3 @4xl:grid-cols-4`.
   */
  children: ReactNode
  className?: string
}

/**
 * FilterRailLayout — a rail, a results column, and the two container queries.
 *
 * The results column is an unnamed `@container`, which is the load-bearing part
 * and the reason this is a component rather than two lines in an example: it
 * makes `@sm:grid-cols-2` inside the caller's own grid mean "two columns when
 * there is 24rem of *results* to fill", at every width, including the ones
 * nobody tested. It keeps being true when the rail's width changes, when the
 * page grows a sidebar of its own, and when the same grid is later dropped
 * somewhere with no rail at all — none of which a viewport breakpoint survives.
 *
 * Unnamed on purpose: the nearest container wins, so a caller writes the plain
 * `@sm:` / `@2xl:` variants and never learns a container name. The two the
 * library queries itself are named (`rail-layout`, `rail`) so that they cannot
 * be the nearest one by accident.
 */
export function FilterRailLayout({ rail, children, className }: FilterRailLayoutProps) {
  return (
    <div
      className={cn(
        "@container/rail-layout flex w-full flex-col gap-6",
        "@3xl/rail-layout:flex-row @3xl/rail-layout:items-start",
        className,
      )}
    >
      {rail}
      <div className="@container flex min-w-0 flex-1 flex-col gap-4">{children}</div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 the facets                                 */
/* -------------------------------------------------------------------------- */

/** ISO `YYYY-MM-DD`, or undefined for anything that is not one. */
function toCalendarDate(value: unknown): CalendarDate | undefined {
  if (typeof value !== "string" || value === "") return undefined
  try {
    return parseDate(value)
  } catch {
    return undefined
  }
}

const asRange = (value: unknown): [unknown, unknown] =>
  Array.isArray(value) ? [value[0], value[1]] : [null, null]

/**
 * One enum field, as a counted column.
 *
 * The count is a column and not a suffix, which is the difference between a
 * table and a list of phrases: rendered inline after each label its left edge
 * lands wherever that label ended, so eight rows put their numbers at eight
 * different x positions with a third of the row empty to the right of them.
 * Right-aligned and `tabular-nums`, the digits line up and the eye can compare
 * them without reading the labels at all — which is the one thing a facet count
 * is for.
 *
 * A zero is a listed, disabled row, never an absent one (`facetedOptions` in
 * `@/lib/data-table` is what guarantees that, for a table and a list alike).
 * It matters more here than anywhere: the rail's whole selling point is "what
 * else could I pick", and a list that drops its zeroes visibly shortens and
 * pulls the next row up under a cursor that was about to click the old one.
 * The exception is a value already applied — this is the only place it can be
 * taken off again, so it stays checkable however few rows are left under it.
 */
function EnumFacet({
  field,
  value,
  onChange,
  optionLimit,
  labelledBy,
}: {
  field: FilterField
  value: unknown
  onChange: (value: string[]) => void
  optionLimit: number
  labelledBy: string
}) {
  const [isExpanded, setExpanded] = useState(false)
  const options = field.options ?? []
  const selected = Array.isArray(value) ? (value as unknown[]).map(String) : []
  const applied = new Set(selected)
  // A selected option is shown whatever the limit says, for the same reason a
  // zeroed one is: hiding it behind "Show all" hides the only control that
  // removes it.
  const shown =
    isExpanded || options.length <= optionLimit
      ? options
      : options.filter((option, index) => index < optionLimit || applied.has(option.value))
  const hidden = options.length - shown.length

  if (options.length === 0) {
    return <p className="py-1 text-quebi-fg-subtle text-sm">No values</p>
  }

  return (
    <>
      <CheckboxGroup
        aria-labelledby={labelledBy}
        value={selected}
        onChange={onChange}
        className="gap-2"
      >
        {shown.map((option) => (
          <Checkbox
            key={option.value}
            value={option.value}
            // Disabled only where the choice is unavailable *and* not already
            // applied — see the note above.
            isDisabled={option.count === 0 && !applied.has(option.value)}
            className="gap-2"
          >
            <span className="flex items-center justify-between gap-2">
              <span className="truncate">{option.label ?? option.value}</span>
              {option.count != null && (
                <span className="shrink-0 text-quebi-fg-subtle text-xs tabular-nums">
                  <FormattedNumber value={option.count} />
                </span>
              )}
            </span>
          </Checkbox>
        ))}
      </CheckboxGroup>
      {(hidden > 0 || isExpanded) && (
        <Button
          intent="ghost"
          size="xs"
          className="-ms-2 self-start"
          onPress={() => setExpanded((open) => !open)}
        >
          {isExpanded ? (
            "Show fewer"
          ) : (
            <>
              Show <FormattedNumber value={hidden} /> more
            </>
          )}
        </Button>
      )}
    </>
  )
}

/**
 * One bounded number field, as a two-thumb slider.
 *
 * Committed on `onChangeEnd` rather than on `onChange`, with the dragged value
 * held locally in between. "Applies on change" is a promise about there being
 * no Apply button, not about there being one commit per animation frame: a
 * server-driven surface would send a query per pixel of drag, and every
 * consumer would have to debounce the callback the rail could simply not fire.
 * The readout still follows the thumb, so the drag looks live either way.
 *
 * Both thumbs back at the bounds is not a filter, so it clears rather than
 * applying `[min, max]` — otherwise "Price" would keep a chip and a Clear
 * button for a range that excludes nothing.
 */
function NumberFacet({
  field,
  value,
  onChange,
  labelledBy,
}: {
  field: FilterField
  value: unknown
  onChange: (value: unknown) => void
  labelledBy: string
}) {
  const [drag, setDrag] = useState<[number, number] | null>(null)
  const [low, high] = asRange(value)

  if (!field.bounds) {
    // No bounds, no scale to draw: the field falls back to the pair of typed
    // bounds `FilterPanel` uses. A slider with invented endpoints would be a
    // worse answer than an honest input — it would silently clamp values the
    // caller never said were out of range.
    const bound = (side: 0 | 1) => (side === 0 ? low : high)
    const commit = (side: 0 | 1, next: number) => {
      const entry = Number.isNaN(next) ? null : next
      const pair: [unknown, unknown] = side === 0 ? [entry, high] : [low, entry]
      onChange(isFilterSet(pair) ? pair : undefined)
    }
    return (
      <div className="flex items-end gap-2">
        {([0, 1] as const).map((side) => (
          <NumberField
            key={side}
            aria-label={`${field.label} ${side === 0 ? "from" : "to"}`}
            value={bound(side) == null ? Number.NaN : Number(bound(side))}
            onChange={(next) => commit(side, next)}
          >
            <Label className="text-quebi-fg-subtle text-xs">{side === 0 ? "From" : "To"}</Label>
            <NumberInput hideStepper size="xs" />
          </NumberField>
        ))}
      </div>
    )
  }

  const [min, max] = field.bounds
  const current: [number, number] = drag ?? [
    low == null ? min : Number(low),
    high == null ? max : Number(high),
  ]
  return (
    <Slider
      aria-labelledby={labelledBy}
      minValue={min}
      maxValue={max}
      step={field.step ?? 1}
      value={current}
      onChange={(next) => setDrag(next as [number, number])}
      onChangeEnd={(next) => {
        const [from, to] = next as [number, number]
        setDrag(null)
        onChange(from === min && to === max ? undefined : [from, to])
      }}
    >
      <SliderTrack>
        <SliderFill />
        <SliderThumb index={0} aria-label={`${field.label} from`} />
        <SliderThumb index={1} aria-label={`${field.label} to`} />
      </SliderTrack>
      {/* The bounds are written out rather than left to react-aria's own thumb
          labels: a prerendered page has to format a number through the locale
          the page was rendered in, and `FormattedNumber` is the only thing here
          that reads it from the `I18nProvider`. */}
      <SliderOutput className="flex justify-between text-quebi-fg-muted text-xs">
        <FormattedNumber value={current[0]} />
        <FormattedNumber value={current[1]} />
      </SliderOutput>
    </Slider>
  )
}

/**
 * One date field, as a From / To pair.
 *
 * The draft is local because an inverted range must not commit — and a
 * controlled control that refuses a change snaps back under the caret, which is
 * every range mid-edit. So the pair holds what was typed, says what is wrong
 * with it, and applies the moment it is a range again. The same argument
 * `FilterPanel`'s live mode makes, one control lower down.
 *
 * The draft records the applied value it diverged from, rather than being a
 * bare pair. An invalid draft never commits, so nothing else can move the
 * applied value *except* something outside this control — the group's Clear,
 * the summary's chip — and a bare draft would keep drawing the rejected dates
 * over a filter that no longer exists. Remounting on the applied value would
 * fix that too and cost the caret on every valid keystroke, which is the more
 * common case by far.
 */
function DateFacet({
  field,
  value,
  onChange,
}: {
  field: FilterField
  value: unknown
  onChange: (value: unknown) => void
}) {
  const [from, to] = asRange(value)
  const applied: [string, string] = [from == null ? "" : String(from), to == null ? "" : String(to)]
  const base = `${applied[0]}|${applied[1]}`
  const [draft, setDraft] = useState<{ base: string; pair: [string, string] } | null>(null)
  const current = draft?.base === base ? draft.pair : applied
  const isInverted = current[0] !== "" && current[1] !== "" && current[0] > current[1]

  const edit = (side: 0 | 1, next: string) => {
    const pair: [string, string] = side === 0 ? [next, current[1]] : [current[0], next]
    if (pair[0] !== "" && pair[1] !== "" && pair[0] > pair[1]) {
      setDraft({ base, pair })
      return
    }
    setDraft(null)
    onChange(pair[0] === "" && pair[1] === "" ? undefined : [pair[0] || null, pair[1] || null])
  }

  return (
    <div className="flex flex-col gap-2">
      {([0, 1] as const).map((side) => (
        <DateField
          key={side}
          className="w-full"
          aria-label={`${field.label} ${side === 0 ? "from" : "to"}`}
          value={toCalendarDate(current[side]) ?? null}
          onChange={(date) => edit(side, date ? date.toString() : "")}
          isInvalid={isInverted}
        >
          <Label className="text-quebi-fg-subtle text-xs">{side === 0 ? "From" : "To"}</Label>
          <DateInput size="xs" />
        </DateField>
      ))}
      {isInverted && <FieldError>The end date must not be before the start date</FieldError>}
    </div>
  )
}

/**
 * One boolean field, as three radios rather than a select.
 *
 * A select is one visible option and two hidden ones, which is the shape a rail
 * is defined by not having. `""` is not a radio value — react-aria reads the
 * empty string as "nothing selected", so "Any" would render unpicked while
 * being the state — so the control speaks `any` / `true` / `false` and the
 * empty string stays at the edge, where `matchesFilter` expects it.
 */
function BooleanFacet({
  value,
  onChange,
  labelledBy,
}: {
  value: unknown
  onChange: (value: unknown) => void
  labelledBy: string
}) {
  const current = value === "true" || value === "false" ? String(value) : "any"
  return (
    <RadioGroup
      aria-labelledby={labelledBy}
      value={current}
      onChange={(next) => onChange(next === "any" ? undefined : next)}
      className="flex-row flex-wrap gap-x-4 gap-y-2"
    >
      <Radio value="any">Any</Radio>
      <Radio value="true">Yes</Radio>
      <Radio value="false">No</Radio>
    </RadioGroup>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  the rail                                  */
/* -------------------------------------------------------------------------- */

export interface FilterRailProps {
  fields: FilterField[]
  /** Every field's current filter, by field id. Controlled — the rail holds none. */
  values: FilterValues
  onChange: (values: FilterValues) => void
  /**
   * How many options a facet lists before it offers "Show N more". A selected
   * option is always listed, whatever this says.
   */
  optionLimit?: number
  /**
   * Rendered above the first facet — a search field, almost always. It belongs
   * in the rail rather than over the results because it is a filter like the
   * rest of them, and it is the one people look for first.
   */
  children?: ReactNode
  /** Names the rail's landmark, and heads it. */
  "aria-label"?: string
  /**
   * The rail's two shapes are container queries on `FilterRailLayout`'s
   * container, so a rail mounted outside one — in a sheet, in a layout of your
   * own — finds no container, every query is false, and it draws the
   * full-width stack. That is the right default for a sheet and the wrong one
   * for a hand-rolled sidebar; `className` is where you say so (`w-56`,
   * `sticky top-6`).
   */
  className?: string
}

/**
 * FilterRail — every facet and every count, always on screen.
 *
 * Two shapes, and the layout around it picks which (see `RAIL_WIDTH`): a 224px
 * column beside the content, sticky and independently scrolled so a long
 * result list scrolls *under* it rather than scrolling it away; or, where there
 * is not room for that, a full-width stack above the content whose groups fall
 * into two columns instead of one.
 */
export function FilterRail({
  fields,
  values,
  onChange,
  optionLimit = 8,
  children,
  "aria-label": ariaLabel = "Filters",
  className,
}: FilterRailProps) {
  const groupId = useId()
  const active = fields.filter((field) => isFilterSet(values[field.id]))

  const without = (fieldId: string): FilterValues => {
    const { [fieldId]: _dropped, ...rest } = values
    return rest
  }
  const set = (fieldId: string, value: unknown) =>
    onChange(isFilterSet(value) ? { ...values, [fieldId]: value } : without(fieldId))

  return (
    <aside
      aria-label={ariaLabel}
      className={cn(
        "quebi-scrollbar @container/rail flex flex-col print:hidden",
        RAIL_WIDTH,
        // Its own scroll, not the page's, and only in the shape where it has a
        // column to itself. With eight facets it makes no difference; with a
        // real catalogue's worth a static rail scrolls off the top and the
        // answer to "what else could I pick" is three screens back up.
        "@3xl/rail-layout:sticky @3xl/rail-layout:top-6",
        "@3xl/rail-layout:max-h-[calc(100svh---spacing(12))] @3xl/rail-layout:overflow-y-auto",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 pb-4">
        <h2 className="font-medium text-quebi-fg text-sm">{ariaLabel}</h2>
        {/* A button, not a low-contrast word beside the title. Clearing every
            facet at once is the most destructive thing the rail does and it was
            the only control on it with no affordance at all. */}
        {active.length > 0 && (
          <Button intent="outline" size="xs" onPress={() => onChange({})}>
            <RotateCcw data-slot="icon" aria-hidden="true" />
            Clear all
          </Button>
        )}
      </div>

      {children && <div className="pb-4">{children}</div>}

      {/* One column as a sidebar, two as a stack — asked of the rail's own
          width, which is the only thing that knows which of the two it
          currently is. */}
      <div className="grid gap-x-8 @xl/rail:grid-cols-2">
        {fields.map((field) => {
          const headingId = `${groupId}-${field.id}`
          const isSet = isFilterSet(values[field.id])
          return (
            <div
              key={field.id}
              className="flex flex-col gap-2 border-quebi-line/10 border-t py-4"
            >
              <div className="flex min-h-8 items-center justify-between gap-2">
                <h3 id={headingId} className="font-medium text-quebi-fg text-xs uppercase tracking-wide">
                  {field.label}
                </h3>
                {/* Per group, because clearing "Room" by unticking four boxes is
                    four commits and four re-queries of the same answer. */}
                {isSet && (
                  <Button
                    intent="ghost"
                    size="xs"
                    className="-me-2"
                    onPress={() => onChange(without(field.id))}
                  >
                    Clear
                  </Button>
                )}
              </div>

              {field.variant === "enum" && (
                <EnumFacet
                  field={field}
                  value={values[field.id]}
                  onChange={(next) => set(field.id, next)}
                  optionLimit={optionLimit}
                  labelledBy={headingId}
                />
              )}
              {field.variant === "number" && (
                <NumberFacet
                  field={field}
                  value={values[field.id]}
                  onChange={(next) => set(field.id, next)}
                  labelledBy={headingId}
                />
              )}
              {field.variant === "date" && (
                <DateFacet
                  field={field}
                  value={values[field.id]}
                  onChange={(next) => set(field.id, next)}
                />
              )}
              {field.variant === "boolean" && (
                <BooleanFacet
                  value={values[field.id]}
                  onChange={(next) => set(field.id, next)}
                  labelledBy={headingId}
                />
              )}
              {field.variant === "text" && (
                <SearchField
                  aria-labelledby={headingId}
                  value={typeof values[field.id] === "string" ? (values[field.id] as string) : ""}
                  onChange={(next) => set(field.id, next)}
                >
                  <SearchInput size="xs" placeholder="Type to match…" />
                </SearchField>
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}

/* -------------------------------------------------------------------------- */
/*                                the summary                                 */
/* -------------------------------------------------------------------------- */

export interface FilterRailSummaryProps {
  fields: FilterField[]
  values: FilterValues
  onChange: (values: FilterValues) => void
  /** Rows the current values select. */
  resultCount?: number
  /** Rows there are in total, for the "of M" half. */
  totalCount?: number
  className?: string
}

/**
 * FilterRailSummary — what is filtered, beside what it filtered.
 *
 * "12 of 40" says the list is short; it does not say why, and a rail that has
 * scrolled off the top — or that is stacked above the fold on a narrow screen —
 * takes the answer with it. The chips are the answer, and they are also where
 * a single filter comes off without scrolling back to the group that set it.
 */
export function FilterRailSummary({
  fields,
  values,
  onChange,
  resultCount,
  totalCount,
  className,
}: FilterRailSummaryProps) {
  const active = fields.filter((field) => isFilterSet(values[field.id]))
  const without = (fieldId: string): FilterValues => {
    const { [fieldId]: _dropped, ...rest } = values
    return rest
  }
  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-2", className)}>
      {resultCount != null && (
        <p className="text-quebi-fg-muted text-sm tabular-nums">
          <FormattedNumber value={resultCount} />
          {totalCount != null && (
            <>
              {" of "}
              <FormattedNumber value={totalCount} />
            </>
          )}
        </p>
      )}
      <FilterChips
        filters={active.map((field) => ({
          id: field.id,
          label: field.label,
          text: describeFilter(field.variant, values[field.id]),
        }))}
        onClear={(fieldId) => onChange(without(fieldId))}
        onClearAll={() => onChange({})}
      />
    </div>
  )
}
