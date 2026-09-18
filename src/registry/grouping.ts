import { registry, type ComponentEntry } from "./index"
import { componentCategories, type ComponentCategory } from "./categories"

export interface CategoryGroup {
  category: ComponentCategory
  components: ComponentEntry[]
}

/**
 * Components grouped by category: groups in the canonical order declared in
 * ./categories.ts, members alphabetical within a group, and categories with
 * nothing in them left out — so a filtered list produces only the groups that
 * still have a hit.
 *
 * A component's nav group is its `category` and nothing else. It used to be
 * computed: anything tagged `conform` was moved into a Conform bucket, which
 * also swept up Data Table and Table Controls, neither of which is a Conform
 * variant — they merely mention Conform among the things they support. The
 * Conform variants now carry `category: "Conform"` themselves.
 */
export function groupByCategory(components: ComponentEntry[] = registry): CategoryGroup[] {
  const byCategory = new Map<ComponentCategory, ComponentEntry[]>()
  for (const c of components) {
    const list = byCategory.get(c.category) ?? []
    list.push(c)
    byCategory.set(c.category, list)
  }
  return componentCategories.flatMap((category) => {
    const list = byCategory.get(category)
    if (!list) return []
    return [{ category, components: [...list].sort((a, b) => a.name.localeCompare(b.name)) }]
  })
}

/** Filter components by a free-text query over name, description, category, and tags. */
export function filterComponents(query: string, components: ComponentEntry[] = registry) {
  const q = query.trim().toLowerCase()
  if (!q) return components
  return components.filter((c) =>
    [c.name, c.description, c.category, ...c.tags].join(" ").toLowerCase().includes(q),
  )
}
