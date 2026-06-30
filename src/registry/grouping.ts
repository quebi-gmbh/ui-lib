import { registry, type ComponentEntry } from "./index"

export interface CategoryGroup {
  category: string
  components: ComponentEntry[]
}

const CONFORM_CATEGORY = "Conform"

/** Conform variants are bucketed into their own nav category, not their base category. */
export function isConform(c: ComponentEntry) {
  return c.slug.startsWith("conform-") || c.tags.includes("conform")
}

/** The category a component appears under in the nav (Conform variants are grouped together). */
export function navCategory(c: ComponentEntry) {
  return isConform(c) ? CONFORM_CATEGORY : c.category
}

/**
 * Components grouped by nav category, categories and members both sorted
 * alphabetically. Conform is pinned to the end so the base components lead.
 */
export function groupByCategory(components: ComponentEntry[] = registry): CategoryGroup[] {
  const byCategory = new Map<string, ComponentEntry[]>()
  for (const c of components) {
    const key = navCategory(c)
    const list = byCategory.get(key) ?? []
    list.push(c)
    byCategory.set(key, list)
  }
  return [...byCategory.entries()]
    .map(([category, list]) => ({
      category,
      components: [...list].sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => {
      // Pin Conform last; everything else alphabetical.
      if (a.category === CONFORM_CATEGORY) return 1
      if (b.category === CONFORM_CATEGORY) return -1
      return a.category.localeCompare(b.category)
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
