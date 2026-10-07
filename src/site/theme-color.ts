/**
 * The colour maths behind the theme import: parsing, compositing, mixing and
 * WCAG contrast, on plain sRGB values. See `theme-import.ts`.
 */
export type ThemeName = "light" | "dark"
export type TokenKind = "color" | "font" | "length" | "shadow"

export interface RGBA {
  r: number
  g: number
  b: number
  /** 0–1 */
  a: number
}

/** A custom-property map for one theme: name without the leading `--` → computed value. */
export type PropertyMap = Record<string, string>

export interface SourceValues {
  light: PropertyMap
  /** Absent when the file declares no dark theme the extractor could find. */
  dark?: PropertyMap
}

export type Lookup = (key: string) => RGBA

export interface TokenSpec {
  /** The quebi token, as the page and the report name it. */
  key: string
  /** The CSS variable the generated theme writes. */
  target: string
  kind: TokenKind
  /** Names recognised in the uploaded file, in order of preference, without `--`. */
  names: string[]
  /** What the token paints in the library. */
  role: string
  required?: boolean
  /** Colours and the shadow differ per theme; fonts and radii are set once. */
  perTheme: boolean
  /** How a missing colour is derived from the tokens before it, in words and in code. */
  fallback?: { note: string; derive: (get: Lookup, theme: ThemeName) => RGBA }
}

// ---------------------------------------------------------------------------
// Colour maths

const clamp = (v: number, lo = 0, hi = 255) => Math.min(hi, Math.max(lo, v))

/** `top` composited over an opaque `ground`. */
export function over(top: RGBA, ground: RGBA): RGBA {
  const a = top.a
  return {
    r: top.r * a + ground.r * (1 - a),
    g: top.g * a + ground.g * (1 - a),
    b: top.b * a + ground.b * (1 - a),
    a: 1,
  }
}

/** `a` and `b` mixed, `t` of the way from `b` to `a` (opaque result). */
export function mix(a: RGBA, b: RGBA, t: number): RGBA {
  return {
    r: a.r * t + b.r * (1 - t),
    g: a.g * t + b.g * (1 - t),
    b: a.b * t + b.b * (1 - t),
    a: 1,
  }
}

export const withAlpha = (c: RGBA, a: number): RGBA => ({ ...c, a })

export function luminance({ r, g, b }: RGBA) {
  const ch = (v: number) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)
}

/** WCAG contrast of `fg` (composited if translucent) on an opaque `ground`. */
export function contrast(fg: RGBA, ground: RGBA): number {
  const a = luminance(fg.a < 1 ? over(fg, ground) : fg)
  const b = luminance(ground)
  const [hi, lo] = a > b ? [a, b] : [b, a]
  return (hi + 0.05) / (lo + 0.05)
}

const hex2 = (v: number) => Math.round(clamp(v)).toString(16).padStart(2, "0")

/** `#rrggbb`, or `#rrggbbaa` when translucent. */
export function formatColor(c: RGBA): string {
  const base = `#${hex2(c.r)}${hex2(c.g)}${hex2(c.b)}`
  return c.a >= 1 ? base : `${base}${hex2(c.a * 255)}`
}

/**
 * Hex, `rgb()`/`rgba()` in both the comma and the space syntax, and
 * `transparent`. The browser extractor falls back to a canvas for anything else
 * (`oklch()`, `hsl()`, named colours), so this only has to cover what a test
 * or a hand-written file is likely to contain.
 */
export function parseColor(value: string): RGBA | null {
  const v = value.trim().toLowerCase()
  if (v === "transparent") return { r: 0, g: 0, b: 0, a: 0 }
  const hex = v.match(/^#([0-9a-f]{3,8})$/)
  if (hex) {
    let h = hex[1]
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join("")
    if (h.length !== 6 && h.length !== 8) return null
    const n = (i: number) => Number.parseInt(h.slice(i, i + 2), 16)
    return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) / 255 : 1 }
  }
  const fn = v.match(/^rgba?\(([^)]+)\)$/)
  if (fn) {
    const parts = fn[1].split(/[\s,/]+/).filter(Boolean)
    if (parts.length < 3) return null
    const channel = (p: string) => (p.endsWith("%") ? (Number.parseFloat(p) / 100) * 255 : Number.parseFloat(p))
    const alpha = parts[3] === undefined ? 1 : parts[3].endsWith("%") ? Number.parseFloat(parts[3]) / 100 : Number.parseFloat(parts[3])
    const [r, g, b] = parts.slice(0, 3).map(channel)
    if ([r, g, b, alpha].some(Number.isNaN)) return null
    return { r, g, b, a: alpha }
  }
  return null
}

