/**
 * A counted facet keeps its domain.
 *
 * The list of choices under an enum filter and the numbers beside them are two
 * different questions — what the data can offer, and what the *other* filters
 * leave of it. `facetedOptions` is where they are put back together, and these
 * are the cases that decide whether a choice you cannot currently make is a
 * disabled row or a missing one. `tests/components/data-table-facets.test.tsx`
 * covers the same argument through a rendered DataTable.
 */
import { describe, expect, test } from "bun:test"
import { facetedOptions } from "../src/lib/data-table"

describe("a counted facet", () => {
  test("a value another filter has zeroed is listed at zero, not dropped", () => {
    // The domain is every status in the data; the counts are what the Room
    // filter leaves. Before this, the list *was* the counts, so draft and
    // offline had no row at all and could not be switched to.
    expect(
      facetedOptions({
        domain: ["live", "draft", "offline"],
        counts: new Map([["live", 2]]),
      }),
    ).toEqual([
      { value: "draft", count: 0 },
      { value: "live", count: 2 },
      { value: "offline", count: 0 },
    ])
  })

  test("a zero keeps its place, so the list does not rearrange under the cursor", () => {
    const domain = ["live", "draft", "offline"]
    const all = facetedOptions({ domain, counts: new Map([["live", 2], ["draft", 1], ["offline", 1]]) })
    const narrowed = facetedOptions({ domain, counts: new Map([["live", 2]]) })
    expect(narrowed.map((option) => option.value)).toEqual(all.map((option) => option.value))
  })

  test("declared options keep the caller's order and take the faceted counts", () => {
    expect(
      facetedOptions({
        declared: [{ value: "live", label: "Live" }, { value: "draft", label: "Draft" }],
        counts: new Map([["live", 2]]),
      }),
    ).toEqual([
      { value: "live", label: "Live", count: 2 },
      { value: "draft", label: "Draft", count: 0 },
    ])
  })

  test("a declared list is the domain — the counts fill it in, they do not extend it", () => {
    expect(
      facetedOptions({
        declared: [{ value: "live" }],
        counts: new Map([["live", 2], ["retired", 1]]),
      }).map((option) => option.value),
    ).toEqual(["live"])
  })

  test("counts that name nothing on the list are not this list's counts", () => {
    // A column with a `filterFn` of its own can declare options that are not
    // the cell values. Reading those counts as absence would disable every
    // choice the column has, so they are left off instead.
    const options = facetedOptions({
      declared: [{ value: "under 100" }, { value: "over 100" }],
      counts: new Map([[42, 3], [128, 1]]),
    })
    expect(options.every((option) => option.count === undefined)).toBe(true)
  })

  test("an empty count map is not a mismatch — it means nothing is left", () => {
    expect(
      facetedOptions({ declared: [{ value: "live" }], counts: new Map() }),
    ).toEqual([{ value: "live", count: 0 }])
  })

  test("a selected value nothing matches is listed, or it could not be removed", () => {
    expect(
      facetedOptions({
        domain: ["live"],
        counts: new Map([["live", 2]]),
        selected: ["archived"],
      }),
    ).toEqual([
      { value: "live", count: 2 },
      { value: "archived", count: 0 },
    ])
  })

  test("nobody counted means no count is invented", () => {
    // A zero would render every option disabled; an absent count renders none.
    expect(facetedOptions({ declared: [{ value: "live", count: 7 }, { value: "draft" }] })).toEqual([
      { value: "live", count: 7 },
      { value: "draft", count: undefined },
    ])
  })
})
