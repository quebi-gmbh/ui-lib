/**
 * The category taxonomy.
 *
 * `category` was a free-form string until the nav learned to collapse: whatever
 * a `.meta.ts` file happened to spell became a group, sorted alphabetically,
 * with "Conform" pinned last by name. A typo opened a silent tenth group, the
 * order was nobody's decision, and which group a component landed in was partly
 * computed from its *tags* — which is how Data Table and Table Controls, which
 * merely support Conform, ended up filed as Conform variants.
 *
 * The union in src/registry/categories.ts is what stops the typo; these tests
 * are what stop the rest, because none of it is expressible in the type.
 */
import { describe, expect, test } from "bun:test"
import {
  compareCategories,
  componentCategories,
  isComponentCategory,
} from "../src/registry/categories"
import { metaRegistry } from "../src/registry/meta"
import { filterComponents, groupByCategory } from "../src/registry/grouping"
import { registry } from "../src/registry"

describe("the canonical list", () => {
  test("has no duplicates", () => {
    expect(new Set(componentCategories).size).toBe(componentCategories.length)
  })

  test("every component's category is one of them", () => {
    const strays = metaRegistry
      .filter((m) => !isComponentCategory(m.category))
      .map((m) => `${m.slug}: ${m.category}`)
    expect(strays).toEqual([])
  })

  test("every category has at least one component — an empty one is a leftover", () => {
    const used = new Set(metaRegistry.map((m) => m.category))
    expect(componentCategories.filter((c) => !used.has(c))).toEqual([])
  })

  test("an unknown name sorts after every known one rather than throwing", () => {
    expect(compareCategories("Layout", "Charts")).toBeLessThan(0)
    expect(compareCategories("Nonsense", "Conform")).toBeGreaterThan(0)
  })
})

describe("groupByCategory", () => {
  test("renders groups in the canonical order, not alphabetically", () => {
    const order = groupByCategory(registry).map((g) => g.category)
    expect(order).toEqual([...componentCategories])
    // The old behaviour, spelled out so a regression to it is unmistakable.
    expect(order).not.toEqual([...order].sort())
  })

  test("sorts members by name inside a group", () => {
    for (const group of groupByCategory(registry)) {
      const names = group.components.map((c) => c.name)
      expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)))
    }
  })

  test("accounts for every component exactly once", () => {
    const grouped = groupByCategory(registry).flatMap((g) => g.components.map((c) => c.slug))
    expect(grouped.length).toBe(registry.length)
    expect(new Set(grouped).size).toBe(registry.length)
  })

  test("groups a component by its category and never by its tags", () => {
    const groupOf = (slug: string) =>
      groupByCategory(registry).find((g) => g.components.some((c) => c.slug === slug))?.category

    // Both tag `conform` among the things they support; neither is a variant.
    expect(groupOf("data-table")).toBe("Display")
    expect(groupOf("table-controls")).toBe("Display")

    // The real variants say so themselves now.
    const conform = groupByCategory(registry).find((g) => g.category === "Conform")
    expect(conform?.components.every((c) => c.slug.startsWith("conform-"))).toBe(true)
    const variants = registry.filter((c) => c.slug.startsWith("conform-")).map((c) => c.slug)
    expect(conform?.components.map((c) => c.slug)).toEqual(variants.sort())
  })

  test("drops categories a filter emptied", () => {
    const groups = groupByCategory(filterComponents("treemap", registry))
    expect(groups.map((g) => g.category)).toEqual(["Charts"])
    expect(groups[0]?.components.map((c) => c.name)).toContain("Treemap")
  })

  test("keeps the canonical order in a filtered list", () => {
    const groups = groupByCategory(filterComponents("color", registry))
    const order = groups.map((g) => g.category)
    expect(order).toEqual(componentCategories.filter((c) => order.includes(c)))
  })
})
