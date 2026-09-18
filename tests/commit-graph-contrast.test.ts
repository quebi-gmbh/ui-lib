/**
 * The colours CommitGraph hands to the SVG: do they exist, and are they legible?
 *
 * Two different failures, and the first one is the one that actually happened.
 *
 * **Does the variable exist at runtime.** A lane colour reaches the DOM as an
 * SVG `stroke`/`fill` attribute, not as a utility class, so nothing in Tailwind's
 * pipeline is obliged to notice it. quebi's `--color-quebi-*` aliases live in
 * `@theme inline`, where Tailwind emits only what it can see used — and it sees
 * source text. An earlier version of this component assembled the name
 * (`var(--color-${token})`), so the literal never appeared anywhere, three of the
 * five aliases were never written to the stylesheet, and those lanes rendered
 * with SVG's own defaults: black dots, and no line at all because SVG's default
 * stroke is `none`. Every test passed. The graph just lost its branches.
 *
 * So the first check reads every `var(--…)` out of the component source and
 * insists the theme declares it in an ordinary rule — `:root, .dark` and
 * `.light` — rather than in `@theme inline`, which is Tailwind's input and not
 * emitted CSS. That is the distinction the bug turned on.
 *
 * **Is it legible.** A lane line is a graphical object whose meaning is carried
 * by colour alone — which of two branches you are following is a hue and nothing
 * else — so WCAG 1.4.11 asks 3:1 against its background, and a 1.5px stroke is
 * the thinnest thing on the page. Nothing is hardcoded here either: both themes'
 * values are read out of `src/quebi-theme.css` and the ratios recomputed, so
 * re-tuning a token fails a test rather than washing out a lane in light mode.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, test } from "bun:test"
import { LANE_COLORS, laneColor } from "../src/components/commit-graph"

const ROOT = join(import.meta.dir, "..")
const THEME = readFileSync(join(ROOT, "src", "quebi-theme.css"), "utf8")
const COMPONENT = readFileSync(join(ROOT, "src", "components", "commit-graph.tsx"), "utf8")

/**
 * The `--*: #hex` pairs declared in one theme's block.
 *
 * Deliberately *not* `@theme inline`: a variable declared only there is a
 * Tailwind input, and whether it reaches the browser depends on a source scan.
 * These blocks are plain CSS and always ship.
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

function relativeLuminance(hex: string) {
  const channel = (value: number) => {
    const c = value / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  const n = hex.replace("#", "")
  const [r, g, b] = [0, 2, 4].map((i) => channel(Number.parseInt(n.slice(i, i + 2), 16)))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string) {
  const [high, low] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return (high + 0.05) / (low + 0.05)
}

/** `var(--q-success)` → `q-success`. */
const variableName = (reference: string) => reference.replace(/^var\(--|\)$/g, "")

const THEMES = [
  { name: "dark", values: themeValues(":root,\n.dark {") },
  { name: "light", values: themeValues(".light {") },
] as const

describe("every colour the component names actually exists at runtime", () => {
  // Every var() in the source, not only the lane palette — the merge dot's fill
  // is one too, and it went through the same alias the lanes did.
  const referenced = [...new Set(COMPONENT.match(/var\(--[a-z0-9-]+\)/g) ?? [])]

  test("the component references at least the lane palette and the merge fill", () => {
    expect(referenced.length).toBeGreaterThanOrEqual(LANE_COLORS.length + 1)
  })

  test.each(THEMES.map((t) => [t.name, t.values] as const))(
    "%s declares every variable the component uses, in a plain rule",
    (_name, values) => {
      const missing = referenced.filter((r) => !values.has(variableName(r)))
      expect(missing).toEqual([])
    },
  )

  test("none of them go through a --color-quebi-* alias", () => {
    // Those live in `@theme inline`, so whether they reach the browser depends
    // on Tailwind finding the literal name in scanned source. An SVG attribute
    // is not a utility class, so that is a coin flip — and it landed wrong once.
    expect(referenced.filter((r) => r.startsWith("var(--color-"))).toEqual([])
  })
})

describe("every lane colour is legible on both surfaces", () => {
  for (const { name, values } of THEMES) {
    test.each(LANE_COLORS.map((color) => [color] as const))(
      `${name}: %s clears 3:1 against the page background`,
      (color) => {
        const hex = values.get(variableName(color))
        expect(hex, `${color} has no value in the ${name} theme`).toBeString()
        expect(contrast(hex as string, values.get("q-bg") as string)).toBeGreaterThanOrEqual(3)
      },
    )
  }

  test("the palette is the set laneColor actually draws from, and it cycles", () => {
    for (const [index, color] of LANE_COLORS.entries()) {
      expect(laneColor(index)).toBe(color)
    }
    expect(laneColor(LANE_COLORS.length)).toBe(laneColor(0))
    expect(laneColor(-1)).toBe(laneColor(LANE_COLORS.length - 1))
  })

  test("no two lanes share a colour", () => {
    expect(new Set(LANE_COLORS).size).toBe(LANE_COLORS.length)
  })
})

describe("the tokens the palette deliberately leaves out", () => {
  // Not a style preference: these are the two a git graph would reach for first,
  // and both are unreadable on the light surface. Pinned so the palette cannot
  // drift back to them, and so this stops failing the day the theme fixes them.
  test.each([["q-brand"], ["q-warn"]])(
    "--%s still fails 3:1 in light mode, which is why it is not a lane",
    (name) => {
      const light = THEMES[1].values
      const ratio = contrast(light.get(name) as string, light.get("q-bg") as string)
      expect(ratio).toBeLessThan(3)
      expect(LANE_COLORS as readonly string[]).not.toContain(`var(--${name})`)
    },
  )
})
