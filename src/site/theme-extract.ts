/**
 * Read a design system's resolved custom properties out of an uploaded HTML
 * file, in the browser, without running any of it.
 *
 * - The file is parsed with `DOMParser`, which never executes scripts, and only
 *   its `<style>` blocks (plus any inline `style` on `<html>`/`<body>`) are kept.
 *   External stylesheets are not fetched; the report names them.
 * - Those styles are loaded into an `<iframe sandbox="allow-same-origin">` —
 *   same-origin so this page can read its computed style, no `allow-scripts`, so
 *   nothing in it runs either. The browser does the cascade: `var()` chains,
 *   `:root` vs `[data-theme]` precedence, everything a hand-written CSS parser
 *   would get wrong.
 * - Light and dark are read from two such frames. The dark one sets every
 *   switch in `DARK_SELECTORS` on its `<html>`, asks for a dark color-scheme
 *   (which is what an iframe's `prefers-color-scheme` follows), and re-declares
 *   the rules of any `prefers-color-scheme: dark` block unconditionally for
 *   engines that do not follow it.
 * - Colours the pure parser cannot read (`oklch()`, `hsl()`, named colours)
 *   are painted onto a 1×1 canvas and read back as sRGB.
 */
import { parseColor, type PropertyMap, type RGBA, type SourceValues } from "@/site/theme-import"

export interface Extraction {
  source: SourceValues
  fontFaces: string[]
  /** Things that were in the file and deliberately not used. */
  skipped: string[]
}

function frame(scheme: "light" | "dark"): Promise<HTMLIFrameElement> {
  const el = document.createElement("iframe")
  el.setAttribute("sandbox", "allow-same-origin")
  el.setAttribute("aria-hidden", "true")
  el.tabIndex = -1
  el.style.cssText = "position:fixed;width:1px;height:1px;left:-10px;top:-10px;border:0;visibility:hidden"
  // An iframe's `prefers-color-scheme` follows its owner element's
  // color-scheme, not the reader's OS — so each frame asks for its own.
  el.style.colorScheme = scheme
  return new Promise((resolve) => {
    el.addEventListener("load", () => resolve(el), { once: true })
    el.srcdoc = "<!doctype html><html><head></head><body></body></html>"
    document.body.append(el)
  })
}

/** Every custom property declared anywhere in the sheets, so the computed style can be asked for each. */
function declaredProperties(sheets: StyleSheetList): Set<string> {
  const names = new Set<string>()
  const walk = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      if ("style" in rule) {
        const style = (rule as CSSStyleRule).style
        for (let i = 0; i < style.length; i++) {
          const prop = style.item(i)
          if (prop.startsWith("--")) names.add(prop)
        }
      }
      if ("cssRules" in rule) walk((rule as CSSGroupingRule).cssRules)
    }
  }
  for (const sheet of Array.from(sheets)) {
    try {
      walk(sheet.cssRules)
    } catch {
      /* a cross-origin sheet: unreadable, and not fetched anyway */
    }
  }
  return names
}

/** The rules inside every `@media (prefers-color-scheme: dark)`, unwrapped. */
function darkMediaRules(sheets: StyleSheetList): string {
  const out: string[] = []
  const walk = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSMediaRule || ("media" in rule && "cssRules" in rule)) {
        const media = rule as CSSMediaRule
        const inner = Array.from(media.cssRules).map((r) => r.cssText)
        if (/prefers-color-scheme:\s*dark/.test(media.conditionText ?? media.media.mediaText)) out.push(...inner)
        else walk(media.cssRules)
      }
    }
  }
  for (const sheet of Array.from(sheets)) walk(sheet.cssRules)
  return out.join("\n")
}

function fontFaceRules(sheets: StyleSheetList, skipped: string[]): string[] {
  const out: string[] = []
  for (const sheet of Array.from(sheets)) {
    for (const rule of Array.from(sheet.cssRules)) {
      if (rule.constructor.name !== "CSSFontFaceRule" && !rule.cssText.startsWith("@font-face")) continue
      // A relative url() points at a file this page does not have.
      const relative = /url\(\s*(?!["']?(?:data:|https?:|\/\/))/.test(rule.cssText)
      if (relative) skipped.push(`an @font-face with a relative url(): ${rule.cssText.slice(0, 80)}…`)
      else out.push(rule.cssText)
    }
  }
  return out
}

function read(doc: Document, names: Set<string>): PropertyMap {
  const style = doc.defaultView?.getComputedStyle(doc.body)
  const out: PropertyMap = {}
  if (!style) return out
  for (const name of names) {
    const value = style.getPropertyValue(name).trim()
    if (value) out[name.slice(2)] = value
  }
  return out
}

/** Any CSS colour → sRGB, via a canvas. `null` when the browser rejects the value. */
export function canvasColor(value: string): RGBA | null {
  const parsed = parseColor(value)
  if (parsed) return parsed
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = 1
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) return null
  // A sentinel first: an invalid colour leaves fillStyle unchanged.
  ctx.fillStyle = "#010203"
  ctx.fillStyle = value
  if (ctx.fillStyle === "#010203" && value.trim().toLowerCase() !== "#010203") return null
  ctx.clearRect(0, 0, 1, 1)
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
  return { r, g, b, a: a / 255 }
}

export async function extractTheme(html: string): Promise<Extraction> {
  const skipped: string[] = []
  const parsed = new DOMParser().parseFromString(html, "text/html")

  const scripts = parsed.querySelectorAll("script").length
  if (scripts) skipped.push(`${scripts} <script> element${scripts === 1 ? "" : "s"} (never run)`)
  const links = Array.from(parsed.querySelectorAll('link[rel~="stylesheet"]'))
  for (const link of links) skipped.push(`external stylesheet ${link.getAttribute("href")} (not fetched)`)

  const css = Array.from(parsed.querySelectorAll("style"))
    .map((s) => s.textContent ?? "")
    .join("\n")
  const rootStyle = [parsed.documentElement.getAttribute("style"), parsed.body?.getAttribute("style")]
    .filter(Boolean)
    .join(";")

  const [lightFrame, darkFrame] = await Promise.all([frame("light"), frame("dark")])
  try {
    const load = (doc: Document, extra = "") => {
      const style = doc.createElement("style")
      style.textContent = `${css}\n${extra}`
      doc.head.append(style)
      if (rootStyle) doc.documentElement.setAttribute("style", rootStyle)
    }

    const light = lightFrame.contentDocument as Document
    load(light)
    light.documentElement.setAttribute("data-theme", "light")
    light.documentElement.setAttribute("data-mode", "light")
    light.documentElement.className = "light"

    const dark = darkFrame.contentDocument as Document
    // Belt and braces for engines that ignore the owner's color-scheme.
    load(dark, darkMediaRules(light.styleSheets))
    dark.documentElement.setAttribute("data-theme", "dark")
    dark.documentElement.setAttribute("data-mode", "dark")
    dark.documentElement.className = "dark"

    const names = declaredProperties(light.styleSheets)
    if (rootStyle) for (const m of rootStyle.matchAll(/(--[\w-]+)\s*:/g)) names.add(m[1])

    return {
      source: { light: read(light, names), dark: read(dark, names) },
      fontFaces: fontFaceRules(light.styleSheets, skipped),
      skipped,
    }
  } finally {
    lightFrame.remove()
    darkFrame.remove()
  }
}
