/**
 * Every Badge intent, read as text, on both surfaces.
 *
 * A Badge's label is `text-xs font-semibold` — 12px, which is not "large text",
 * so WCAG 1.4.3 asks 4.5:1 and not 3:1. Five of the eight intents did not reach
 * it on the light surface, and nothing said so: quebi is dark-first, every
 * intent clears 7:1 on `#030712`, and the light theme is the one nobody looks
 * at. That is the definition of a bug an eye will not catch and a test will.
 *
 * Nothing here is a hardcoded ratio. Both themes' `--q-*` values are read out of
 * `src/quebi-theme.css`, the intent's own class list is read out of the
 * component, and the ratio is recomputed — so re-tuning a token either keeps
 * this green or fails it, rather than leaving a stale table behind. That is the
 * lesson of `commit-graph-contrast.test.ts`, which this follows.
 *
 * ## The surface a badge is actually read on
 *
 * Two, and both are checked. An intent paints a 10% tint behind its own label,
 * so the label's real backdrop is that tint composited over the page — which is
 * *worse* than the page alone, by up to 12%, and is what pushed `danger` under
 * the line at 600-level while the bare page still said 4.45:1. But a badge is
 * not guaranteed to sit on its own tint: it sits in a table row, a toast, a
 * card. So the bare page background is checked too, and the intent has to clear
 * 4.5:1 on both.
 *
 * `ai` is the one intent that is not a tint — an opaque gradient, which lets
 * nothing through — so the page is not one of its surfaces and the sweep is
 * read at three points instead of one. See `backdrops` and the block at the
 * bottom of this file.
 *
 * ## Why the intent map is parsed rather than listed
 *
 * The thing under test is the pairing — *this* foreground against *that* fill —
 * and a list here would be a third copy of a map that already exists twice
 * (`badgeIntents` and its pinned twin `iconTileIntents`). A new intent, or an
 * intent that swaps its hue, has to be caught; so an intent whose classes this
 * file cannot decode fails loudly instead of being quietly skipped.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, test } from "bun:test"
import { badgeIntents } from "../src/components/badge"

const ROOT = join(import.meta.dir, "..")
const THEME = readFileSync(join(ROOT, "src", "quebi-theme.css"), "utf8")

/**
 * Tailwind's own default palette, for the four intents whose fill is a stock
 * hue rather than a quebi token. These five values are not ours and are not in
 * this repo — the risk of writing them down is that Tailwind re-tunes one and
 * this file goes on measuring the old colour. The guard is below: an intent
 * naming a fill that is neither a `--q-*` token nor a key of this map is a
 * failure, not a skip, so the map cannot fall behind the component.
 */
const TAILWIND = {
  "purple-400": "#c084fc",
  "purple-500": "#a855f7",
  "emerald-500": "#10b981",
  "amber-500": "#f59e0b",
  "red-500": "#ef4444",
  "cyan-500": "#06b6d4",
} as const

/**
 * The `--*: #hex` pairs declared in one theme's block.
 *
 * Deliberately not `@theme inline`: that block is Tailwind's input, and what
 * reaches the browser from it depends on a source scan. These blocks are plain
 * CSS and always ship.
 */
function themeValues(selector: string): Map<string, string> {
  const start = THEME.indexOf(selector)
  expect(start, `${selector} is not in quebi-theme.css`).toBeGreaterThan(-1)
  const block = THEME.slice(start, THEME.indexOf("\n}", start))
  const values = new Map<string, string>()
  for (const [, name, hex] of block.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)) {
    values.set(name, hex)
  }
  return values
}

const THEMES = [
  { name: "dark", values: themeValues(":root,\n.dark {") },
  { name: "light", values: themeValues(".light {") },
] as const

const rgb = (hex: string) =>
  [0, 2, 4].map((i) => Number.parseInt(hex.replace("#", "").slice(i, i + 2), 16))

function relativeLuminance(hex: string) {
  const channel = (value: number) => {
    const c = value / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  const [r, g, b] = rgb(hex).map(channel)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string) {
  const [high, low] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return (high + 0.05) / (low + 0.05)
}

/** `fg` at `alpha` over an opaque `bg` — what the browser composites. */
function over(fg: string, bg: string, alpha: number) {
  const [f, b] = [rgb(fg), rgb(bg)]
  const hex = f.map((v, i) =>
    Math.round(v * alpha + b[i] * (1 - alpha))
      .toString(16)
      .padStart(2, "0"),
  )
  return `#${hex.join("")}`
}

/**
 * The hex a `quebi-<name>` / `<hue>-500` class resolves to in one theme.
 *
 * `quebi-*` utilities go through the `@theme inline` alias to a `--q-*`
 * variable, so the indirection is the theme's; everything else is Tailwind's.
 * Returns `undefined` for a name from neither, which the callers turn into a
 * failure.
 */
function resolve(name: string, values: Map<string, string>) {
  if (name.startsWith("quebi-")) return values.get(`q-${name.slice("quebi-".length)}`)
  return TAILWIND[name as keyof typeof TAILWIND]
}

/** `bg-quebi-brand/10` → `{ name: "quebi-brand", alpha: 0.1 }`; `/[0.06]` too. */
function parseColorClass(classes: string, prefix: string) {
  const match = classes.match(
    new RegExp(`(?:^|\\s)${prefix}-([a-z0-9-]+?)(?:/(?:\\[([\\d.]+)\\]|(\\d+)))?(?=\\s|$)`),
  )
  if (!match) return undefined
  const [, name, bracketed, percent] = match
  const alpha = bracketed ? Number(bracketed) : percent ? Number(percent) / 100 : 1
  return { name, alpha }
}

/** The colour halfway along a CSS gradient, which interpolates in sRGB. */
function midpoint(a: string, b: string) {
  const [x, y] = [rgb(a), rgb(b)]
  return `#${x.map((v, i) => Math.round((v + y[i]) / 2).toString(16).padStart(2, "0")).join("")}`
}

/**
 * The surfaces an intent's label is read against, in one theme: the bare page,
 * and the page with the intent's own fill composited over it.
 *
 * `bg-transparent` and a gradient are the two shapes that are not one flat
 * fill. `outline` is the first; `ai` is the second, and a gradient is read at
 * both ends *and in the middle*: the ends are not the bounds of the sweep,
 * because sRGB interpolation moves the channels independently and mint→purple
 * moves green down while it moves red and blue up. The midpoint of a sweep
 * between two legible ends can be less legible than either.
 *
 * The bare page is a surface only while the fill lets it through. Eight intents
 * paint a 10% tint, so their label really is read against the page underneath;
 * `ai` paints an opaque gradient, which does not, and asking it to clear 4.5:1
 * against a page it covers would be asking the dark ink to be legible on the
 * dark page — a test of nothing, failing forever.
 */
function backdrops(classes: string, values: Map<string, string>): string[] {
  const page = values.get("q-bg") as string
  const composite = ({ name, alpha }: { name: string; alpha: number }) => {
    const hex = resolve(name, values)
    expect(hex, `no value for the fill \`${name}\` — add it to TAILWIND or the theme`).toBeString()
    return over(hex as string, page, alpha)
  }

  const flat = parseColorClass(classes, "bg")
  // `bg-transparent` is not a colour, and `bg-gradient-to-r` is a direction —
  // the gradient's colours arrive as `from-`/`to-` below.
  const isFill = flat && flat.name !== "transparent" && !flat.name.startsWith("gradient-")
  const stops = ["from", "to"]
    .map((prefix) => parseColorClass(classes, prefix))
    .filter((stop) => stop !== undefined)

  const fills = [...(isFill ? [flat] : []), ...stops]
  const surfaces = fills.map(composite)
  // Only a sweep with both ends has a middle to read.
  if (stops.length === 2) surfaces.push(midpoint(composite(stops[0]), composite(stops[1])))

  return fills.some(({ alpha }) => alpha === 1) ? surfaces : [page, ...surfaces]
}

const INTENTS = Object.entries(badgeIntents)

describe("every Badge intent is legible as 12px text", () => {
  test("the map is the nine intents, and none of them is excused", () => {
    // `ai` was, until task #99. Nothing here is skipped now, so an intent that
    // this file cannot decode or cannot pass is a failure rather than a gap.
    expect(INTENTS).toHaveLength(9)
  })

  for (const { name: theme, values } of THEMES) {
    test.each(INTENTS)(`${theme}: %s clears 4.5:1 on every surface it is drawn on`, (_n, classes) => {
      const fg = parseColorClass(classes, "text")
      expect(fg, `no \`text-\` class in \`${classes}\``).toBeDefined()
      const hex = resolve((fg as { name: string }).name, values)
      expect(hex, `no value for the foreground \`${(fg as { name: string }).name}\``).toBeString()

      for (const surface of backdrops(classes, values)) {
        expect(contrast(hex as string, surface)).toBeGreaterThanOrEqual(4.5)
      }
    })
  }
})

describe("brand is two tokens because one value cannot do both jobs", () => {
  const [dark, light] = [THEMES[0].values, THEMES[1].values]

  test("the fill token is the same mint in both themes, as the theme says it is", () => {
    expect(light.get("q-brand")).toBe(dark.get("q-brand") as string)
  })

  test("which is why it cannot also be the text token: 1.74:1 on the light surface", () => {
    // The reason the split exists. If this ever passes 4.5:1, the light theme
    // has changed the mint and `--q-brand-text` may be able to collapse back
    // into `--q-brand`.
    const ratio = contrast(light.get("q-brand") as string, light.get("q-bg") as string)
    expect(ratio).toBeLessThan(4.5)
  })

  test("on dark the split costs nothing — text and fill are the same value", () => {
    expect(dark.get("q-brand-text")).toBe(dark.get("q-brand") as string)
    expect(dark.get("q-brand-text-hover")).toBe(dark.get("q-brand-hover") as string)
  })

  test.each([
    ["q-brand-text", "q-brand"],
    ["q-brand-text-hover", "q-brand-hover"],
  ])("light darkens %s away from %s until it is readable", (text, fill) => {
    expect(contrast(light.get(text) as string, light.get("q-bg") as string)).toBeGreaterThanOrEqual(
      4.5,
    )
    expect(light.get(text)).not.toBe(light.get(fill) as string)
  })
})

describe("the foreground tokens, on the bare page, in both themes", () => {
  // The intents above cover these through Badge. They are checked directly too
  // because they are used as small text far beyond Badge — every `text-quebi-*`
  // in the library resolves to one of them — and a token that is only legible
  // inside a badge is not fixed.
  //
  // `q-fg-subtle` was absent from this list until task #98, because it failed:
  // 4.16:1 on dark and 2.79:1 on light, which is under even the 3:1 large text
  // would be allowed. It is an ordinary member now, and the assertion that was
  // interesting about it moved to the ramp below.
  const TEXT_TOKENS = [
    "q-fg",
    "q-fg-muted",
    "q-fg-subtle",
    "q-brand-text",
    "q-brand-text-hover",
    "q-danger",
    "q-warn",
    "q-success",
    "q-info",
    "q-accent",
  ]

  for (const { name: theme, values } of THEMES) {
    test.each(TEXT_TOKENS)(`${theme}: --%s clears 4.5:1 against --q-bg`, (token) => {
      const hex = values.get(token)
      expect(hex, `--${token} has no value in the ${theme} theme`).toBeString()
      expect(contrast(hex as string, values.get("q-bg") as string)).toBeGreaterThanOrEqual(4.5)
    })
  }
})

/**
 * `--q-fg` → `--q-fg-muted` → `--q-fg-subtle` is a three-rung ramp, and the two
 * things it has to be are both testable.
 *
 * Legible: every rung is text, so 4.5:1 against the page — that is the block
 * above. And *distinguishable*: three greys that cannot be told apart are one
 * grey with two extra names, which is the failure mode re-tuning `subtle`
 * upwards walks straight into. There is no WCAG number for the second one —
 * 1.4.3 is about text against its background, not against other text — so the
 * floor here is a design decision, recorded rather than derived: 1.4:1 between
 * adjacent rungs, which the light theme could not have met without also moving
 * `--q-fg-muted` down to gray-700.
 *
 * Monotonic is checked separately from the step size because they fail
 * differently: a ramp that is out of order is a mistake, a ramp whose steps are
 * too small is a re-tune that went one shade too far.
 */
describe("the three rungs of the type hierarchy stay three", () => {
  const RAMP = ["q-fg", "q-fg-muted", "q-fg-subtle"] as const
  const MIN_STEP = 1.4

  for (const { name: theme, values } of THEMES) {
    const ratios = RAMP.map((token) => contrast(values.get(token) as string, values.get("q-bg") as string))

    test(`${theme}: the ramp descends — fg is the loudest, subtle the quietest`, () => {
      expect(ratios).toEqual([...ratios].sort((a, b) => b - a))
    })

    test.each([0, 1])(`${theme}: rung %s and the one below it can be told apart`, (i) => {
      const step = contrast(values.get(RAMP[i]) as string, values.get(RAMP[i + 1]) as string)
      expect(step).toBeGreaterThanOrEqual(MIN_STEP)
    })
  }
})

describe("the `ai` intent, which is the one gradient", () => {
  /**
   * `ai` is the teal→purple sweep with `text-quebi-on-brand` (dark ink) on top,
   * and it is the same in both themes — so unlike the other eight its defect
   * was never a light-mode defect. The ink read 7.81:1 over the mint end and
   * 3.74:1 over `purple-500` at the far end: the label faded out as it crossed
   * its own badge.
   *
   * Fixed in task #99 by lightening the far stop to `purple-400`, which is the
   * direction the ink dictates and not the one that reads as "more contrast":
   * the ink is dark, so a *darker* purple makes it worse, and the `purple-700`
   * the report suggested would have read 2.12:1. The loop above now covers this
   * intent like any other; what is left here is the part a ratio assertion does
   * not say — that the fix has to keep going the way it went.
   */
  const { values } = THEMES[1]
  const ink = values.get("q-on-brand") as string

  test("the far stop is lighter than the ink needs it to be, not darker", () => {
    // The trap. `to-purple-500` → `to-purple-700` looks like a fix, halves the
    // ratio, and passes a review that never re-measures. Stated as a property
    // of the sweep rather than as a class name: any far stop is fine as long as
    // the dark ink can still be read on it.
    const [, far] = backdrops(badgeIntents.ai, values)
    expect(contrast(ink, far)).toBeGreaterThanOrEqual(4.5)
    expect(relativeLuminance(far)).toBeGreaterThan(relativeLuminance(ink))
  })

  test("the middle of the sweep is read too, and it is not between the ends", () => {
    // sRGB interpolation moves the channels independently — mint→purple takes
    // green down while it takes red and blue up — so the midpoint's luminance
    // is not bounded by the two ends and checking only the ends would be
    // checking the wrong two colours.
    const surfaces = backdrops(badgeIntents.ai, values)
    expect(surfaces).toHaveLength(3)
    expect(Math.min(...surfaces.map((s) => contrast(ink, s)))).toBeGreaterThanOrEqual(4.5)
  })

  test("the page is not one of its surfaces, because the gradient is opaque", () => {
    // The dark ink on the dark page is 1.36:1 and always will be. A badge whose
    // fill lets nothing through is not read against what is behind it.
    expect(backdrops(badgeIntents.ai, values)).not.toContain(values.get("q-bg") as string)
  })

  test("both themes draw it identically, so this was never a light-mode bug", () => {
    expect(THEMES[0].values.get("q-on-brand")).toBe(THEMES[1].values.get("q-on-brand") as string)
    expect(THEMES[0].values.get("q-brand")).toBe(THEMES[1].values.get("q-brand") as string)
  })
})

/**
 * A link inside body copy, where the second cue is not optional.
 *
 * WCAG 1.4.1 asks for 3:1 between link text and the text it sits inside when
 * colour is the only thing telling them apart. `--q-brand-text` against
 * `--q-fg-muted` is 1.38:1 on light and 1.34:1 on dark — the same darkness, a
 * different hue — and that cannot be re-tuned away: a `--q-brand-text` that
 * clears 4.5:1 on `--q-bg` (#f4f6f6) needs luminance ≤ 0.1651, and sitting 3:1
 * either side of `--q-fg-muted` (#4b5563) needs ≥ 0.3668 or ≤ −0.004, i.e.
 * darker than black. No colour satisfies both while body copy stays gray-600.
 *
 * So `Link` carries a resting underline instead, and both halves are pinned
 * here: the arithmetic that forces it, and the class that provides it. Re-tune
 * the tokens until the ratio does clear 3:1 and the first test fails, which is
 * the moment the underline becomes a choice rather than a requirement.
 */
describe("an inline link against the prose around it", () => {
  const LINK_SOURCE = readFileSync(join(ROOT, "src", "components", "link.tsx"), "utf8")

  for (const { name: theme, values } of THEMES) {
    test(`${theme}: --q-brand-text is under 3:1 against --q-fg-muted, so colour cannot be the only cue`, () => {
      const ratio = contrast(values.get("q-brand-text") as string, values.get("q-fg-muted") as string)
      expect(ratio).toBeLessThan(3)
    })
  }

  test("light: no --q-brand-text can clear 4.5:1 on the page and 3:1 against the body copy at once", () => {
    const { values } = THEMES[1]
    const bg = relativeLuminance(values.get("q-bg") as string)
    const muted = relativeLuminance(values.get("q-fg-muted") as string)
    // Darkest a 4.5:1-on-background link may be, and the lightest/darkest a
    // 3:1-from-body-copy one would have to be.
    const darkEnoughForBg = (bg + 0.05) / 4.5 - 0.05
    const lighterThanMuted = 3 * (muted + 0.05) - 0.05
    const darkerThanMuted = (muted + 0.05) / 3 - 0.05

    expect(lighterThanMuted).toBeGreaterThan(darkEnoughForBg)
    expect(darkerThanMuted).toBeLessThan(0)
  })

  test("Link underlines at rest, and says so in one place", () => {
    const base = LINK_SOURCE.slice(
      LINK_SOURCE.indexOf("const BASE_CLASSES"),
      LINK_SOURCE.indexOf("export interface LinkProps"),
    )
    expect(base).toInclude("underline decoration-quebi-brand-text/40")
    // `no-underline` in the base would put it back to colour-only. The opt-out
    // is a caller's `className`, not a default.
    expect(base).not.toInclude('"font-sans font-medium text-quebi-brand-text no-underline')
    expect(base.match(/(?<!data-disabled:|disabled:|hover:)no-underline/)).toBeNull()
  })
})
