/**
 * Theme import — turn a design system into a quebi theme, and a theme into a
 * stylesheet, a preview and a link.
 *
 * A theme is plain data: `ThemeValues`, one string per token (`TOKENS` in
 * `theme-tokens.ts`) for Daylight, and optionally one per per-theme token for
 * Cinematic. Everything else is computed from it — the contrast checks, the
 * CSS, the scoped preview, the shareable URL — which is what lets the /theme
 * editor change any value by hand and see all of it follow.
 *
 * `importTheme` builds those values from a design system in two passes:
 *
 * 1. **Names.** The file's resolved custom properties, matched by name (exact
 *    first, then namespaced: `--ds-bg-000` fills `bg`).
 * 2. **Components.** What the file's own component classes compute to —
 *    `.x-btn`, `.x-input`, `.x-box`, `.x-page`, `.x-check input` — read by
 *    `theme-extract.ts` in its sandbox. This is where shape comes from: a
 *    design system rarely names "the radius of a button", but its button has
 *    one. A component beats a name — `--bg-000` is the page in one system and
 *    the card in the next — unless the property is named exactly after the
 *    quebi token.
 *
 * Whatever neither pass finds is derived (a colour, from `bg` and `fg`) or
 * left at the library default, and the result says which.
 *
 * This module is pure; the browser half is `theme-extract.ts`.
 */

import {
  contrast,
  defaultOf,
  formatColor,
  mix,
  parseColor,
  type PropertyMap,
  type RGBA,
  type SourceValues,
  type ThemeName,
  type TokenSpec,
  withAlpha,
} from "@/site/theme-color"
import { DARK_SELECTORS, TOKEN_BY_KEY, TOKENS } from "@/site/theme-tokens"

export * from "@/site/theme-color"
export { DARK_SELECTORS, GROUP_LABEL, TOKEN_BY_KEY, TOKENS } from "@/site/theme-tokens"

type Parse = (value: string) => RGBA | null

/** A theme as data. `light` also carries every token that is not per theme. */
export interface ThemeValues {
  light: Record<string, string>
  dark?: Record<string, string>
}

export type Origin =
  | { kind: "found"; property: string }
  | { kind: "probed"; selector: string }
  | { kind: "derived"; note: string }
  | { kind: "default" }

// ---------------------------------------------------------------------------
// Probes: what the file's own components compute to (see theme-extract.ts)

export interface ProbeSet {
  page?: { selector: string; bg?: string; image?: string; imageSize?: string }
  button?: { selector: string; radius: string; border: string; shadow: string; font: string; press?: string }
  solid?: { selector: string; shadow: string }
  input?: { selector: string; radius: string; borderSide: string; paddingLeft: string; shadow: string }
  card?: { selector: string; radius: string; border: string; shadow: string; bg?: string }
  check?: { selector: string; radius: string }
}

export interface Probes {
  light: ProbeSet
  dark?: ProbeSet
}

// ---------------------------------------------------------------------------

/** The library's own theme, as values: the editor's blank page. */
export function defaultValues(): ThemeValues {
  const light: Record<string, string> = {}
  const dark: Record<string, string> = {}
  for (const spec of TOKENS) {
    light[spec.key] = defaultOf(spec, "light")
    if (spec.perTheme) dark[spec.key] = defaultOf(spec, "dark")
  }
  return { light, dark }
}

/**
 * The property a spec matches in `props`: an exact name first (in the spec's
 * order), then a namespaced one that ends in `-<name>`. Exact beats namespaced,
 * so `--text` is never shadowed by `--color-text` when both exist.
 */
export function findProperty(props: PropertyMap, names: string[]): string | undefined {
  for (const name of names) if (props[name]?.trim()) return name
  const keys = Object.keys(props)
  for (const name of names) {
    const hit = keys.find((k) => k.endsWith(`-${name}`) && props[k]?.trim())
    if (hit) return hit
  }
  return undefined
}

const isOpaque = (parse: Parse, value?: string) => {
  const c = value ? parse(value) : null
  return c !== null && c.a > 0.99
}

/** `translate(4px, 4px)`, `translate(4px)`, `4px 4px` → `4px`. */
export function pressFrom(transform?: string): string | undefined {
  const m = transform?.match(/(-?[\d.]+)px/)
  return m && Number(m[1]) > 0 ? `${Number(m[1])}px` : undefined
}

/** Probed values for one theme, keyed by token, each with the selector it came from. */
function probedValues(probe: ProbeSet | undefined, parse: Parse): Record<string, [string, string]> {
  const out: Record<string, [string, string]> = {}
  if (!probe) return out
  const { page, button, solid, input, card, check } = probe
  if (page && isOpaque(parse, page.bg)) out.bg = [page.bg as string, page.selector]
  if (page?.image && page.image !== "none") {
    out["page-image"] = [page.image, page.selector]
    if (page.imageSize && page.imageSize !== "auto") out["page-image-size"] = [page.imageSize, page.selector]
  }
  if (card) {
    if (isOpaque(parse, card.bg)) out.card = [card.bg as string, card.selector]
    out["radius-surface"] = [card.radius, card.selector]
    out["border-surface"] = [card.border, card.selector]
    out["shadow-surface"] = [card.shadow, card.selector]
  }
  if (button) {
    out["radius-control"] = [button.radius, button.selector]
    out["border-control"] = [button.border, button.selector]
    out["shadow-control"] = [button.shadow, button.selector]
    out["font-control"] = [button.font, button.selector]
    if (button.press) out.press = [button.press, `${button.selector}:hover`]
  }
  if (solid) out["shadow-action"] = [solid.shadow, solid.selector]
  if (input) {
    const boxed = Number.parseFloat(input.borderSide) > 0
    out.field = [boxed ? "box" : "underline", input.selector]
    if (boxed) out["field-px"] = [input.paddingLeft, input.selector]
    if (!out["radius-control"]) out["radius-control"] = [input.radius, input.selector]
    if (!out["shadow-control"] || out["shadow-control"][0] === "none") {
      out["shadow-control"] = [input.shadow, input.selector]
    }
  }
  if (check) out["radius-mark"] = [check.radius, check.selector]
  return out
}

interface Mapped {
  values: Record<string, string>
  origins: Record<string, Origin>
}

/**
 * A probe beats a name, because a component's computed style is what the
 * design actually does and a name is a guess at what it means: `--bg-000` is
 * the page in one system and the card in the next, `--shadow-hard` could be
 * anything. Only a property named exactly after the quebi token (`--card`,
 * `--radius-control`) outranks the component.
 */
const probeWins = (spec: TokenSpec, property?: string) => property !== spec.key

function mapTheme(
  props: PropertyMap,
  probe: ProbeSet | undefined,
  theme: ThemeName,
  parse: Parse,
  errors: string[],
  notes: string[],
): Mapped {
  const values: Record<string, string> = {}
  const origins: Record<string, Origin> = {}
  const colors: Record<string, RGBA> = {}
  const probed = probedValues(probe, parse)
  const get = (key: string): RGBA => {
    const c = colors[key]
    if (!c) throw new Error(`token ${key} resolved out of order`)
    return c
  }

  for (const spec of TOKENS) {
    if (!spec.perTheme && theme === "dark") continue
    const property = findProperty(props, spec.names)
    const raw = property ? props[property].trim() : undefined
    const fromProbe = probed[spec.key]

    const take = (value: string, origin: Origin) => {
      values[spec.key] = value
      origins[spec.key] = origin
      if (spec.kind === "color") {
        const c = parse(value)
        if (c) colors[spec.key] = c
      }
    }

    if (fromProbe && probeWins(spec, property)) {
      const [value, selector] = fromProbe
      const parsed = spec.kind === "color" ? parse(value) : null
      if (spec.kind !== "color" || parsed) {
        take(parsed ? formatColor(parsed) : value, { kind: "probed", selector })
        continue
      }
    }

    if (spec.kind === "color") {
      const parsed = raw ? parse(raw) : null
      if (parsed) {
        take(formatColor(parsed), { kind: "found", property: property as string })
        continue
      }
      if (spec.required) {
        errors.push(
          raw
            ? `${theme}: --${property} ("${raw}") is not a colour this page can read.`
            : `${theme}: no ${spec.key} — define one of ${spec.names.map((n) => `--${n}`).join(", ")}.`,
        )
        continue
      }
      if (raw && property) notes.push(`${theme}: --${property} ("${raw}") is not a colour; ${spec.key} was not taken from it.`)
      if (spec.fallback && colors.bg && colors.fg) {
        take(formatColor(spec.fallback.derive(get, theme)), { kind: "derived", note: spec.fallback.note })
        continue
      }
      take(defaultOf(spec, theme), { kind: "default" })
      continue
    }

    if (raw && property) {
      take(raw, { kind: "found", property })
      continue
    }
    take(defaultOf(spec, theme), { kind: "default" })
  }

  // A design whose page is its second grey (cards on a tinted ground) leaves
  // `raised` the same colour as the page, and a hovered row would vanish.
  // Step the two hover grounds one rung down instead.
  if (colors.bg && colors.fg && values.raised === values.bg) {
    values.raised = values.pressed
    values.pressed = formatColor(mix(colors.fg, colors.bg, 0.2))
    origins.raised = { kind: "derived", note: "pressed, because raised is the page colour" }
    origins.pressed = { kind: "derived", note: "fg mixed 20% into bg" }
  }

  return { values, origins }
}

export interface ImportResult {
  values: ThemeValues
  origins: { light: Record<string, Origin>; dark?: Record<string, Origin> }
  /** Problems that stop the import. */
  errors: string[]
  /** What the reader should know: guessed values, a missing dark theme. */
  notes: string[]
}

/** Map a design system onto the quebi tokens. */
export function importTheme(source: SourceValues, probes?: Probes, parse: Parse = parseColor): ImportResult {
  const errors: string[] = []
  const notes: string[] = []
  const light = mapTheme(source.light, probes?.light, "light", parse, errors, notes)
  const result: ImportResult = { values: { light: light.values }, origins: { light: light.origins }, errors, notes }

  if (source.dark) {
    // Probes carry colour (a page ground, an inked shadow), so the dark theme
    // reads only its own; shape is global and comes from Daylight anyway.
    const dark = mapTheme(source.dark, probes?.dark, "dark", parse, errors, notes)
    // Whether the *file* has a dark theme: its declared values or its probed
    // components differ. The mapped values always differ somewhere, since
    // whatever the file leaves out falls back to each theme's own default.
    const differs =
      JSON.stringify(source.dark) !== JSON.stringify(source.light) ||
      (probes?.dark !== undefined && JSON.stringify(probes.dark) !== JSON.stringify(probes.light))
    if (differs) {
      result.values.dark = dark.values
      result.origins.dark = dark.origins
    }
  }
  if (!result.values.dark) {
    notes.push(
      `No dark theme found (looked for ${DARK_SELECTORS.join(", ")}). The theme sets Daylight; Cinematic keeps the library's values.`,
    )
  }

  for (const [name, origins] of Object.entries(result.origins) as [ThemeName, Record<string, Origin>][]) {
    const derived = Object.entries(origins)
      .filter(([, o]) => o.kind === "derived")
      .map(([k]) => k)
    if (derived.length) notes.push(`${name}: derived ${derived.join(", ")} from the tokens that were found.`)
  }
  return result
}

// ---------------------------------------------------------------------------
// Evaluation: colours, checks

export interface Check {
  theme: ThemeName
  label: string
  ratio: number
  min: number
  pass: boolean
}

/** One theme's values with the global tokens filled in from Daylight. */
export const themeOf = (values: ThemeValues, theme: ThemeName): Record<string, string> =>
  theme === "dark" && values.dark ? { ...values.light, ...values.dark } : values.light

/** A token's colour, following `var(--q-<key>)` references to other tokens. */
function colorOf(t: Record<string, string>, key: string, parse: Parse, depth = 0): RGBA | null {
  const v = t[key]?.trim()
  if (!v || depth > 4) return null
  const ref = v.match(/^var\(--q-([a-z-]+)\)$/)
  if (ref) return colorOf(t, ref[1], parse, depth + 1)
  return parse(v)
}

/** Every colour of one theme, parsed — `null` where a value is not a colour. */
export function colorsOf(values: ThemeValues, theme: ThemeName, parse: Parse = parseColor): Record<string, RGBA | null> {
  const t = themeOf(values, theme)
  return Object.fromEntries(TOKENS.filter((s) => s.kind === "color").map((s) => [s.key, colorOf(t, s.key, parse)]))
}

export function checks(values: ThemeValues, parse: Parse = parseColor): Check[] {
  const out: Check[] = []
  for (const theme of ["light", "dark"] as ThemeName[]) {
    if (theme === "dark" && !values.dark) continue
    const c = colorsOf(values, theme, parse)
    const add = (label: string, fg?: RGBA | null, ground?: RGBA | null, min = 4.5) => {
      if (!fg || !ground) return
      const ratio = contrast(fg, ground)
      out.push({ theme, label, ratio, min, pass: ratio >= min })
    }
    for (const text of ["fg", "fg-muted", "fg-subtle"]) {
      for (const ground of ["bg", "card", "raised", "elevated"]) add(`${text} on ${ground}`, c[text], c[ground])
    }
    add("on-action on action", c["on-action"], c.action)
    // The signal is text — a link — and the ground of a checked box.
    for (const ground of ["bg", "card", "raised", "selected"]) add(`signal on ${ground}`, c.signal, c[ground])
    add("on-signal on signal", c["on-signal"], c.signal)
    add("on-selected on selected", c["on-selected"], c.selected)
    add("on-overlay on overlay", c["on-overlay"], c.overlay)
    add("signal-inverse on overlay", c["signal-inverse"], c.overlay)
    add("rule on bg (non-text, 3:1)", c.rule, c.bg, 3)
    add("focus on bg (non-text, 3:1)", c.focus, c.bg, 3)
    for (const state of ["danger", "warn", "success"]) add(`${state} on bg`, c[state], c.bg)
  }
  return out
}

// ---------------------------------------------------------------------------
// Output: variables, CSS, preview

const STAGE_GEOMETRY: Record<ThemeName, (from: string, to: string) => string> = {
  light: (from, to) => `radial-gradient(110% 90% at 85% 0%, ${from} 0%, ${to} 100%)`,
  dark: (from, to) => `radial-gradient(120% 90% at 80% 10%, ${from} 0%, ${to} 60%)`,
}

/**
 * Whether a value may be written into a stylesheet. Values reach the CSS from
 * a file the reader chose, from the editor, and from a shared link someone
 * else made — so nothing that could close the declaration (`;`, `{`, `}`),
 * open markup, escape, or fetch (`url()`, `@import`) is ever written.
 */
export function isSafeValue(value: string): boolean {
  return value.length <= 400 && !/[;{}<>\\]|url\s*\(|@import|expression\s*\(/i.test(value)
}

/** Shadows that sit beside a focus shadow are written as a transparent shadow, never `none`. */
const LISTABLE_SHADOWS = new Set(["shadow-control", "shadow-action", "shadow-surface"])

function variable(spec: TokenSpec, value: string): [string, string][] {
  if (spec.key === "field" || spec.key === "field-px" || !isSafeValue(value)) return []
  if (LISTABLE_SHADOWS.has(spec.key) && value.trim() === "none") return [[spec.target, "0 0 #0000"]]
  return [[spec.target, value]]
}

function fieldVariables(t: Record<string, string>): [string, string][] {
  if (t.field !== "box") {
    return [
      ["--q-field-border-x", "0px"],
      ["--q-field-boxed", "0"],
      ["--q-field-px", "0px"],
      ["--q-field-bg", "transparent"],
      ["--q-field-focus", "inset 0 -1px 0 var(--q-focus)"],
      ["--q-field-focus-danger", "inset 0 -1px 0 var(--q-danger)"],
      ["--q-field-line", "var(--q-rule)"],
    ]
  }
  return [
    ["--q-field-border-x", "var(--q-border-control)"],
    ["--q-field-boxed", "1"],
    ["--q-field-px", t["field-px"] && isSafeValue(t["field-px"]) ? t["field-px"] : "12px"],
    ["--q-field-bg", "var(--q-card)"],
    ["--q-field-focus", "0 0 0 1px var(--q-focus)"],
    ["--q-field-focus-danger", "0 0 0 1px var(--q-danger)"],
    ["--q-field-line", "var(--q-hairline)"],
  ]
}

/**
 * The CSS variables one theme sets. `includeGlobal` adds the tokens that are
 * not per theme (fonts, shape), which the CSS writes once, on `:root`.
 */
export function themeVariables(values: ThemeValues, theme: ThemeName, includeGlobal: boolean): [string, string][] {
  const t = themeOf(values, theme)
  const vars: [string, string][] = []
  for (const spec of TOKENS) {
    if (!spec.perTheme && !includeGlobal) continue
    const value = t[spec.key]
    if (value) vars.push(...variable(spec, value))
  }
  if (includeGlobal) vars.push(...fieldVariables(t))
  if (t["glow-from"] && t["glow-to"] && isSafeValue(t["glow-from"]) && isSafeValue(t["glow-to"])) {
    vars.push(["--q-stage-light", STAGE_GEOMETRY[theme](t["glow-from"], t["glow-to"])])
  }
  const fg = colorOf(t, "fg", parseColor)
  if (fg) {
    vars.push(["--q-scroll-thumb", formatColor(withAlpha(fg, 0.35))])
    vars.push(["--q-scroll-thumb-hover", formatColor(withAlpha(fg, 0.5))])
    vars.push(["--q-scroll-thumb-active", formatColor(withAlpha(fg, 0.8))])
  }
  return vars
}

/**
 * The theme as a stylesheet: the file's `@font-face` rules, then `:root,
 * .light` (with everything that is not per theme) and, when there is one, a
 * `.dark` block — the selectors `quebi-theme.css` uses, so importing this
 * after it overrides it value for value.
 */
export function generateCss(values: ThemeValues, fontFaces: string[], name: string): string {
  const block = (selector: string, vars: [string, string][]) =>
    `${selector} {\n${vars.map(([k, v]) => `  ${k}: ${v};`).join("\n")}\n}`
  const parts = [
    `/* quebi theme "${name.replace(/\*\//g, "")}", made at ui-lib.quebi.de/theme.\n   Import it after quebi-theme.css. */`,
    ...fontFaces,
    block(":root,\n.light", themeVariables(values, "light", true)),
  ]
  if (values.dark) parts.push(block(".dark", themeVariables(values, "dark", false)))
  return `${parts.join("\n\n")}\n`
}

/** Every variable of one theme as an inline style, for a preview scoped to one box. */
export function previewStyle(values: ThemeValues, theme: ThemeName): Record<string, string> {
  return Object.fromEntries(themeVariables(values, theme, true))
}

// ---------------------------------------------------------------------------
// Sharing: the theme as a URL fragment

const b64url = (bytes: Uint8Array) => {
  let s = ""
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

const fromB64url = (s: string) => {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"))
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream)
  return new Uint8Array(await new Response(out).arrayBuffer())
}

/** Only what differs from the library's own theme travels. */
function diff(values: ThemeValues) {
  const base = defaultValues()
  const pick = (t: Record<string, string>, d: Record<string, string>) =>
    Object.fromEntries(Object.entries(t).filter(([k, v]) => TOKEN_BY_KEY[k] && v !== d[k]))
  return {
    v: 1,
    l: pick(values.light, base.light),
    d: values.dark ? pick(values.dark, base.dark as Record<string, string>) : 0,
  }
}

/**
 * The theme as a compact, URL-safe string: the tokens that differ from the
 * library's defaults, as JSON, deflated and base64url-encoded (`z` prefix), or
 * only encoded where the browser has no CompressionStream (`j` prefix).
 * Embedded fonts do not travel — only their family names do.
 */
export async function encodeTheme(values: ThemeValues): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(diff(values)))
  if (typeof CompressionStream === "undefined") return `j${b64url(json)}`
  return `z${b64url(await pipe(json, new CompressionStream("deflate-raw")))}`
}

export async function decodeTheme(encoded: string): Promise<ThemeValues> {
  const kind = encoded[0]
  if (kind !== "z" && kind !== "j") throw new Error("This is not a theme link.")
  const body = fromB64url(encoded.slice(1))
  const bytes = kind === "z" ? await pipe(body, new DecompressionStream("deflate-raw")) : body
  const data = JSON.parse(new TextDecoder().decode(bytes)) as {
    v: number
    l?: Record<string, string>
    d?: Record<string, string> | 0
  }
  if (data.v !== 1) throw new Error("This theme link was made by a newer version of the page.")
  const base = defaultValues()
  const clean = (t: Record<string, string> = {}) =>
    Object.fromEntries(
      Object.entries(t).filter(([k, v]) => TOKEN_BY_KEY[k] && typeof v === "string" && isSafeValue(v)),
    )
  return {
    light: { ...base.light, ...clean(data.l) },
    dark: data.d === 0 ? undefined : { ...(base.dark as Record<string, string>), ...clean(data.d || {}) },
  }
}
