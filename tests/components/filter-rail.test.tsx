/**
 * The rail, which is the filter model with nothing hidden.
 *
 * Every assertion here is about something that still *looks* like a faceted
 * rail when it is broken: a count computed against the wrong rows is still a
 * number, an option that drops out at zero still leaves a list, a group whose
 * Clear takes the whole rail with it still clears, and a "Show 4 more" that
 * hides a ticked option still shows four more.
 */
import { describe, expect, test } from "bun:test"
import { act, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { FilterRail, FilterRailSummary } from "../../src/components/filter-rail"
import type { FilterField, FilterValues } from "../../src/lib/data-table"
import { facetCounts, filterRows } from "../../src/lib/data-table"

interface Part {
  id: string
  name: string
  category: string
  maker: string
  price: number
  added: string
  inStock: boolean
}

const PARTS: Part[] = [
  { id: "p1", name: "Aperture 55", category: "display", maker: "Aperture", price: 2490, added: "2026-09-12", inStock: true },
  { id: "p2", name: "Northlight 32", category: "display", maker: "Northlight", price: 690, added: "2026-08-21", inStock: false },
  { id: "p3", name: "Tilt Mount", category: "mount", maker: "Ironpost", price: 129, added: "2026-09-18", inStock: true },
  { id: "p4", name: "Flush Mount", category: "mount", maker: "Ironpost", price: 89, added: "2026-08-04", inStock: true },
  { id: "p5", name: "Pulse Player", category: "player", maker: "Pulse", price: 549, added: "2026-09-15", inStock: true },
  { id: "p6", name: "Fibre HDMI", category: "cable", maker: "Aperture", price: 249, added: "2026-05-19", inStock: false },
]

const FIELDS: FilterField[] = [
  {
    id: "category",
    label: "Category",
    variant: "enum",
    options: [
      { value: "display", label: "Displays" },
      { value: "mount", label: "Mounts" },
      { value: "player", label: "Players" },
      { value: "cable", label: "Cables" },
    ],
  },
  { id: "maker", label: "Maker", variant: "enum" },
  { id: "price", label: "Price", variant: "number", bounds: [89, 2490], step: 1 },
  { id: "added", label: "Added", variant: "date" },
  { id: "inStock", label: "In stock", variant: "boolean" },
  { id: "name", label: "Name", variant: "text" },
]

function Harness({
  initial = {},
  optionLimit,
  withSummary = false,
}: {
  initial?: FilterValues
  optionLimit?: number
  withSummary?: boolean
}) {
  const [values, setValues] = useState<FilterValues>(initial)
  const rows = filterRows(PARTS, FIELDS, values)
  const fields = FIELDS.map((field) =>
    field.variant === "enum"
      ? { ...field, options: facetCounts(PARTS, FIELDS, field.id, values) }
      : field,
  )
  return (
    <>
      <FilterRail
        fields={fields}
        values={values}
        onChange={setValues}
        optionLimit={optionLimit}
      />
      {withSummary && (
        <div data-testid="summary">
        <FilterRailSummary
          fields={fields}
          values={values}
          onChange={setValues}
          resultCount={rows.length}
          totalCount={PARTS.length}
        />
        </div>
      )}
      <output data-testid="rows">{rows.map((row) => row.name).join(", ")}</output>
    </>
  )
}

const rows = () => screen.getByTestId("rows").textContent
const group = (name: string) => screen.getByRole("group", { name })

describe("the counted facets", () => {
  test("a declared option list keeps its labels and its order through facetCounts", () => {
    const counted = facetCounts(PARTS, FIELDS, "category", {})
    expect(counted.map((option) => option.label)).toEqual([
      "Displays",
      "Mounts",
      "Players",
      "Cables",
    ])
    expect(counted.map((option) => option.count)).toEqual([2, 2, 1, 1])
  })

  test("a count ignores its own group and respects the others", () => {
    // Ticking one category must not zero the rest of the category list — the
    // number has to read "and this many would be left", which is the only thing
    // it is useful for.
    const counted = facetCounts(PARTS, FIELDS, "category", { category: ["display"] })
    expect(counted.find((option) => option.value === "mount")?.count).toBe(2)
    // Another group does narrow it: only Ironpost's two mounts survive.
    const byMaker = facetCounts(PARTS, FIELDS, "category", { maker: ["Ironpost"] })
    expect(byMaker.find((option) => option.value === "mount")?.count).toBe(2)
    expect(byMaker.find((option) => option.value === "display")?.count).toBe(0)
  })

  test("every option shows its count, and a zeroed one is listed and disabled", () => {
    render(<Harness initial={{ maker: ["Ironpost"] }} />)
    const category = group("Category")
    // The four declared categories are all still on screen. Three of them have
    // nothing under Ironpost and say so, rather than vanishing and pulling the
    // rows up under the cursor.
    expect(within(category).getByRole("checkbox", { name: /Displays/ })).toBeDisabled()
    expect(within(category).getByRole("checkbox", { name: /Mounts/ })).toBeEnabled()
    expect(within(category).getByRole("checkbox", { name: /Displays 0/ })).toBeInTheDocument()
    expect(within(category).getByRole("checkbox", { name: /Mounts 2/ })).toBeInTheDocument()
  })

  test("an applied option stays checkable at zero — it is the only way off", async () => {
    const user = userEvent.setup()
    render(<Harness initial={{ category: ["cable"], maker: ["Ironpost"] }} />)
    // Cables under Ironpost is nothing at all, but Cables is what is applied.
    const cables = within(group("Category")).getByRole("checkbox", { name: /Cables/ })
    expect(cables).toBeEnabled()
    expect(cables).toBeChecked()
    await user.click(cables)
    expect(rows()).toBe("Tilt Mount, Flush Mount")
  })
})

describe("applying", () => {
  test("a tick applies immediately — there is no Apply button", async () => {
    const user = userEvent.setup()
    render(<Harness />)
    expect(screen.queryByRole("button", { name: "Apply" })).toBeNull()
    await user.click(within(group("Category")).getByRole("checkbox", { name: /Mounts/ }))
    expect(rows()).toBe("Tilt Mount, Flush Mount")
  })

  test("a group's Clear clears that group and leaves the others", async () => {
    const user = userEvent.setup()
    render(<Harness initial={{ category: ["mount"], inStock: "false" }} />)
    expect(rows()).toBe("")
    const clears = screen.getAllByRole("button", { name: "Clear" })
    // One per set group, and no more: an untouched facet has nothing to clear.
    expect(clears).toHaveLength(2)
    await user.click(clears[0])
    expect(rows()).toBe("Northlight 32, Fibre HDMI")
  })

  test("Clear all empties the rail, and only appears when there is something to empty", async () => {
    const user = userEvent.setup()
    render(<Harness />)
    expect(screen.queryByRole("button", { name: /Clear all/ })).toBeNull()
    await user.click(within(group("Category")).getByRole("checkbox", { name: /Players/ }))
    await user.click(screen.getByRole("button", { name: /Clear all/ }))
    expect(rows()).toBe("Aperture 55, Northlight 32, Tilt Mount, Flush Mount, Pulse Player, Fibre HDMI")
    expect(screen.queryByRole("button", { name: /Clear all/ })).toBeNull()
  })

  test("the boolean facet is three radios, and Any is not a filter", async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const stock = screen.getByRole("radiogroup", { name: /In stock/ })
    await user.click(within(stock).getByRole("radio", { name: "No" }))
    expect(rows()).toBe("Northlight 32, Fibre HDMI")
    // Back to Any: the field comes out of the values rather than applying "".
    await user.click(within(stock).getByRole("radio", { name: "Any" }))
    expect(rows()).toBe("Aperture 55, Northlight 32, Tilt Mount, Flush Mount, Pulse Player, Fibre HDMI")
    expect(screen.queryByRole("button", { name: /Clear all/ })).toBeNull()
  })

  test("the text facet filters as it is typed, with nothing to press", async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.type(screen.getByRole("searchbox", { name: /Name/ }), "mount")
    expect(rows()).toBe("Tilt Mount, Flush Mount")
  })

  test("the bounded number facet is a slider, and both thumbs home is not a filter", async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const [from] = screen.getAllByRole("slider")
    await act(async () => from.focus())
    // One step off the lower bound (89 → 90) drops the €89 mount and nothing
    // else, and the rail now has something to clear.
    await user.keyboard("{ArrowRight}")
    expect(rows()).toBe("Aperture 55, Northlight 32, Tilt Mount, Pulse Player, Fibre HDMI")
    expect(screen.getByRole("button", { name: /Clear all/ })).toBeInTheDocument()
    await user.keyboard("{ArrowLeft}")
    expect(rows()).toBe("Aperture 55, Northlight 32, Tilt Mount, Flush Mount, Pulse Player, Fibre HDMI")
    expect(screen.queryByRole("button", { name: /Clear all/ })).toBeNull()
  })
})

describe("a long facet", () => {
  test("Show more reveals the rest, and a ticked option is never behind it", async () => {
    const user = userEvent.setup()
    // A limit of two hides Players and Cables — but "cable" is applied, so it
    // has to be listed anyway.
    render(<Harness optionLimit={2} initial={{ category: ["cable"] }} />)
    const category = group("Category")
    expect(within(category).getByRole("checkbox", { name: /Cables/ })).toBeChecked()
    expect(within(category).queryByRole("checkbox", { name: /Players/ })).toBeNull()
    await user.click(screen.getByRole("button", { name: /Show 1 more/ }))
    expect(within(category).getByRole("checkbox", { name: /Players/ })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Show fewer" }))
    expect(within(category).queryByRole("checkbox", { name: /Players/ })).toBeNull()
  })
})

describe("the date pair", () => {
  test("an inverted range is refused and said out loud, not applied as an empty result", async () => {
    const user = userEvent.setup()
    render(<Harness initial={{ added: ["2026-09-01", null] }} />)
    expect(rows()).toBe("Aperture 55, Tilt Mount, Pulse Player")
    const to = screen.getByRole("group", { name: /Added to/ })
    // Type a day before the start into the "to" field's year segment.
    const segments = within(to).getAllByRole("spinbutton")
    await user.click(segments[0])
    await user.keyboard("01012026")
    expect(await screen.findByText(/end date must not be before/i)).toBeInTheDocument()
    // The rows are the ones the *valid* filter selected — nothing was applied.
    expect(rows()).toBe("Aperture 55, Tilt Mount, Pulse Player")
  })
})

describe("the summary", () => {
  test("names every active filter beside the results, and takes one off", async () => {
    const user = userEvent.setup()
    render(<Harness withSummary initial={{ category: ["mount"], maker: ["Ironpost"] }} />)
    const summary = within(screen.getByTestId("summary"))
    expect(summary.getByText(/Category/)).toBeInTheDocument()
    expect(summary.getByText(/Maker/)).toBeInTheDocument()
    expect(screen.getByTestId("summary").textContent).toContain("2 of 6")
    await user.click(summary.getByRole("button", { name: "Clear Maker filter" }))
    expect(rows()).toBe("Tilt Mount, Flush Mount")
  })
})
