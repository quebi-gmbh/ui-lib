/**
 * Where a ScrollArea's padding lands, and which scrollbar model it declares.
 *
 * Both halves of task #102 were invisible failures — nothing threw, nothing
 * logged, the component just looked wrong — and both are one edit away from
 * coming back, so both are pinned here.
 *
 * The React half: the browser paints a scrollbar at the inner edge of the
 * *scroll container's* border box, so a wrapper div between the consumer's
 * `className` and the overflow container turns `p-4` into a 16px inset on the
 * bar plus a dead strip beyond it. The guarantee is that there is no such
 * wrapper: the node the consumer's props reach is the node that scrolls.
 *
 * The CSS half: an element that sets `scrollbar-width` or `scrollbar-color`
 * makes Chromium and Safari ignore its own `::-webkit-scrollbar-*` rules, so
 * declaring both families together is not a fallback — it silently hands those
 * browsers the platform bar, arrows and all. The `@supports` gate is what keeps
 * any one element from setting both, and a well-meaning tidy-up that hoists
 * either family out of its gate would restore the bug.
 */
import { createRef } from "react"
import { describe, expect, test } from "bun:test"
import { render, screen } from "@testing-library/react"
import { ScrollArea } from "../../src/components/scroll-area"

const viewport = () =>
  document.querySelector('[data-slot="scroll-area-viewport"]') as HTMLDivElement

describe("ScrollArea is the element that scrolls", () => {
  test("the consumer's className lands on the viewport, not on a wrapper around it", () => {
    render(
      <ScrollArea className="p-4">
        <p>content</p>
      </ScrollArea>,
    )
    const el = viewport()
    expect(el.classList.contains("p-4")).toBe(true)
    // Padding on anything *containing* the viewport is the bug: it insets the
    // native bar from the card edge.
    expect(el.parentElement?.className ?? "").not.toContain("p-4")
  })

  test("there is no wrapper element at all — the viewport is the outermost node", () => {
    const { container } = render(
      <ScrollArea>
        <p>content</p>
      </ScrollArea>,
    )
    expect(container.firstElementChild).toBe(viewport())
  })

  test("a forwarded ref points at the viewport, so scrollTop means something", () => {
    const ref = createRef<HTMLDivElement>()
    render(
      <ScrollArea ref={ref}>
        <p>content</p>
      </ScrollArea>,
    )
    expect(ref.current).toBe(viewport())
  })

  test("other props reach the viewport too", () => {
    render(
      <ScrollArea aria-label="log" data-testid="area">
        <p>content</p>
      </ScrollArea>,
    )
    expect(screen.getByTestId("area")).toBe(viewport())
  })
})

describe("scrollbarGutter reserves the gutter with the CSS property", () => {
  // Padding is the consumer's to spend on content inset now that `className`
  // lands here, so the gutter cannot also be padding — the two would collide on
  // the same edge and the narrower one would win. `scrollbar-gutter: stable`
  // also reserves the space *before* the bar appears, which padding applied on
  // `data-has-overflow-y` never did.
  test("sets scrollbar-gutter and leaves the consumer's padding intact", () => {
    render(
      <ScrollArea scrollbarGutter className="p-4">
        <p>content</p>
      </ScrollArea>,
    )
    const el = viewport()
    expect(el.className).toContain("[scrollbar-gutter:stable]")
    expect(el.classList.contains("p-4")).toBe(true)
    expect(el.className).not.toMatch(/(?:^|\s|:)pe-\d/)
  })

  test("is off by default", () => {
    render(
      <ScrollArea>
        <p>content</p>
      </ScrollArea>,
    )
    expect(viewport().className).not.toContain("scrollbar-gutter")
  })
})

describe("the quebi-scrollbar utility declares one scrollbar model per browser", () => {
  const css = Bun.file(`${import.meta.dir}/../../src/quebi-theme.css`)

  /** The body of a `@utility <name> { … }` / `@theme { … }` block, by brace matching. */
  const blockBody = (source: string, opener: string) => {
    const start = source.indexOf(opener)
    expect(start).toBeGreaterThan(-1)
    let depth = 0
    for (let i = source.indexOf("{", start); i < source.length; i++) {
      if (source[i] === "{") depth++
      else if (source[i] === "}" && --depth === 0)
        return source.slice(source.indexOf("{", start) + 1, i)
    }
    throw new Error(`unbalanced braces in ${opener}`)
  }

  /** The body of `@utility quebi-scrollbar { … }` — the base bar, not a variant. */
  const utilityBody = async () => blockBody(await css.text(), "@utility quebi-scrollbar {")

  /** The body of the nested `@supports <condition> { … }`, by brace matching. */
  const supportsBody = (body: string, condition: string) => {
    const start = body.indexOf(`@supports ${condition} {`)
    expect(start).toBeGreaterThan(-1)
    let depth = 0
    for (let i = body.indexOf("{", start); i < body.length; i++) {
      if (body[i] === "{") depth++
      else if (body[i] === "}" && --depth === 0)
        return body.slice(body.indexOf("{", start) + 1, i)
    }
    throw new Error(`unbalanced braces in @supports ${condition}`)
  }

  test("the standard properties are gated to browsers without ::-webkit-scrollbar", async () => {
    const body = await utilityBody()
    const firefoxOnly = supportsBody(body, "not selector(::-webkit-scrollbar)")
    expect(firefoxOnly).toContain("scrollbar-width:")
    expect(firefoxOnly).toContain("scrollbar-color:")
    // Nowhere else. Ungated, they would switch Chromium and Safari to the
    // platform bar and make every rule below dead code.
    const outside = body.replace(firefoxOnly, "")
    expect(outside).not.toContain("scrollbar-width:")
    expect(outside).not.toContain("scrollbar-color:")
  })

  test("the ::-webkit- rules are gated to browsers that have them, and kill the steppers", async () => {
    const body = await utilityBody()
    const webkitOnly = supportsBody(body, "selector(::-webkit-scrollbar)")
    expect(webkitOnly).toContain("&::-webkit-scrollbar-thumb {")
    // The arrows the user reported. Chromium on Linux paints them by default.
    expect(webkitOnly).toMatch(/&::-webkit-scrollbar-button \{[^}]*display: none/)
    // `&::` — the `@supports` conditions themselves name the bare pseudo-element.
    const outside = body.replace(webkitOnly, "")
    expect(outside).not.toContain("&::-webkit-scrollbar")
  })

  test("a stepper can only ever be the single pair, and only on a variant's say-so", async () => {
    // Two things the blanket `display: none` above is doing at once. It is the
    // default — no steppers unless something asks — and it is what stops
    // Chromium's *doubled* pair: the platform offers a decrement and an
    // increment button at **each** end, four per bar, and only the two named
    // here are ever given a display to take.
    const webkitOnly = supportsBody(await utilityBody(), "selector(::-webkit-scrollbar)")
    expect(webkitOnly).toMatch(
      /&::-webkit-scrollbar-button:start:decrement,\s*\n\s*&::-webkit-scrollbar-button:end:increment \{[^}]*display: var\(--q-scroll-button\)/,
    )
    // The switch is a variable, so turning steppers on is an override and not a
    // second copy of these rules racing them at equal specificity.
    const theme = blockBody(await css.text(), "@theme {")
    expect(theme).toMatch(/--q-scroll-button: none;/)

    // The glyph is gradients, not a data URI: Chromium ignores `clip-path` and
    // `mask-image` on this pseudo-element, and a data-URI arrow would carry its
    // own ink colour past `--q-scroll-thumb` and past the theme flip.
    expect(webkitOnly).not.toContain("data:image")

    // The ink's resting value sits on the *bare* button selector. Declared
    // instead beside the sizing — which names two pseudo-classes — it would
    // out-specify `:hover`'s one and the arrow would never light up, which is
    // exactly how it shipped for the length of one screenshot.
    expect(webkitOnly).toMatch(
      /&::-webkit-scrollbar-button \{[^}]*--q-scroll-ink: var\(--q-scroll-thumb\);/,
    )
    for (const state of ["hover", "active"] as const) {
      expect(webkitOnly).toMatch(
        new RegExp(
          `&::-webkit-scrollbar-button:${state} \\{\\s*--q-scroll-ink: var\\(--q-scroll-thumb-${state}\\)`,
        ),
      )
    }

    for (const direction of ["vertical:start:decrement", "vertical:end:increment"]) {
      const rule = webkitOnly.slice(
        webkitOnly.indexOf(`&::-webkit-scrollbar-button:${direction} {`),
      )
      expect(rule.slice(0, rule.indexOf("}"))).toContain("var(--q-scroll-ink)")
    }
  })

  test("the thumb's colour is a theme token, and both scrollbar systems read it", async () => {
    // The thumb was cyan-500 at 25% in both themes, which is 1.26:1 on the
    // light Card — a control you have to find and drag, at less contrast than
    // the divider #103 already rejected that number for (task #146). It is now
    // `--q-scroll-thumb`, ink under `.light` and the unchanged cyan under
    // `:root, .dark`.
    //
    // The two systems have to move together: `quebi-scrollbar` paints every
    // native overflow container — including the page scroller since tasks
    // #180/#181 — and `.os-theme-quebi` paints the inner scroll areas'
    // OverlayScrollbars. Naming the same three variables is what makes that
    // structural rather than a promise in a comment — so what is pinned here
    // is that neither block spells a colour out for itself.
    const source = await css.text()
    const body = await utilityBody()
    // Bounded at the block's own closing brace rather than running to the end
    // of the file: `.os-theme-quebi` happened to be last in `quebi-theme.css`,
    // so an unbounded slice read whatever was appended after it as part of the
    // block — and `task #179` in a comment is a three-digit hex colour.
    const osStart = source.indexOf(".os-theme-quebi {")
    const os = source.slice(osStart, source.indexOf("\n}", osStart) + 2)

    for (const token of ["--q-scroll-thumb", "--q-scroll-thumb-hover", "--q-scroll-thumb-active"]) {
      expect(body).toContain(`var(${token})`)
      expect(os).toContain(`var(${token})`)
      // Declared in both theme blocks, or one theme falls back to nothing.
      expect(source.match(new RegExp(`^\\s*${token}:`, "gm"))?.length).toBe(2)
    }

    // A literal colour in either block is the drift this replaces.
    const colour = /(?:#[0-9a-fA-F]{3,8}|rgba?\(|color-mix\()/
    expect(body.replace(/transparent/g, "")).not.toMatch(colour)
    expect(os.replace(/transparent/g, "")).not.toMatch(colour)
  })

  test("the bar's geometry is tokens, and both scrollbar systems read the same ones", async () => {
    // Taking the padding off the bar was the moment to stop spelling the
    // numbers twice, so the decision lives in one place. `--q-scroll-size` is
    // the whole bar and `--q-scroll-pad` the gap to the edge; the utility below
    // and `.os-theme-quebi` both read them, so the native bars and the app
    // shell's OverlayScrollbars cannot end up two different scrollbars — the
    // same argument the colours won in task #146.
    const source = await css.text()
    const webkitOnly = supportsBody(await utilityBody(), "selector(::-webkit-scrollbar)")
    expect(webkitOnly).toContain("width: var(--q-scroll-size)")
    expect(webkitOnly).toContain("height: var(--q-scroll-size)")
    // A thumb has no padding property, so a transparent border plus a
    // padding-box clip is the only way to inset it — and at `pad: 0` that
    // border is zero-width and the pill fills the track.
    expect(webkitOnly).toContain("background-clip: padding-box")
    expect(webkitOnly).toContain("border: var(--q-scroll-pad) solid transparent")
    // Firefox takes a keyword and not a length, so it reads its own token.
    const firefoxOnly = supportsBody(await utilityBody(), "not selector(::-webkit-scrollbar)")
    expect(firefoxOnly).toContain("scrollbar-width: var(--q-scroll-width)")

    const os = blockBody(source, ".os-theme-quebi {")
    expect(os).toContain("--os-size: var(--q-scroll-size)")
    // Both paddings, not just the perpendicular one: a bar that hugs the sides
    // and stops short of the ends is a half-applied decision.
    expect(os).toContain("--os-padding-perpendicular: var(--q-scroll-pad)")
    expect(os).toContain("--os-padding-axis: var(--q-scroll-pad)")
    expect(os).toContain("--os-handle-min-size: var(--q-scroll-min)")
    // A literal length left in either block is the drift this replaces — in the
    // declarations, that is; a comment may quote a number. The two exceptions
    // are not geometry: `0` is how a stepper button is removed, and `9999px` is
    // "a pill" rather than a measurement.
    const declarationsOf = (block: string) =>
      block.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(?:width|height): 0;|9999px/g, "")
    expect(declarationsOf(webkitOnly)).not.toMatch(/\d+px/)
    expect(declarationsOf(os)).not.toMatch(/\d+px/)
  })

  test("the default is no padding, declared once as theme geometry", async () => {
    // The bar is the same size in both themes, the way a radius is, so these
    // live in `@theme` next to the radii and not in the per-theme value sets.
    const theme = blockBody(await css.text(), "@theme {")
    expect(theme).toMatch(/--q-scroll-size:\s+6px;/)
    expect(theme).toMatch(/--q-scroll-pad:\s+0px;/)
    expect(theme).toMatch(/--q-scroll-width:\s+thin;/)
    expect(theme).toMatch(/--q-scroll-min:\s+32px;/)
  })

  test("a variant is variable overrides only, so one class picks a bar", async () => {
    const source = await css.text()
    for (const [name, declarations] of [
      ["quebi-scrollbar-floating", ["--q-scroll-size: 12px", "--q-scroll-pad: 3px"]],
      ["quebi-scrollbar-none", ["--q-scroll-size: 0px", "--q-scroll-width: none"]],
      [
        "quebi-scrollbar-arrows",
        ["--q-scroll-size: 12px", "--q-scroll-pad: 3px", "--q-scroll-button: block"],
      ],
    ] as const) {
      const body = blockBody(source, `@utility ${name} {`)
      for (const declaration of declarations) expect(body).toContain(declaration)
      // A variant that restated the rules would be a second scrollbar to keep
      // in step with the first, and its rules would race the base utility's at
      // equal specificity. Overriding the variables it reads cannot.
      expect(body).not.toContain("::-webkit-")
      expect(body).not.toContain("scrollbar-color")
    }
  })

  test("the corner clip is its own utility, gated, and never on the page itself", async () => {
    const source = await css.text()
    // Not in the base utility. `clip-path` trims everything the element paints
    // outside its border box — ListBox's `shadow-quebi-glow`, an `outline` ring
    // — and on `<html>` it would make the page the containing block for every
    // fixed descendant on the site (which is how tasks #180/#181 started).
    // Declarations only: a comment there may *name* the property, and one does
    // — the steppers' glyph is gradients precisely because Chromium ignores
    // `clip-path` on `::-webkit-scrollbar-button`.
    expect((await utilityBody()).replace(/\/\*[\s\S]*?\*\//g, "")).not.toContain("clip-path")

    const corners = blockBody(source, "@utility quebi-scrollbar-corners {")
    expect(corners).toContain("clip-path: border-box")
    // `border-box` alone is newer than the shapes; a browser without it keeps a
    // bar that crosses the arc, which is what every browser had before.
    expect(corners).toContain("@supports (clip-path: border-box)")

    const root = Bun.file(`${import.meta.dir}/../../src/root.tsx`)
    // The opening tag, not the first `<html>` in the file — the comment above
    // it names the element too.
    const html = (await root.text()).match(/<html\s+lang[\s\S]*?>/)?.[0] ?? ""
    expect(html).toContain("quebi-scrollbar")
    expect(html).not.toContain("quebi-scrollbar-corners")
  })
})

describe("the bar the viewport wears", () => {
  test("it hugs the edge and follows the surface's own corner", () => {
    render(
      <ScrollArea>
        <p>content</p>
      </ScrollArea>,
    )
    const className = viewport().className
    expect(className).toContain("quebi-scrollbar")
    // The radius is whatever the parent's is — `rounded-[inherit]` — so the
    // clip has to come from the element's own box rather than from a prop
    // someone has to keep in sync with the card around it.
    expect(className).toContain("quebi-scrollbar-corners")
    expect(className).toContain("rounded-[inherit]")
    // flush is the default, and the default is the base utility on its own.
    expect(className).not.toContain("quebi-scrollbar-floating")
    expect(className).not.toContain("quebi-scrollbar-none")
    expect(className).not.toContain("quebi-scrollbar-arrows")
  })

  test("a variant adds exactly its own utility", () => {
    for (const [variant, expected] of [
      ["floating", "quebi-scrollbar-floating"],
      ["none", "quebi-scrollbar-none"],
      ["arrows", "quebi-scrollbar-arrows"],
    ] as const) {
      const { unmount } = render(
        <ScrollArea scrollbar={variant}>
          <p>content</p>
        </ScrollArea>,
      )
      const className = viewport().className
      expect(className).toContain("quebi-scrollbar")
      expect(className).toContain(expected)
      unmount()
    }
  })

  test("arrows is the one variant without the corner clip, and the only one", () => {
    // A stepper sits at the end of the bar, which is the part the arc cuts
    // away, so `quebi-scrollbar-corners` would take a bite out of the arrow —
    // and leaving the clip off is free on the square-cornered surface the
    // variant asks for anyway. Pinned in both directions: the day the clip
    // becomes unconditional again, an arrowed bar goes quietly wrong.
    for (const [variant, clipped] of [
      ["flush", true],
      ["floating", true],
      ["none", true],
      ["arrows", false],
    ] as const) {
      const { unmount } = render(
        <ScrollArea scrollbar={variant}>
          <p>content</p>
        </ScrollArea>,
      )
      expect(viewport().className.includes("quebi-scrollbar-corners")).toBe(clipped)
      unmount()
    }
  })
})
