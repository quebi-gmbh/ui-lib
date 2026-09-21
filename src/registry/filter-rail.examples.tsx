import { useState } from "react"
import { Badge } from "@/components/badge"
import { Card, CardContent } from "@/components/card"
import { FilterRail, FilterRailLayout, FilterRailSummary } from "@/components/filter-rail"
import { FormattedNumber } from "@/components/formatted-number"
import { Note } from "@/components/note"
import { SearchField, SearchInput } from "@/components/search-field"
import { Text } from "@/components/text"
import type { FilterField, FilterValues } from "@/lib/data-table"
import { facetCounts, filterRows } from "@/lib/data-table"
import type { ComponentExample } from "./types"

/**
 * A catalogue, which is the point: a rail is for browsing, not for narrowing a
 * list you already know the shape of. Twenty-four parts across six categories
 * and five makers, so the counts move, the zeroes appear, and one facet is long
 * enough to need "Show 2 more".
 */

interface Part {
  id: string
  name: string
  category: string
  maker: string
  price: number
  added: string
  inStock: boolean
}

/** Deterministic, so the prerendered HTML and the hydrated page agree. */
const PARTS: Part[] = [
  { id: "p1", name: "Aperture 55\" 4K", category: "display", maker: "Aperture", price: 2490, added: "2026-09-12", inStock: true },
  { id: "p2", name: "Aperture 43\" 4K", category: "display", maker: "Aperture", price: 1490, added: "2026-09-02", inStock: true },
  { id: "p3", name: "Northlight 32\" HD", category: "display", maker: "Northlight", price: 690, added: "2026-08-21", inStock: false },
  { id: "p4", name: "Northlight 65\" 4K", category: "display", maker: "Northlight", price: 2190, added: "2026-07-30", inStock: true },
  { id: "p5", name: "Beacon Slim 27\"", category: "display", maker: "Beacon", price: 540, added: "2026-06-11", inStock: true },
  { id: "p6", name: "Tilt Mount 400", category: "mount", maker: "Ironpost", price: 129, added: "2026-09-18", inStock: true },
  { id: "p7", name: "Flush Mount 200", category: "mount", maker: "Ironpost", price: 89, added: "2026-08-04", inStock: true },
  { id: "p8", name: "Floor Stand Duo", category: "mount", maker: "Ironpost", price: 449, added: "2026-05-27", inStock: false },
  { id: "p9", name: "Ceiling Drop 1m", category: "mount", maker: "Beacon", price: 199, added: "2026-09-08", inStock: true },
  { id: "p10", name: "Pulse Player S", category: "player", maker: "Pulse", price: 319, added: "2026-09-20", inStock: true },
  { id: "p11", name: "Pulse Player M", category: "player", maker: "Pulse", price: 549, added: "2026-09-15", inStock: true },
  { id: "p12", name: "Pulse Player L", category: "player", maker: "Pulse", price: 890, added: "2026-08-30", inStock: false },
  { id: "p13", name: "Beacon Stick", category: "player", maker: "Beacon", price: 149, added: "2026-07-12", inStock: true },
  { id: "p14", name: "Motion Sensor A2", category: "sensor", maker: "Pulse", price: 79, added: "2026-09-04", inStock: true },
  { id: "p15", name: "People Counter X", category: "sensor", maker: "Northlight", price: 390, added: "2026-08-14", inStock: true },
  { id: "p16", name: "Ambient Light Cell", category: "sensor", maker: "Pulse", price: 39, added: "2026-06-25", inStock: true },
  { id: "p17", name: "HDMI 2.1 · 3m", category: "cable", maker: "Ironpost", price: 39, added: "2026-09-16", inStock: true },
  { id: "p18", name: "HDMI 2.1 · 10m", category: "cable", maker: "Ironpost", price: 69, added: "2026-08-09", inStock: true },
  { id: "p19", name: "USB-C Power 5m", category: "cable", maker: "Beacon", price: 49, added: "2026-07-03", inStock: true },
  { id: "p20", name: "Fibre HDMI 25m", category: "cable", maker: "Aperture", price: 249, added: "2026-05-19", inStock: false },
  { id: "p21", name: "Outdoor Case 43\"", category: "enclosure", maker: "Ironpost", price: 1890, added: "2026-09-10", inStock: true },
  { id: "p22", name: "Lobby Kiosk Shell", category: "enclosure", maker: "Beacon", price: 1290, added: "2026-08-25", inStock: true },
  { id: "p23", name: "Wall Recess Kit", category: "enclosure", maker: "Northlight", price: 340, added: "2026-06-30", inStock: true },
  { id: "p24", name: "Vandal Shield 32\"", category: "enclosure", maker: "Aperture", price: 760, added: "2026-04-16", inStock: false },
]

/**
 * `category` declares its options; the rest are read off the rows.
 *
 * A declared list is what carries the labels ("display" shown as "Displays")
 * and the order — most-stocked first here, not alphabetical — and `facetCounts`
 * writes the counts onto it rather than replacing it.
 */
const PART_FIELDS: FilterField[] = [
  {
    id: "category",
    label: "Category",
    variant: "enum",
    options: [
      { value: "display", label: "Displays" },
      { value: "mount", label: "Mounts" },
      { value: "player", label: "Players" },
      { value: "sensor", label: "Sensors" },
      { value: "cable", label: "Cables" },
      { value: "enclosure", label: "Enclosures" },
    ],
  },
  { id: "maker", label: "Maker", variant: "enum" },
  { id: "price", label: "Price", variant: "number", bounds: [39, 2490], step: 10 },
  { id: "added", label: "Added", variant: "date" },
  { id: "inStock", label: "In stock", variant: "boolean" },
]

/**
 * The two lines filtering a catalogue actually is.
 *
 * `filterRows` runs every field's filter over the array; `facetCounts` counts
 * one field's choices against the rows the *other* fields leave — so "Mounts 4"
 * means "and four would be left", not "four of what you can already see". That
 * is the whole promise the rail makes, and it is one function call.
 */
function useCatalogue(initial: FilterValues = {}) {
  const [values, setValues] = useState<FilterValues>(initial)
  const rows = filterRows(PARTS, PART_FIELDS, values)
  const fields = PART_FIELDS.map((field) =>
    field.variant === "enum"
      ? { ...field, options: facetCounts(PARTS, PART_FIELDS, field.id, values) }
      : field,
  )
  return { values, setValues, rows, fields }
}

const CATEGORY_LABELS: Record<string, string> = {
  display: "Displays",
  mount: "Mounts",
  player: "Players",
  sensor: "Sensors",
  cable: "Cables",
  enclosure: "Enclosures",
}

/**
 * The grid the rail exists for, and the one thing about it that matters: the
 * column counts are `@`-variants, so they are asked of the results column
 * `FilterRailLayout` makes a container. A `sm:grid-cols-4` here would be four
 * columns of the *viewport* — which is the same width whether the rail is
 * taking 224px of it or not.
 */
function Results({ rows }: { rows: Part[] }) {
  return (
    <div className="grid gap-3 @sm:grid-cols-2 @2xl:grid-cols-3 @4xl:grid-cols-4">
      {rows.map((row) => (
        <Card key={row.id}>
          <CardContent className="flex flex-col items-start gap-1.5 p-3">
            <span className="font-medium text-quebi-fg text-sm">{row.name}</span>
            <span className="text-quebi-fg-subtle text-xs">
              {CATEGORY_LABELS[row.category]} · {row.maker}
            </span>
            <span className="font-medium text-quebi-fg text-sm tabular-nums">
              <FormattedNumber
                value={row.price}
                options={{ style: "currency", currency: "EUR", maximumFractionDigits: 0 }}
              />
            </span>
            <Badge intent={row.inStock ? "success" : "neutral"}>
              {row.inStock ? "in stock" : "backorder"}
            </Badge>
          </CardContent>
        </Card>
      ))}
      {rows.length === 0 && (
        <Text className="col-span-full py-8 text-center text-quebi-fg-subtle text-sm">
          Nothing matches these filters.
        </Text>
      )}
    </div>
  )
}

function Catalogue({ initial = {} }: { initial?: FilterValues }) {
  const { values, setValues, rows, fields } = useCatalogue(initial)
  return (
    <FilterRailLayout
      rail={
        <FilterRail aria-label="Filters" fields={fields} values={values} onChange={setValues}>
          <SearchField aria-label="Search the catalogue">
            <SearchInput size="xs" placeholder="Search parts…" />
          </SearchField>
        </FilterRail>
      }
    >
      <FilterRailSummary
        fields={fields}
        values={values}
        onChange={setValues}
        resultCount={rows.length}
        totalCount={PARTS.length}
      />
      <Results rows={rows} />
    </FilterRailLayout>
  )
}

export const filterRailExamples: ComponentExample[] = [
  {
    title: "Browse",
    description:
      "Every facet and every count on screen at once, applying as you change them. The counts ignore the selection in their own group and respect every other one, so a number reads as \"and this many would be left\" — tick two rooms and a third still says what adding it would give you.",
    render: () => <Catalogue />,
  },
  {
    title: "A zero is a row, not an absence",
    description:
      "Filtered to cables under €100, which leaves four of the six categories with nothing. They stay listed at 0 and disabled, so you can see that the choice exists and that taking it would empty the result — and the list stops rearranging itself under the cursor. A value you have already applied stays checkable whatever its count, because this is the only place it comes off again.",
    render: () => <Catalogue initial={{ category: ["cable"], price: [39, 99] }} />,
  },
  {
    title: "Narrow — the same component, two queries",
    description:
      "The same surface in a 32rem box. Nothing here is keyed to the viewport: the layout asks itself whether there is room for a sidebar beside a grid and stacks because there is not, the rail asks its own width and lays its facets out in one column or two, and the card grid asks the results column. At a 700px viewport a fixed rail beside a sm:grid-cols-4 grid gives 67px cards — this is the same page, sized by the boxes that actually exist.",
    render: () => (
      <div className="flex w-full flex-col gap-4">
        <Note intent="info">
          Drag the gallery narrower and nothing jumps: every breakpoint on this surface is a
          container query.
        </Note>
        <div className="w-full max-w-lg self-center rounded-quebi-md border border-quebi-line/10 p-4">
          <Catalogue initial={{ maker: ["Pulse"] }} />
        </div>
      </div>
    ),
  },
]
