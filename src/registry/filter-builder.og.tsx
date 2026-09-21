import { FilterBuilder } from "@/components/filter-builder"
import type { FilterField } from "@/lib/data-table"
import type { OgScene } from "./types"

const fields: FilterField[] = [
  { id: "status", label: "Status", variant: "enum" },
  { id: "price", label: "Price", variant: "number", bounds: [129, 399] },
]

/**
 * One row, negated — which is the whole component in one picture: `Where Status
 * is not live` is the sentence no other filter surface in this library can
 * write. Two rows and the `and` between them said more, and did not fit: the
 * builder is a stack of full-width rows, so a second one is another 100px of
 * height in a stage that has 380 of it, and the picture was losing the `Where`
 * off the top and the result count off the bottom. No overlay is opened either;
 * a value popover covers whatever is under it.
 */
export const filterBuilderOgScene: OgScene = {
  scale: 1.6,
  render: () => (
    <FilterBuilder
      fields={fields}
      conditions={[{ id: "c1", fieldId: "status", operator: "isNot", value: ["live"] }]}
      onChange={() => {}}
      resultCount={4}
      className="w-160"
    />
  ),
}
