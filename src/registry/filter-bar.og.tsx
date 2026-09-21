import { FilterBar } from "@/components/filter-bar"
import type { FilterField } from "@/lib/data-table"
import type { OgScene } from "./types"

const fields: FilterField[] = [
  {
    id: "status",
    label: "Status",
    variant: "enum",
    options: [
      { value: "live", count: 4 },
      { value: "draft", count: 3 },
      { value: "offline", count: 2 },
    ],
  },
  { id: "room", label: "Room", variant: "enum" },
  { id: "price", label: "Price", variant: "number", bounds: [129, 399] },
  { id: "updated", label: "Updated", variant: "date" },
]

/**
 * The bar at rest with one field set, which is the whole idea in one row: the
 * filled pill states its own value, so the control and the summary are the same
 * object. No overlay is opened — a popover would cover the three pills that make
 * the row read as a row.
 */
export const filterBarOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <FilterBar
      aria-label="Filters"
      layout="bar"
      fields={fields}
      values={{ status: ["live"] }}
      onChange={() => {}}
      className="w-140"
    />
  ),
}
