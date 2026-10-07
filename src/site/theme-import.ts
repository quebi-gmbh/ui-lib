/**
 * Theme import — turn a design system's CSS custom properties into a quebi
 * theme.
 *
 * The contract is deliberately small and written down (`TOKENS` in
 * `theme-tokens.ts` is the page's "what your file must define" table, rendered
 * as-is): a design system names its decisions as custom properties on `:root`, and every quebi token
 * the library paints with is either found among them by name or derived from
 * the ones that were. Only `bg` and `fg` are required; everything else has a
 * documented fallback, so a file that names five colours still produces a
 * complete, legible theme — and the report says which values were guessed.
 *
 * This module is pure: it takes the custom properties already resolved per
 * theme (see `theme-extract.ts`, which does that in a sandboxed iframe) and a
 * colour parser, and returns the mapping, the contrast checks and the CSS. That
 * is what lets the whole mapping be tested without a browser.
 */

import {
  contrast,
  formatColor,
  parseColor,
  type PropertyMap,
  type RGBA,
  type SourceValues,
  type ThemeName,
  type TokenSpec,
  withAlpha,
} from "@/site/theme-color"
import { DARK_SELECTORS, TOKENS } from "@/site/theme-tokens"

export * from "@/site/theme-color"
export { DARK_SELECTORS, TOKENS } from "@/site/theme-tokens"

// ---------------------------------------------------------------------------
// Mapping

/**
 * The property a spec matches in `props`: an exact name first (in the spec's
 * order), then a namespaced one — `--ds-bg-000`, `--color-text-muted` — that
 * ends in `-<name>`. Exact beats namespaced, so `--text` is never shadowed by
 * `--color-text` when both exist.
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

export type Origin =
  | { kind: "found"; property: string }
  | { kind: "derived"; note: string }
  | { kind: "default" }
  | { kind: "unparsable"; property: string; value: string }

export interface ResolvedToken {
  spec: TokenSpec
  /** Absent when the library keeps its own value (`origin.kind === "default"`). */
  value?: string
  color?: RGBA
  origin: Origin
}

export type ResolvedTheme = Record<string, ResolvedToken>

export interface Check {
  theme: ThemeName
  label: string
  ratio: number
  min: number
  pass: boolean
}

export interface ImportResult {
  themes: Partial<Record<ThemeName, ResolvedTheme>>
  checks: Check[]
  /** Problems that stop the import. */
  errors: string[]
  /** Things the reader should know: guessed values, a missing dark theme, ignored fonts. */
  notes: string[]
}

function resolveTheme(
  props: PropertyMap,
  theme: ThemeName,
  parse: (value: string) => RGBA | null,
  errors: string[],
): ResolvedTheme {
  const out: ResolvedTheme = {}
  const get = (key: string): RGBA => {
    const c = out[key]?.color
    if (!c) throw new Error(`token ${key} resolved out of order`)
    return c
  }

  for (const spec of TOKENS) {
    const property = findProperty(props, spec.names)
    const raw = property ? props[property].trim() : undefined

    if (spec.kind === "color") {
      const parsed = raw ? parse(raw) : null
      if (parsed) {
        out[spec.key] = { spec, value: formatColor(parsed), color: parsed, origin: { kind: "found", property: property as string } }
        continue
      }
      if (raw && property && spec.required) {
        errors.push(`${theme}: --${property} ("${raw}") is not a colour this page can read.`)
        continue
      }
      if (spec.required) {
        errors.push(`${theme}: no ${spec.key} — define one of ${spec.names.map((n) => `--${n}`).join(", ")}.`)
        continue
      }
      if (spec.fallback && out.bg?.color && out.fg?.color) {
        const color = spec.fallback.derive(get, theme)
        out[spec.key] = { spec, value: formatColor(color), color, origin: { kind: "derived", note: spec.fallback.note } }
        continue
      }
      out[spec.key] = {
        spec,
        origin: raw && property ? { kind: "unparsable", property, value: raw } : { kind: "default" },
      }
      continue
    }

    out[spec.key] = raw && property ? { spec, value: raw, origin: { kind: "found", property } } : { spec, origin: { kind: "default" } }
  }
  return out
}

function checksFor(theme: ThemeName, t: ResolvedTheme): Check[] {
  const c = (key: string) => t[key]?.color
  const checks: Check[] = []
  const add = (label: string, fg?: RGBA, ground?: RGBA, min = 4.5) => {
    if (!fg || !ground) return
    const ratio = contrast(fg, ground)
    checks.push({ theme, label, ratio, min, pass: ratio >= min })
  }
  for (const text of ["fg", "fg-muted", "fg-subtle"]) {
    for (const ground of ["bg", "raised", "elevated"]) add(`${text} on ${ground}`, c(text), c(ground))
  }
  add("on-action on action", c("on-action"), c("action"))
  add("rule on bg (non-text, 3:1)", c("rule"), c("bg"), 3)
  add("focus on bg (non-text, 3:1)", c("focus"), c("bg"), 3)
  for (const state of ["danger", "warn", "success"]) add(`${state} on bg`, c(state), c("bg"))
  return checks
}

/** Map the extracted custom properties onto the quebi tokens, and check the result. */
export function importTheme(source: SourceValues, parse: (value: string) => RGBA | null = parseColor): ImportResult {
  const errors: string[] = []
  const notes: string[] = []
  const themes: ImportResult["themes"] = { light: resolveTheme(source.light, "light", parse, errors) }

  if (source.dark) {
    const dark = resolveTheme(source.dark, "dark", parse, errors)
    const light = themes.light as ResolvedTheme
    const differs = TOKENS.some((s) => s.perTheme && dark[s.key]?.value && dark[s.key]?.value !== light[s.key]?.value)
    if (differs) themes.dark = dark
  }
  if (!themes.dark) {
    notes.push(
      `No dark theme found (looked for ${DARK_SELECTORS.join(", ")}). The generated theme sets Daylight only; Cinematic keeps the library's values.`,
    )
  }

  for (const [name, t] of Object.entries(themes) as [ThemeName, ResolvedTheme][]) {
    const derived = Object.values(t).filter((r) => r.origin.kind === "derived").map((r) => r.spec.key)
    if (derived.length) notes.push(`${name}: derived ${derived.join(", ")} from the tokens that were found.`)
    for (const r of Object.values(t)) {
      if (r.origin.kind === "unparsable") notes.push(`${name}: --${r.origin.property} ("${r.origin.value}") is not a colour; ${r.spec.key} keeps the library's value.`)
    }
  }

  const checks = errors.length
    ? []
    : (Object.entries(themes) as [ThemeName, ResolvedTheme][]).flatMap(([name, t]) => checksFor(name, t))
  return { themes, checks, errors, notes }
}

// ---------------------------------------------------------------------------
// Output

const STAGE_GEOMETRY: Record<ThemeName, (from: string, to: string) => string> = {
  light: (from, to) => `radial-gradient(110% 90% at 85% 0%, ${from} 0%, ${to} 100%)`,
  dark: (from, to) => `radial-gradient(120% 90% at 80% 10%, ${from} 0%, ${to} 60%)`,
}

/** Every variable one theme sets, in the order the CSS lists them. */
export function themeVariables(t: ResolvedTheme, theme: ThemeName, includeGlobal: boolean): [string, string][] {
  const vars: [string, string][] = []
  for (const spec of TOKENS) {
    if (!spec.perTheme && !includeGlobal) continue
    const value = t[spec.key]?.value
    if (value) vars.push([spec.target, value])
  }
  const from = t["glow-from"]?.value
  const to = t["glow-to"]?.value
  if (from && to) vars.push(["--q-stage-light", STAGE_GEOMETRY[theme](from, to)])
  const fg = t.fg?.color
  if (fg) {
    vars.push(["--q-scroll-thumb", formatColor(withAlpha(fg, 0.35))])
    vars.push(["--q-scroll-thumb-hover", formatColor(withAlpha(fg, 0.5))])
    vars.push(["--q-scroll-thumb-active", formatColor(withAlpha(fg, 0.8))])
  }
  return vars
}

/**
 * The theme as a stylesheet: the uploaded file's `@font-face` rules, then a
 * `:root, .light` block and (when the file had one) a `.dark` block, written
 * to the same selectors `quebi-theme.css` uses, so importing it after that file
 * overrides it value for value.
 */
export function generateCss(result: ImportResult, fontFaces: string[], fileName: string): string {
  const block = (selector: string, vars: [string, string][]) =>
    `${selector} {\n${vars.map(([k, v]) => `  ${k}: ${v};`).join("\n")}\n}`
  const parts = [
    `/* quebi theme generated from ${fileName.replace(/\*\//g, "")} by ui-lib.quebi.de/theme.\n   Import it after quebi-theme.css. */`,
    ...fontFaces,
  ]
  const light = result.themes.light
  if (light) parts.push(block(":root,\n.light", themeVariables(light, "light", true)))
  const dark = result.themes.dark
  if (dark) parts.push(block(".dark", themeVariables(dark, "dark", false)))
  return `${parts.join("\n\n")}\n`
}

/** The variables of one theme as an inline style, for a scoped preview. */
export function previewStyle(result: ImportResult, theme: ThemeName): Record<string, string> {
  const t = result.themes[theme] ?? result.themes.light
  if (!t) return {}
  const global = result.themes.light ? themeVariables(result.themes.light, "light", true).filter(([k]) => !k.startsWith("--q-")) : []
  return Object.fromEntries([...global, ...themeVariables(t, theme, false)])
}
