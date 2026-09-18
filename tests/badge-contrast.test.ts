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

/**
 * The surfaces an intent's label is read against, in one theme: the bare page,
 * and the page with the intent's own fill composited over it.
 *
 * `bg-transparent` and a gradient are the two shapes that are not one flat
 * fill. `outline` is the first; `ai` is the second, and a gradient is read at
 * both ends because the worst end is the one that decides.
 */
function backdrops(classes: string, values: Map<string, string>): string[] {
  const page = values.get("q-bg") as string
  const fills: { name: string; alpha: number }[] = []

  const flat = parseColorClass(classes, "bg")
  // `bg-transparent` is not a colour, and `bg-gradient-to-r` is a direction —
  // the gradient's colours arrive as `from-`/`to-` below.
  if (flat && flat.name !== "transparent" && !flat.name.startsWith("gradient-")) fills.push(flat)
  for (const prefix of ["from", "to"]) {
    const stop = parseColorClass(classes, prefix)
    if (stop) fills.push(stop)
  }

  return [
    page,
    ...fills.map(({ name, alpha }) => {
      const hex = resolve(name, values)
      expect(hex, `no value for the fill \`${name}\` — add it to TAILWIND or the theme`).toBeString()
      return over(hex as string, page, alpha)
    }),
  ]
}

const INTENTS = Object.entries(badgeIntents)

describe("every Badge intent is legible as 12px text", () => {
  // `ai` is the one exception, and it is stated rather than skipped — see the
  // block at the bottom of this file for what is wrong with it and why fixing
  // it is not this change.
  const checked = INTENTS.filter(([name]) => name !== "ai")

  test("the map is the nine intents, and `ai` is the only one excused", () => {
    expect(INTENTS).toHaveLength(9)
    expect(checked).toHaveLength(8)
  })

  for (const { name: theme, values } of THEMES) {
    test.each(checked)(`${theme}: %s clears 4.5:1 on every surface it is drawn on`, (_n, classes) => {
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

describe("the `ai` intent, which is not fixed here", () => {
  /**
   * `ai` is the teal→purple gradient with `text-quebi-on-brand` (dark ink) on
   * top, and it is the same in both themes — so unlike the other eight this is
   * not a light-mode defect, it is a defect. The ink reads 7.81:1 over the mint
   * end and 3.74:1 over the purple end: the label fades out as it crosses its
   * own badge.
   *
   * Left alone on purpose. Every fix — a lighter foreground, a darker purple, a
   * shorter gradient — changes the look of the one intent whose look is the
   * point, and that is a design decision rather than a re-tune of a token.
   * Pinned here so it is recorded rather than hidden, and so it fails the day
   * someone fixes it without updating this file.
   */
  test("the ink still fails 4.5:1 over the purple end of the gradient", () => {
    const { values } = THEMES[1]
    const ink = values.get("q-on-brand") as string
    const surfaces = backdrops(badgeIntents.ai, values)
    const worst = Math.min(...surfaces.map((s) => contrast(ink, s)))
    expect(worst).toBeLessThan(4.5)
    expect(worst).toBeGreaterThanOrEqual(3)
  })

  test("both themes draw it identically, so this is not a light-mode bug", () => {
    expect(THEMES[0].values.get("q-on-brand")).toBe(THEMES[1].values.get("q-on-brand") as string)
    expect(THEMES[0].values.get("q-brand")).toBe(THEMES[1].values.get("q-brand") as string)
  })
})
