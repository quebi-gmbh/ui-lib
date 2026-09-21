/**
 * The filter model: the operator, the condition, and the one predicate every
 * surface runs.
 *
 * Split from `data-table-model.test.ts` because the model it covers is no
 * longer the table's — `matchesFilter` has never known what a column is, and
 * since task #191 neither has `FilterField`. What is new here is the operator
 * (task #193): the term that lets a filter say "is not", and that has to reach
 * a server as well as a row model or the two modes stop answering the same
 * question.
 */
import { describe, expect, test } from "bun:test"
import type { FilterCondition, FilterField } from "../src/lib/data-table"
import {
  conditionOnField,
  defaultOperator,
  filterOperators,
  filterRows,
  isConditionSet,
  isOperatorFor,
  matchesFilter,
  newCondition,
  toConditions,
  toFilterValues,
} from "../src/lib/data-table"

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

describe("the operator", () => {
  test("each variant offers only what its value shape can answer", () => {
    expect(filterOperators("enum").map((o) => o.id)).toEqual(["is", "isNot"])
    expect(filterOperators("boolean").map((o) => o.id)).toEqual(["is"])
    expect(filterOperators("number").map((o) => o.id)).toEqual(["between", "notBetween"])
    expect(filterOperators("date").map((o) => o.id)).toEqual(["between", "notBetween"])
    expect(filterOperators("text").map((o) => o.id)).toEqual([
      "contains",
      "doesNotContain",
      "is",
      "startsWith",
    ])
    expect(isOperatorFor("enum", "startsWith")).toBe(false)
    expect(isOperatorFor("text", "startsWith")).toBe(true)
    expect(isOperatorFor("enum", undefined)).toBe(false)
  })

  test("each variant's default is what it meant before there were operators", () => {
    expect(defaultOperator("enum")).toBe("is")
    expect(defaultOperator("text")).toBe("contains")
    expect(defaultOperator("number")).toBe("between")
    expect(defaultOperator("date")).toBe("between")
    expect(defaultOperator("boolean")).toBe("is")
    // The operator each variant offers first is the one it applies unasked.
    for (const variant of ["text", "number", "date", "boolean", "enum"] as const) {
      expect(filterOperators(variant)[0].id).toBe(defaultOperator(variant))
    }
  })

  test("the negated operators are the ones the model could not express", () => {
    expect(matchesFilter("live", "enum", ["live"], "isNot")).toBe(false)
    expect(matchesFilter("draft", "enum", ["live"], "isNot")).toBe(true)
    expect(matchesFilter(true, "boolean", "true", "isNot")).toBe(false)
    expect(matchesFilter("Nova GmbH", "text", "nova", "doesNotContain")).toBe(false)
    expect(matchesFilter("Apex AG", "text", "nova", "doesNotContain")).toBe(true)
    expect(matchesFilter("Nova GmbH", "text", "nova", "is")).toBe(false)
    expect(matchesFilter("nova", "text", "NOVA", "is")).toBe(true)
    expect(matchesFilter("Nova GmbH", "text", "nova", "startsWith")).toBe(true)
    expect(matchesFilter("GmbH Nova", "text", "nova", "startsWith")).toBe(false)
    expect(matchesFilter(50, "number", [10, 100], "notBetween")).toBe(false)
    expect(matchesFilter(500, "number", [10, 100], "notBetween")).toBe(true)
    expect(matchesFilter("2026-03-04", "date", ["2026-01-01", "2026-06-01"], "notBetween")).toBe(
      false,
    )
    expect(matchesFilter("2026-09-04", "date", ["2026-01-01", "2026-06-01"], "notBetween")).toBe(
      true,
    )
  })

  test("an unset filter matches everything, negated operators included", () => {
    // The trap the negated operators walk into: "not between" over a range
    // with neither bound set would reject every row, so a condition nobody
    // finished filling in would empty the list instead of being inert.
    expect(matchesFilter(50, "number", [null, null], "notBetween")).toBe(true)
    expect(matchesFilter("x", "enum", [], "isNot")).toBe(true)
    expect(matchesFilter("x", "text", "", "doesNotContain")).toBe(true)
    expect(matchesFilter("x", "date", [null, null], "notBetween")).toBe(true)
  })

  test("a row with no number is outside a range and outside its complement", () => {
    expect(matchesFilter("n/a", "number", [10, 100])).toBe(false)
    expect(matchesFilter("n/a", "number", [10, 100], "notBetween")).toBe(false)
  })

  test("the default operator is what an operator-less call has always applied", () => {
    expect(matchesFilter("Nova GmbH", "text", "nova", "contains")).toBe(
      matchesFilter("Nova GmbH", "text", "nova"),
    )
    expect(matchesFilter("Paid", "enum", ["Paid"], "is")).toBe(
      matchesFilter("Paid", "enum", ["Paid"]),
    )
  })
})

describe("conditions", () => {
  const FIELDS: FilterField[] = [
    { id: "status", label: "Status", variant: "enum" },
    { id: "room", label: "Room", variant: "enum" },
    { id: "name", label: "Name", variant: "text" },
  ]
  const ROWS = [
    { status: "live", room: "Atrium", name: "Nova" },
    { status: "draft", room: "Atrium", name: "Apex" },
    { status: "live", room: "Foyer", name: "Nova II" },
    { status: "offline", room: "Foyer", name: "Zenith" },
  ]
  const on = (
    fieldId: string,
    operator: FilterCondition["operator"],
    value: unknown,
    id = fieldId,
  ): FilterCondition => ({ id, fieldId, operator, value })

  test("a fresh condition is valueless, and says so", () => {
    const condition = newCondition(FIELDS[0], "c1")
    expect(condition).toEqual({ id: "c1", fieldId: "status", operator: "is", value: [] })
    expect(isConditionSet(condition)).toBe(false)
    expect(isConditionSet({ ...condition, value: ["live"] })).toBe(true)
  })

  test("moving a condition to another field drops the value and keeps only an answerable operator", () => {
    const negated = on("status", "isNot", ["live"])
    // `isNot` survives to another enum…
    expect(conditionOnField(negated, FIELDS[1])).toEqual({
      id: "status",
      fieldId: "room",
      operator: "isNot",
      value: [],
    })
    // …and not to a text field, which cannot answer it.
    expect(conditionOnField(negated, FIELDS[2])).toEqual({
      id: "status",
      fieldId: "name",
      operator: "contains",
      value: "",
    })
  })

  test("a list of conditions expresses what the map cannot", () => {
    // "is not live" — the sketch's decorative select, now the predicate.
    expect(filterRows(ROWS, FIELDS, [on("status", "isNot", ["live"])])).toEqual([
      ROWS[1],
      ROWS[3],
    ])
    // Two conditions on one field: the map would have kept only the second.
    const twice = [
      on("name", "contains", "nova", "a"),
      on("name", "doesNotContain", "II", "b"),
    ]
    expect(filterRows(ROWS, FIELDS, twice)).toEqual([ROWS[0]])
    expect(Object.keys(toFilterValues(twice))).toEqual(["name"])
  })

  test("an incomplete condition is inert rather than empty", () => {
    expect(filterRows(ROWS, FIELDS, [newCondition(FIELDS[0], "c1")])).toEqual(ROWS)
  })

  test("the map is the list at every variant's default operator", () => {
    expect(toConditions({ status: ["live"], name: "nova" }, FIELDS)).toEqual([
      { id: "status", fieldId: "status", operator: "is", value: ["live"], variant: "enum" },
      { id: "name", fieldId: "name", operator: "contains", value: "nova", variant: "text" },
    ])
    // An empty value is not a condition, and a field nobody declared is not one either.
    expect(toConditions({ status: [], nope: "x" }, FIELDS)).toEqual([])
    // Both shapes run the same predicate, so both answer the same question.
    expect(filterRows(ROWS, FIELDS, { status: ["live"] })).toEqual(
      filterRows(ROWS, FIELDS, toConditions({ status: ["live"] }, FIELDS)),
    )
  })

  test("the map keeps what a one-control-per-field surface can show, and no more", () => {
    expect(toFilterValues([on("status", "isNot", ["live"])])).toEqual({ status: ["live"] })
    expect(toFilterValues([newCondition(FIELDS[0], "c1")])).toEqual({})
  })
})
