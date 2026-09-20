import { metaRegistry } from "./meta"
import type { ComponentMeta } from "./types"
import { componentCategories, type ComponentCategory } from "./categories"

export interface CategoryGroup {
  category: ComponentCategory
  components: ComponentMeta[]
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
 *
 * Typed against `ComponentMeta` and defaulting to `metaRegistry`, not
 * `ComponentEntry` and `registry`. Every field the catalog reads — `name`,
 * `description`, `category`, `tags`, `slug` — is plain data from a `*.meta.ts`
 * file, so grouping has no reason to reach `./index` and pull the live examples
 * of all 154 components in behind it. That import was the second edge into the
 * trap task #171 describes: a page that only counts components was loading
 * every chart and the whole Conform stack to do it. `ComponentEntry` extends
 * `ComponentMeta`, so a caller holding entries still passes them in unchanged.
 */
export function groupByCategory(components: ComponentMeta[] = metaRegistry): CategoryGroup[] {
  const byCategory = new Map<ComponentCategory, ComponentMeta[]>()
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
export function filterComponents(
  query: string,
  components: ComponentMeta[] = metaRegistry,
): ComponentMeta[] {
  const q = query.trim().toLowerCase()
  if (!q) return components
  return components.filter((c) =>
    [c.name, c.description, c.category, ...c.tags].join(" ").toLowerCase().includes(q),
  )
}
