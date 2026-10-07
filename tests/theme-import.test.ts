/**
 * The theme import's mapping, without a browser: the custom properties a
 * design system declares go in (already resolved per theme, as the extractor
 * hands them over), and the quebi tokens, the checks and the CSS come out.
 *
 * The first fixture is the token block of quebi-design-system.html itself —
 * the file this library's theme was translated from by hand — so the import
 * has to reproduce that translation exactly.
 */
import { describe, expect, test } from "bun:test"
import {
  findProperty,
  generateCss,
  importTheme,
  parseColor,
  previewStyle,
  TOKENS,
} from "../src/site/theme-import"

const DESIGN_LIGHT = {
  "bg-000": "#ffffff",
  "bg-100": "#e5e7eb",
  "bg-200": "#d9dce1",
  "glow-from": "#ffffff",
  "glow-to": "#d9dce1",
  text: "#030712",
  "text-body": "#1f2937",
  "text-muted": "#4b5563",
  line: "#03071240",
  "line-strong": "#030712",
  glyph: "#0307120f",
  action: "#030712",
  "on-action": "#ffffff",
  focus: "#030712",
  "shadow-float": "0 1px 2px #0307120f, 0 12px 32px #03071214",
  "radius-s": "6px",
  "radius-l": "22px",
  "font-display": '"Outfit", ui-sans-serif, system-ui, sans-serif',
  "font-text": '"Inter", ui-sans-serif, system-ui, sans-serif',
  "font-mono": '"JetBrains Mono", ui-monospace, monospace',
}

const DESIGN_DARK = {
  ...DESIGN_LIGHT,
  "bg-000": "#030712",
  "bg-100": "#111827",
  "bg-200": "#1f2937",
  "glow-from": "#1f2937",
  "glow-to": "#030712",
  text: "#f9fafb",
  "text-body": "#d1d5db",
  "text-muted": "#9ca3af",
  line: "#ffffff33",
  "line-strong": "#f9fafb",
  glyph: "#ffffff12",
  action: "#f9fafb",
  "on-action": "#030712",
  focus: "#f9fafb",
}

describe("the quebi design system imports as the theme it was translated into", () => {
  const result = importTheme({ light: DESIGN_LIGHT, dark: DESIGN_DARK })

  test("no errors, and both themes", () => {
    expect(result.errors).toEqual([])
    expect(Object.keys(result.themes).sort()).toEqual(["dark", "light"])
  })

  test.each([
    ["bg", "#ffffff", "#030712", "bg-000"],
    ["raised", "#e5e7eb", "#111827", "bg-100"],
    ["pressed", "#d9dce1", "#1f2937", "bg-200"],
    ["fg", "#030712", "#f9fafb", "text"],
    ["fg-muted", "#1f2937", "#d1d5db", "text-body"],
    ["fg-subtle", "#4b5563", "#9ca3af", "text-muted"],
    ["hairline", "#03071240", "#ffffff33", "line"],
    ["rule", "#030712", "#f9fafb", "line-strong"],
    ["action", "#030712", "#f9fafb", "action"],
    ["on-action", "#ffffff", "#030712", "on-action"],
    ["focus", "#030712", "#f9fafb", "focus"],
  ])("%s ← --%4$s", (key, light, dark, property) => {
    expect(result.themes.light?.[key]?.value).toBe(light)
    expect(result.themes.dark?.[key]?.value).toBe(dark)
    expect(result.themes.light?.[key]?.origin).toEqual({ kind: "found", property })
  })

  test("fonts and radii are carried as written", () => {
    expect(result.themes.light?.["font-display"]?.value).toBe(DESIGN_LIGHT["font-display"])
    expect(result.themes.light?.["radius-s"]?.value).toBe("6px")
  })

  test("every contrast check passes, as the design system promises", () => {
    expect(result.checks.filter((c) => !c.pass)).toEqual([])
  })

  test("the CSS writes the selectors quebi-theme.css uses, so it overrides it in order", () => {
    const css = generateCss(result, ["@font-face { font-family: X; src: url(data:,) }"], "ds.html")
    expect(css).toContain("@font-face { font-family: X")
    expect(css).toContain(":root,\n.light {")
    expect(css).toContain(".dark {")
    expect(css).toContain("  --q-bg: #ffffff;")
    expect(css).toContain("  --font-display: \"Outfit\"")
    expect(css).toContain("--q-stage-light: radial-gradient(")
    // Fonts are set once, not per theme.
    expect(css.slice(css.indexOf(".dark {"))).not.toContain("--font-display")
  })
})

describe("a sparse file still produces a complete theme", () => {
  const result = importTheme({ light: { background: "#fafaf9", foreground: "rgb(28 25 23)" } })

  test("bg and fg alone are enough", () => {
    expect(result.errors).toEqual([])
    for (const spec of TOKENS.filter((s) => s.fallback)) {
      expect([spec.key, result.themes.light?.[spec.key]?.origin.kind]).toEqual([spec.key, "derived"])
    }
  })

  test("the derived ink stays legible", () => {
    expect(result.checks.filter((c) => !c.pass)).toEqual([])
  })

  test("the report says what was guessed, and that there is no dark theme", () => {
    expect(result.notes.some((n) => n.startsWith("light: derived"))).toBe(true)
    expect(result.notes.some((n) => n.startsWith("No dark theme found"))).toBe(true)
    expect(generateCss(result, [], "x.html")).not.toContain(".dark {")
  })

  test("state colours and the shadow keep the library's values", () => {
    expect(result.themes.light?.danger?.origin.kind).toBe("default")
    expect(result.themes.light?.["shadow-float"]?.origin.kind).toBe("default")
  })
})

describe("names", () => {
  test("an exact name beats a namespaced one, and the spec's order decides between names", () => {
    expect(findProperty({ "color-text": "#000", text: "#111" }, ["text"])).toBe("text")
    expect(findProperty({ "ds-bg-000": "#fff" }, ["bg-000", "bg"])).toBe("ds-bg-000")
    expect(findProperty({ bg: "#fff", "bg-000": "#eee" }, ["bg-000", "bg"])).toBe("bg-000")
  })

  test("a longer name is not mistaken for a shorter one", () => {
    // `--text-muted` must fill fg-subtle, not fg.
    const result = importTheme({ light: { bg: "#fff", "text-muted": "#4b5563", text: "#030712" } })
    expect(result.themes.light?.fg?.origin).toEqual({ kind: "found", property: "text" })
    expect(result.themes.light?.["fg-subtle"]?.origin).toEqual({ kind: "found", property: "text-muted" })
  })

  test("a dark block identical to the light one is not a dark theme", () => {
    const light = { bg: "#fff", text: "#000" }
    expect(importTheme({ light, dark: { ...light } }).themes.dark).toBeUndefined()
  })
})

describe("what stops an import", () => {
  test("no ground is an error naming the names it looked for", () => {
    const result = importTheme({ light: { text: "#000" } })
    expect(result.errors[0]).toContain("no bg")
    expect(result.errors[0]).toContain("--bg-000")
    expect(result.checks).toEqual([])
  })

  test("an unreadable required colour is an error, an unreadable optional one a note", () => {
    const bad = importTheme({ light: { bg: "nonsense", text: "#000" } })
    expect(bad.errors[0]).toContain("--bg")
    const soft = importTheme({ light: { bg: "#fff", text: "#000", danger: "var-missing" } })
    expect(soft.errors).toEqual([])
    expect(soft.notes.some((n) => n.includes("--danger"))).toBe(true)
  })
})

describe("colour parsing and the preview", () => {
  test.each([
    ["#fff", { r: 255, g: 255, b: 255, a: 1 }],
    ["#03071240", { r: 3, g: 7, b: 18, a: 64 / 255 }],
    ["rgb(3, 7, 18)", { r: 3, g: 7, b: 18, a: 1 }],
    ["rgb(3 7 18 / 50%)", { r: 3, g: 7, b: 18, a: 0.5 }],
    ["rgba(255,255,255,.2)", { r: 255, g: 255, b: 255, a: 0.2 }],
  ])("%s", (value, rgba) => {
    expect(parseColor(value)).toEqual(rgba)
  })

  test("oklch is left to the browser's canvas", () => {
    expect(parseColor("oklch(0.2 0.02 260)")).toBeNull()
  })

  test("the preview is a scoped set of variables, fonts included", () => {
    const result = importTheme({ light: DESIGN_LIGHT, dark: DESIGN_DARK })
    const style = previewStyle(result, "dark")
    expect(style["--q-bg"]).toBe("#030712")
    expect(style["--font-display"]).toBe(DESIGN_LIGHT["font-display"])
  })
})
