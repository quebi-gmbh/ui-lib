/**
 * The things about ActivityPulse that are decisions rather than styling.
 *
 * Every one of them is a way the component would still render, still look
 * roughly right in the one screenshot anybody takes of it, and be wrong in the
 * situation it exists for — a strip that flatlines under re-render pressure, an
 * idle strip that renders as nothing, a lull that rescales into a cliff. None
 * of those is visible in a static example, which is why they are pinned here.
 */
import { describe, expect, test } from "bun:test"
import { act } from "react"
import { useRef } from "react"
import { render } from "@testing-library/react"
import {
  ActivityPulse,
  PULSE_HEIGHT_PX,
  PULSE_SLOTS,
  useActivityPulse,
} from "../../src/components/activity-pulse"

const bars = () =>
  Array.from(document.querySelectorAll<HTMLElement>('[data-slot="activity-pulse-bar"]'))

const strip = () => document.querySelector<HTMLElement>('[data-slot="activity-pulse-strip"]')

const heightOf = (bar: HTMLElement) => Number.parseFloat(bar.style.height)
const opacityOf = (bar: HTMLElement) => Number.parseFloat(bar.style.opacity)

describe("the strip is always twenty slots wide", () => {
  test("an all-zero buffer renders twenty visible dots, not nothing", () => {
    // The `1 +` in the height formula. A dead tick has to look like a dead
    // tick; a zero-height bar looks like a rendering bug.
    render(<ActivityPulse samples={new Array(PULSE_SLOTS).fill(0)} />)
    const rendered = bars()
    expect(rendered).toHaveLength(PULSE_SLOTS)
    for (const bar of rendered) {
      expect(heightOf(bar)).toBe(1)
      expect(bar.dataset.empty).toBeUndefined()
    }
  })

  test("a three-sample buffer puts its samples on the right", () => {
    render(<ActivityPulse samples={[600, 600, 600]} />)
    const rendered = bars()
    expect(rendered).toHaveLength(PULSE_SLOTS)
    const filled = rendered.filter((bar) => bar.dataset.empty === undefined)
    expect(filled).toHaveLength(3)
    expect(rendered.slice(-3)).toEqual(filled)
    // An empty slot holds the width open and draws nothing.
    expect(opacityOf(rendered[0])).toBe(0)
  })

  test("`fill=\"zeros\"` pre-fills the strip instead", () => {
    render(<ActivityPulse samples={[600, 600, 600]} fill="zeros" />)
    expect(bars().filter((bar) => bar.dataset.empty !== undefined)).toHaveLength(0)
  })

  test("`direction=\"rtl\"` puts the newest sample on the left", () => {
    render(<ActivityPulse samples={[600, 600, 600]} direction="rtl" />)
    const rendered = bars()
    expect(rendered.slice(0, 3).every((bar) => bar.dataset.empty === undefined)).toBe(true)
    expect(rendered.at(-1)?.dataset.empty).toBe("true")
  })
})

describe("the container's height is the bars' height", () => {
  // Bar heights are px because they are computed per tick, so a `h-4` class on
  // the container would be a second source of truth and would drift from
  // PULSE_HEIGHT_PX the first time either moved.
  test("the default strip is exactly PULSE_HEIGHT_PX tall", () => {
    render(<ActivityPulse samples={[600]} />)
    expect(strip()?.style.height).toBe(`${PULSE_HEIGHT_PX}px`)
    expect(bars().at(-1) && heightOf(bars().at(-1) as HTMLElement)).toBe(PULSE_HEIGHT_PX)
  })

  test("an overridden height moves both together", () => {
    render(<ActivityPulse samples={[600]} height={40} />)
    expect(strip()?.style.height).toBe("40px")
    expect(heightOf(bars().at(-1) as HTMLElement)).toBe(40)
  })
})

describe("the opacity ramp is positional and carries no data", () => {
  test("runs from 0.25 at the oldest slot to 0.25 + 0.65 * 19/20 at the newest", () => {
    // Every sample is the same value, so any variation in opacity is the ramp.
    render(<ActivityPulse samples={new Array(PULSE_SLOTS).fill(300)} />)
    const rendered = bars()
    expect(opacityOf(rendered[0])).toBeCloseTo(0.25, 5)
    expect(opacityOf(rendered[PULSE_SLOTS - 1])).toBeCloseTo(0.25 + 0.65 * (19 / 20), 5)
    // Identical samples, identical heights: the ramp moved and the data did not.
    expect(new Set(rendered.map(heightOf)).size).toBe(1)
  })
})

describe("the rolling scale has a floor under it", () => {
  test("a trickle is not amplified into a flood", () => {
    // Without the floor these nine-unit samples would normalise to full height
    // and the strip would report a burst that never happened.
    render(<ActivityPulse samples={new Array(PULSE_SLOTS).fill(9)} />)
    expect(Math.max(...bars().map(heightOf))).toBeLessThanOrEqual(2)
  })

  test("a lull after a burst does not rescale into a cliff", () => {
    const afterBurst = [880, ...new Array(PULSE_SLOTS - 1).fill(5)]
    const { rerender } = render(<ActivityPulse samples={afterBurst} />)
    expect(Math.max(...bars().slice(1).map(heightOf))).toBeLessThanOrEqual(2)

    // And once the burst has scrolled out of the buffer entirely, the quiet
    // ticks still read as quiet rather than as the new full scale.
    rerender(<ActivityPulse samples={new Array(PULSE_SLOTS).fill(5)} />)
    expect(Math.max(...bars().map(heightOf))).toBeLessThanOrEqual(2)
  })

  test("an absolute scale compares two pulses instead", () => {
    render(<ActivityPulse samples={new Array(PULSE_SLOTS).fill(450)} scale={{ max: 900 }} />)
    // Half the domain, so about half the height — which self-normalising would
    // have drawn at full height.
    const height = heightOf(bars()[0])
    expect(height).toBeGreaterThan(PULSE_HEIGHT_PX / 3)
    expect(height).toBeLessThan((PULSE_HEIGHT_PX * 2) / 3)
  })
})

describe("idle is a statement, not the absence of one", () => {
  test("an inactive strip is a full row of dots, dimmed", () => {
    render(<ActivityPulse samples={[880, 600, 420]} isActive={false} />)
    const rendered = bars()
    expect(rendered).toHaveLength(PULSE_SLOTS)
    expect(rendered.every((bar) => heightOf(bar) === 1)).toBe(true)
    expect(strip()?.className).toContain("opacity-50")
  })

  test("`idle=\"hold\"` freezes the last samples instead", () => {
    render(<ActivityPulse samples={[880, 600, 420]} isActive={false} idle="hold" />)
    expect(Math.max(...bars().map(heightOf))).toBe(PULSE_HEIGHT_PX)
  })
})

describe("what a screen reader gets", () => {
  test("the strip is decoration and the live region carries the label only", () => {
    render(<ActivityPulse samples={[880, 600, 420]} label="Running Bash" />)
    expect(strip()?.getAttribute("aria-hidden")).toBe("true")

    const status = document.querySelector('[role="status"]')
    expect(status?.textContent).toBe("Running Bash")
    // Never the clock and never the pulse: a 4Hz tick in a live region turns a
    // screen reader into a metronome.
    expect(status?.textContent).not.toMatch(/\d/)
    expect(status?.className).toContain("sr-only")
  })

  test("the live region exists before there is anything to say", () => {
    // A region inserted and populated in the same commit is not reliably
    // announced, and `label={isRunning ? "…" : undefined}` is the shape every
    // caller writes — so the region is in the tree from the first frame.
    const { rerender } = render(<ActivityPulse samples={[880]} />)
    expect(document.querySelector('[role="status"]')?.textContent).toBe("")

    rerender(<ActivityPulse samples={[880]} label="Running Bash" />)
    expect(document.querySelector('[role="status"]')?.textContent).toBe("Running Bash")
  })
})

/** The buffer the probe below last rendered, readable after it has unmounted. */
let latest: readonly number[] = []

/**
 * A probe whose `read` is an inline arrow — the shape every caller writes, and
 * the shape that breaks a hook which puts `read` in its effect dependencies.
 * Each reading adds exactly ten, so a rebuilt interval is visible twice over:
 * the buffer is cleared, and the delta straddling the rebuild is not ten.
 */
function Probe({ nudge }: { nudge: number }) {
  const total = useRef(0)
  latest = useActivityPulse(
    () => {
      total.current += 10
      return total.current
    },
    true,
    { tickMs: 10 },
  )
  return <span data-nudge={nudge} />
}

const wait = (ms: number) => act(async () => new Promise((resolve) => setTimeout(resolve, ms)))

describe("the hook survives the re-render pressure it exists to visualise", () => {
  test("an inline `read` does not tear down the interval", async () => {
    const { rerender, unmount } = render(<Probe nudge={0} />)

    // Re-render continuously while the interval is running. If `read` were an
    // effect dependency, every one of these would rebuild the timer and reset
    // the previous reading, and the buffer would never get past one entry.
    for (let nudge = 1; nudge <= 12; nudge += 1) {
      rerender(<Probe nudge={nudge} />)
      await wait(10)
    }

    // Unmount inside act() before asserting, so no tick can land between the
    // last wait and the expectations.
    act(() => {
      unmount()
    })

    expect(latest.length).toBeGreaterThanOrEqual(3)
    // Every delta is a real one — including the first, because the baseline is
    // taken when the run starts rather than on the first tick.
    expect(new Set(latest)).toEqual(new Set([10]))
  })
})
