import { useState } from "react"
import { Badge } from "@/components/badge"
import { Card, CardContent } from "@/components/card"
import { FilterBar, FilterChips, FilterPanel, describeFilter } from "@/components/filter-bar"
import { FormattedNumber } from "@/components/formatted-number"
import { Note } from "@/components/note"
import { SearchField, SearchInput } from "@/components/search-field"
import { Text } from "@/components/text"
import type { FilterField, FilterValues } from "@/lib/data-table"
import { facetCounts, filterRows, isFilterSet } from "@/lib/data-table"
import type { ComponentExample } from "./types"

/**
 * A card grid, which is the point: nothing on this page is a table.
 *
 * The same five variants that filter a column filter these six fields over a
 * plain array of objects, through the same `matchesFilter` — what changed is
 * only where the controls are drawn.
 */

export interface Kiosk {
  id: string
  title: string
  status: string
  room: string
  price: number
  updated: string
  isFeatured: boolean
}

/** Deterministic, so the prerendered HTML and the hydrated page agree. */
export const KIOSKS: Kiosk[] = [
  { id: "k1", title: "Atrium North", status: "live", room: "Atrium", price: 249, updated: "2026-09-14", isFeatured: true },
  { id: "k2", title: "Atrium South", status: "live", room: "Atrium", price: 249, updated: "2026-09-02", isFeatured: false },
  { id: "k3", title: "Lobby Desk", status: "draft", room: "Lobby", price: 189, updated: "2026-08-28", isFeatured: false },
  { id: "k4", title: "Lobby Window", status: "offline", room: "Lobby", price: 189, updated: "2026-07-19", isFeatured: false },
  { id: "k5", title: "Garage Entry", status: "live", room: "Garage", price: 129, updated: "2026-09-18", isFeatured: false },
  { id: "k6", title: "Garage Exit", status: "offline", room: "Garage", price: 129, updated: "2026-06-30", isFeatured: false },
  { id: "k7", title: "Rooftop Bar", status: "draft", room: "Rooftop", price: 399, updated: "2026-09-11", isFeatured: true },
  { id: "k8", title: "Rooftop Terrace", status: "live", room: "Rooftop", price: 399, updated: "2026-09-20", isFeatured: true },
  { id: "k9", title: "Foyer East", status: "live", room: "Foyer", price: 209, updated: "2026-08-05", isFeatured: false },
  { id: "k10", title: "Foyer West", status: "draft", room: "Foyer", price: 209, updated: "2026-05-22", isFeatured: false },
]

export const KIOSK_FIELDS: FilterField[] = [
  { id: "status", label: "Status", variant: "enum" },
  { id: "room", label: "Room", variant: "enum" },
  { id: "price", label: "Price", variant: "number", bounds: [129, 399] },
  { id: "updated", label: "Updated", variant: "date" },
  { id: "isFeatured", label: "Featured", variant: "boolean" },
  { id: "title", label: "Name", variant: "text" },
]

/**
 * The two lines that filtering a list actually is.
 *
 * `filterRows` runs every field's filter over the array; `facetCounts` counts
 * one field's choices against the rows the *other* fields leave, so "Rooftop 2"
 * means "and two would be left", not "two of what you can already see". The
 * counts go back onto the fields, which is the only thing `FilterBar` needs to
 * draw a faceted panel.
 */
function useKiosks(fields: FilterField[] = KIOSK_FIELDS) {
  const [values, setValues] = useState<FilterValues>({})
  const rows = filterRows(KIOSKS, fields, values)
  const withFacets = fields.map((field) =>
    field.variant === "enum"
      ? { ...field, options: facetCounts(KIOSKS, fields, field.id, values) }
      : field,
  )
  return { values, setValues, rows, fields: withFacets }
}

function Results({ rows }: { rows: Kiosk[] }) {
  return (
    <div className="flex flex-col gap-2">
      <Text className="text-quebi-fg-subtle text-xs">
        <FormattedNumber value={rows.length} /> of <FormattedNumber value={KIOSKS.length} /> kiosks
      </Text>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {rows.map((row) => (
          <Card key={row.id}>
            <CardContent className="flex flex-col items-start gap-1 p-3">
              <span className="font-medium text-quebi-fg text-sm">{row.title}</span>
              <span className="text-quebi-fg-subtle text-xs">
                {row.room} ·{" "}
                <FormattedNumber
                  value={row.price}
                  options={{ style: "currency", currency: "EUR", maximumFractionDigits: 0 }}
                />
              </span>
              <Badge
                intent={
                  row.status === "live" ? "success" : row.status === "draft" ? "warning" : "neutral"
                }
              >
                {row.status}
              </Badge>
            </CardContent>
          </Card>
        ))}
        {rows.length === 0 && (
          <Text className="col-span-full py-6 text-center text-quebi-fg-subtle text-sm">
            Nothing matches these filters.
          </Text>
        )}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   the bar                                  */
/* -------------------------------------------------------------------------- */

const Bar = () => {
  const { values, setValues, rows, fields } = useKiosks()

  return (
    <div className="flex w-full flex-col gap-4">
      <FilterBar
        aria-label="Filter kiosks"
        fields={fields}
        values={values}
        onChange={setValues}
        resultCount={rows.length}
      >
        <SearchField
          className="w-52"
          aria-label="Search kiosks"
          value={String(values.title ?? "")}
          onChange={(search) => setValues({ ...values, title: search })}
        >
          <SearchInput size="sm" placeholder="Search kiosks" />
        </SearchField>
      </FilterBar>
      <Results rows={rows} />
      <Note intent="info">
        Four pills, then <code>+ Filter</code> for the two that did not fit.
        An inactive pill is an outline chip naming its field; an active one fills
        and states its own value, so the row is both the control and the summary
        — there is no second chip strip to keep in sync. Narrow the window past{" "}
        <code>768px</code> and the same component redraws itself as the sheet
        below.
      </Note>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  the sheet                                 */
/* -------------------------------------------------------------------------- */

const AsSheet = () => {
  const { values, setValues, rows, fields } = useKiosks()

  return (
    <div className="flex w-full flex-col gap-4">
      <FilterBar
        aria-label="Filter kiosks"
        layout="sheet"
        fields={fields}
        values={values}
        onChange={setValues}
        resultCount={rows.length}
      >
        <SearchField
          className="w-52"
          aria-label="Search kiosks"
          value={String(values.title ?? "")}
          onChange={(search) => setValues({ ...values, title: search })}
        >
          <SearchInput size="sm" placeholder="Search kiosks" />
        </SearchField>
      </FilterBar>
      <Results rows={rows} />
      <Note intent="info">
        The same fields, the same values, one button. Every panel inside applies
        on change — no per-field Clear/Apply pair, because six of them would be
        six equally loud primary buttons and none of them the one that dismisses
        the drawer. The footer is the single commit: <em>Reset all</em>, and{" "}
        <em>Show N results</em>, which is the only thing in a drawer that says
        what the drawer did. What is active stays on the page as chips.
      </Note>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                              the panel alone                               */
/* -------------------------------------------------------------------------- */

const Panels = () => {
  const [submitted, setSubmitted] = useState<unknown>(["live"])
  const [lived, setLived] = useState<unknown>([200, null])

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Text className="font-medium text-quebi-fg text-sm">
            <code>apply="submit"</code>
          </Text>
          <div className="rounded-quebi-md border border-quebi-line/10">
            <FilterPanel
              fieldId="status"
              label="Status"
              variant="enum"
              value={submitted}
              options={facetCounts(KIOSKS, KIOSK_FIELDS, "status", {})}
              onApply={setSubmitted}
              onClear={() => setSubmitted([])}
            />
          </div>
          <Text className="text-quebi-fg-subtle text-xs">
            Applied: <code>{describeFilter("enum", submitted)}</code>
          </Text>
        </div>
        <div className="flex flex-col gap-2">
          <Text className="font-medium text-quebi-fg text-sm">
            <code>apply="live"</code>
          </Text>
          <div className="rounded-quebi-md border border-quebi-line/10">
            <FilterPanel
              fieldId="price"
              label="Price"
              variant="number"
              apply="live"
              bounds={[129, 399]}
              value={lived}
              onApply={setLived}
              onClear={() => setLived([null, null])}
            />
          </div>
          <Text className="text-quebi-fg-subtle text-xs">
            Applied: <code>{describeFilter("number", lived)}</code>
          </Text>
        </div>
      </div>
      <Note intent="info">
        One form, two commit modes. <code>submit</code> is a real submit behind a
        Clear/Apply pair — one commit per press, which is what keeps a
        server-driven query to one round-trip per change. <code>live</code>{" "}
        commits every change and draws no footer. Put 300 in <em>From</em> and 100
        in <em>To</em> and the range is refused with the schema's own message
        rather than applied: a query that would have returned nothing never runs.
      </Note>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   chips                                    */
/* -------------------------------------------------------------------------- */

const Chips = () => {
  const [values, setValues] = useState<FilterValues>({
    status: ["live", "draft"],
    price: [200, null],
  })
  const active = KIOSK_FIELDS.filter((field) => isFilterSet(values[field.id]))

  return (
    <div className="flex w-full flex-col gap-3">
      <FilterChips
        filters={active.map((field) => ({
          id: field.id,
          label: field.label,
          text: describeFilter(field.variant, values[field.id]),
        }))}
        onClear={(id) => setValues(({ [id]: _dropped, ...rest }) => rest)}
        onClearAll={() => setValues({})}
        presets={[{ id: "open", label: "Everything live" }]}
        onApplyPreset={() => setValues({ status: ["live"] })}
      />
      <Note intent="info">
        The strip the sheet leaves on the page. <code>describeFilter</code> is
        what turns a value into words, and the variant decides which words: two
        selected enum values and a two-ended range are both arrays of length two,
        so reading one as the other is how a chip ends up saying
        &ldquo;Paid&nbsp;–&nbsp;Pending&rdquo;.
      </Note>
    </div>
  )
}

export const filterBarExamples: ComponentExample[] = [
  {
    title: "A list with filters",
    description:
      "One pill per field above a card grid, with faceted counts and a search box in the bar's own start slot.",
    render: () => <Bar />,
  },
  {
    title: "Collapsed to a sheet",
    description:
      "The same component below md, or forced with layout=\"sheet\": one counted button, a drawer, and chips for what is active.",
    render: () => <AsSheet />,
  },
  {
    title: "The panel, and when it commits",
    description: "FilterPanel on its own, in both of its commit modes.",
    render: () => <Panels />,
  },
  {
    title: "Active-filter chips",
    description: "FilterChips and describeFilter, without a bar around them.",
    render: () => <Chips />,
  },
]
