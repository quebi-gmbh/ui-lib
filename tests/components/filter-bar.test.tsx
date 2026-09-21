/**
 * The filter model, away from the table.
 *
 * Three groups of assertions, each covering something that breaks silently:
 *
 * - the **model** (`filterRows`, `facetCounts`, `isFilterSet`), where a facet
 *   counted against the wrong rows still returns numbers and an option that
 *   drops out of the list still renders a list;
 * - the **bar**, where a pill that does not close its popover on Apply, or does
 *   not state its own value, still looks like a filter bar;
 * - the **panel's two commit modes**, where a live panel that quietly applies an
 *   inverted range produces an empty result rather than an error, and a submit
 *   panel that applies on every keystroke produces a round-trip per character.
 */
import { describe, expect, test } from "bun:test"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { FilterBar, FilterPanel } from "../../src/components/filter-bar"
import type { FilterField, FilterValues } from "../../src/lib/data-table"
import { facetCounts, filterRows, isFilterSet } from "../../src/lib/data-table"

interface Kiosk {
  id: string
  title: string
  status: string
  room: string
  price: number
}

const KIOSKS: Kiosk[] = [
  { id: "k1", title: "Atrium North", status: "live", room: "Atrium", price: 249 },
  { id: "k2", title: "Atrium South", status: "live", room: "Atrium", price: 249 },
  { id: "k3", title: "Lobby Desk", status: "draft", room: "Lobby", price: 189 },
  { id: "k4", title: "Garage Exit", status: "offline", room: "Garage", price: 129 },
]

const FIELDS: FilterField[] = [
  { id: "status", label: "Status", variant: "enum" },
  { id: "room", label: "Room", variant: "enum" },
  { id: "price", label: "Price", variant: "number" },
  { id: "title", label: "Name", variant: "text" },
]

const withFacets = (values: FilterValues): FilterField[] =>
  FIELDS.map((field) =>
    field.variant === "enum"
      ? { ...field, options: facetCounts(KIOSKS, FIELDS, field.id, values) }
      : field,
  )

function Harness({
  layout = "bar",
  initial = {},
  ...rest
}: { layout?: "bar" | "sheet"; initial?: FilterValues } & Partial<
  Pick<React.ComponentProps<typeof FilterBar>, "inlineLimit">
>) {
  const [values, setValues] = useState<FilterValues>(initial)
  const rows = filterRows(KIOSKS, FIELDS, values)
  return (
    <>
      <FilterBar
        {...rest}
        aria-label="Filter kiosks"
        layout={layout}
        fields={withFacets(values)}
        values={values}
        onChange={setValues}
        resultCount={rows.length}
      />
      <output data-testid="rows">{rows.map((row) => row.title).join(", ")}</output>
    </>
  )
}

describe("the filter model", () => {
  test("isFilterSet is false for every shape of empty", () => {
    expect(isFilterSet(undefined)).toBe(false)
    expect(isFilterSet("")).toBe(false)
    expect(isFilterSet([])).toBe(false)
    expect(isFilterSet([null, null])).toBe(false)
    expect(isFilterSet([null, 50])).toBe(true)
    expect(isFilterSet(["live"])).toBe(true)
    expect(isFilterSet("false")).toBe(true)
  })

  test("filterRows applies every field, and an unset field narrows nothing", () => {
    expect(filterRows(KIOSKS, FIELDS, {})).toHaveLength(4)
    expect(filterRows(KIOSKS, FIELDS, { status: ["live"] }).map((k) => k.id)).toEqual(["k1", "k2"])
    expect(filterRows(KIOSKS, FIELDS, { status: ["live"], price: [null, 200] })).toHaveLength(0)
    expect(filterRows(KIOSKS, FIELDS, { title: "atrium" })).toHaveLength(2)
  })

  test("a facet counts against the other filters, not against the result", () => {
    // Room, with Status narrowed to live: Atrium keeps both of its rows even
    // though Room itself is what the count is for.
    const rooms = facetCounts(KIOSKS, FIELDS, "room", { status: ["live"] })
    expect(rooms.find((option) => option.value === "Atrium")?.count).toBe(2)
  })

  test("an option the other filters have emptied stays in the list, at zero", () => {
    const rooms = facetCounts(KIOSKS, FIELDS, "room", { status: ["live"] })
    // Lobby and Garage hold no live kiosk. A vanished option is a choice you
    // cannot see and cannot switch to; a zero is a choice you can still make.
    expect(rooms.map((option) => option.value)).toEqual(["Atrium", "Garage", "Lobby"])
    expect(rooms.find((option) => option.value === "Lobby")?.count).toBe(0)
  })

  test("a selected value nothing matches is still listed, so it can be taken off", () => {
    // Nothing is in the Cellar. Applied anyway, it has to appear in the only
    // panel that could unapply it — `facetedOptions` is what guarantees that,
    // and this is the assertion that the list half really goes through it.
    const rooms = facetCounts(KIOSKS, FIELDS, "room", { room: ["Cellar"] })
    expect(rooms.find((option) => option.value === "Cellar")).toEqual({
      value: "Cellar",
      count: 0,
    })
  })
})

describe("FilterBar, as a bar", () => {
  test("an inactive pill names its field; an active one states its value", () => {
    render(<Harness initial={{ status: ["live"] }} />)

    expect(screen.getByRole("button", { name: "Status: live" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Room" })).toBeInTheDocument()
  })

  test("Apply filters the rows and closes the popover it was pressed in", async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole("button", { name: "Status" }))
    const panel = await screen.findByRole("dialog")
    await user.click(within(panel).getByRole("checkbox", { name: /live/ }))
    await user.click(within(panel).getByRole("button", { name: "Apply" }))

    // The panel is gone — a filter popover left open sits over the results it
    // just produced, with the page scroll-locked behind it.
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(screen.getByTestId("rows")).toHaveTextContent("Atrium North, Atrium South")
    expect(screen.getByRole("button", { name: "Status: live" })).toBeInTheDocument()
  })

  test("+ Filter offers the fields the bar did not start with, and adds one", async () => {
    const user = userEvent.setup()
    render(<Harness inlineLimit={2} />)

    expect(screen.queryByRole("button", { name: "Price" })).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Add a filter" }))
    await user.click(await screen.findByRole("menuitem", { name: "Price" }))

    expect(await screen.findByRole("button", { name: "Price" })).toBeInTheDocument()
  })

  test("Reset appears only once something is set, and clears everything", async () => {
    const user = userEvent.setup()
    render(<Harness />)
    expect(screen.queryByRole("button", { name: "Reset" })).not.toBeInTheDocument()

    render(<Harness initial={{ status: ["live"] }} />)
    await user.click(screen.getAllByRole("button", { name: "Reset" })[0])

    expect(screen.getAllByTestId("rows")[1]).toHaveTextContent(
      "Atrium North, Atrium South, Lobby Desk, Garage Exit",
    )
  })
})

describe("FilterBar, as a sheet", () => {
  test("the trigger counts what is active and the chips say what it is", () => {
    render(<Harness layout="sheet" initial={{ status: ["live"], price: [200, null] }} />)

    expect(screen.getByRole("button", { name: "Filters (2)" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Clear Status filter" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Clear Price filter" })).toBeInTheDocument()
  })

  test("the drawer applies on change and holds one commit, not one per field", async () => {
    const user = userEvent.setup()
    render(<Harness layout="sheet" />)

    await user.click(screen.getByRole("button", { name: "Filters" }))
    const sheet = await screen.findByRole("dialog")

    // No per-field Clear/Apply pair — four of them would be four equally loud
    // primary buttons, none of which dismisses the drawer.
    expect(within(sheet).queryByRole("button", { name: "Apply" })).not.toBeInTheDocument()

    await user.click(within(sheet).getByRole("checkbox", { name: /live/ }))
    expect(screen.getByTestId("rows")).toHaveTextContent("Atrium North, Atrium South")

    // The one commit: a footer that says what it did, and dismisses.
    await user.click(within(sheet).getByRole("button", { name: /Show 2 results/ }))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })
})

describe("FilterPanel's commit modes", () => {
  test("submit reports once, on Apply, and not on the way there", async () => {
    const user = userEvent.setup()
    const applied: unknown[] = []
    render(
      <FilterPanel
        fieldId="status"
        label="Status"
        variant="enum"
        value={[]}
        options={[{ value: "live" }, { value: "draft" }]}
        onApply={(value) => applied.push(value)}
        onClear={() => {}}
      />,
    )

    await user.click(screen.getByRole("checkbox", { name: "live" }))
    await user.click(screen.getByRole("checkbox", { name: "draft" }))
    expect(applied).toHaveLength(0)

    await user.click(screen.getByRole("button", { name: "Apply" }))
    await waitFor(() => expect(applied).toEqual([["live", "draft"]]))
  })

  test("live reports every change and draws no footer", async () => {
    const user = userEvent.setup()
    const applied: unknown[] = []
    render(
      <FilterPanel
        fieldId="status"
        label="Status"
        variant="enum"
        apply="live"
        value={[]}
        options={[{ value: "live" }, { value: "draft" }]}
        onApply={(value) => applied.push(value)}
        onClear={() => {}}
      />,
    )

    expect(screen.queryByRole("button", { name: "Apply" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument()

    await user.click(screen.getByRole("checkbox", { name: "live" }))
    expect(applied).toEqual([["live"]])
    await user.click(screen.getByRole("checkbox", { name: "draft" }))
    expect(applied).toEqual([["live"], ["live", "draft"]])
  })

  test("live refuses an inverted range and says why, instead of applying it", async () => {
    const user = userEvent.setup()
    const applied: unknown[] = []
    render(
      <FilterPanel
        fieldId="price"
        label="Price"
        variant="number"
        apply="live"
        value={[null, null]}
        onApply={(value) => applied.push(value)}
        onClear={() => {}}
      />,
    )

    await user.type(screen.getByRole("textbox", { name: "To" }), "100")
    await user.tab()
    await user.type(screen.getByRole("textbox", { name: "From" }), "300")
    await user.tab()

    expect(
      await screen.findByText("The lower bound must not be above the upper one"),
    ).toBeInTheDocument()
    // Whatever was committed, it was never the inverted pair — that is a query
    // that returns nothing and reads as an empty list.
    expect(applied).not.toContainEqual([300, 100])
  })
})
