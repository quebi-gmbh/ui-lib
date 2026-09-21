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
 * The results sit under the rail rather than beside it because that is what the
 * component does at any width: `FilterRailLayout` names its own container and
 * then asks that container for `flex-row`, which a container query never
 * answers for the element declaring it. Filed as its own task — a scene is a
 * photograph of the component, not a place to work around it.
 */
export const filterRailOgScene: OgScene = {
  scale: 1.5,
  render: () => (
    <FilterRailLayout
      className="w-176"
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
