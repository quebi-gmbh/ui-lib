/**
 * The focus ring is detached from the border it sits on.
 *
 * What was reported on `/components/input` as the focus glow being too much
 * (task #110) had two causes. One was a cascade bug — hover outranking focus,
 * fixed there and held by `focus-precedence.test.ts`. The other is geometry,
 * and it is what this file holds: a 1px mark-teal border with a 2px mark-teal
 * ring painted straight onto it is 3px of continuous, fully opaque teal with
 * nothing between the two to say where the field stops. That falloff reads as a
 * bloom rather than an edge.
 *
 * Five candidates went side by side on the component page and the offset ring
 * won (task #150). `ring-offset-2 ring-offset-quebi-bg` puts a 2px band of page
 * colour into that seam, so the same ink reads as a ring *around* the field.
 * Nothing about the colour moved, and it could not have: `--q-brand-mark` has
 * 0.45 of headroom over WCAG 1.4.11's 3:1 on the light page (task #96) and
 * nothing to spend on translucency, which is why the levers left were geometry
 * and trigger. `mark-contrast.test.ts` owns the colour; this file owns the gap.
 *
 * ## The rule, and the one legitimate second form
 *
 * Where a class list paints a brand-mark **border** and a brand-mark **ring**
 * under the same variant — the bloom shape, exactly — the ring must either
 *
 * - carry `ring-offset-2 ring-offset-quebi-bg` under that same variant, or
 * - be drawn `ring-inset`.
 *
 * The second is not a second focus language. A control with no room outside
 * itself — a cell in a calendar grid, a row in a table or a sidebar — takes the
 * offset out of itself instead of out of its neighbour, because an outward ring
 * there paints over the row above. It is the same ring with the gap on the
 * other side.
 *
 * ## Why per `cn()` call and not per string literal
 *
 * `InputOTP` writes the border on one line and the ring on the next, and a
 * literal-by-literal scan would see two unrelated halves and pass. The class
 * list is the unit that reaches the element, so it is the unit the rule is
 * stated over — the same choice `focus-precedence.test.ts` makes, for the same
 * reason.
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

const RING_WIDTH = /^(?:inset-)?ring-\d+$/
const detached = (utilities: Set<string>) =>
  utilities.has("ring-offset-2") && [...utilities].some((u) => u.startsWith("ring-offset-quebi-"))
const inward = (utilities: Set<string>) =>
  utilities.has("ring-inset") || [...utilities].some((u) => u.startsWith("inset-ring-"))

/** Class lists that paint a brand-mark border and a brand-mark ring under one variant. */
const blooms = SOURCES.flatMap(({ path, source }) =>
  allClassLists(source).flatMap((list) =>
    [...byVariant(list)]
      .filter(
        ([variant, utilities]) =>
          variant !== "" &&
          utilities.has("border-quebi-brand-mark") &&
          utilities.has("ring-quebi-brand-mark") &&
          [...utilities].some((u) => RING_WIDTH.test(u)),
      )
      .map(([variant, utilities]) => ({ path, variant, utilities })),
  ),
)

describe("a brand-mark ring is never flush against a brand-mark border", () => {
  test("the scan found the shape — an empty sweep would pass vacuously", () => {
    // Input, Textarea, Select (twice), ColorField, TagField, DateField and
    // TimeField (twice each), DatePicker, DateRangePicker, MultipleSelect,
    // AsyncSelect, InputOTP, and the two raw fields in the ColorPicker examples.
    // The floor guards against the parser going quiet, not against the count
    // moving.
    expect(blooms.length).toBeGreaterThanOrEqual(15)
  })

  test("every one of them is offset, or drawn inward", () => {
    const flush = blooms
      .filter(({ utilities }) => !detached(utilities) && !inward(utilities))
      .map(({ path, variant }) => `${path}: ${variant}:`)

    // Add `<variant>:ring-offset-2 <variant>:ring-offset-quebi-bg` to the list
    // named below — or `<variant>:ring-inset` if the control has no room
    // outside itself. See the Input doc comment for which is which.
    expect(flush).toEqual([])
  })
})

describe("the canonical copy", () => {
  test("Input carries the whole treatment on one line", () => {
    const input = readFileSync(join(ROOT, "src", "components", "input.tsx"), "utf8")
    for (const utility of [
      "focus:border-quebi-brand-mark",
      "focus:ring-2",
      "focus:ring-quebi-brand-mark",
      "focus:ring-offset-2",
      "focus:ring-offset-quebi-bg",
    ]) {
      expect(input).toContain(utility)
    }
  })

  test("the comparison sheet it was chosen from is gone", () => {
    // `input.examples.tsx` is copied verbatim by agents through
    // `/api/components/input.json`, so five candidate treatments left behind
    // propagate as if one of them were a pattern. The decision aid ships until
    // the decision is made, and not after it.
    const examples = readFileSync(join(ROOT, "src", "registry", "input.examples.tsx"), "utf8")
    expect(examples).not.toContain("focusTreatments")
  })
})
