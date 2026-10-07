/**
 * The focus ring, as the design system states it: "a 2px solid `focus` ring
 * with 3px offset on every interactive element".
 *
 * Two legitimate second forms, neither of them a second language:
 *
 * - A control with no room outside itself — a cell in a calendar grid, a row
 *   in a table or a sidebar — draws the same ring `ring-inset`, taking the
 *   offset out of itself rather than out of its neighbour.
 * - An indicator inside another control's chrome (a tag's ✕, a dialog's close)
 *   stays `ring-offset-0`: there is no page colour at that seam to offset into.
 *
 * Text fields are the one exception the design makes on purpose: they are
 * underline-only, and focus thickens the underline to 2px instead of drawing a
 * ring. Input is the canonical copy of that and is checked by name.
 */
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, test } from "bun:test"

const ROOT = join(import.meta.dir, "..")

const SOURCES = [
  ...readdirSync(join(ROOT, "src", "components"))
    .filter((file) => file.endsWith(".tsx"))
    .map((file) => join("src", "components", file)),
  ...readdirSync(join(ROOT, "src", "registry"))
    .filter((file) => file.endsWith(".examples.tsx"))
    .map((file) => join("src", "registry", file)),
].map((path) => ({ path, source: readFileSync(join(ROOT, path), "utf8") }))

/** Every `cn(` call in a source file, paren-matched. One call is one class list. */
function classLists(source: string): string[] {
  const lists: string[] = []
  for (let i = source.indexOf("cn("); i !== -1; i = source.indexOf("cn(", i + 1)) {
    let depth = 0
    for (let j = i + 2; j < source.length; j++) {
      if ("{[(".includes(source[j])) depth++
      else if ("}])".includes(source[j]) && --depth === 0) {
        lists.push(source.slice(i, j + 1))
        break
      }
    }
  }
  return lists
}

/**
 * The class lists in a file: every `cn(` call, plus every bare
 * `className="…"`. The second is how the examples agents copy verbatim out of
 * `/api/components/<slug>.json` spell a class list — a shortcut taken in one of
 * those propagates, so they are read on the same terms as the components.
 */
function allClassLists(source: string): string[] {
  return [...classLists(source), ...(source.match(/className="[^"]*"/g) ?? [])]
}

/**
 * The utilities in a class list, bucketed by their variant prefix.
 *
 * Split on the *last* colon, so `data-[active=true]:ring-2` and
 * `[&_input:focus]:ring-0` both land on the utility rather than on a colon
 * inside the brackets. A utility with no variant buckets under `""` and is
 * ignored below — an unprefixed ring is painted by a JS condition
 * (`isFocusVisible && "…"`) and the class string cannot say which state it is.
 */
function byVariant(list: string): Map<string, Set<string>> {
  const buckets = new Map<string, Set<string>>()
  for (const literal of list.match(/"(?:[^"\\\n]|\\.)*"/g) ?? []) {
    for (const token of literal.slice(1, -1).split(/\s+/)) {
      if (token === "") continue
      const cut = token.lastIndexOf(":")
      const [variant, utility] = cut === -1 ? ["", token] : [token.slice(0, cut), token.slice(cut + 1)]
      const bucket = buckets.get(variant) ?? new Set<string>()
      bucket.add(utility)
      buckets.set(variant, bucket)
    }
  }
  return buckets
}

const RING_WIDTH = /^(?:inset-)?ring(?:-\d+)?$/
const detached = (utilities: Set<string>) =>
  [...utilities].some((u) => /^ring-offset-[1-9]$/.test(u)) &&
  [...utilities].some((u) => u.startsWith("ring-offset-quebi-"))
const inward = (utilities: Set<string>) =>
  utilities.has("ring-inset") || [...utilities].some((u) => u.startsWith("inset-ring-"))
/** A ring tight to the chrome it sits in on purpose: a tag's ✕, a dialog's close. */
const tight = (utilities: Set<string>) => utilities.has("ring-offset-0")

/** Every variant under which a class list paints the focus ring. */
const rings = SOURCES.flatMap(({ path, source }) =>
  allClassLists(source).flatMap((list) =>
    [...byVariant(list)]
      .filter(
        ([variant, utilities]) =>
          /(?:^|:)(?:focus|focus-visible|focus-within|group-focus-visible\/[\w-]+|data-\[focus-visible\])$/.test(variant) &&
          utilities.has("ring-quebi-focus") &&
          [...utilities].some((u) => RING_WIDTH.test(u)),
      )
      .map(([variant, utilities]) => ({ path, variant, utilities })),
  ),
)

describe("the focus ring is the design's ring", () => {
  test("the scan found the rings — an empty sweep would pass vacuously", () => {
    expect(rings.length).toBeGreaterThanOrEqual(20)
  })

  test("every one of them is offset, drawn inward, or deliberately tight", () => {
    const flush = rings
      .filter(({ utilities }) => !detached(utilities) && !inward(utilities) && !tight(utilities))
      .map(({ path, variant }) => `${path}: ${variant}:`)
    // Add `<variant>:ring-offset-3 <variant>:ring-offset-quebi-bg` — or
    // `<variant>:ring-inset` if the control has no room outside itself.
    expect(flush).toEqual([])
  })
})

describe("a text field draws an underline, not a ring", () => {
  const input = readFileSync(join(ROOT, "src", "components", "input.tsx"), "utf8")

  test("Input is underline-only and thickens the line on focus", () => {
    // The frame (`quebi-field`) is underline-only unless a theme boxes it.
    expect(input).toContain("quebi-field")
    expect(input).toContain("focus:shadow-[inset_0_-1px_0_var(--color-quebi-focus)]")
  })

  test("and puts no focus ring around itself", () => {
    expect(input).not.toMatch(/focus(?:-visible)?:ring-\d/)
  })

  test("the comparison sheet the old ring was chosen from is gone", () => {
    // `input.examples.tsx` is copied verbatim by agents, so a set of candidate
    // treatments left behind would propagate as if one of them were a pattern.
    const examples = readFileSync(join(ROOT, "src", "registry", "input.examples.tsx"), "utf8")
    expect(examples).not.toContain("focusTreatments")
  })
})
