/**
 * Button's press behaviour and its radius.
 *
 * Mostly a smoke test — Button is a thin wrapper over React Aria's — with one
 * assertion that is a regression guard: `isCircle` used to be a no-op, because
 * `rounded-quebi-sm` in the base and `rounded-full` in the variant are not one
 * group to tailwind-merge, so the base radius survived the merge and won on
 * sheet order. The fix was to make the two radii mutually exclusive branches of
 * the same variant (task #49); this pins it.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, test } from "bun:test"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Button, buttonStyles } from "../../src/components/button"

describe("Button", () => {
  test("renders its label as a real button", () => {
    render(<Button>Save</Button>)

    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument()
  })

  test("calls onPress when pressed", async () => {
    const user = userEvent.setup()
    let presses = 0
    render(<Button onPress={() => presses++}>Save</Button>)

    await user.click(screen.getByRole("button", { name: "Save" }))

    expect(presses).toBe(1)
  })

  test("a disabled button is disabled to the DOM, not only to React Aria", async () => {
    const user = userEvent.setup()
    let presses = 0
    render(
      <Button isDisabled onPress={() => presses++}>
        Save
      </Button>,
    )

    const button = screen.getByRole("button", { name: "Save" })
    expect(button).toBeDisabled()
    await user.click(button)
    expect(presses).toBe(0)
  })

  test("isCircle actually rounds the button", () => {
    render(<Button isCircle>+</Button>)

    const button = screen.getByRole("button", { name: "+" })
    expect(button).toHaveClass("rounded-full")
    expect(button).not.toHaveClass("rounded-quebi-sm")
  })

  test("defaults to the quebi radius", () => {
    render(<Button>Save</Button>)

    expect(screen.getByRole("button", { name: "Save" })).toHaveClass("rounded-quebi-sm")
  })
})

/**
 * Every intent's label against its own fill, at rest and on hover, in both
 * themes.
 *
 * `accent` and `danger` put `text-white` on a stock Tailwind 500 — 3.96:1 and
 * 3.76:1, under 1.4.3's 4.5:1, which `xs` (12px) and `sm` (14px) are squarely
 * subject to. Worse, both *lightened* on hover, to 2.64:1 and 2.77:1: the label
 * faded out exactly when the pointer was on it (task #144).
 *
 * `tests/badge-contrast.test.ts` could not catch it. It walks `badgeIntents`,
 * and Button has its own intent map, its own foreground convention (`text-white`
 * rather than a `--q-*` token) and a hover state no contrast test in the repo
 * read. So this is that file's method pointed at Button: resolve what the
 * rendered class list actually asks for, composite it, and recompute — no ratio
 * is written down here, and both themes are read out of `src/quebi-theme.css`.
 *
 * It walks the *output* of `buttonStyles`, not the source of the variant map,
 * so an intent whose fill is overridden elsewhere in the recipe is measured as
 * it renders rather than as it is written.
 */
describe("Button intents: the label on its own fill", () => {
  const THEME = readFileSync(join(import.meta.dir, "..", "..", "src", "quebi-theme.css"), "utf8")

  /** The `--*: #hex` pairs of one theme block — plain CSS, so always shipped. */
  function themeValues(selector: string): Map<string, string> {
    const start = THEME.indexOf(selector)
    expect(start, `${selector} is not in quebi-theme.css`).toBeGreaterThan(-1)
    const block = THEME.slice(start, THEME.indexOf("\n}", start))
    return new Map(
      [...block.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)].map(([, n, hex]) => [n, hex]),
    )
  }

  const THEMES = [
    { name: "dark", values: themeValues(":root,\n.dark {") },
    { name: "light", values: themeValues(".light {") },
  ] as const

  /**
   * The stock hues the two non-token intents are painted in. Written down here
   * because they are Tailwind's values and not ours; the guard against this map
   * falling behind the component is below — a fill that is neither a `--q-*`
   * token nor a key here fails rather than being skipped.
   */
  const TAILWIND: Record<string, string> = {
    white: "#ffffff",
    // The two steps the fix moved off are kept in the map on purpose: putting a
    // 500 back must fail on its *ratio*, with the number in the message, rather
    // than on this map not knowing the colour.
    "purple-400": "#c084fc",
    "purple-500": "#a855f7",
    "purple-600": "#9333ea",
    "purple-700": "#7e22ce",
    "red-400": "#f87171",
    "red-500": "#ef4444",
    "red-600": "#dc2626",
    "red-700": "#b91c1c",
  }

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
    return `#${f
      .map((v, i) =>
        Math.round(v * alpha + b[i] * (1 - alpha))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")}`
  }

  /** `quebi-brand/20` → `["quebi-brand", 0.2]`; `/[0.04]` too; bare → alpha 1. */
  function split(value: string): [string, number] {
    const [name, alpha] = value.split("/")
    if (alpha === undefined) return [name, 1]
    return [name, alpha.startsWith("[") ? Number(alpha.slice(1, -1)) : Number(alpha) / 100]
  }

  /**
   * The colour a utility's value resolves to, composited over what is behind
   * it. `transparent` is the page: an outline or ghost button has the page
   * showing through, which is exactly what its label is read against.
   */
  function resolve(value: string, values: Map<string, string>, behind: string) {
    const [name, alpha] = split(value)
    if (name === "transparent" || name === "current") return behind
    const hex = name.startsWith("quebi-")
      ? values.get(`q-${name.slice("quebi-".length)}`)
      : TAILWIND[name]
    // Not a token and not in the map above: the map has fallen behind the
    // component, and silently skipping is how a fill stops being measured.
    expect(hex, `no value for "${name}" — add it to TAILWIND or use a token`).toBeString()
    return over(hex as string, behind, alpha)
  }

  /** `text-base`, `text-xs`… are sizes, not colours. */
  const SIZE_WORDS = new Set(["xs", "sm", "base", "lg", "xl"])

  /** The last `[hover:]bg-`/`text-` value in a rendered class list. */
  function utility(classes: string[], variant: "" | "hover:", property: "bg" | "text") {
    const prefix = `${variant}${property}-`
    const hit = classes
      .filter((c) => c.startsWith(prefix))
      .map((c) => c.slice(prefix.length))
      .filter((v) => !(property === "text" && SIZE_WORDS.has(v)))
      .at(-1)
    return hit
  }

  const INTENTS = ["primary", "secondary", "outline", "ghost", "accent", "danger"] as const

  const pairs = INTENTS.flatMap((intent) => {
    const classes = buttonStyles({ intent }).split(/\s+/)
    const bg = utility(classes, "", "bg") ?? "transparent"
    const fg = utility(classes, "", "text") ?? "quebi-fg"
    return [
      { intent, state: "rest", bg, fg },
      {
        intent,
        state: "hover",
        bg: utility(classes, "hover:", "bg") ?? bg,
        fg: utility(classes, "hover:", "text") ?? fg,
      },
    ]
  })

  test("the scan found a fill and a label for every intent and state", () => {
    expect(pairs).toHaveLength(INTENTS.length * 2)
    expect(pairs.every(({ bg, fg }) => bg.length > 0 && fg.length > 0)).toBe(true)
  })

  for (const { name: theme, values } of THEMES) {
    test(`${theme}: every intent clears 4.5:1 at rest and on hover`, () => {
      const page = values.get("q-bg") as string
      const failures = pairs
        .map(({ intent, state, bg, fg }) => {
          const fill = resolve(bg, values, page)
          return {
            where: `${intent} ${state} (${fg} on ${bg})`,
            ratio: contrast(resolve(fg, values, fill), fill),
          }
        })
        .filter(({ ratio }) => ratio < 4.5)
        .map(({ where, ratio }) => `${where} → ${ratio.toFixed(2)}:1`)

      // 4.5 and not 3: `xs` is 12px and `sm` is 14px, so no button size this
      // library offers is WCAG "large text" at the label's weight.
      expect(failures).toEqual([])
    })
  }

  test("hover never makes a white label harder to read than at rest", () => {
    // The half of #144 that a floor alone would not have caught: `accent` and
    // `danger` used to lighten their fill under a white label, so the button
    // was least legible under the pointer. Every other intent's label is a dark
    // token, where lightening the fill is the right direction — this is scoped
    // to the two that are white on a saturated fill.
    const white = pairs.filter(({ fg }) => fg === "white")
    expect(white.map(({ intent }) => intent)).toEqual(["accent", "accent", "danger", "danger"])

    for (const { name: theme, values } of THEMES) {
      const page = values.get("q-bg") as string
      const ratio = (bg: string, fg: string) => {
        const fill = resolve(bg, values, page)
        return contrast(resolve(fg, values, fill), fill)
      }
      for (const intent of ["accent", "danger"] as const) {
        const rest = white.find((p) => p.intent === intent && p.state === "rest")
        const hover = white.find((p) => p.intent === intent && p.state === "hover")
        expect(
          ratio(hover?.bg as string, "white"),
          `${theme}: ${intent} loses contrast on hover`,
        ).toBeGreaterThanOrEqual(ratio(rest?.bg as string, "white"))
      }
    }
  })
})

/**
 * Hover: one behaviour across the intent set, at control scale (task #178).
 *
 * The report was a default `<Button>` under the pointer — "too messy hover
 * effect, too much shadow etc." — and it was four changes at once. `primary`
 * alone carried `hover:shadow-quebi-glow-strong`, the theme's *overlay* rung:
 * `0 16px 40px` on light, under a 46px control, so the cast was about the size
 * of the button and landed most of a button-height below it — heavier than a
 * dialog's at rest. On dark the same token is the mint bloom that #137/#141/
 * #142 took off the whole overlay family. Meanwhile `base` scaled the box by 2%
 * and ran the lot through `transition-all`.
 *
 * What is pinned here is the shape of the fix rather than the exact rung: that
 * no intent reaches for the overlay token, that the lift is declared once and
 * so reads the same on every intent, that `ghost` — which has no box at rest to
 * cast one — actually wins the merge against the base, and that nothing grows
 * under the pointer. It reads the *output* of `buttonStyles`, like the contrast
 * scan above, so an override anywhere in the recipe is measured as it renders.
 */
describe("Button hover: one lift, at control scale", () => {
  const INTENTS = ["primary", "secondary", "outline", "ghost", "accent", "danger"] as const

  /** The classes `buttonStyles` actually emits for one intent, post-merge. */
  const classesFor = (intent: (typeof INTENTS)[number]) => buttonStyles({ intent }).split(/\s+/)

  test("no intent lifts on the overlay token any more", () => {
    // `shadow-quebi-glow-strong` is not retired — the command palette and the
    // active Stepper bullet still take it, and `tests/elevation.test.ts` guards
    // the token itself. The point is that an inline control is not a floating
    // surface.
    for (const intent of INTENTS) {
      expect(classesFor(intent), `${intent} is back on the overlay rung`).not.toContain(
        "hover:shadow-quebi-glow-strong",
      )
    }
  })

  test("every intent with a box at rest lifts, and lifts identically", () => {
    // Declared once in `base`, so "the same rung" is structural rather than six
    // copies that have to be kept in step.
    const withBox = INTENTS.filter((intent) => intent !== "ghost")
    const rungs = new Set(
      withBox.map((intent) =>
        classesFor(intent)
          .filter((c) => c.startsWith("hover:shadow-"))
          .join(" "),
      ),
    )
    expect(rungs.size, `hover shadows differ across intents: ${JSON.stringify([...rungs])}`).toBe(1)
    expect([...rungs][0]).toBe("hover:shadow-md")
  })

  test("ghost opts out, and the merge lets it", () => {
    // A base utility and a variant utility in the same tailwind-merge group:
    // the variant has to win, or `ghost` silently keeps the base shadow. That
    // is the `isCircle` failure mode (task #49) in a different group.
    const ghost = classesFor("ghost")
    expect(ghost).toContain("hover:shadow-none")
    expect(ghost).not.toContain("hover:shadow-md")
  })

  test("nothing grows under the pointer", () => {
    // A button that scales nudges its neighbours' optical alignment in a
    // ButtonGroup or a table toolbar, and resamples its own label for as long
    // as it is hovered. With the scale gone, `active:scale-100` had nothing
    // left to cancel.
    for (const intent of INTENTS) {
      const scales = classesFor(intent).filter((c) => /(^|:)scale-/.test(c))
      expect(scales, `${intent} still transforms on a state`).toEqual([])
    }
  })

  test("the transition names its properties instead of animating all of them", () => {
    const classes = classesFor("primary")
    expect(classes).not.toContain("transition-all")

    const transition = classes.find((c) => c.startsWith("transition-["))
    expect(transition, "base no longer declares an explicit transition property list").toBeString()

    // Every property the recipe actually moves has to be in the list, or
    // narrowing the transition silently snaps that change instead of easing it.
    const animated = (transition as string).slice("transition-[".length, -1).split(",")
    expect(animated).toContain("box-shadow") // the lift above
    expect(animated).toContain("background-color") // every intent's fill
    expect(animated).toContain("border-color") // secondary / outline / accent / danger
    expect(animated).toContain("color") // outline / ghost labels
    expect(animated).toContain("opacity") // disabled: and pending:
  })
})
