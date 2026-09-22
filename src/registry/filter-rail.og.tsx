import { FilterRail, FilterRailLayout } from "@/components/filter-rail"
import type { FilterField } from "@/lib/data-table"
import type { OgScene } from "./types"

const fields: FilterField[] = [
  {
    id: "category",
    label: "Category",
    variant: "enum",
    options: [
      { value: "Displays", count: 5 },
      { value: "Sensors", count: 0 },
    ],
  },
]

const parts = [
  { name: 'Aperture 55" 4K', price: "€2,490" },
  { name: "Tilt Mount 400", price: "€129" },
]

/**
 * The rail beside what it filters, with one facet ticked and one option sitting
 * at a disabled zero — which is the whole idea in one picture: every choice and
 * its count readable without opening anything, including the choice that would
 * leave nothing.
 *
 * One facet and two options. The rail with a price slider under the category
 * facet is taller than the stage on its own, and the four product cards that
 * used to stand in for the results were eight lines of 10px type, half of them
 * sliced by the edge of the stage. Two lines of plain text say the same thing —
 * "these are the rows the rail is filtering" — in a fifth of the height, which
 * is what leaves room for the rail itself to be readable.
 *
 * The prices are literal strings rather than `FormattedNumber`, because the
 * scene is a photograph: a number that formats per locale would publish a
 * different image depending on where the screenshot ran.
 *
 * The results sit **beside** the rail, which they could not do when this scene
 * was written: `FilterRailLayout` named its own container and then asked that
 * container for `flex-row`, and a container query is never answered by the
 * element declaring it, so the layout was a column at every width (task #206).
 * The scene was composed around that and said so here. With the container moved
 * onto a wrapper the side-by-side shape renders, and it is the one worth
 * photographing — a rail is *for* standing next to what it filters, and a
 * stacked scene is a picture of the fallback.
 *
 * Hence `w-192`. The stage is 1200×630 at `scale: 1.5`, so a scene has 800px of
 * width to spend and the layout's own threshold is 48rem — 768px, which fits
 * with room for the 8px stage margin and little else. The scale cannot come
 * down to buy more: the facet headings are `text-xs`, and 12px × 1.5 is exactly
 * the 18px type floor this scene is measured against.
 */
export const filterRailOgScene: OgScene = {
  scale: 1.5,
  render: () => (
    <FilterRailLayout
      className="w-192"
      rail={
        <FilterRail
          aria-label="Filters"
          fields={fields}
          values={{ category: ["Displays"] }}
          onChange={() => {}}
        />
      }
    >
      <div className="flex flex-col gap-2">
        {parts.map((part) => (
          <div key={part.name} className="flex items-center justify-between gap-3">
            <span className="font-medium text-quebi-fg text-sm">{part.name}</span>
            <span className="text-quebi-fg-muted text-sm tabular-nums">{part.price}</span>
          </div>
        ))}
      </div>
    </FilterRailLayout>
  ),
}
