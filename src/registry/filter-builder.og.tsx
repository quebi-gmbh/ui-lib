import { FilterBuilder } from "@/components/filter-builder"
import type { FilterField } from "@/lib/data-table"
import type { OgScene } from "./types"

const fields: FilterField[] = [
  { id: "status", label: "Status", variant: "enum" },
  { id: "room", label: "Room", variant: "enum" },
  { id: "price", label: "Price", variant: "number", bounds: [129, 399] },
]

/**
 * Two rows, the second of them negated — which is the whole component in one
 * picture: `Where Status is not live` is the sentence no other filter surface
 * in this library can write, and the second row is the `and` that makes the
 * list a query. No overlay is opened; a value popover would cover the row below
 * it, which is the thing the two rows are here to show.
 */
export const filterBuilderOgScene: OgScene = {
  scale: 1.6,
  render: () => (
    <FilterBuilder
      fields={fields}
      conditions={[
        { id: "c1", fieldId: "status", operator: "isNot", value: ["live"] },
        { id: "c2", fieldId: "price", operator: "between", value: [150, 350] },
      ]}
      onChange={() => {}}
      resultCount={4}
      className="w-160"
    />
  ),
}
