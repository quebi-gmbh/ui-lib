/**
 * `ComponentMeta.usage` — when to use a component, when not to, and what to use
 * instead.
 *
 * The field is guidance an agent acts on without a human in between: it reads
 * "a list item → GridList" in `/api/components/card.json` or in llms.txt and
 * goes to fetch `grid-list`. So the slugs have to exist, and a component that
 * says "use something else" has to name something.
 */
import { describe, expect, test } from "bun:test"
import { registry } from "../src/registry"
import { metaRegistry } from "../src/registry/meta"

const known = new Set(metaRegistry.map((m) => m.slug))
const guided = metaRegistry.filter((m) => m.usage)

describe("usage guidance", () => {
  test("Card carries it — it is the component agents reach for first", () => {
    expect(guided.map((m) => m.slug)).toContain("card")
  })

  test("every alternative's slug is a component in the registry", () => {
    const dangling = guided.flatMap((m) =>
      (m.usage?.instead ?? []).flatMap((group) =>
        group.use
          .filter((alt) => alt.slug !== undefined && !known.has(alt.slug))
          .map((alt) => `${m.slug}: ${group.job} → ${alt.name} (${alt.slug})`),
      ),
    )
    expect(dangling).toEqual([])
  })

  test("says when, when not, and names at least one alternative per job", () => {
    for (const m of guided) {
      const usage = m.usage
      if (!usage) continue
      expect(usage.when.length).toBeGreaterThan(0)
      expect(usage.whenNot.length).toBeGreaterThan(0)
      expect(usage.instead.length).toBeGreaterThan(0)
      for (const group of usage.instead) expect(group.use.length).toBeGreaterThan(0)
    }
  })
})

describe("examples that show what to use instead", () => {
  test("Card has them, and every one draws both halves", () => {
    const card = registry.find((c) => c.slug === "card")
    const alternatives = card?.examples.filter((e) => e.insteadOf) ?? []
    expect(alternatives.length).toBeGreaterThan(0)
    for (const example of alternatives) {
      expect(example.insteadOf?.()).toBeTruthy()
      expect(example.render()).toBeTruthy()
    }
  })

  test("a component with such examples also has usage, which is what heads their section", () => {
    const orphans = registry
      .filter((c) => c.examples.some((e) => e.insteadOf) && !c.usage)
      .map((c) => c.slug)
    expect(orphans).toEqual([])
  })
})
