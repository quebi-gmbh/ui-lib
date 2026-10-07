/**
 * Button's press behaviour and its radius.
 *
 * Mostly a smoke test — Button is a thin wrapper over React Aria's — with one
 * assertion that is a regression guard: `isCircle` used to be a no-op, because
 * a radius token in the base and `rounded-full` in the variant were not one
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
    expect(button).not.toHaveClass("rounded-none")
  })

  test("defaults to the theme's control radius, 6px on the app surface and square inside quebi-editorial", () => {
    render(<Button>Save</Button>)

    expect(screen.getByRole("button", { name: "Save" })).toHaveClass("rounded-(--q-radius-control)")
  })
})

/**
 * Every intent's label against its own fill, at rest and on hover, in both
 * themes.
 *
 * `tests/badge-contrast.test.ts` walks `badgeIntents`; Button has its own
 * intent map and a hover state, so this is that file's method pointed at
 * Button: resolve what the rendered class list actually asks for, composite
 * it, and recompute — no ratio is written down here, and both themes are read
 * out of `src/quebi-theme.css`.
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
    { name: "light", values: themeValues(":root,\n.light {") },
    { name: "dark", values: themeValues(".dark {") },
  ] as const

  /**
   * Stock Tailwind hues. Every intent is painted in tokens now, so this is
   * empty on purpose: a raw palette fill fails below on not being known rather
   * than being skipped.
   */
  const TAILWIND: Record<string, string> = {}

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

  /** `quebi-fg/20` → `["quebi-fg", 0.2]`; `/[0.04]` too; bare → alpha 1. */
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
    // A theme variable for a ground: the card ground, which is the page itself
    // (and transparent while fields are underlines).
    if (name === "(--q-field-bg)") return behind
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

  const INTENTS = ["primary", "secondary", "outline", "ghost", "danger"] as const

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

  test("every label is a token, so it flips with the theme its fill flips with", () => {
    // `danger` used to put `text-white` on its red. `--q-danger` is red-700 on
    // Daylight and red-400 on Cinematic, and white on red-400 is under 3:1 —
    // the label has to be the ground, which flips with it.
    for (const { intent, fg } of pairs) {
      expect(fg.startsWith("quebi-"), `${intent} paints its label in "${fg}"`).toBe(true)
    }
  })
})

/**
 * Hover: a change of fill, never a shadow or a transform.
 *
 * A button sits in the page flow, and nothing in the page flow casts a shadow
 * — `shadow-quebi-float` belongs to menus, popovers and toasts. A control that
 * grows under the pointer nudges its neighbours out of alignment in a
 * `ButtonGroup` and resamples its own label for as long as it is hovered. It
 * reads the *output* of `buttonStyles`, like the contrast scan above, so an
 * override anywhere in the recipe is measured as it renders.
 */
describe("Button hover: fill only", () => {
  const INTENTS = ["primary", "secondary", "outline", "ghost", "danger"] as const

  /** The classes `buttonStyles` actually emits for one intent, post-merge. */
  const classesFor = (intent: (typeof INTENTS)[number]) => buttonStyles({ intent }).split(/\s+/)

  test("no intent casts a shadow of its own — only the theme's, which the theme sets to none", () => {
    // A theme may give controls a hard shadow (`--q-shadow-control`,
    // `--q-shadow-action`) and drop it on press; a literal shadow utility would
    // be one the theme cannot take back.
    const themed = /(^|:)shadow-(?:\(--q-shadow-(?:control|action)\)|none)$/
    for (const intent of INTENTS) {
      const shadows = classesFor(intent).filter((c) => /(^|:)shadow-/.test(c) && !themed.test(c))
      expect(shadows, `${intent} casts a shadow`).toEqual([])
    }
  })

  test("nothing grows under the pointer", () => {
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
    expect(animated).toContain("background-color") // every intent's fill
    expect(animated).toContain("border-color") // primary's hover edge
    expect(animated).toContain("color") // ghost's label
    expect(animated).toContain("opacity") // danger's hover, disabled: and pending:
  })
})
