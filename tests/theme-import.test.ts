/**
 * The theme import, without a browser: custom properties and component probes
 * go in (already resolved per theme, as the extractor hands them over), values
 * come out, and from values the checks, the CSS, the preview and the link.
 *
 * Two fixtures are real design systems: the token block of
 * quebi-design-system.html — which the library's own theme was translated from
 * by hand, so the import has to reproduce that translation — and the token
 * block and component probes of quebi-neubrutalism-design-system.html, whose
 * look is mostly shape and has to survive the import.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, test } from "bun:test"
import {
  checks,
  decodeTheme,
  defaultOf,
  defaultValues,
  encodeTheme,
  findProperty,
  generateCss,
  importTheme,
  isSafeValue,
  parseColor,
  previewStyle,
  type Probes,
  TOKENS,
} from "../src/site/theme-import"

const THEME_CSS = readFileSync(join(import.meta.dir, "..", "src", "quebi-theme.css"), "utf8")

const INK_LIGHT = {
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

const INK_DARK = {
  ...INK_LIGHT,
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

/** The app tokens the updated design file adds, light and dark, as it declares them. */
const APP_LIGHT = {
  "app-bg": "#ffffff",
  "app-surface": "#f3f4f6",
  "app-line": "#e5e7eb",
  "app-text": "#030712",
  "app-text-2": "#374151",
  "app-text-muted": "#5b6472",
  "app-action": "#374151",
  "app-on-action": "#ffffff",
  "app-overlay": "#374151",
  "app-on-overlay": "#ffffff",
  "app-overlay-ring": "#374151",
  "app-signal": "#3b5a86",
  "app-on-signal": "#ffffff",
  "app-signal-inverse": "#c9d6ec",
  "app-selected": "#e6ebf3",
  "app-on-selected": "#24344f",
  "app-success": "#15803d",
  "app-warning": "#b45309",
  "app-danger": "#b91c1c",
  "app-danger-line": "#fca5a5",
}

const APP_DARK = {
  "app-bg": "#111827",
  "app-surface": "#182131",
  "app-line": "#273142",
  "app-text": "#f9fafb",
  "app-text-2": "#d1d5db",
  "app-text-muted": "#9ca3af",
  "app-action": "#f9fafb",
  "app-on-action": "#030712",
  "app-overlay": "#030712",
  "app-on-overlay": "#f9fafb",
  "app-overlay-ring": "#374151",
  "app-signal": "#a7bbdc",
  "app-on-signal": "#111827",
  "app-signal-inverse": "#a7bbdc",
  "app-selected": "#243149",
  "app-on-selected": "#dde6f5",
  "app-success": "#4ade80",
  "app-warning": "#fbbf24",
  "app-danger": "#fca5a5",
  "app-danger-line": "#7f1d1d",
}

describe("the defaults are the library's own theme", () => {
  // Every `--q-*` literal the theme file declares for a token, per theme.
  const block = (selector: string) => {
    const start = THEME_CSS.indexOf(selector)
    return THEME_CSS.slice(start, THEME_CSS.indexOf("\n}", start))
  }
  const declared = (css: string, target: string) =>
    css.match(new RegExp(`${target.replace(/[-]/g, "\\-")}:\\s*([^;]+);`))?.[1].trim()

  // `field` expands to several variables and `field-px` is the box padding an
  // underline does not use, so neither is a single declared value.
  test.each(
    TOKENS.filter((t) => t.target.startsWith("--q-") && t.key !== "field" && t.key !== "field-px").map((t) => [
      t.key,
      t,
    ]),
  )(
    "%s",
    (_key, spec) => {
      const shape = block(":root {")
      const light = declared(block(":root,\n.light {"), spec.target) ?? declared(shape, spec.target)
      const expected = defaultOf(spec, "light")
      // Shadows are written listable in the theme (`0 0 #0000`) and `none` in the editor.
      const normalise = (v?: string) => (v === "0 0 #0000" ? "none" : v)
      expect([spec.key, normalise(light)]).toEqual([spec.key, expected])
      if (spec.perTheme) {
        expect([spec.key, normalise(declared(block(".dark {"), spec.target))]).toEqual([
          spec.key,
          defaultOf(spec, "dark"),
        ])
      }
    },
  )
})

describe("the design file with its app surface imports as the library default", () => {
  const result = importTheme({ light: { ...INK_LIGHT, ...APP_LIGHT }, dark: { ...INK_DARK, ...APP_DARK } })

  test.each([
    ["bg", "#ffffff", "#111827"],
    ["raised", "#f3f4f6", "#182131"],
    ["pressed", "#e5e7eb", "#273142"],
    ["fg-muted", "#374151", "#d1d5db"],
    ["fg-subtle", "#5b6472", "#9ca3af"],
    ["hairline", "#e5e7eb", "#273142"],
    ["rule", "#374151", "#f9fafb"],
    ["action", "#374151", "#f9fafb"],
    ["focus", "#3b5a86", "#a7bbdc"],
    ["signal", "#3b5a86", "#a7bbdc"],
    ["selected", "#e6ebf3", "#243149"],
    ["overlay", "#374151", "#030712"],
  ])("%s", (key, light, dark) => {
    expect(result.values.light[key]).toBe(light)
    expect(result.values.dark?.[key]).toBe(dark)
  })

  test("every contrast check passes", () => {
    expect(checks(result.values).filter((c) => !c.pass)).toEqual([])
  })
})

describe("the quebi design system imports as the theme it was translated into", () => {
  const probes: Probes = {
    light: {
      page: { selector: ".qb-page", bg: "rgb(255, 255, 255)", image: "none", imageSize: "auto" },
      button: {
        selector: ".qb-btn",
        radius: "0px",
        border: "1px",
        shadow: "none",
        font: '"Inter", ui-sans-serif, system-ui, sans-serif',
      },
      input: { selector: ".qb-field input", radius: "0px", borderSide: "0px", paddingLeft: "0px", shadow: "none" },
    },
  }
  const result = importTheme({ light: INK_LIGHT, dark: INK_DARK }, probes)

  test("no errors, and both themes", () => {
    expect(result.errors).toEqual([])
    expect(result.values.dark).toBeDefined()
  })

  test.each([
    ["bg", "#ffffff", "#030712"],
    ["raised", "#e5e7eb", "#111827"],
    ["fg", "#030712", "#f9fafb"],
    ["fg-subtle", "#4b5563", "#9ca3af"],
    ["hairline", "#03071240", "#ffffff33"],
    ["action", "#030712", "#f9fafb"],
    ["on-action", "#ffffff", "#030712"],
  ])("%s", (key, light, dark) => {
    expect(result.values.light[key]).toBe(light)
    expect(result.values.dark?.[key]).toBe(dark)
  })

  test("its shape is Ink & Paper's: square, 1px, flat, underlined", () => {
    expect(result.values.light["radius-control"]).toBe("0px")
    expect(result.values.light["border-control"]).toBe("1px")
    expect(result.values.light.field).toBe("underline")
    expect(result.values.light["shadow-control"]).toBe("none")
  })

  test("every contrast check passes, as the design system promises", () => {
    expect(checks(result.values).filter((c) => !c.pass)).toEqual([])
  })
})

describe("neubrutalism keeps its shape", () => {
  // The neubrutalism file's tokens, as the browser resolves them.
  const light = {
    "bg-000": "#ffffff",
    "bg-100": "#f3f4f6",
    "bg-200": "#e5e7eb",
    text: "#030712",
    "text-body": "#1f2937",
    "text-muted": "#4b5563",
    border: "#030712",
    action: "#030712",
    "on-action": "#ffffff",
    focus: "#030712",
    "shadow-hard": "5px 5px 0 #030712",
    "radius-s": "4px",
    "radius-m": "8px",
    "radius-l": "10px",
    "font-display": '"Outfit", ui-sans-serif',
    "font-text": '"Inter", ui-sans-serif',
    "font-mono": '"JetBrains Mono", ui-monospace',
  }
  const dark = {
    ...light,
    "bg-000": "#111827",
    "bg-100": "#030712",
    "bg-200": "#1f2937",
    text: "#f9fafb",
    "text-body": "#d1d5db",
    "text-muted": "#9ca3af",
    border: "#f9fafb",
    action: "#f9fafb",
    "on-action": "#030712",
    focus: "#f9fafb",
    "shadow-hard": "5px 5px 0 #f9fafb",
  }
  const probesFor = (ink: string, page: string, box: string, dot: string) => ({
    page: {
      selector: ".nb-page",
      bg: page,
      image: `radial-gradient(${dot} 1px, transparent 1px)`,
      imageSize: "14px 14px",
    },
    button: {
      selector: ".nb-btn",
      radius: "8px",
      border: "2px",
      shadow: `${ink} 4px 4px 0px 0px`,
      font: '"JetBrains Mono", ui-monospace',
      press: "4px",
    },
    solid: { selector: ".nb-btn-solid", shadow: "rgb(156, 163, 175) 4px 4px 0px 0px" },
    input: { selector: ".nb-input", radius: "8px", borderSide: "2px", paddingLeft: "12px", shadow: `${ink} 4px 4px 0px 0px` },
    card: { selector: ".nb-box", radius: "10px", border: "2px", shadow: `${ink} 5px 5px 0px 0px`, bg: box },
    check: { selector: ".nb-check input", radius: "4px" },
  })
  const result = importTheme(
    { light, dark },
    {
      light: probesFor("rgb(3, 7, 18)", "rgb(243, 244, 246)", "rgb(255, 255, 255)", "rgb(209, 213, 219)"),
      dark: probesFor("rgb(249, 250, 251)", "rgb(3, 7, 18)", "rgb(17, 24, 39)", "rgb(31, 41, 55)"),
    },
  )

  test("the page is the dotted grey, and cards are the white boxes on it", () => {
    expect(result.values.light.bg).toBe("#f3f4f6")
    expect(result.values.light.card).toBe("#ffffff")
    expect(result.values.dark?.bg).toBe("#030712")
    expect(result.values.dark?.card).toBe("#111827")
    expect(result.origins.light.bg).toEqual({ kind: "probed", selector: ".nb-page" })
    expect(result.values.light["page-image"]).toContain("radial-gradient")
    expect(result.values.light["page-image-size"]).toBe("14px 14px")
  })

  test("a hovered row does not vanish into the page", () => {
    // bg-100 is the page here, so it cannot also be the hover ground.
    expect(result.values.light.raised).not.toBe(result.values.light.bg)
  })

  test("controls are rounded, ruled at 2px, hard-shadowed, mono, and press in", () => {
    const l = result.values.light
    expect(l["radius-control"]).toBe("8px")
    expect(l["border-control"]).toBe("2px")
    expect(l["shadow-control"]).toBe("rgb(3, 7, 18) 4px 4px 0px 0px")
    expect(l["shadow-action"]).toBe("rgb(156, 163, 175) 4px 4px 0px 0px")
    expect(l["font-control"]).toContain("JetBrains Mono")
    expect(l.press).toBe("4px")
    expect(l.field).toBe("box")
    expect(l["field-px"]).toBe("12px")
    expect(l["radius-mark"]).toBe("4px")
  })

  test("cards are boxes: rounded, ruled, hard-shadowed", () => {
    expect(result.values.light["radius-surface"]).toBe("10px")
    expect(result.values.light["border-surface"]).toBe("2px")
    expect(result.values.light["shadow-surface"]).toBe("rgb(3, 7, 18) 5px 5px 0px 0px")
    expect(result.values.dark?.["shadow-surface"]).toBe("rgb(249, 250, 251) 5px 5px 0px 0px")
  })

  test("the CSS boxes the fields and puts shape on :root", () => {
    const css = generateCss(result.values, [], "neubrutalism")
    const root = css.slice(css.indexOf(":root,\n.light {"), css.indexOf(".dark {"))
    expect(root).toContain("--q-radius-control: 8px;")
    expect(root).toContain("--q-field-border-x: var(--q-border-control);")
    expect(root).toContain("--q-field-px: 12px;")
    expect(root).toContain("--q-page-image: radial-gradient(")
    expect(css.slice(css.indexOf(".dark {"))).toContain("--q-shadow-surface: rgb(249, 250, 251) 5px 5px 0px 0px;")
  })
})

describe("a sparse file still produces a complete theme", () => {
  const result = importTheme({ light: { background: "#fafaf9", foreground: "rgb(28 25 23)" } })

  test("bg and fg alone are enough; every token has a value", () => {
    expect(result.errors).toEqual([])
    for (const spec of TOKENS) expect([spec.key, typeof result.values.light[spec.key]]).toEqual([spec.key, "string"])
    for (const spec of TOKENS.filter((s) => s.fallback)) {
      expect([spec.key, result.origins.light[spec.key]?.kind]).toEqual([spec.key, "derived"])
    }
  })

  test("the derived ink stays legible", () => {
    expect(checks(result.values).filter((c) => !c.pass)).toEqual([])
  })

  test("the report says what was guessed, and that there is no dark theme", () => {
    expect(result.notes.some((n) => n.startsWith("light: derived"))).toBe(true)
    expect(result.notes.some((n) => n.startsWith("No dark theme found"))).toBe(true)
    expect(generateCss(result.values, [], "x")).not.toContain(".dark {")
  })
})

describe("names", () => {
  test("an exact name beats a namespaced one, and the spec's order decides between names", () => {
    expect(findProperty({ "color-text": "#000", text: "#111" }, ["text"])).toBe("text")
    expect(findProperty({ "ds-bg-000": "#fff" }, ["bg-000", "bg"])).toBe("ds-bg-000")
    expect(findProperty({ bg: "#fff", "bg-000": "#eee" }, ["bg-000", "bg"])).toBe("bg-000")
  })

  test("a longer name is not mistaken for a shorter one", () => {
    const result = importTheme({ light: { bg: "#fff", "text-muted": "#4b5563", text: "#030712" } })
    expect(result.origins.light.fg).toEqual({ kind: "found", property: "text" })
    expect(result.origins.light["fg-subtle"]).toEqual({ kind: "found", property: "text-muted" })
  })

  test("a dark block identical to the light one is not a dark theme", () => {
    const light = { bg: "#fff", text: "#000" }
    expect(importTheme({ light, dark: { ...light } }).values.dark).toBeUndefined()
  })

  test("no ground is an error naming the names it looked for", () => {
    const result = importTheme({ light: { text: "#000" } })
    expect(result.errors[0]).toContain("no bg")
    expect(result.errors[0]).toContain("--bg-000")
  })
})

describe("sharing and safety", () => {
  test("a theme survives the round trip through a link", async () => {
    const values = defaultValues()
    values.light.action = "#b45309"
    values.light["radius-control"] = "8px"
    values.dark = undefined
    const encoded = await encodeTheme(values)
    expect(encoded).toMatch(/^[zj][\w-]+$/)
    const back = await decodeTheme(encoded)
    expect(back.light.action).toBe("#b45309")
    expect(back.light["radius-control"]).toBe("8px")
    expect(back.light.fg).toBe(defaultValues().light.fg)
    expect(back.dark).toBeUndefined()
  })

  test("only what differs from the defaults travels, so an untouched theme is a short link", async () => {
    expect((await encodeTheme(defaultValues())).length).toBeLessThan(40)
  })

  test("a value that could escape its declaration is never decoded or written", async () => {
    expect(isSafeValue("#fff; } body { background: red")).toBe(false)
    expect(isSafeValue("url(https://example.com/x.png)")).toBe(false)
    expect(isSafeValue("radial-gradient(#d1d5db 1px, transparent 1px)")).toBe(true)

    const values = defaultValues()
    values.light.bg = "#fff;}html{display:none"
    const css = generateCss(values, [], "x")
    expect(css).not.toContain("display:none")
    const back = await decodeTheme(await encodeTheme(values))
    expect(back.light.bg).toBe(defaultValues().light.bg)
  })

  test("a link with a foreign prefix is refused", async () => {
    await expect(decodeTheme("xabc")).rejects.toThrow("not a theme link")
  })
})

describe("colour parsing and the preview", () => {
  test.each([
    ["#fff", { r: 255, g: 255, b: 255, a: 1 }],
    ["#03071240", { r: 3, g: 7, b: 18, a: 64 / 255 }],
    ["rgb(3, 7, 18)", { r: 3, g: 7, b: 18, a: 1 }],
    ["rgb(3 7 18 / 50%)", { r: 3, g: 7, b: 18, a: 0.5 }],
  ])("%s", (value, rgba) => {
    expect(parseColor(value)).toEqual(rgba)
  })

  test("the preview is a scoped set of every variable, shape and fonts included", () => {
    const values = defaultValues()
    values.light["radius-control"] = "8px"
    const style = previewStyle(values, "dark")
    expect(style["--q-bg"]).toBe("#111827")
    expect(style["--q-radius-control"]).toBe("8px")
    expect(style["--font-display"]).toContain("Outfit")
    expect(style["--q-shadow-control"]).toBe("0 0 #0000")
  })
})
