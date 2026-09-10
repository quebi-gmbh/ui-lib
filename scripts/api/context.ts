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

export async function createHighlight(): Promise<Highlight> {
  // Shiki highlighter — pre-renders source to HTML at build time so the SPA
  // ships no highlighter. Dual themes: "vesper" (dark) + "github-light" (light).
  // With `defaultColor: false`, Shiki emits token colors as CSS variables
  // (--shiki-dark / --shiki-light) instead of a fixed color, so the code block
  // follows the app theme — the .shiki CSS in quebi-theme.css picks the right
  // variable per `.dark`/`.light` class. Each theme's page-matching background
  // is replaced with transparent so the quebi surface shows through.
  const highlighter = await createHighlighter({
    themes: ["vesper", "github-light"],
    langs: ["tsx", "markdown", "js", "bash", "json"],
  })
  return (code, lang = "tsx") =>
    highlighter.codeToHtml(code, {
      lang,
      themes: { dark: "vesper", light: "github-light" },
      defaultColor: false,
      colorReplacements: {
        vesper: { "#101010": "transparent" },
        "github-light": { "#ffffff": "transparent" },
      },
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
