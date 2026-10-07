/**
 * Where the generated API is written, and the one Shiki highlighter that writes it.
 *
 * Split out of `scripts/generate-api.ts` so the emitters below it — components,
 * rules, discovery files, the skill — can each be read on their own. Nothing here
 * decides anything; it is the addresses and the highlighter, in one place, so the
 * emitters agree on both by construction rather than by repetition.
 */
import { mkdir, rm } from "node:fs/promises"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { createHighlighter } from "shiki"

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..")
export const COMPONENTS_DIR = join(ROOT, "src/components")
export const SRC_DIR = join(ROOT, "src")
export const PUBLIC = join(ROOT, "public")
export const API = join(PUBLIC, "api")
export const COMPONENTS_OUT = join(API, "components")
export const REGISTRY_OUT = join(PUBLIC, "r")
export const RULES_OUT = join(API, "rules")
export const RULE_PLUGINS_OUT = join(RULES_OUT, "plugins")

export const BASE_URL = "https://ui-lib.quebi.de"
export const HOST = "ui-lib.quebi.de"

/** The languages the generated pages are highlighted in. */
export type HighlightLang = "tsx" | "markdown" | "js" | "bash" | "json"

/** Source in, build-time HTML out. Passed to every emitter that shows code. */
export type Highlight = (code: string, lang?: HighlightLang) => string

/**
 * The two code themes, written for Ink & Paper rather than borrowed: no hue,
 * only the gray ramp. Structure comes from ink depth — keywords and names in
 * full ink, strings one step down, punctuation and comments at the muted step
 * (comments italic) — the same three rungs the type hierarchy uses. Each
 * theme's `bg` is transparent so the quebi surface shows through.
 */
function inkTheme(name: string, ink: { fg: string; body: string; muted: string }) {
  return {
    name,
    type: name === "quebi-cinematic" ? ("dark" as const) : ("light" as const),
    colors: { "editor.background": "#00000000", "editor.foreground": ink.fg },
    bg: "transparent",
    fg: ink.fg,
    tokenColors: [
      { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: ink.muted, fontStyle: "italic" } },
      { scope: ["string", "string.template", "constant.other.symbol"], settings: { foreground: ink.body } },
      { scope: ["punctuation", "meta.brace", "keyword.operator"], settings: { foreground: ink.muted } },
      { scope: ["constant.numeric", "constant.language"], settings: { foreground: ink.body } },
      { scope: ["keyword", "storage", "storage.type", "storage.modifier"], settings: { foreground: ink.fg } },
      { scope: ["entity.name", "support.class.component", "entity.name.tag"], settings: { foreground: ink.fg } },
      { scope: ["entity.other.attribute-name", "variable.parameter"], settings: { foreground: ink.body } },
    ],
  }
}

const DAYLIGHT = inkTheme("quebi-daylight", { fg: "#030712", body: "#374151", muted: "#4b5563" })
const CINEMATIC = inkTheme("quebi-cinematic", { fg: "#f9fafb", body: "#d1d5db", muted: "#9ca3af" })

export async function createHighlight(): Promise<Highlight> {
  // Shiki highlighter — pre-renders source to HTML at build time so the SPA
  // ships no highlighter. Dual themes (above). With `defaultColor: false`,
  // Shiki emits token colors as CSS variables (--shiki-dark / --shiki-light)
  // instead of a fixed color, so the code block follows the app theme — the
  // .shiki CSS in quebi-theme.css picks the right variable per `.dark`/`.light`.
  const highlighter = await createHighlighter({
    themes: [DAYLIGHT, CINEMATIC],
    langs: ["tsx", "markdown", "js", "bash", "json"],
  })
  return (code, lang = "tsx") =>
    highlighter.codeToHtml(code, {
      lang,
      themes: { dark: CINEMATIC.name, light: DAYLIGHT.name },
      defaultColor: false,
    })
}

/** Empty the generated trees, so a deleted component cannot leave a stale file behind. */
export async function freshOutputDirs(): Promise<void> {
  await rm(API, { recursive: true, force: true })
  await rm(REGISTRY_OUT, { recursive: true, force: true })
  await mkdir(COMPONENTS_OUT, { recursive: true })
  await mkdir(REGISTRY_OUT, { recursive: true })
  await mkdir(RULES_OUT, { recursive: true })
  await mkdir(RULE_PLUGINS_OUT, { recursive: true })
}
