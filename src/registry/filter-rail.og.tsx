import { Badge } from "@/components/badge"
import { Card, CardContent } from "@/components/card"
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
      { value: "Mounts", count: 4 },
      { value: "Sensors", count: 0 },
    ],
  },
  { id: "price", label: "Price", variant: "number", bounds: [39, 2490], step: 10 },
]

const parts = [
  { name: "Aperture 55\" 4K", maker: "Aperture", price: "€2,490" },
  { name: "Pulse Player M", maker: "Pulse", price: "€549" },
  { name: "Tilt Mount 400", maker: "Ironpost", price: "€129" },
  { name: "Ceiling Drop 1m", maker: "Beacon", price: "€199" },
]

/**
 * The rail beside what it filters, with one facet ticked and one option sitting
 * at a disabled zero — which is the whole idea in one picture: every choice and
 * its count readable without opening anything, including the choice that would
 * leave nothing.
 *
 * The prices are literal strings rather than `FormattedNumber`, because the
 * scene is a photograph: a number that formats per locale would publish a
 * different image depending on where the screenshot ran.
 */
export const filterRailOgScene: OgScene = {
  scale: 1.15,
  render: () => (
    <FilterRailLayout
      className="w-228"
      rail={
        <FilterRail
          aria-label="Filters"
          fields={fields}
          values={{ category: ["Displays"] }}
          onChange={() => {}}
        />
      }
    >
      <div className="grid grid-cols-4 gap-3">
        {parts.map((part) => (
          <Card key={part.name}>
            <CardContent className="flex flex-col items-start gap-1.5 p-3">
              <span className="font-medium text-quebi-fg text-sm">{part.name}</span>
              <span className="text-quebi-fg-subtle text-xs">{part.maker}</span>
              <span className="font-medium text-quebi-fg text-sm tabular-nums">{part.price}</span>
              <Badge intent="success">in stock</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </FilterRailLayout>
  ),
}
