/**
 * The slider's length is the consumer's to set — on either axis.
 *
 * `<Slider orientation="vertical" className="h-48">` used to render a single
 * dot. The root carried `orientation-vertical:h-full`, which tailwind-merge
 * keeps beside a bare `h-48` (different group) and CSS then resolves in the
 * variant's favour: the compiled selector is
 * `.orientation-vertical\:h-full[data-orientation="vertical"]`, specificity
 * (0,2,0) against `.h-48`'s (0,1,0). `height: 100%` of an auto-height parent is
 * `auto`, the track is the only in-flow child and it is `flex-1`, so the whole
 * slider collapsed to the absolutely positioned thumb. The horizontal axis had
 * the same defect without the collapse: `orientation-horizontal:w-full` quietly
 * ate the `w-72` every example passes.
 *
 * So the default length is now a plain utility picked off the `orientation`
 * prop, which is the one shape tailwind-merge can drop. That is what the first
 * two tests pin — a class-level assertion on purpose, because happy-dom has no
 * layout and the failure this guards against is a CSS cascade, not a DOM shape.
 *
 * The fill geometry is here because it had never rendered at a non-zero size:
 * with the track collapsed, a vertical fill of `height: 50%` was 50% of nothing.
 */
import { describe, expect, test } from "bun:test"
import { render } from "@testing-library/react"
import { Slider, SliderFill, SliderThumb, SliderTrack } from "../../src/components/slider"

const root = (container: HTMLElement) =>
  container.querySelector('[data-slot="control"]') as HTMLElement

const fill = (container: HTMLElement) =>
  container.querySelector('[data-slot="slider-fill"]') as HTMLElement

const thumbs = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('[data-slot="indicator"]')) as HTMLElement[]

const single = (props: { orientation?: "horizontal" | "vertical"; className?: string }) => (
  <Slider aria-label="Level" defaultValue={50} {...props}>
    <SliderTrack>
      <SliderFill />
      <SliderThumb />
    </SliderTrack>
  </Slider>
)

describe("Slider length", () => {
  test("a vertical slider's height comes from the consumer, not the component", () => {
    const { container } = render(single({ orientation: "vertical", className: "h-48" }))
    const className = root(container).className

    expect(className).toContain("h-48")
    // Any `orientation-vertical:h-*` here outranks the consumer's class again.
    expect(className).not.toMatch(/orientation-vertical:h-/)
  })

  test("a horizontal slider's width comes from the consumer, not the component", () => {
    const { container } = render(single({ className: "w-72" }))
    const className = root(container).className

    expect(className).toContain("w-72")
    expect(className).not.toContain("w-full")
    expect(className).not.toMatch(/orientation-horizontal:w-/)
  })

  test("a slider that asks for no length still has one", () => {
    const { container: horizontal } = render(single({}))
    const { container: vertical } = render(single({ orientation: "vertical" }))

    expect(root(horizontal).className).toContain("w-full")
    expect(root(vertical).className).toContain("h-48")
  })
})

describe("Slider fill", () => {
  test("a vertical fill grows from the bottom", () => {
    const { container } = render(single({ orientation: "vertical", className: "h-48" }))

    expect(fill(container).style.height).toBe("50%")
    expect(fill(container).className).toContain("group-orientation-vertical/track:bottom-0")
  })

  test("a vertical range fill spans between the two thumbs", () => {
    const { container } = render(
      <Slider aria-label="Range" defaultValue={[20, 70]} orientation="vertical" className="h-48">
        <SliderTrack>
          <SliderFill />
          <SliderThumb index={0} />
          <SliderThumb index={1} />
        </SliderTrack>
      </Slider>,
    )

    expect(fill(container).style.bottom).toBe("20%")
    expect(fill(container).style.height).toBe("50%")
  })

  test("a horizontal fill grows from the start", () => {
    const { container } = render(single({ className: "w-72" }))

    expect(fill(container).style.width).toBe("50%")
    expect(fill(container).className).toContain("group-orientation-horizontal/track:h-full")
  })
})

describe("Slider thumb", () => {
  test("react-aria owns the value axis and the class owns the other one", () => {
    const { container: vertical } = render(
      single({ orientation: "vertical", className: "h-48" }),
    )
    const [verticalThumb] = thumbs(vertical)

    // Vertical values run bottom-up, so react-aria writes `top: 1 - percent`.
    expect(verticalThumb.style.top).toBe("50%")
    expect(verticalThumb.className).toContain("left-1/2")

    const { container: horizontal } = render(single({ className: "w-72" }))
    const [horizontalThumb] = thumbs(horizontal)

    expect(horizontalThumb.style.left).toBe("50%")
    expect(horizontalThumb.className).toContain("top-1/2")
  })
})
