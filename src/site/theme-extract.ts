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
 * - Shape is read from the file's own components: the first class selector
 *   that looks like a page, a button, a solid button, an input, a box or card,
 *   and a checkbox (`ROLES`) is rebuilt as an element in each frame and its
 *   computed radius, border, shadow, font and grounds are read back. A
 *   button's hover/active `transform` gives the press offset.
 * - Colours the pure parser cannot read (`oklch()`, `hsl()`, named colours)
 *   are painted onto a 1×1 canvas and read back as sRGB.
 */
import { parseColor, type PropertyMap, type RGBA, type SourceValues } from "@/site/theme-color"
import { type Probes, type ProbeSet, pressFrom } from "@/site/theme-import"

export interface Extraction {
  source: SourceValues
  probes: Probes
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


/** Class selectors that look like a component, by role. `\b` lets `.nb-btn` and `.btn` both match. */
const ROLES = {
  page: /^\.[\w-]*\bpage$/,
  button: /^\.[\w-]*\b(?:btn|button)$/,
  solid: /^\.[\w-]*\b(?:btn|button)-(?:solid|primary)$/,
  input: /^(?:\.[\w-]*\binput|\.[\w-]*\bfield\s+input)$/,
  card: /^\.[\w-]*\b(?:box|card|panel|surface)$/,
  check: /^(?:\.[\w-]*\b(?:check|checkbox)\s+input|\.[\w-]*\bcheckbox)$/,
} as const

type Role = keyof typeof ROLES

function styleRules(sheets: StyleSheetList): CSSStyleRule[] {
  const out: CSSStyleRule[] = []
  for (const sheet of Array.from(sheets)) {
    for (const rule of Array.from(sheet.cssRules)) {
      if ("selectorText" in rule) out.push(rule as CSSStyleRule)
    }
  }
  return out
}

/** Every simple selector in the sheets that fills a role, in source order. */
function candidates(rules: CSSStyleRule[]): Record<Role, string[]> {
  const found = Object.fromEntries(Object.keys(ROLES).map((r) => [r, [] as string[]])) as Record<Role, string[]>
  for (const rule of rules) {
    for (const raw of rule.selectorText.split(",")) {
      const selector = raw.trim().replace(/\s+/g, " ")
      for (const role of Object.keys(ROLES) as Role[]) {
        if (ROLES[role].test(selector) && !found[role].includes(selector)) found[role].push(selector)
      }
    }
  }
  return found
}

/** Rebuild `.a .b input` as nested elements under `host`; return the innermost. */
function build(doc: Document, host: HTMLElement, selector: string, extraClass?: string): HTMLElement {
  let parent: HTMLElement = host
  const parts = selector.split(" ")
  parts.forEach((part, i) => {
    const tag = part.match(/^[a-z]+/)?.[0] ?? "div"
    const el = doc.createElement(tag)
    for (const m of part.matchAll(/\.([\w-]+)/g)) el.classList.add(m[1])
    if (i === parts.length - 1 && extraClass) el.classList.add(extraClass)
    if (tag === "input" && /check/.test(selector)) el.setAttribute("type", "checkbox")
    el.textContent = tag === "input" ? "" : "x"
    parent.append(el)
    parent = el
  })
  return parent
}

/** The press offset of a button: its `:hover`/`:active` transform, resolved through the cascade. */
function pressOf(doc: Document, host: HTMLElement, rules: CSSStyleRule[], selector: string): string | undefined {
  for (const rule of rules) {
    const states = rule.selectorText.split(",").map((s) => s.trim())
    if (!states.some((s) => s === `${selector}:hover` || s === `${selector}:active`)) continue
    const translate = rule.style.getPropertyValue("translate")
    if (translate) return pressFrom(translate)
    const transform = rule.style.getPropertyValue("transform")
    if (!transform) continue
    const probe = doc.createElement("div")
    probe.style.transform = transform
    host.append(probe)
    const matrix = doc.defaultView?.getComputedStyle(probe).transform ?? ""
    const n = matrix.match(/matrix\(([^)]+)\)/)?.[1].split(",").map(Number)
    return n && n[4] > 0 ? `${n[4]}px` : pressFrom(transform)
  }
  return undefined
}

function probe(doc: Document): ProbeSet {
  const rules = styleRules(doc.styleSheets)
  const found = candidates(rules)
  const host = doc.createElement("div")
  doc.body.append(host)
  const view = doc.defaultView as Window
  const cs = (el: HTMLElement) => view.getComputedStyle(el)
  const out: ProbeSet = {}

  const page = found.page[0]
  if (page) {
    const s = cs(build(doc, host, page))
    out.page = { selector: page, bg: s.backgroundColor, image: s.backgroundImage, imageSize: s.backgroundSize }
  }
  const button = found.button[0]
  if (button) {
    const s = cs(build(doc, host, button))
    out.button = {
      selector: button,
      radius: s.borderTopLeftRadius,
      border: s.borderTopWidth,
      shadow: s.boxShadow,
      font: s.fontFamily,
      press: pressOf(doc, host, rules, button),
    }
    const solid = found.solid[0]
    if (solid) {
      const base = button.slice(1)
      out.solid = { selector: solid, shadow: cs(build(doc, host, solid, base)).boxShadow }
    }
  }
  const input = found.input[0]
  if (input) {
    const s = cs(build(doc, host, input))
    out.input = {
      selector: input,
      radius: s.borderTopLeftRadius,
      borderSide: s.borderLeftWidth,
      paddingLeft: s.paddingLeft,
      shadow: s.boxShadow,
    }
  }
  // A design may have several box-like classes; the surface is the one that draws an edge.
  const cards = found.card.map((selector) => ({ selector, s: cs(build(doc, host, selector)) }))
  const card = cards.find(({ s }) => Number.parseFloat(s.borderTopWidth) > 0 || s.boxShadow !== "none") ?? cards[0]
  if (card) {
    out.card = {
      selector: card.selector,
      radius: card.s.borderTopLeftRadius,
      border: card.s.borderTopWidth,
      shadow: card.s.boxShadow,
      bg: card.s.backgroundColor,
    }
  }
  const check = found.check[0]
  if (check) out.check = { selector: check, radius: cs(build(doc, host, check)).borderTopLeftRadius }

  host.remove()
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
      probes: { light: probe(light), dark: probe(dark) },
      fontFaces: fontFaceRules(light.styleSheets, skipped),
      skipped,
    }
  } finally {
    lightFrame.remove()
    darkFrame.remove()
  }
}
