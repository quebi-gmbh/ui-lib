/**
 * The horizontal orientation — `orientation="horizontal"` (task #186).
 *
 * The day used to run down the page and only down it. Turned across, it is the
 * same geometry with the two axes swapped, which is easy to claim and easy to
 * get half right: a bar positioned by `left` but still sized by `height`, an
 * hour axis whose ends tuck on the axis it is no longer drawn on, a drag that
 * reads the pointer's y while the track measures its minutes in x.
 *
 * None of that is visible in happy-dom, which has no layout — but all of it is
 * in the inline styles and the class names, so it is asserted here rather than
 * reviewed.
 *
 * Two of the claims are about things that stop existing rather than about
 * things that move, and those are the ones worth the most: a horizontal span
 * owns a row, so no name can collide with another name and no leader line is
 * ever drawn, and a horizontal time reads along the axis on its own, so
 * `timeLabelOrientation` has nothing to widen the lanes for.
 */
import { describe, expect, test } from "bun:test"
import { act, fireEvent, render } from "@testing-library/react"
import { DaySchedule, type DaySpan } from "../../src/components/day-schedule"

const WORKDAY: DaySpan[] = [
  { id: "pairing", label: "pairing", start: 780, end: 960 },
  { id: "deploy", label: "deploy", start: 990, end: 1080 },
]

/** Four spans inside one hour — every name wants the same place. */
const CROWDED: DaySpan[] = [
  { id: "standup", label: "standup", start: 540, end: 555 },
  { id: "one-on-one", label: "1:1", start: 545, end: 590 },
  { id: "triage", label: "triage", start: 555, end: 585 },
  { id: "retro", label: "retro", start: 560, end: 600 },
]

/** The track — the box every span is positioned against. */
const trackOf = (container: HTMLElement) => {
  const track = container.querySelector('[role="group"]')?.parentElement
  if (!track) throw new Error("no track")
  return track as HTMLElement
}

const barOf = (container: HTMLElement, label: string) => {
  const bar = container.querySelector<HTMLElement>(`[role="slider"][aria-label="${label} span"]`)
  if (!bar) throw new Error(`no bar for "${label}"`)
  return bar
}

const handleOf = (container: HTMLElement, label: string, edge: "start" | "end") => {
  const node = container.querySelector<HTMLElement>(
    `[role="slider"][aria-label="${label} ${edge} time"]`,
  )
  if (!node) throw new Error(`no ${edge} handle for "${label}"`)
  return node
}

/** Each hour label as `[text, the shift it carries]`, in DOM order. */
const axisOf = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>('[aria-hidden="true"] > .text-\\[9\\.5px\\]'))
    .map((el) => [el.textContent, /-?translate-[xy]-\S+/.exec(el.className)?.[0]] as const)

describe("a horizontal day", () => {
  test("lays a span along the track and across its lane, not the other way round", () => {
    const { container } = render(<DaySchedule defaultSpans={WORKDAY} orientation="horizontal" />)
    const bar = barOf(container, "pairing")

    // 13:00–16:00 of a 1440-minute day: left at the start, as wide as it lasts.
    expect(bar.style.left).toBe("54.1667%")
    expect(bar.style.width).toBe("12.5000%")
    expect(bar.style.height).toBe("")
    // The lane is the other axis now — the first one, `laneOffset` down.
    expect(bar.style.top).toBe("24px")
    expect(bar.className).toContain("h-[5px]")
    expect(bar.className).not.toContain("w-[5px]")
  })

  test("stacks the lanes downward, a laneGap apart", () => {
    const { container } = render(<DaySchedule defaultSpans={WORKDAY} orientation="horizontal" />)
    expect(barOf(container, "pairing").style.top).toBe("24px")
    expect(barOf(container, "deploy").style.top).toBe("42px")
  })

  test("puts a handle on its minute along the track, and names the axis it resizes on", () => {
    const { container } = render(<DaySchedule defaultSpans={WORKDAY} orientation="horizontal" />)
    const end = handleOf(container, "pairing", "end")

    expect(end.style.left).toBe("66.6667%")
    expect(end.style.top).toBe("24px")
    expect(end.className).toContain("cursor-ew-resize")
    expect(end.className).not.toContain("cursor-ns-resize")
  })

  test("tucks the ends of the hour axis in on the axis they hang off", () => {
    const [first, ...rest] = axisOf(
      render(<DaySchedule defaultSpans={WORKDAY} orientation="horizontal" />).container,
    )
    const last = rest.pop()

    // Midnight hangs to the right of its rule and 24:00 to the left of its own;
    // neither has track on the side its other half would need.
    expect(first).toEqual(["00:00", "translate-x-0"])
    expect(last).toEqual(["24:00", "-translate-x-full"])
    // Every tick between them is centred on its own minute, as before.
    for (const [, shift] of rest) expect(shift).toBe("-translate-x-1/2")
  })

  test("draws the gridlines as verticals down the track", () => {
    const { container } = render(<DaySchedule defaultSpans={WORKDAY} orientation="horizontal" />)
    const rules = Array.from(container.querySelectorAll<HTMLElement>('[aria-hidden="true"].w-px'))

    expect(rules.length).toBeGreaterThan(0)
    expect(container.querySelectorAll(".h-px")).toHaveLength(0)
    for (const rule of rules) expect(rule.className).toContain("inset-y-0")
    expect(rules[0].style.left).toBe("0.0000%")
    expect(rules.at(-1)?.className).toContain("-translate-x-full")
  })
})

describe("a name across the page", () => {
  test("gets a row of its own, so the column never has to be swept apart", () => {
    const { container } = render(<DaySchedule defaultSpans={CROWDED} orientation="horizontal" />)
    // Down the page these four share one midpoint to within a few minutes, and
    // the sweep is what stops them drawing on top of each other. Across it they
    // are four rows, so there is nothing to push and nothing to point at.
    expect(container.querySelectorAll("svg")).toHaveLength(0)

    const names = Array.from(container.querySelectorAll<HTMLElement>(".flex-col > .text-xs"))
    expect(names.map((el) => el.textContent)).toEqual(["standup", "1:1", "triage", "retro"])
    // One `laneGap`-tall box each, centred on the lane its bar is drawn on.
    for (const name of names) expect(name.style.height).toBe("18px")
  })

  test("is not also drawn inside the track", () => {
    const { container } = render(<DaySchedule defaultSpans={WORKDAY} orientation="horizontal" />)
    const insideTrack = container.querySelectorAll('[role="group"] > .text-xs')
    expect(insideTrack).toHaveLength(0)
  })
})

describe("an edge time across the page", () => {
  /** Every edge time's inline `transform`, in DOM order. */
  const transformsOf = (container: HTMLElement) =>
    Array.from(container.querySelectorAll<HTMLElement>('[aria-hidden="true"].origin-top-left')).map(
      (el) => el.style.transform,
    )

  test("is the rotated placement without the rotation: before the bar, and after it", () => {
    const { container } = render(<DaySchedule defaultSpans={WORKDAY} orientation="horizontal" />)
    const [start, end] = transformsOf(container)

    expect(start).toBe("translate(calc(-100% - 16px), -50%)")
    expect(end).toBe("translate(16px, -50%)")
  })

  test("sits on its own minute along the track, on its span's lane", () => {
    const { container } = render(<DaySchedule defaultSpans={WORKDAY} orientation="horizontal" />)
    const [start] = Array.from(
      container.querySelectorAll<HTMLElement>('[aria-hidden="true"].origin-top-left'),
    )

    expect(start.style.left).toBe("54.1667%")
    expect(start.style.top).toBe("24px")
  })

  test("ignores timeLabelOrientation rather than widening the lanes for it", () => {
    const { container } = render(
      <DaySchedule
        defaultSpans={WORKDAY}
        orientation="horizontal"
        timeLabelOrientation="upright"
      />,
    )
    // Upright is a 64px lane down the page, because there a time spends its
    // whole width on the gap. Across it the time spends its line box, which is
    // the 18px a rotated one costs — so the lanes must not have moved.
    expect(barOf(container, "deploy").style.top).toBe("42px")
    expect(transformsOf(container)[0]).toBe("translate(calc(-100% - 16px), -50%)")
  })
})

describe("a horizontal drag", () => {
  /** Give the track a box, since happy-dom lays nothing out. */
  function trackRect(container: HTMLElement) {
    const track = trackOf(container)
    track.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 1440, height: 100, right: 1440, bottom: 100 }) as DOMRect
    return track
  }

  test("reads the pointer's x, so a move along the axis moves the span", () => {
    const moved: DaySpan[][] = []
    const { container } = render(
      <DaySchedule
        defaultSpans={WORKDAY}
        orientation="horizontal"
        onSpansChange={(next) => moved.push(next)}
      />,
    )
    trackRect(container)
    const bar = barOf(container, "pairing")
    // happy-dom has no pointer capture; the component only ever calls it.
    bar.setPointerCapture = () => {}
    bar.releasePointerCapture = () => {}

    // One pixel of this track is one minute, so grabbing at 13:00 and letting
    // go 60px right is an hour later — and the 15-minute step lands on it.
    act(() => {
      fireEvent.pointerDown(bar, { button: 0, clientX: 780, clientY: 50, pointerId: 1 })
    })
    act(() => {
      fireEvent.pointerMove(bar, { clientX: 840, clientY: 50, pointerId: 1 })
    })

    expect(moved.at(-1)?.[0]).toMatchObject({ id: "pairing", start: 840, end: 1020 })
  })

  test("ignores the pointer's y, which is only which lane it is over", () => {
    const moved: DaySpan[][] = []
    const { container } = render(
      <DaySchedule
        defaultSpans={WORKDAY}
        orientation="horizontal"
        onSpansChange={(next) => moved.push(next)}
      />,
    )
    trackRect(container)
    const bar = barOf(container, "pairing")
    bar.setPointerCapture = () => {}
    bar.releasePointerCapture = () => {}

    act(() => {
      fireEvent.pointerDown(bar, { button: 0, clientX: 780, clientY: 24, pointerId: 1 })
    })
    act(() => {
      fireEvent.pointerMove(bar, { clientX: 780, clientY: 90, pointerId: 1 })
    })

    // A span cannot be dragged into another lane: the lane is its position in
    // `spans`, and nothing about the gesture changes that.
    expect(moved.at(-1)?.[0]).toMatchObject({ id: "pairing", start: 780, end: 960 })
  })
})

describe("what the other axis does not carry over", () => {
  test("has no minimap to draw, and keeps the scrollbar it would have replaced", () => {
    const { container } = render(
      <DaySchedule defaultSpans={WORKDAY} orientation="horizontal" zoom={3} minimap />,
    )
    const viewport = container.querySelector<HTMLElement>("[data-day-schedule-viewport]")

    // The same schedule down the page does draw one, so this is the axis
    // declining it rather than the selector missing it.
    const vertical = render(<DaySchedule defaultSpans={WORKDAY} zoom={3} minimap />)
    expect(vertical.container.querySelector("[aria-hidden='true'].w-9")).not.toBeNull()
    expect(container.querySelector("[aria-hidden='true'].w-9")).toBeNull()
    expect(viewport?.className).toContain("overflow-x-auto")
    expect(viewport?.className).toContain("quebi-scrollbar")
    expect(viewport?.className).not.toContain("quebi-scrollbar-none")
  })

  test("does not read `height`: the day is the width, and the lanes are the height", () => {
    const { container } = render(
      <DaySchedule defaultSpans={WORKDAY} orientation="horizontal" height={999} />,
    )
    const viewport = container.querySelector<HTMLElement>("[data-day-schedule-viewport]")
    expect(viewport?.style.height).toBe("")

    // `laneOffset` of air at each end, and one `laneGap` between the two lanes.
    expect(trackOf(container).style.height).toBe("66px")
  })

  test("is still vertical unless asked, so nothing existing moves", () => {
    const { container } = render(<DaySchedule defaultSpans={WORKDAY} />)
    const bar = barOf(container, "pairing")
    expect(bar.style.top).toBe("54.1667%")
    expect(bar.style.left).toBe("24px")
    expect(bar.className).toContain("w-[5px]")
  })
})
