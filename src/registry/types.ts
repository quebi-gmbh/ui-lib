import type { ReactNode } from "react"

/** Human-curated metadata for a component. Plain data — fully serializable. */
export interface ComponentMeta {
  /** kebab-case id, matches the source filename in src/components. */
  slug: string
  name: string
  description: string
  category: string
  tags: string[]
}

/** A single rendered example within a component's gallery entry. */
export interface ComponentExample {
  title: string
  description?: string
  render: () => ReactNode
}

/** Metadata + live examples, combined for the gallery. */
export interface ComponentEntry extends ComponentMeta {
  examples: ComponentExample[]
}
