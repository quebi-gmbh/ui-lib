/**
 * Every lane colour must be legible on both quebi surfaces.
 *
 * A lane line is the one part of CommitGraph whose meaning is carried by colour
 * — which of two branches you are following is a hue and nothing else — so WCAG
 * 1.4.11 asks 3:1 of it against its background, and a 1.5px stroke is the
 * thinnest thing on the page to begin with.
 *
 * The check that matters is not "did someone pick sensible tokens once". It is
 * that the numbers stay true after the *theme* moves, which is a file this
 * component does not own and cannot see. So nothing here is hardcoded: the token
 * indirection (`--color-quebi-x: var(--q-y)`) and both themes' `--q-*` values are
 * read out of `src/quebi-theme.css` and the ratios are recomputed. Re-tune a
 * token and this fails, rather than a lane quietly washing out in light mode.
 *
 * It is also the record of why the palette is five hues and not six: the two
 * tokens a git graph would obviously reach for are exactly the two that fail,
 * and the last test pins that so the palette cannot drift back to them.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, test } from "bun:test"
import { LANE_COLOR_TOKENS, laneColor } from "../src/components/commit-graph"

const THEME = readFileSync(join(import.meta.dir, "..", "src", "quebi-theme.css"), "utf8")

/** `--color-quebi-success: var(--q-success)` → `quebi-success` ➝ `q-success`. */
function tokenIndirection(): Map<string, string> {
  const inline = THEME.slice(THEME.indexOf("@theme inline"))
  const block = inline.slice(0, inline.indexOf("\n}"))
  const map = new Map<string, string>()
  for (const [, name, runtime] of block.matchAll(
    /--color-(quebi-[a-z-]+):\s*var\(--(q-[a-z-]+)\)/g,
  )) {
    map.set(name, runtime)
  }
  return map
}

/** The `--q-*` values declared in one theme's block. */
function themeValues(selector: string): Map<string, string> {
  const start = THEME.indexOf(selector)
  expect(start).toBeGreaterThan(-1)
  const block = THEME.slice(start, THEME.indexOf("\n}", start))
  const values = new Map<string, string>()
  for (const [, name, hex] of block.matchAll(/--(q-[a-z-]+):\s*(#[0-9a-fA-F]{6})/g)) {
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

const INDIRECTION = tokenIndirection()
const THEMES = [
  { name: "dark", values: themeValues(":root,\n.dark {") },
  { name: "light", values: themeValues(".light {") },
] as const

/** Resolve a `quebi-*` token to the hex one theme gives it. */
function resolve(token: string, values: Map<string, string>) {
  const runtime = INDIRECTION.get(token)
  expect(runtime, `${token} is not a --color-quebi-* token declared in @theme inline`).toBeString()
  const hex = values.get(runtime as string)
  expect(hex, `--${runtime} has no value in this theme`).toBeString()
  return hex as string
}

describe("the theme file parses", () => {
  test("both themes declare every --q-* value the lane palette needs", () => {
    for (const { name, values } of THEMES) {
      expect(values.get("q-bg"), `${name} has no --q-bg`).toBeString()
      expect(values.size).toBeGreaterThan(10)
    }
  })
})

describe("every lane colour is legible on both surfaces", () => {
  for (const { name, values } of THEMES) {
    test.each(LANE_COLOR_TOKENS.map((token) => [token] as const))(
      `${name}: %s clears 3:1 against the page background`,
      (token) => {
        const ratio = contrast(resolve(token, values), values.get("q-bg") as string)
        expect(ratio).toBeGreaterThanOrEqual(3)
      },
    )
  }

  test("the palette is the set laneColor actually draws from", () => {
    for (const [index, token] of LANE_COLOR_TOKENS.entries()) {
      expect(laneColor(index)).toBe(`var(--color-${token})`)
    }
    // …and it cycles, so there is no lane index without a colour.
    expect(laneColor(LANE_COLOR_TOKENS.length)).toBe(laneColor(0))
    expect(laneColor(-1)).toBe(laneColor(LANE_COLOR_TOKENS.length - 1))
  })

  test("adjacent lanes never share a token", () => {
    expect(new Set(LANE_COLOR_TOKENS).size).toBe(LANE_COLOR_TOKENS.length)
  })
})

describe("the tokens the palette deliberately leaves out", () => {
  // Not a style preference: these are the two a git graph would reach for first,
  // and both are unreadable on the light surface. Pinned so the palette cannot
  // drift back to them, and so this stops failing the day the theme fixes them.
  test.each([["quebi-brand"], ["quebi-warn"]])(
    "%s still fails 3:1 in light mode, which is why it is not a lane",
    (token) => {
      const light = THEMES[1].values
      const ratio = contrast(resolve(token, light), light.get("q-bg") as string)
      expect(ratio).toBeLessThan(3)
      expect(LANE_COLOR_TOKENS as readonly string[]).not.toContain(token)
    },
  )
})
