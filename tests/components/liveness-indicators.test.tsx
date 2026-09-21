/**
 * The three siblings whose whole job is to say a state — and whose whole
 * failure mode is saying it in the colour and nowhere else.
 *
 * Each of them renders a handful of coloured boxes and would pass any
 * screenshot review while being unreadable to a screen reader, in forced
 * colors, or to a reader who cannot tell the amber from the green. So what is
 * asserted here is the text equivalent and the redundant encoding, not the
 * classes that draw them.
 */
import { describe, expect, test } from "bun:test"
import { render } from "@testing-library/react"
import { SignalBars } from "../../src/components/signal-bars"
import { StatusDot } from "../../src/components/status-dot"
import { TypingIndicator } from "../../src/components/typing-indicator"

const query = <T extends HTMLElement>(selector: string) =>
  Array.from(document.querySelectorAll<T>(selector))

describe("SignalBars encodes the level in the height", () => {
  test("fills exactly `value` steps out of `steps`", () => {
    render(<SignalBars value={3} steps={5} label="3 of 5" />)
    const steps = query('[data-slot="signal-bars-step"]')
    expect(steps).toHaveLength(5)
    expect(steps.filter((step) => step.dataset.filled === "true")).toHaveLength(3)
  })

  test("clamps a value outside the scale rather than drawing off the end", () => {
    render(<SignalBars value={99} label="clamped" />)
    expect(query('[data-slot="signal-bars-step"]')).toHaveLength(4)
    expect(
      query('[data-slot="signal-bars-step"]').every((step) => step.dataset.filled === "true"),
    ).toBe(true)
  })

  test("the steps get taller, so the level survives a monochrome render", () => {
    render(<SignalBars value={2} label="2 of 4" />)
    const heights = query('[data-slot="signal-bars-step"]').map((step) =>
      Number.parseFloat(step.style.height),
    )
    for (let index = 1; index < heights.length; index += 1) {
      expect(heights[index]).toBeGreaterThan(heights[index - 1])
    }
  })
})

describe("SignalBars always has a text equivalent", () => {
  test("with no children, the graphic carries a generated role=img label", () => {
    render(<SignalBars value={3} />)
    const graphic = document.querySelector('[data-slot="signal-bars-graphic"]')
    expect(graphic?.getAttribute("role")).toBe("img")
    expect(graphic?.getAttribute("aria-label")).toBe("3 of 4")
  })

  test("with visible text, the graphic steps out of the tree instead of doubling it", () => {
    render(<SignalBars value={3}>Good</SignalBars>)
    const graphic = document.querySelector('[data-slot="signal-bars-graphic"]')
    expect(graphic?.getAttribute("aria-hidden")).toBe("true")
    expect(graphic?.getAttribute("role")).toBeNull()
    expect(document.querySelector('[data-slot="signal-bars-label"]')?.textContent).toBe("Good")
  })
})

describe("StatusDot never leaves the meaning in the colour", () => {
  test("with no children the tone's own word is rendered, sr-only", () => {
    render(<StatusDot tone="busy" />)
    const label = document.querySelector('[data-slot="status-dot-label"]')
    expect(label?.textContent).toBe("Busy")
    expect(label?.className).toContain("sr-only")
  })

  test("children replace it and are visible", () => {
    render(<StatusDot tone="online">In a meeting</StatusDot>)
    const label = document.querySelector('[data-slot="status-dot-label"]')
    expect(label?.textContent).toBe("In a meeting")
    expect(label?.className).not.toContain("sr-only")
  })

  test("`unknown` is a different shape, not a fifth colour", () => {
    // The one tone that is an admission rather than a claim is a hollow ring,
    // so it is distinguishable without reading a colour at all.
    render(<StatusDot tone="unknown" />)
    const glyph = document.querySelector('[data-slot="status-dot-glyph"] > span:last-child')
    expect(glyph?.className).toContain("bg-transparent")
    expect(glyph?.className).toContain("border")
  })

  test("the mark survives forced-colors, where a background colour would not", () => {
    render(<StatusDot tone="online" />)
    const glyph = document.querySelector('[data-slot="status-dot-glyph"] > span:last-child')
    expect(glyph?.className).toContain("forced-colors:outline")
  })

  test("the ring is opt-in and is dropped under reduced motion", () => {
    const { rerender } = render(<StatusDot tone="online" />)
    expect(document.querySelector('[data-slot="status-dot-ring"]')).toBeNull()

    rerender(<StatusDot tone="online" isLive />)
    const ring = document.querySelector('[data-slot="status-dot-ring"]')
    expect(ring?.className).toContain("animate-ping")
    expect(ring?.className).toContain("motion-reduce:hidden")
  })

  test("the glyph is decoration", () => {
    render(<StatusDot tone="idle" />)
    expect(
      document.querySelector('[data-slot="status-dot-glyph"]')?.getAttribute("aria-hidden"),
    ).toBe("true")
  })
})

describe("TypingIndicator is three dots and one announcement", () => {
  test("renders three dots, staggered", () => {
    render(<TypingIndicator />)
    const dots = query('[data-slot="typing-indicator-dot"]')
    expect(dots).toHaveLength(3)
    expect(dots.map((dot) => dot.style.animationDelay)).toEqual(["0ms", "160ms", "320ms"])
  })

  test("under reduced motion it becomes three static dots, not nothing", () => {
    render(<TypingIndicator />)
    for (const dot of query('[data-slot="typing-indicator-dot"]')) {
      expect(dot.className).toContain("motion-reduce:animate-none")
      expect(dot.className).not.toContain("motion-reduce:hidden")
    }
  })

  test("the label is announced once and the bounce is not", () => {
    render(<TypingIndicator label="Ada is typing" />)
    const status = document.querySelector('[role="status"]')
    expect(status?.textContent).toBe("Ada is typing")
    expect(status?.className).toContain("sr-only")
    expect(
      query('[data-slot="typing-indicator-dot"]')[0].closest("[aria-hidden]")?.getAttribute(
        "aria-hidden",
      ),
    ).toBe("true")
  })
})
