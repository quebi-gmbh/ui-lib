/**
 * Elevation: the surface a floating thing is painted in, and the shadow that
 * lifts it — in both themes (task #117).
 *
 * The reported bug was a ListBox on `/components/list-box` in light mode, and
 * it was two defects wearing one impression ("too glowy and or bg too light").
 *
 * 1. **The overlay was painted in the page colour.** `bg-quebi-bg` is
 *    `#f4f6f6` in light, and every example on the site sits inside a default
 *    Card, whose surface is `bg-quebi-surface/[0.02]` — ink at 2%, which tints
 *    *down* to ≈ `#eff1f2`. So the overlay rendered ~2% **lighter** than its
 *    own container, separated by a 10%-alpha hairline: a pale patch, not
 *    something raised. On dark the same pair happens to work, in the other
 *    direction, which is why it survived.
 *
 * 2. **The glow could not flip.** `--shadow-quebi-glow` was declared in the
 *    plain `@theme` block rather than the `@theme inline` one, so unlike every
 *    colour in this design system it was the same value in both themes — an
 *    emissive mint bloom on a near-white page, which reads as "shiny" and not
 *    as elevation. And because of (1) it was the only thing separating the
 *    overlay from the card, doing the one job it is worst at.
 *
 * Both fixes are values in `src/quebi-theme.css`, so both can be undone by an
 * edit that looks harmless. This file reads the file and recomputes, in the
 * manner of `badge-contrast.test.ts` and `mark-contrast.test.ts`: nothing below
 * is a ratio someone wrote down.
 *
 * What is deliberately *not* checked is which components are overlays. That is
 * a judgement — a docked sidebar and a floating one are the same component —
 * and a scan that tried to infer it would either force `bg-quebi-elevated` onto
 * surfaces that must stay welded to the page, or be so loose it proved nothing.
 * The sweep at the bottom only guards against the token falling out of use.
 */
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, test } from "bun:test"

const ROOT = join(import.meta.dir, "..")
const THEME = readFileSync(join(ROOT, "src", "quebi-theme.css"), "utf8")

/** The text of one `{ … }` block, found by its selector or at-rule. */
function block(selector: string): string {
  const start = THEME.indexOf(selector)
  expect(start, `${selector} is not in quebi-theme.css`).toBeGreaterThan(-1)
  return THEME.slice(start, THEME.indexOf("\n}", start))
}

/** The `--*: <value>` pairs in one block, values unparsed. */
function declarations(selector: string): Map<string, string> {
  const values = new Map<string, string>()
  for (const [, name, value] of block(selector).matchAll(/--([a-z0-9-]+):\s*([^;\n]+);/g)) {
    values.set(name, value.trim())
  }
  return values
}

const DARK = declarations(":root,\n.dark {")
const LIGHT = declarations(".light {")
const INLINE = declarations("@theme inline {")
const PLAIN = declarations("\n@theme {")

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

/**
 * What a default `<Card>` composites to in one theme: `bg-quebi-surface/[0.02]`
 * over the page. Read out of `card.tsx` rather than written down, so a change
 * to the card surface moves this test with it instead of past it.
 */
function cardSurface(values: Map<string, string>) {
  const card = readFileSync(join(ROOT, "src", "components", "card.tsx"), "utf8")
  const [, alpha] = card.match(/bg-quebi-surface\/\[([\d.]+)\]/) ?? []
  expect(alpha, "card.tsx no longer paints its default surface with bg-quebi-surface/[…]").toBeString()
  return over(values.get("q-surface") as string, values.get("q-bg") as string, Number(alpha))
}

describe("--q-elevated — the surface of something that floats", () => {
  test("light: an overlay is lighter than the page it floats over", () => {
    expect(relativeLuminance(LIGHT.get("q-elevated") as string)).toBeGreaterThan(
      relativeLuminance(LIGHT.get("q-bg") as string),
    )
  })

  test("light: the ramp is card → page → overlay, each step up", () => {
    // The reported bug, as an ordering. A Card tints *down* from the page, so
    // an overlay painted in the page colour landed only ~2% above the card and
    // exactly *on* the page — no rung of its own, and a hairline at 10% alpha
    // to carry the difference. Three distinct rungs is what makes it read as
    // floating rather than as a pale patch.
    const [card, page, overlay] = [
      cardSurface(LIGHT),
      LIGHT.get("q-bg") as string,
      LIGHT.get("q-elevated") as string,
    ].map(relativeLuminance)
    expect(card).toBeLessThan(page)
    expect(page).toBeLessThan(overlay)
  })

  test("dark: deliberately the page colour — there the glow carries elevation", () => {
    // Not an oversight and not a thing to "fix": the token exists so light can
    // differ, and on dark it is a no-op by value. If this ever stops being true
    // it should be because someone decided dark needs a lighter overlay too.
    expect(DARK.get("q-elevated")).toBe(DARK.get("q-bg") as string)
  })

  test("the utility resolves through the runtime variable, like every colour", () => {
    expect(INLINE.get("color-quebi-elevated")).toBe("var(--q-elevated)")
  })
})

describe("--q-glow — elevation that flips", () => {
  const NAMES = ["q-glow", "q-glow-strong"]

  test.each(NAMES)("--%s is declared in both themes", (name) => {
    expect(DARK.get(name), `--${name} has no dark value`).toBeString()
    expect(LIGHT.get(name), `--${name} has no light value`).toBeString()
  })

  test.each(NAMES)("--%s is actually different in the two themes", (name) => {
    // The defect in one line: before this, one value served both.
    expect(LIGHT.get(name)).not.toBe(DARK.get(name) as string)
  })

  test.each(NAMES)("shadow-%s goes through it rather than carrying a literal", (name) => {
    const token = `shadow-${name.replace("q-", "quebi-")}`
    expect(INLINE.get(token)).toBe(`var(--${name})`)
    // The plain `@theme` block is the one place in this file that cannot
    // re-theme. A shadow declared there is the original bug, restored.
    expect(PLAIN.has(token), `--${token} is back in the plain @theme block`).toBe(false)
  })

  test("dark keeps the signature: a symmetrical mint bloom", () => {
    for (const name of NAMES) expect(DARK.get(name)).toContain("rgb(45 212 168 /")
  })

  test("light has no mint in it at all — that is the whole complaint", () => {
    for (const name of NAMES) expect(LIGHT.get(name)).not.toContain("45 212 168")
  })

  test("light is a downward, occlusion-shaped shadow", () => {
    // `0 0 <blur>` is a glow: light coming off the surface in every direction.
    // A light surface takes its depth from something falling *below* it, so
    // every layer of the light value needs a positive y-offset.
    for (const name of NAMES) {
      const layers = (LIGHT.get(name) as string).split(/,\s*(?=0|-|\d)/)
      expect(layers.length, `--${name} light should be layered, not a single glow`).toBeGreaterThan(1)
      for (const layer of layers) {
        const y = Number(layer.trim().split(/\s+/)[1]?.replace("px", ""))
        expect(y, `--${name}: "${layer.trim()}" does not fall downward`).toBeGreaterThan(0)
      }
    }
  })
})

describe("the token is in use", () => {
  const SOURCES = [
    ...readdirSync(join(ROOT, "src", "components"))
      .filter((f) => f.endsWith(".tsx"))
      .map((f) => join("src", "components", f)),
    ...readdirSync(join(ROOT, "src", "registry"))
      .filter((f) => f.endsWith(".examples.tsx"))
      .map((f) => join("src", "registry", f)),
  ].map((path) => ({ path, source: readFileSync(join(ROOT, path), "utf8") }))

  const users = SOURCES.filter(({ source }) => /bg-quebi-elevated\b/.test(source)).map((f) => f.path)

  test("the overlay family shares one surface token, not one per component", () => {
    // Loose on purpose — it guards against the token quietly falling out of use
    // (a revert to `bg-quebi-bg` one file at a time), not against the count.
    expect(users.length).toBeGreaterThanOrEqual(10)
  })

  test("including the one the bug was reported against", () => {
    expect(users).toContain(join("src", "components", "list-box.tsx"))
  })
})
