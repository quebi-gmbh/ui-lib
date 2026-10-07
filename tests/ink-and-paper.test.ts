/**
 * The Ink & Paper design system, held as data.
 *
 * `quebi-design-system.html` is the source; `src/quebi-theme.css` is its one
 * translation into Tailwind. The design has two surfaces: the app surface
 * (`app-*` tokens) is the theme's default, and the website surface lives on
 * inside `.quebi-editorial`, the scope Stage wears. This file checks the
 * translation in three ways:
 *
 * 1. **The values are the design's values.** Every semantic token, in both
 *    themes and on both surfaces, is the hex the design system's colour table
 *    names — read out of the CSS, not restated from memory.
 * 2. **The contrast promises hold.** On the app surface every text token clears
 *    4.5:1 on every ground, the signal 5.8:1 and focus 3:1; on the website
 *    surface every text token clears 4.5:1 on both ends of the stage glow and
 *    `rule` and `focus` clear 14:1. Those are recomputed here, composited where
 *    a token is translucent, so a later tweak to a grey cannot quietly break one.
 * 3. **The library speaks only this vocabulary.** The retired tokens (mint
 *    brand, cyan line, glow shadows, the 4/8/12/16px radii) are gone from the
 *    source, no component paints a decorative hue, the only shadows sit on a
 *    floating surface or an overlay, the only radii are the three the design allows, and the
 *    hairline is never given a second alpha on top of its own.
 */
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, test } from "bun:test"

const ROOT = join(import.meta.dir, "..")
const THEME = readFileSync(join(ROOT, "src", "quebi-theme.css"), "utf8")

function themeValues(selector: string): Map<string, string> {
  const start = THEME.indexOf(selector)
  expect(start, `${selector} is not in quebi-theme.css`).toBeGreaterThan(-1)
  const block = THEME.slice(start, THEME.indexOf("\n}", start))
  const values = new Map<string, string>()
  for (const [, name, hex] of block.matchAll(/--q-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6,8})\b/g)) {
    values.set(name, hex.toLowerCase())
  }
  return values
}

const LIGHT = themeValues(":root,\n.light {")
const DARK = themeValues(".dark {")
const THEMES = [
  ["daylight", LIGHT],
  ["cinematic", DARK],
] as const

/** The website surface: the app values with `.quebi-editorial`'s on top. */
const EDITORIAL_LIGHT = new Map([...LIGHT, ...themeValues(".quebi-editorial {")])
const EDITORIAL_DARK = new Map([...DARK, ...themeValues(".quebi-editorial {"), ...themeValues(".dark .quebi-editorial {")])
const EDITORIAL = [
  ["daylight", EDITORIAL_LIGHT],
  ["cinematic", EDITORIAL_DARK],
] as const

const rgba = (hex: string): [number, number, number, number] => {
  const h = hex.replace("#", "")
  const [r, g, b] = [0, 2, 4].map((i) => Number.parseInt(h.slice(i, i + 2), 16))
  const a = h.length === 8 ? Number.parseInt(h.slice(6, 8), 16) / 255 : 1
  return [r, g, b, a]
}

/** A possibly translucent colour composited over an opaque ground. */
function over(fg: string, ground: string) {
  const [fr, fgc, fb, a] = rgba(fg)
  const [br, bg, bb] = rgba(ground)
  return [fr * a + br * (1 - a), fgc * a + bg * (1 - a), fb * a + bb * (1 - a)]
}

function luminance([r, g, b]: number[]) {
  const ch = (v: number) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)
}

function contrast(fg: string, ground: string) {
  const a = luminance(over(fg, ground))
  const b = luminance(rgba(ground))
  const [hi, lo] = a > b ? [a, b] : [b, a]
  return (hi + 0.05) / (lo + 0.05)
}

const get = (values: Map<string, string>, token: string) => {
  const v = values.get(token)
  expect(v, `--q-${token} is not declared`).toBeString()
  return v as string
}

describe("the theme carries the design system's app values", () => {
  // The app rows of quebi-design-system.html's colour table, token by token.
  // warn and success are the exception, one step darker in Daylight: the
  // design's #b45309 / #15803d fall to 4.0:1 under the tint a Badge paints.
  const table: Record<string, [string, string]> = {
    bg: ["#ffffff", "#111827"],
    raised: ["#f3f4f6", "#182131"],
    pressed: ["#e5e7eb", "#273142"],
    elevated: ["#ffffff", "#111827"],
    fg: ["#030712", "#f9fafb"],
    "fg-muted": ["#374151", "#d1d5db"],
    "fg-subtle": ["#5b6472", "#9ca3af"],
    hairline: ["#e5e7eb", "#273142"],
    rule: ["#374151", "#f9fafb"],
    action: ["#374151", "#f9fafb"],
    "on-action": ["#ffffff", "#030712"],
    focus: ["#3b5a86", "#a7bbdc"],
    signal: ["#3b5a86", "#a7bbdc"],
    "on-signal": ["#ffffff", "#111827"],
    "signal-inverse": ["#c9d6ec", "#a7bbdc"],
    selected: ["#e6ebf3", "#243149"],
    "on-selected": ["#24344f", "#dde6f5"],
    overlay: ["#374151", "#030712"],
    "on-overlay": ["#ffffff", "#f9fafb"],
    "overlay-ring": ["#374151", "#374151"],
    danger: ["#b91c1c", "#fca5a5"],
    warn: ["#92400e", "#fbbf24"],
    success: ["#065f46", "#4ade80"],
    glyph: ["#0307120f", "#ffffff12"],
    "glow-from": ["#ffffff", "#1f2937"],
    "glow-to": ["#d9dce1", "#030712"],
  }

  for (const [token, [day, night]] of Object.entries(table)) {
    test(`--q-${token}`, () => {
      expect([token, get(LIGHT, token), get(DARK, token)]).toEqual([token, day, night])
    })
  }

  test("daylight is the default theme", () => {
    expect(THEME).toContain(":root,\n.light {")
  })
})

describe("quebi-editorial carries the website's values", () => {
  // The website rows of the same table.
  const table: Record<string, [string, string]> = {
    bg: ["#ffffff", "#030712"],
    raised: ["#e5e7eb", "#111827"],
    pressed: ["#d9dce1", "#1f2937"],
    fg: ["#030712", "#f9fafb"],
    "fg-muted": ["#1f2937", "#d1d5db"],
    "fg-subtle": ["#4b5563", "#9ca3af"],
    hairline: ["#03071240", "#ffffff33"],
    rule: ["#030712", "#f9fafb"],
    glyph: ["#0307120f", "#ffffff12"],
    action: ["#030712", "#f9fafb"],
    "on-action": ["#ffffff", "#030712"],
    focus: ["#030712", "#f9fafb"],
    "glow-from": ["#ffffff", "#1f2937"],
    "glow-to": ["#d9dce1", "#030712"],
  }

  for (const [token, [day, night]] of Object.entries(table)) {
    test(`--q-${token}`, () => {
      expect([token, get(EDITORIAL_LIGHT, token), get(EDITORIAL_DARK, token)]).toEqual([token, day, night])
    })
  }

  test("Stage wears it", () => {
    expect(readFileSync(join(ROOT, "src", "components", "stage.tsx"), "utf8")).toContain('"quebi-editorial ')
  })

  test("so does the home page, the website's one page on this site", () => {
    expect(readFileSync(join(ROOT, "src", "routes", "_index.tsx"), "utf8")).toMatch(/"quebi-editorial [^"]*bg-quebi-bg/)
  })
})

describe("the app surface's contrast promises hold, in both themes", () => {
  const grounds = ["bg", "raised", "pressed", "elevated", "selected"]

  for (const [name, values] of THEMES) {
    test(`${name}: every text token clears 4.5:1 on every app ground`, () => {
      const misses: string[] = []
      for (const text of ["fg", "fg-muted", "fg-subtle"]) {
        for (const ground of grounds) {
          const ratio = contrast(get(values, text), get(values, ground))
          if (ratio < 4.5) misses.push(`${text} on ${ground}: ${ratio.toFixed(2)}:1`)
        }
      }
      expect(misses).toEqual([])
    })

    test(`${name}: the signal clears 5.8:1 on bg, raised and selected, and focus 3:1 everywhere`, () => {
      for (const ground of ["bg", "raised", "selected"]) {
        expect([ground, contrast(get(values, "signal"), get(values, ground)) >= 5.8]).toEqual([ground, true])
      }
      for (const ground of grounds) {
        expect([ground, contrast(get(values, "focus"), get(values, ground)) >= 3]).toEqual([ground, true])
      }
    })

    test(`${name}: the pairs are legible — on-action, on-signal, on-selected, on-overlay, signal-inverse`, () => {
      expect(contrast(get(values, "on-action"), get(values, "action"))).toBeGreaterThanOrEqual(10)
      expect(contrast(get(values, "on-signal"), get(values, "signal"))).toBeGreaterThanOrEqual(4.5)
      expect(contrast(get(values, "on-selected"), get(values, "selected"))).toBeGreaterThanOrEqual(9)
      expect(contrast(get(values, "on-overlay"), get(values, "overlay"))).toBeGreaterThanOrEqual(10)
      expect(contrast(get(values, "signal-inverse"), get(values, "overlay"))).toBeGreaterThanOrEqual(4.5)
    })

    test(`${name}: the state tokens are text — 4.5:1 on bg, raised, elevated and their own 10% tint`, () => {
      const misses: string[] = []
      for (const state of ["danger", "warn", "success"]) {
        const ink = get(values, state)
        for (const ground of ["bg", "raised", "elevated"]) {
          const g = get(values, ground)
          const tint = over(`${ink}1a`, g)
          const tintHex = `#${tint.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`
          for (const [label, surface] of [
            [ground, g],
            [`${ground}+tint`, tintHex],
          ]) {
            const ratio = contrast(ink, surface)
            if (ratio < 4.5) misses.push(`${state} on ${label}: ${ratio.toFixed(2)}:1`)
          }
        }
      }
      expect(misses).toEqual([])
    })

    test(`${name}: rule carries structure at 10:1 on bg`, () => {
      expect(contrast(get(values, "rule"), get(values, "bg"))).toBeGreaterThanOrEqual(10)
    })
  }
})

describe("the website surface's contrast promises hold, in both themes", () => {
  const grounds = ["bg", "raised", "pressed", "elevated", "glow-from", "glow-to"]

  for (const [name, values] of EDITORIAL) {
    test(`${name}: every text token clears 4.5:1 on every ground and on the glow`, () => {
      const misses: string[] = []
      for (const text of ["fg", "fg-muted", "fg-subtle"]) {
        for (const ground of grounds) {
          const ratio = contrast(get(values, text), get(values, ground))
          if (ratio < 4.5) misses.push(`${text} on ${ground}: ${ratio.toFixed(2)}:1`)
        }
      }
      expect(misses).toEqual([])
    })

    test(`${name}: the state tokens are text — 4.5:1 on bg, raised, elevated and their own 10% tint`, () => {
      const misses: string[] = []
      for (const state of ["danger", "warn", "success"]) {
        const ink = get(values, state)
        for (const ground of ["bg", "raised", "elevated"]) {
          const g = get(values, ground)
          const tint = over(`${ink}1a`, g)
          const tintHex = `#${tint.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`
          for (const [label, surface] of [
            [ground, g],
            [`${ground}+tint`, tintHex],
          ]) {
            const ratio = contrast(ink, surface)
            if (ratio < 4.5) misses.push(`${state} on ${label}: ${ratio.toFixed(2)}:1`)
          }
        }
      }
      expect(misses).toEqual([])
    })

    test(`${name}: rule, focus and action carry structure at 14:1 on bg`, () => {
      for (const token of ["rule", "focus", "action"]) {
        expect([token, contrast(get(values, token), get(values, "bg")) >= 14]).toEqual([token, true])
      }
    })

    test(`${name}: on-action is legible on action`, () => {
      expect(contrast(get(values, "on-action"), get(values, "action"))).toBeGreaterThanOrEqual(14)
    })
  }
})

// ---------------------------------------------------------------------------

const LIBRARY = join(ROOT, "src", "components")
const SOURCES = readdirSync(LIBRARY)
  .filter((f) => f.endsWith(".tsx"))
  .map((f) => ({ file: `src/components/${f}`, text: readFileSync(join(LIBRARY, f), "utf8") }))

/** Source with comments removed, so prose that names a retired token is not a finding. */
const code = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1")

function scan(rx: RegExp, files = SOURCES) {
  const hits: string[] = []
  for (const { file, text } of files) {
    for (const m of code(text).matchAll(rx)) hits.push(`${file}: ${m[0]}`)
  }
  return hits
}

describe("the library speaks only the Ink & Paper vocabulary", () => {
  test("no retired token survives", () => {
    expect(
      scan(
        /(?<![\w-])[\w:[\]&>*=/.-]*-quebi-(?:brand(?:-[a-z]+)?|on-brand|line|inverse-(?:bg|fg)|info|accent)(?![\w-])|shadow-quebi-glow(?:-strong)?|rounded(?:-[a-z]{1,2})?-quebi-(?:xs|sm|md|lg)\b/g,
      ),
    ).toEqual([])
  })

  test("no decorative hue — state is a quebi token, and colour-as-content is excused by name", () => {
    // Components whose content *is* a colour: the colour-picking family shows
    // the user's colour, and the EU energy label's band colours are regulation.
    const excused = /^src\/components\/(?:color-[a-z-]+|conform-color-[a-z-]+|energy-class-badge)\.tsx$/
    expect(
      scan(
        /(?<![\w-])(?:bg|text|border|ring|fill|stroke|from|via|to|outline|decoration|divide)(?:-[lrtbxyse])?-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g,
        SOURCES.filter((s) => !excused.test(s.file)),
      ),
    ).toEqual([])
  })

  test("the hairline is never given a second alpha", () => {
    expect(scan(/(?<![\w-])[\w:[\]&>*=/.-]*-quebi-hairline\/[\w[\].]+/g)).toEqual([])
  })

  test("the only radii are none, full, quebi-s and quebi-l", () => {
    expect(
      scan(/(?<![\w-])(?:[\w[\]&>*=/.@-]+:)*rounded(?:-(?:t|b|l|r|s|e|tl|tr|bl|br|ss|se|es|ee))?(?:-(?:xs|sm|md|lg|xl|2xl|3xl))?(?![\w[-])/g),
    ).toEqual([])
  })

  test("the only shadow is the float, and it sits on a floating surface", () => {
    // A stock shadow utility anywhere is a shadow in the page flow.
    expect(scan(/(?<![\w-])(?:[\w[\]&>*=/.@-]+:)*shadow-(?:2xs|xs|sm|md|lg|xl|2xl)(?![\w-])/g)).toEqual([])
    // The float belongs to a surface painted in the elevated token.
    const orphans = SOURCES.filter(
      (s) => code(s.text).includes("shadow-quebi-float") && !code(s.text).includes("bg-quebi-elevated"),
    ).map((s) => s.file)
    expect(orphans).toEqual([])
    // The overlay shadow is a ring in the overlay's own slate: on anything else it is a frame.
    const strays = SOURCES.filter(
      (s) => code(s.text).includes("shadow-quebi-overlay") && !code(s.text).includes("bg-quebi-overlay"),
    ).map((s) => s.file)
    expect(strays).toEqual([])
  })

  test("tv() is the configured one, so the quebi tokens merge inside a variant too", () => {
    // tailwind-variants' own tv merges with a stock tailwind-merge, which files
    // `text-quebi-caption` as a colour and drops it beside `text-quebi-fg`.
    expect(scan(/import \{[^}]*\btv\b[^}]*\} from "tailwind-variants"/g)).toEqual([])
  })
})
