/**
 * The canonical component categories, in nav order.
 *
 * `category` on ComponentMeta is one of these and nothing else. Two things
 * follow from that which a free-form string could not give:
 *
 * - A typo in a `.meta.ts` file is a type error rather than a tenth nav group
 *   that nobody notices.
 * - The order is data. The nav and the catalog page render categories in the
 *   order of this array, replacing the alphabetical sort that put Actions
 *   first and Layout in the middle for no reason anyone chose.
 *
 * The order is roughly the order you build a page in: the shell, how you move
 * around it, what you press, then the five kinds of form control, then what
 * the app says back, what floats above it, what it displays, and charts.
 * Conform comes last because it is a parallel set of the form controls above,
 * for people already using Conform — the same names a second time, which is
 * why it is worth keeping out of the way.
 */
export const componentCategories = [
  "Layout",
  "Navigation",
  "Actions",
  "Inputs",
  "Selection",
  "Date & time",
  "Color",
  "Files",
  "Feedback",
  "Overlays",
  "Display",
  "Charts",
  "Conform",
] as const

export type ComponentCategory = (typeof componentCategories)[number]

const ORDER = new Map<string, number>(componentCategories.map((c, i) => [c, i]))

/** True if `value` is one of the canonical categories — the runtime half of the union. */
export function isComponentCategory(value: string): value is ComponentCategory {
  return ORDER.has(value)
}

/** Comparator putting categories in canonical order; unknown names sort last. */
export function compareCategories(a: string, b: string) {
  return (ORDER.get(a) ?? componentCategories.length) - (ORDER.get(b) ?? componentCategories.length)
}
