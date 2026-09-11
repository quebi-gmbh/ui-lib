/**
 * The shared headless core, tested where it is decidable: the sorting seam,
 * the selection model, the pager's honesty when the total is unknown, and the
 * round trip through search params.
 *
 * These are the parts where the two modes are supposed to agree, so a change
 * that makes the client table right and the server one wrong shows up here
 * rather than in a rendering test for one of them.
 */
import { describe, expect, test } from "bun:test"
import type { DataTableColumn, DataTableSelection } from "../src/lib/data-table"
import {
  applySelection,
  clampPage,
  csvCell,
  editValuesFor,
  editableCells,
  emptyQuery,
  emptySelection,
  isRowSelected,
  leafColumns,
  matchesFilter,
  nextEditableCell,
  nextSorting,
  pageRange,
  queryFromSearchParams,
  queryToSearchParams,
  readView,
  writeView,
  selectedKeysFor,
  selectionCount,
  sortPriority,
  toCsv,
  toSortDescriptor,
  withTiebreak,
} from "../src/lib/data-table"

describe("the sorting seam", () => {
  test("a press cycles ascending, descending, off", () => {
    const first = nextSorting([], "amount")
    expect(first).toEqual([{ id: "amount", desc: false }])
    const second = nextSorting(first, "amount")
    expect(second).toEqual([{ id: "amount", desc: true }])
    expect(nextSorting(second, "amount")).toEqual([])
  })

  test("without shift, a different column replaces the sort", () => {
    expect(nextSorting([{ id: "amount", desc: true }], "date")).toEqual([
      { id: "date", desc: false },
    ])
  })

  test("with shift, a different column is appended and keeps its priority", () => {
    const stack = nextSorting([{ id: "amount", desc: true }], "date", { additive: true })
    expect(stack).toEqual([
      { id: "amount", desc: true },
      { id: "date", desc: false },
    ])
    expect(sortPriority(stack, "amount")).toBe(1)
    expect(sortPriority(stack, "date")).toBe(2)
    expect(sortPriority(stack, "customer")).toBeNull()
  })

  test("cycling a shifted column past descending drops it out of the stack", () => {
    let stack = [
      { id: "amount", desc: false },
      { id: "date", desc: false },
    ]
    stack = nextSorting(stack, "amount", { additive: true })
    expect(stack[0]).toEqual({ id: "amount", desc: true })
    stack = nextSorting(stack, "amount", { additive: true })
    expect(stack).toEqual([{ id: "date", desc: false }])
  })

  test("the stack is capped, oldest first out", () => {
    let stack: { id: string; desc: boolean }[] = []
    for (const id of ["a", "b", "c", "d"]) {
      stack = nextSorting(stack, id, { additive: true, maxCount: 3 })
    }
    expect(stack.map((s) => s.id)).toEqual(["b", "c", "d"])
  })

  test("react-aria is handed the primary sort only", () => {
    expect(
      toSortDescriptor([
        { id: "amount", desc: true },
        { id: "date", desc: false },
      ]),
    ).toEqual({ column: "amount", direction: "descending" })
    expect(toSortDescriptor([])).toBeUndefined()
  })

  test("a paginated sort always ends in the tiebreaker", () => {
    expect(withTiebreak([{ column: "date", direction: "desc" }], "id")).toEqual([
      { column: "date", direction: "desc" },
      // Same direction as the primary sort, so the tiebreak reads as part of it
      // rather than as a second, contradictory ordering.
      { column: "id", direction: "desc" },
    ])
    // Already total: nothing to add.
    expect(withTiebreak([{ column: "id", direction: "asc" }], "id")).toEqual([
      { column: "id", direction: "asc" },
    ])
    expect(withTiebreak([{ column: "date", direction: "asc" }], undefined)).toEqual([
      { column: "date", direction: "asc" },
    ])
  })
})

describe("the selection model", () => {
  const page1 = ["1", "2", "3"]
  const page2 = ["4", "5", "6"]

  test("a selection survives paging away and back", () => {
    let selection = applySelection(emptySelection, new Set(["1", "3"]), page1, false)
    // react-aria only knows the rows it can see, so page 2 reports a set with
    // none of page 1 in it. That must not clear page 1's selection.
    selection = applySelection(selection, new Set(["5"]), page2, false)
    expect(selection).toEqual({ mode: "include", keys: ["1", "3", "5"] })
    expect(isRowSelected(selection, "1")).toBe(true)
    expect(isRowSelected(selection, "2")).toBe(false)
  })

  test("deselecting on the current page removes only that page's keys", () => {
    let selection = applySelection(emptySelection, new Set(["1", "2"]), page1, false)
    selection = applySelection(selection, new Set(["1"]), page1, false)
    expect(selection).toEqual({ mode: "include", keys: ["1"] })
  })

  test("select-all is a mode server-side and a set client-side", () => {
    expect(applySelection(emptySelection, "all", page1, true)).toEqual({
      mode: "all-matching",
      excluded: [],
    })
    expect(applySelection(emptySelection, "all", page1, false)).toEqual({
      mode: "include",
      keys: page1,
    })
  })

  test("unchecking a row while everything matching is selected becomes an exclusion", () => {
    const all = applySelection(emptySelection, "all", page1, true)
    const minusTwo = applySelection(all, new Set(["1", "3"]), page1, true)
    expect(minusTwo).toEqual({ mode: "all-matching", excluded: ["2"] })
    expect(isRowSelected(minusTwo, "2")).toBe(false)
    expect(isRowSelected(minusTwo, "99")).toBe(true)
    // Re-checking it takes it back out of the exclusion list.
    expect(applySelection(minusTwo, new Set(page1), page1, true)).toEqual({
      mode: "all-matching",
      excluded: [],
    })
  })

  test("the count is unknown, not zero, when the total is", () => {
    const all: DataTableSelection = { mode: "all-matching", excluded: ["2"] }
    expect(selectionCount(all, 300)).toEqual({ count: 299, isAll: true })
    expect(selectionCount(all, undefined)).toEqual({ count: undefined, isAll: true })
    expect(selectionCount({ mode: "include", keys: ["1"] }, undefined)).toEqual({
      count: 1,
      isAll: false,
    })
  })

  test("react-aria is told 'all' only when nothing is excluded", () => {
    expect(selectedKeysFor({ mode: "all-matching", excluded: [] }, page1)).toBe("all")
    expect(selectedKeysFor({ mode: "all-matching", excluded: ["2"] }, page1)).toEqual(
      new Set(["1", "3"]),
    )
    expect(selectedKeysFor({ mode: "include", keys: ["1", "9"] }, page1)).toEqual(new Set(["1"]))
  })
})

describe("the pager, when the total is not free", () => {
  test("with a total it offers a page count and a last page", () => {
    const range = pageRange(1, 20, 20, 300, undefined)
    expect(range).toEqual({
      from: 21,
      to: 40,
      total: 300,
      pageCount: 15,
      hasPrevious: true,
      hasNext: true,
    })
  })

  test("without a total it degrades rather than inventing one", () => {
    const range = pageRange(1, 20, 20, undefined, true)
    expect(range.pageCount).toBeUndefined()
    expect(range.total).toBeUndefined()
    expect(range.hasNext).toBe(true)
    // A short page is the end of the result when nothing says otherwise.
    expect(pageRange(1, 20, 7, undefined, undefined).hasNext).toBe(false)
  })

  test("an empty result reports no range at all", () => {
    expect(pageRange(3, 20, 0, 0, false)).toMatchObject({ from: 0, to: 0 })
  })

  test("a narrower filter clamps the page instead of emptying the table", () => {
    expect(clampPage(19, 20, 40)).toBe(1)
    expect(clampPage(19, 20, 0)).toBe(0)
    // Unknown total: nothing to clamp against, so the page stands.
    expect(clampPage(19, 20, undefined)).toBe(19)
  })
})

describe("the shared filter predicate", () => {
  test("an unset filter matches everything", () => {
    expect(matchesFilter("x", "text", "")).toBe(true)
    expect(matchesFilter("x", "enum", [])).toBe(true)
    expect(matchesFilter("x", "text", null)).toBe(true)
  })

  test("each variant asks its own question", () => {
    expect(matchesFilter("Nova GmbH", "text", "nova")).toBe(true)
    expect(matchesFilter("Nova GmbH", "text", "apex")).toBe(false)
    expect(matchesFilter("Paid", "enum", ["Paid", "Pending"])).toBe(true)
    expect(matchesFilter("Shipped", "enum", ["Paid"])).toBe(false)
    expect(matchesFilter(true, "boolean", "true")).toBe(true)
    expect(matchesFilter(false, "boolean", "true")).toBe(false)
    expect(matchesFilter(50, "number", [10, 100])).toBe(true)
    expect(matchesFilter(50, "number", [60, null])).toBe(false)
    expect(matchesFilter(50, "number", [null, 40])).toBe(false)
    expect(matchesFilter("2026-03-04", "date", ["2026-01-01", "2026-06-01"])).toBe(true)
    expect(matchesFilter("2026-09-04", "date", ["2026-01-01", "2026-06-01"])).toBe(false)
  })
})

describe("the query as search params", () => {
  test("round-trips sort, search, page and filters", () => {
    const query = {
      ...emptyQuery,
      sort: [
        { column: "date", direction: "desc" as const },
        { column: "id", direction: "asc" as const },
      ],
      search: "nova",
      page: 2,
      pageSize: 50,
      filters: [
        { column: "status", variant: "enum" as const, value: ["Paid", "Pending"] },
        { column: "amount", variant: "number" as const, value: [10, null] },
      ],
    }
    const params = new URLSearchParams(queryToSearchParams(query))
    expect(params.get("sort")).toBe("date:desc,id:asc")
    expect(params.get("page")).toBe("3")
    expect(params.get("f.status")).toBe("Paid,Pending")

    const parsed = queryFromSearchParams(params, [
      { id: "status", variant: "enum" },
      { id: "amount", variant: "number" },
    ])
    expect(parsed.sort).toEqual(query.sort)
    expect(parsed.search).toBe("nova")
    expect(parsed.page).toBe(2)
    expect(parsed.pageSize).toBe(50)
    expect(parsed.filters).toEqual([
      { column: "status", variant: "enum", value: ["Paid", "Pending"] },
      { column: "amount", variant: "number", value: ["10", null] },
    ])
  })

  test("the default query writes nothing, so a clean URL stays clean", () => {
    expect(queryToSearchParams(emptyQuery)).toEqual({})
  })
})

describe("csv", () => {
  test("quotes exactly what RFC 4180 says to quote", () => {
    expect(csvCell("plain")).toBe("plain")
    expect(csvCell("a,b")).toBe('"a,b"')
    expect(csvCell('say "hi"')).toBe('"say ""hi"""')
    expect(csvCell("line\nbreak")).toBe('"line\nbreak"')
    expect(csvCell(null)).toBe("")
  })

  test("rows are CRLF-separated, headers first", () => {
    expect(toCsv(["a", "b"], [[1, "x,y"]])).toBe('a,b\r\n1,"x,y"')
  })
})

/**
 * The four browser-side helpers the module gained when the render layers were
 * split apart. They were in `data-table.tsx` because they happened to be
 * written there, not because they needed React — which meant a route loader
 * could not read a saved layout without importing a 2,400-line component. They
 * are tested here, with the rest of the headless core, for the same reason they
 * live here.
 */
describe("the saved view", () => {
  test("round-trips through localStorage", () => {
    writeView("ui-lib.test.view", { density: "compact", columnOrder: ["b", "a"] })
    expect(readView("ui-lib.test.view")).toEqual({
      density: "compact",
      columnOrder: ["b", "a"],
    })
  })

  test("an unreadable entry is undefined, not a throw", () => {
    // A layout someone's other tab wrote, or a schema from two releases ago. A
    // saved column order is not worth taking the page down for.
    localStorage.setItem("ui-lib.test.broken", "{not json")
    expect(readView("ui-lib.test.broken")).toBeUndefined()
  })

  test("a key that was never written is undefined", () => {
    expect(readView("ui-lib.test.absent")).toBeUndefined()
  })
})

/**
 * The order Tab walks, and the row a form is over.
 *
 * Both are decidable without a DOM, which is the point of them living here: the
 * rendering test next door asserts that Tab *lands* where this says it should,
 * and this asserts what it should say — including the two cases a keyboard test
 * would take a full table to reach, a wrap past the end and a cell that is no
 * longer in the list because the commit filtered its row away.
 */
describe("walking the editable cells", () => {
  const cells = editableCells(["r1", "r2"], ["name", "price"])

  test("the order is reading order: a row's columns, then the next row's", () => {
    expect(cells).toEqual([
      { rowId: "r1", columnId: "name" },
      { rowId: "r1", columnId: "price" },
      { rowId: "r2", columnId: "name" },
      { rowId: "r2", columnId: "price" },
    ])
  })

  test("Tab at the end of a row goes to the start of the next", () => {
    expect(nextEditableCell(cells, { rowId: "r1", columnId: "price" }, 1)).toEqual({
      rowId: "r2",
      columnId: "name",
    })
  })

  test("the last cell wraps to the first, and the first back to the last", () => {
    // Wrapping rather than leaving the table is the whole distinction between a
    // data table and a page of inputs.
    expect(nextEditableCell(cells, { rowId: "r2", columnId: "price" }, 1)).toEqual({
      rowId: "r1",
      columnId: "name",
    })
    expect(nextEditableCell(cells, { rowId: "r1", columnId: "name" }, -1)).toEqual({
      rowId: "r2",
      columnId: "price",
    })
  })

  test("a cell that is no longer on screen has no neighbour to offer", () => {
    // The commit that just landed re-filtered the rows out from under it. The
    // caller closes rather than guessing at a cell.
    expect(nextEditableCell(cells, { rowId: "gone", columnId: "name" }, 1)).toBeUndefined()
    expect(nextEditableCell([], { rowId: "r1", columnId: "name" }, 1)).toBeUndefined()
  })
})

describe("the row an edit form is over", () => {
  interface Product {
    sku: string
    net: number
    tax: number
  }
  const columns: DataTableColumn<Product>[] = [
    { id: "sku", header: "SKU", accessorKey: "sku" },
    // A column whose id is not the field it edits.
    { id: "netAmount", header: "Net", accessorKey: "net", editField: "net" },
    // A derived column: read through the accessor, so the form edits the value
    // the cell displays rather than a key the row does not have.
    { id: "gross", header: "Gross", accessorFn: (row) => row.net + row.tax },
  ]

  test("every editable column, under the name its schema field has", () => {
    expect(editValuesFor(columns, { sku: "SKU-1", net: 100, tax: 19 })).toEqual({
      sku: "SKU-1",
      net: 100,
      gross: 119,
    })
  })

  test("a header band contributes its leaves, not itself", () => {
    const banded: DataTableColumn<Product>[] = [
      { id: "totals", header: "Totals", columns: [columns[1], columns[2]] },
      columns[0],
    ]
    expect(leafColumns(banded).map((column) => column.id)).toEqual(["netAmount", "gross", "sku"])
  })
})
