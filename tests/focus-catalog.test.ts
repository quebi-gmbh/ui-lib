/**
 * The catalogue and its stylesheet are two halves of one thing.
 *
 * `/components/focus` renders a tile per entry in `src/site/focus-catalog.ts`
 * and gives each one a `[data-focus-variant="<id>"]` hook that
 * `src/focus-variants.css` is supposed to answer. Nothing in either file
 * notices when they disagree, and both failure directions are silent on the
 * page rather than loud:
 *
 * - An entry with no CSS renders a field that does nothing on focus, which is
 *   pixel-identical to the `none` baseline. A reader would take that as a
 *   finding about the technique instead of a missing block.
 * - A CSS block with no entry is dead weight that never renders, so it is never
 *   seen to be broken, and it survives every future edit to the page.
 *
 * So the pairing is asserted here rather than trusted. The CSS side is read as
 * text on purpose: the alternative is parsing a stylesheet Biome cannot lint
 * and `bun test` cannot import, and a selector is a string either way.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, test } from "bun:test"
import { focusGroups, focusVariants } from "../src/site/focus-catalog"

const CSS = readFileSync(join(import.meta.dir, "..", "src", "focus-variants.css"), "utf8")

/** Every id the stylesheet actually styles, in the order it styles them. */
const styledIds = new Set(
  [...CSS.matchAll(/\[data-focus-variant="([a-z-]+)"\]/g)].map((match) => match[1]),
)

describe("the focus catalogue", () => {
  test("every variant has a CSS block", () => {
    const missing = focusVariants.filter((variant) => !styledIds.has(variant.id))
    expect(missing.map((variant) => variant.id)).toEqual([])
  })

  test("every CSS block has a variant", () => {
    const ids = new Set(focusVariants.map((variant) => variant.id))
    expect([...styledIds].filter((id) => !ids.has(id))).toEqual([])
  })

  test("ids are unique across groups", () => {
    const ids = focusVariants.map((variant) => variant.id)
    expect(ids.length).toBe(new Set(ids).size)
  })

  /**
   * A badge with no reason is a rating, and a rating is the one thing this page
   * must not publish: the verdicts are about the drawing on this page, and the
   * sentence is what says so.
   */
  test("every verdict carries its reason", () => {
    for (const variant of focusVariants) {
      expect(variant.verdictWhy.trim().length).toBeGreaterThan(0)
      expect(variant.note.trim().length).toBeGreaterThan(0)
      expect(variant.css.trim().length).toBeGreaterThan(0)
    }
  })

  /**
   * The page's own claim about itself. It says "thirty-three" in prose, and
   * prose does not update itself when a variant is added.
   */
  test("the page's stated count matches the catalogue", () => {
    const page = readFileSync(
      join(import.meta.dir, "..", "src", "routes", "components.focus.tsx"),
      "utf8",
    )
    expect(focusVariants.length).toBe(33)
    expect(page).toContain("Thirty-three ways")
  })

  test("every group has at least one variant", () => {
    for (const group of focusGroups) expect(group.variants.length).toBeGreaterThan(0)
  })
})
