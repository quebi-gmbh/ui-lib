/**
 * Brand as a *thin graphical mark* — the focus ring, the focus border, the
 * ProgressCircle arc — against the surface it is drawn on, in both themes.
 *
 * A focus ring has no text alternative: where focus is, is carried by a 2px
 * line and nothing else. So WCAG 1.4.11 (Non-text Contrast) and 2.4.11 (Focus
 * Appearance, AA in WCAG 2.2) ask 3:1 against the adjacent background, and
 * `focus-visible:ring-2 ring-quebi-brand/50` — this library's focus treatment on
 * every button, input, select, menu item and dialog trigger — was **1.35:1** on
 * the light surface. A keyboard user could not see where they were.
 *
 * Less obviously, it was **3.29:1 on dark** as well. The mint token reads 10.64:1
 * on `#030712`, and that is the number it is easy to quote; but the ring is
 * painted at 50% and what the eye judges is the *composite*, which is a much
 * duller teal. So the alpha was not a light-mode problem that dark got away
 * with — it was a whole-library problem that dark nearly got away with. That is
 * why this file composites every alpha it finds instead of reading tokens.
 *
 * ## Three brand roles, three thresholds
 *
 * - `--q-brand` is a **fill**. Mint in both themes; what sits on it is
 *   `--q-on-brand` and that pairing is Badge's problem, not this file's.
 * - `--q-brand-text` is **text** (task #94). 1.4.3, so 4.5:1.
 * - `--q-brand-mark` is a **mark** (this file). 1.4.11 / 2.4.11, so 3:1 — a
 *   looser bar than text, which is the whole reason it is not simply
 *   `--q-brand-text` under another name: a mark that only needs 3:1 gets to stay
 *   a step mintier than a label that needs 4.5:1.
 *
 * ## What is checked, and why it is a scan
 *
 * Pinning the token alone would leave the 73 call sites free to drift back:
 * re-adding a `/50` is a one-character edit and nothing about it looks wrong.
 * So the library's own sources are read, every brand mark utility in them is
 * resolved and composited, and the three ways of getting it wrong each fail
 * with the class that caused them:
 *
 * 1. a mark whose composited value misses 3:1 on either theme's page,
 * 2. a `ring-`/`stroke-`/`outline-` painted in the *fill* token,
 * 3. an opaque `border-quebi-brand` with no opaque `bg-quebi-brand` behind it —
 *    a border is the edge of a mint fill only when there is a mint fill; on its
 *    own it is the only thing marking the state, which makes it a mark.
 *
 * The alpha'd `border-quebi-brand/20…/40` on Card, Badge, IconTile and the
 * TableControls chips are deliberately none of these. They are tint edges on a
 * surface whose meaning is carried by the label inside it, so 1.4.11 does not
 * ask 3:1 of them, and forcing it would repaint every tinted container in the
 * library.
 *
 * Nothing here is a hardcoded ratio — both themes are read out of
 * `src/quebi-theme.css` and recomputed, following `badge-contrast.test.ts` and
 * `commit-graph-contrast.test.ts`.
 */
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, test } from "bun:test"

const ROOT = join(import.meta.dir, "..")
const THEME = readFileSync(join(ROOT, "src", "quebi-theme.css"), "utf8")

/**
 * The `--*: #hex` pairs declared in one theme's block.
 *
 * Deliberately not `@theme inline`: that block is Tailwind's input, and what
 * reaches the browser from it depends on a source scan. These blocks are plain
 * CSS and always ship.
 */
function themeValues(selector: string): Map<string, string> {
  const start = THEME.indexOf(selector)
  expect(start, `${selector} is not in quebi-theme.css`).toBeGreaterThan(-1)
  const block = THEME.slice(start, THEME.indexOf("\n}", start))
  const values = new Map<string, string>()
  for (const [, name, hex] of block.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)) {
    values.set(name, hex)
  }
  return values
}

const THEMES = [
  { name: "dark", values: themeValues(":root,\n.dark {") },
  { name: "light", values: themeValues(".light {") },
] as const

const [DARK, LIGHT] = [THEMES[0].values, THEMES[1].values]

const rgb = (hex: string) =>
  [0, 2, 4].map((i) => Number.parseInt(hex.replace("#", "").slice(i, i + 2), 16))

function relativeLuminance(hex: string) {
  const channel = (value: number) => {
    const c = value / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  const [r, g, b] = rgb(hex).map(channel)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string) {
  const [high, low] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return (high + 0.05) / (low + 0.05)
}

/** `fg` at `alpha` over an opaque `bg` — what the browser composites. */
function over(fg: string, bg: string, alpha: number) {
  const [f, b] = [rgb(fg), rgb(bg)]
  const hex = f.map((v, i) =>
    Math.round(v * alpha + b[i] * (1 - alpha))
      .toString(16)
      .padStart(2, "0"),
  )
  return `#${hex.join("")}`
}

/** A mark drawn in `token` at `alpha`, read against its own theme's page. */
function markContrast(values: Map<string, string>, token: string, alpha = 1) {
  const page = values.get("q-bg") as string
  const hex = values.get(token)
  expect(hex, `--${token} has no value in this theme`).toBeString()
  return contrast(over(hex as string, page, alpha), page)
}

describe("--q-brand-mark", () => {
  test.each(THEMES.map((t) => [t.name, t.values] as const))(
    "%s: clears 1.4.11's 3:1 against the page",
    (_name, values) => {
      expect(markContrast(values, "q-brand-mark")).toBeGreaterThanOrEqual(3)
    },
  )

  test("on dark the split costs nothing — the mark is the fill", () => {
    expect(DARK.get("q-brand-mark")).toBe(DARK.get("q-brand") as string)
  })

  test("on light it cannot be the fill: mint is 1.74:1 there", () => {
    // The reason the token exists. If this ever reaches 3:1, the light theme has
    // changed the mint and `--q-brand-mark` may be able to collapse back into
    // `--q-brand`.
    expect(markContrast(LIGHT, "q-brand")).toBeLessThan(3)
    expect(LIGHT.get("q-brand-mark")).not.toBe(LIGHT.get("q-brand") as string)
  })

  test("and it is not `--q-brand-text` renamed: a mark may stay lighter", () => {
    // The payoff of a third token rather than a role-neutral second one. A mark
    // is judged at 3:1 and a label at 4.5:1, so the mark is free to sit higher
    // up the teal ladder. Equality would still pass — this fails only if the
    // mark is forced *darker* than the text token, which nothing asks for.
    const mark = relativeLuminance(LIGHT.get("q-brand-mark") as string)
    const text = relativeLuminance(LIGHT.get("q-brand-text") as string)
    expect(mark).toBeGreaterThanOrEqual(text)
  })

  test("the ring it replaces missed 3:1 in BOTH themes once composited", () => {
    // `ring-quebi-brand/50`, the treatment this change removes. Kept as a
    // measurement rather than a sentence: the dark number is the surprising one,
    // and it is the reason the alphas went rather than being raised.
    expect(markContrast(LIGHT, "q-brand", 0.5)).toBeLessThan(2)
    expect(markContrast(DARK, "q-brand", 0.5)).toBeLessThan(3.5)
  })
})

/**
 * The library's own sources: published components, the examples agents copy
 * verbatim out of `/api/components/<slug>.json`, and the site chrome and routes
 * that are linted at full strength beside them.
 */
const SOURCES = [
  ...readdirSync(join(ROOT, "src", "components"))
    .filter((f) => f.endsWith(".tsx"))
    .map((f) => join("src", "components", f)),
  ...readdirSync(join(ROOT, "src", "registry"))
    .filter((f) => f.endsWith(".examples.tsx"))
    .map((f) => join("src", "registry", f)),
  ...readdirSync(join(ROOT, "src", "site"))
    .filter((f) => f.endsWith(".tsx"))
    .map((f) => join("src", "site", f)),
  ...readdirSync(join(ROOT, "src", "routes"))
    .filter((f) => f.endsWith(".tsx"))
    .map((f) => join("src", "routes", f)),
].map((path) => ({ path, source: readFileSync(join(ROOT, path), "utf8") }))

/** `ring-quebi-brand-mark/50` → alpha 0.5; `…/[0.06]` too; bare → 1. */
const alphaOf = (suffix: string | undefined) =>
  suffix === undefined ? 1 : suffix.startsWith("[") ? Number(suffix.slice(1, -1)) : Number(suffix) / 100

/**
 * `inset-ring` is listed with the rest rather than left to the `ring` branch:
 * the lookbehind rejects a `-` before the property, so `inset-ring-…` would
 * otherwise slip past this whole file. An inward ring is as much the only thing
 * marking a state as an outward one — Input's "inward only" focus candidate is
 * exactly that — so it is judged at the same 3:1.
 */
const MARK_UTILITY =
  /(?<![-\w])(?:[\w:[\]./-]*:)?(inset-ring|ring|stroke|outline|border|divide)-quebi-brand-mark(?:\/(\[[\d.]+\]|\d+))?(?![\w/-])/g

const FILL_MARK =
  /(?<![-\w])(?:[\w:[\]./-]*:)?(inset-ring|ring|stroke|outline)-quebi-brand(?:\/(?:\[[\d.]+\]|\d+))?(?![\w/-])/g

/** An opaque `border-quebi-brand` / `bg-quebi-brand` — the fill token, no alpha. */
const OPAQUE_BRAND_BORDER = /(?<![-\w])(?:[\w:[\]./-]*:)?border-quebi-brand(?![\w/-])/
const OPAQUE_BRAND_FILL = /(?<![-\w])(?:[\w:[\]./-]*:)?bg-quebi-brand(?![\w/-])/

/** The double-quoted string literals in a source file — one class list each. */
const stringLiterals = (source: string) => source.match(/"(?:[^"\\\n]|\\.)*"/g) ?? []

describe("every brand mark in the library, composited, in both themes", () => {
  const marks = SOURCES.flatMap(({ path, source }) =>
    [...source.matchAll(MARK_UTILITY)].map(([klass, , alpha]) => ({ path, klass, alpha })),
  )

  test("the scan found the marks — an empty sweep would pass vacuously", () => {
    // 74 ring/outline utilities, 2 ProgressCircle strokes, 37 focus borders. The
    // floor is deliberately loose: it guards against the regexes above going
    // quiet, not against the count moving.
    expect(marks.length).toBeGreaterThan(80)
  })

  for (const { name: theme, values } of THEMES) {
    test(`${theme}: each one clears 3:1 against --q-bg`, () => {
      const failures = marks
        .map(({ path, klass, alpha }) => ({
          where: `${path}: ${klass}`,
          ratio: markContrast(values, "q-brand-mark", alphaOf(alpha)),
        }))
        .filter(({ ratio }) => ratio < 3)
        .map(({ where, ratio }) => `${where} → ${ratio.toFixed(2)}:1`)

      // A mark may carry an alpha if it still clears the bar; `/50` does not,
      // in either theme, which is what this change removed.
      expect(failures).toEqual([])
    })
  }
})

describe("the fill token is not used as a mark", () => {
  test("no `ring-`/`stroke-`/`outline-quebi-brand` — those are `-brand-mark`", () => {
    const uses = SOURCES.flatMap(({ path, source }) =>
      [...source.matchAll(FILL_MARK)].map(([klass]) => `${path}: ${klass}`),
    )
    expect(uses).toEqual([])
  })

  test("no opaque `border-quebi-brand` at all — a mint fill's edge is the mark", () => {
    // This test used to allow `border-quebi-brand bg-quebi-brand`, on the
    // argument that the border is the fill's own edge and so not a mark. Task
    // #145 measured that argument and it is false on the light page: mint is
    // 1.74:1 there, so edging a mint fill in the fill token gives a selected
    // Checkbox, Radio, Switch, Toggle, Tag or Stepper bullet *no boundary at
    // all* — the control and the page meet at an invisible seam. The edge is
    // what marks the state, whatever is behind it, so it is judged at 1.4.11's
    // 3:1 like every other mark and belongs to `--q-brand-mark` (teal-600 on
    // light, 3.45:1; identical to `--q-brand` on dark, so dark is unchanged).
    //
    // Both readings therefore fail now — lone, or edging a fill — which
    // collapses to the simpler rule this asserts.
    const uses = SOURCES.flatMap(({ path, source }) =>
      stringLiterals(source)
        .filter((s) => OPAQUE_BRAND_BORDER.test(s))
        .map((s) => `${path}: ${s}`),
    )
    expect(uses).toEqual([])
  })

  test("and a mint fill is never edged in `border-transparent`", () => {
    // The same invisible seam reached from the other side, and how the Stepper's
    // done-bullet had it: `border-transparent bg-quebi-brand` draws the fill with
    // no edge whatsoever, which on light is a 1.74:1 shape floating on the page.
    // A mint fill either carries `border-quebi-brand-mark` or sits on a surface
    // that is not the page; it does not opt out of having an edge.
    const edgeless = SOURCES.flatMap(({ path, source }) =>
      stringLiterals(source)
        .filter((s) => OPAQUE_BRAND_FILL.test(s) && /(?<![-\w])(?:[\w:[\]./-]*:)?border-transparent(?![\w/-])/.test(s))
        .map((s) => `${path}: ${s}`),
    )
    expect(edgeless).toEqual([])
  })
})
