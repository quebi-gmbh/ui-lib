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

  /** The body of `@utility quebi-scrollbar { … }`, by brace matching. */
  const utilityBody = async () => {
    const source = await css.text()
    const start = source.indexOf("@utility quebi-scrollbar {")
    expect(start).toBeGreaterThan(-1)
    let depth = 0
    for (let i = source.indexOf("{", start); i < source.length; i++) {
      if (source[i] === "{") depth++
      else if (source[i] === "}" && --depth === 0)
        return source.slice(source.indexOf("{", start) + 1, i)
    }
    throw new Error("unbalanced braces in @utility quebi-scrollbar")
  }

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

  test("the thumb floats clear of the edges, matching the OverlayScrollbars theme", async () => {
    const source = await css.text()
    const webkitOnly = supportsBody(await utilityBody(), "selector(::-webkit-scrollbar)")
    // A thumb has no padding property: a transparent border plus a padding-box
    // clip is the only way to inset it off the container's rounded corner.
    expect(webkitOnly).toContain("background-clip: padding-box")
    const inset = webkitOnly.match(/border: (\d+)px solid transparent/)?.[1]
    const track = webkitOnly.match(/&::-webkit-scrollbar \{\s*width: (\d+)px/)?.[1]
    // The app shell's OverlayScrollbars theme is the source these copy.
    expect(track).toBe(source.match(/--os-size: (\d+)px/)?.[1])
    expect(inset).toBe(source.match(/--os-padding-perpendicular: (\d+)px/)?.[1])
  })
})
