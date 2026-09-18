/**
 * The disabled state of the three color surfaces.
 *
 * ColorArea, ColorSliderTrack and ColorWheelTrack all paint their gradient
 * through react-aria's `defaultStyle`, and all three used to delete it when
 * disabled — `background: isDisabled ? undefined : …`. What was left was an
 * empty box with a `disabled:opacity-50` on it that had nothing to mute, and a
 * thumb still showing the picked color, which reads as a broken component
 * rather than a state (task #124).
 *
 * So the guarantee worth pinning is the one that regressed: disabling a color
 * surface must not change the gradient it paints. The muting is asserted
 * beside it, because "keep the gradient" and "mute it" are only right together
 * — either on its own is the bug back in a different shape.
 */
import { readFileSync } from "node:fs"
import { describe, expect, test } from "bun:test"
import { render } from "@testing-library/react"
import { ColorArea } from "../../src/components/color-area"
import { ColorSlider } from "../../src/components/color-slider"
import { ColorWheel } from "../../src/components/color-wheel"

/** The inline `background` react-aria wrote, read off the attribute. */
const backgroundOf = (el: Element) =>
  /background:\s*([^;]+)/.exec(el.getAttribute("style") ?? "")?.[1]?.trim()

const area = (isDisabled: boolean) => (
  <ColorArea
    defaultValue="hsb(219, 58%, 93%)"
    xChannel="saturation"
    yChannel="brightness"
    aria-label="Saturation and brightness"
    isDisabled={isDisabled}
  />
)
const slider = (isDisabled: boolean) => (
  <ColorSlider label="Hue" defaultValue="hsl(280, 100%, 50%)" channel="hue" isDisabled={isDisabled} />
)
const wheel = (isDisabled: boolean) => (
  <ColorWheel defaultValue="hsl(200, 100%, 50%)" isDisabled={isDisabled} />
)

/** Each surface, and how to find the painted element inside its own markup. */
const surfaces = [
  ["ColorArea", area, (c: HTMLElement) => c.querySelector('[data-slot="color-area"]')],
  ["ColorSliderTrack", slider, (c: HTMLElement) => c.querySelector('[class~="group"]')],
  // The track is the wheel's first child; the thumb is its second.
  ["ColorWheelTrack", wheel, (c: HTMLElement) => c.firstElementChild?.firstElementChild],
] as const

describe("a disabled color surface", () => {
  // The wheel is absent here on purpose: its gradient is a `conic-gradient(…)`
  // layered under a checkerboard, and happy-dom's CSS parser drops the whole
  // declaration rather than keeping both layers, so there is nothing to read
  // back. Its half of this guarantee is the source assertion at the bottom.
  test.each(surfaces.filter(([name]) => name !== "ColorWheelTrack"))(
    "%s keeps the gradient it paints when enabled",
    (_name, fixture, locate) => {
      const enabled = backgroundOf(locate(render(fixture(false)).container) as Element)
      const disabled = backgroundOf(locate(render(fixture(true)).container) as Element)

      expect(enabled).toContain("gradient")
      expect(disabled).toBe(enabled as string)
    },
  )

  test.each(surfaces)("%s mutes that gradient rather than deleting it", (_name, fixture, locate) => {
    const surface = locate(render(fixture(true)).container) as Element
    expect(surface).toHaveAttribute("data-disabled")
    expect(surface.className).toContain("disabled:opacity-50")
  })
})

describe("the thumb inside a color area", () => {
  // The area's `opacity-50` covers its whole subtree, and ColorThumb carries its
  // own — compounded, the thumb lands at a quarter, dimmer than the slider's and
  // the wheel's thumbs, neither of which is nested under a dimmed surface.
  test("does not dim a second time", () => {
    const { container } = render(area(true))
    const thumb = container.querySelector('[data-slot="color-area"] > [data-rac]') as HTMLElement

    expect(thumb.className).toContain("disabled:opacity-100")
    expect(thumb.className).not.toContain("disabled:opacity-50")
  })
})

describe("no color surface blanks its own paint when disabled", () => {
  // The source, not the DOM, because the wheel's rendered background does not
  // survive happy-dom — and because `isDisabled ? undefined` is the exact shape
  // that caused this, in all three files, by copy.
  test.each(["color-area", "color-slider", "color-wheel"])("%s.tsx", (file) => {
    const source = readFileSync(`${import.meta.dir}/../../src/components/${file}.tsx`, "utf8")
    expect(source).not.toContain("isDisabled")
  })
})
