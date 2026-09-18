/**
 * What a ColorArea does with the `children` its own prop type advertises.
 *
 * It used to spread them onto the react-aria primitive and then write a JSX
 * child of its own. JSX children win over a spread `children`, so anything a
 * consumer passed was discarded with no error and no warning (task #152) —
 * the same "both props are dropped in silence" shape this repo publishes a lint
 * rule about, in a library component. The registry examples for ColorThumb
 * demonstrated exactly that: they nest a ColorThumb in a ColorArea, and what
 * rendered was the area's own.
 *
 * The contract is now: `children` replace the default thumb, and the default is
 * a fallback. The hairline assertion rides along because it is the other thing
 * on that element that regressed — a `border` sat under react-aria's inline
 * `background` shorthand (which resets `background-clip` to `border-box`) and
 * so was composited into the gradient instead of drawn against the page,
 * fading out across the rounded corners (task #127).
 */
import { describe, expect, test } from "bun:test"
import { render } from "@testing-library/react"
import { ColorArea } from "../../src/components/color-area"
import { ColorThumb } from "../../src/components/color-thumb"

const area = (children?: React.ReactNode) => (
  <ColorArea
    defaultValue="hsb(219, 58%, 93%)"
    xChannel="saturation"
    yChannel="brightness"
    aria-label="Saturation and brightness"
  >
    {children}
  </ColorArea>
)

const surface = (container: HTMLElement) =>
  container.querySelector('[data-slot="color-area"]') as HTMLElement

describe("ColorArea children", () => {
  test("render the default thumb when none are given", () => {
    const { container } = render(area())
    const children = surface(container).children

    expect(children).toHaveLength(1)
    expect(children[0]?.className).toContain("rounded-full")
  })

  test("are rendered, not dropped", () => {
    const { container } = render(area(<span data-testid="mine" />))

    expect(container.querySelector('[data-testid="mine"]')).not.toBeNull()
  })

  test("replace the default thumb rather than sitting beside it", () => {
    const { container } = render(area(<ColorThumb />))

    expect(surface(container).children).toHaveLength(1)
  })

  // What the Color Thumb page is *for* (task #132): the slot is only worth
  // publishing if a thumb passed through it can look different from the one it
  // replaces. `cn` merges, so a size in `className` has to beat the base
  // `size-6` rather than land beside it and lose to source order.
  test("carry a className that beats the thumb's own defaults", () => {
    const { container } = render(area(<ColorThumb className="size-8 rounded-quebi-sm" />))
    const thumb = surface(container).children[0] as HTMLElement

    expect(thumb.className).toContain("size-8")
    expect(thumb.className).not.toContain("size-6")
    expect(thumb.className).not.toContain("rounded-full")
  })
})

describe("the area's hairline", () => {
  test("is an inset ring, not a border painted over the gradient", () => {
    const className = surface(render(area()).container).className

    expect(className).toContain("inset-ring-1")
    expect(className).not.toMatch(/(^|\s)border(\s|$)/)
  })
})
