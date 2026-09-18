/**
 * The three things a ColorSlider used to get wrong about its own geometry.
 *
 * 1. A vertical thumb sat on the track's start edge instead of on the track
 *    (task #131). react-aria inlines a percentage on the *main* axis only —
 *    `left` when horizontal, `top` when vertical — and `translate(-50%, -50%)`
 *    centres the thumb on that point. The cross axis is the class list's job,
 *    and `left-[50%]` was missing, so a vertical thumb fell back to
 *    `left: auto` and translated a further half-width off the track.
 * 2. The size defaults were `orientation-*:` variants, which outrank a
 *    consumer's bare utility: the compiled selector carries the
 *    `[data-orientation]` attribute, so it is specificity (0,2,0) against
 *    `.h-80`'s (0,1,0), and tailwind-merge keeps both because they are
 *    different groups. `<ColorSlider className="w-64">` did nothing, silently
 *    (task #151) — the same trap `Slider` was pulled out of in #114.
 * 3. The track's hairline was a `border`. react-aria writes the gradient onto
 *    the inline `background` shorthand, which resets `background-clip` to
 *    `border-box` and outranks any class, so the border was composited over
 *    the track's own gradient rather than drawn against the page and faded out
 *    across the rounded ends (task #127). It is an inset ring now: a
 *    box-shadow, painted above the background, following `border-radius`.
 *
 * All three are class-level assertions on purpose: happy-dom has no layout, and
 * every one of these failures is a CSS cascade rather than a DOM shape.
 */
import { describe, expect, test } from "bun:test"
import { render } from "@testing-library/react"
import {
  ColorSlider,
  ColorSliderOutput,
  ColorSliderThumb,
  ColorSliderTrack,
} from "../../src/components/color-slider"

const root = (container: HTMLElement) =>
  container.querySelector('[data-slot="control"]') as HTMLElement

const track = (container: HTMLElement) => container.querySelector('[class~="group"]') as HTMLElement

/** The thumb is the track's only element child. */
const thumb = (container: HTMLElement) => track(container).firstElementChild as HTMLElement

const composed = (props: {
  orientation?: "horizontal" | "vertical"
  className?: string
  trackClassName?: string
}) => (
  <ColorSlider
    defaultValue="hsl(140, 100%, 50%)"
    channel="hue"
    orientation={props.orientation}
    className={props.className}
  >
    <ColorSliderTrack className={props.trackClassName}>
      <ColorSliderThumb />
    </ColorSliderTrack>
    <ColorSliderOutput />
  </ColorSlider>
)

describe("the thumb", () => {
  test.each(["horizontal", "vertical"] as const)(
    "is centred on both axes when %s",
    (orientation) => {
      const { container } = render(composed({ orientation }))
      const className = thumb(container).className

      // react-aria's inline style wins on whichever of these is the main axis;
      // the other one is the only thing centring the thumb across the track.
      expect(className).toContain("top-[50%]")
      expect(className).toContain("left-[50%]")
    },
  )
})

describe("the slider's size", () => {
  test("a horizontal slider's width comes from the consumer, not the component", () => {
    const { container } = render(composed({ className: "w-64" }))
    const className = root(container).className

    expect(className).toContain("w-64")
    expect(className).not.toContain("w-full")
    // A variant would outrank the consumer's class again.
    expect(className).not.toMatch(/orientation-\w+:w-/)
  })

  test("a track's length comes from the consumer, not the component", () => {
    const { container } = render(composed({ orientation: "vertical", trackClassName: "h-80" }))
    const className = track(container).className

    expect(className).toContain("h-80")
    expect(className).not.toContain("h-56")
    expect(className).not.toMatch(/orientation-\w+:h-/)
  })

  test("the track still carries a default on each axis for each orientation", () => {
    expect(track(render(composed({})).container).className).toContain("h-6")
    expect(track(render(composed({})).container).className).toContain("w-full")

    const vertical = track(render(composed({ orientation: "vertical" })).container).className
    expect(vertical).toContain("h-56")
    expect(vertical).toContain("w-6")
  })
})

describe("the track's hairline", () => {
  test("is an inset ring, not a border painted over the gradient", () => {
    const className = track(render(composed({})).container).className

    expect(className).toContain("inset-ring-1")
    expect(className).not.toMatch(/(^|\s)border(\s|$)/)
  })
})
