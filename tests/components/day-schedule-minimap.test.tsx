/**
 * The DaySchedule minimap: the strip that replaces a zoomed schedule's
 * scrollbar with a map of the whole day.
 *
 * Nearly all of it is arithmetic, and the arithmetic is where the design
 * decisions live — a lane is a *rank* rather than a clock position, a line has
 * a fixed thickness rather than a share of the width, and what does not fit
 * sideways is ridden rather than squeezed. Each of those is invisible until it
 * is wrong on somebody's busy Tuesday, so each is pinned here, on the exported
 * functions, with no browser involved.
 *
 * The two component assertions are the ones that arithmetic alone cannot make:
 * that a line's x really comes from the grid (no `inset-x-*` sneaking a full
 * width back in), and that a parked line keeps its own minute — parking is a
 * horizontal answer to a horizontal problem and must never move a line in time.
 */
import { describe, expect, test } from "bun:test"
import { render } from "@testing-library/react"
import {
  DayScheduleMinimap,
  MINIMAP_BAR_PX,
  minimapLaneAtMinute,
  minimapLanes,
  minimapScrollTop,
} from "../../src/components/day-schedule-minimap"
import { DaySchedule, type DaySpan } from "../../src/components/day-schedule"
import { useRef } from "react"

/** The strip at its default `w-9`, less its 1px border on each side. */
const INNER_WIDTH = 34
const EDGE = 1

describe("minimapLaneAtMinute", () => {
  /** Starts at least five minutes apart, which is what bounds the slope below. */
  const STARTS = [0, 120, 300, 480, 900, 1380]

  test("clamps to the first and last lane outside the range of start times", () => {
    expect(minimapLaneAtMinute(STARTS, -600)).toBe(0)
    expect(minimapLaneAtMinute(STARTS, 0)).toBe(0)
    expect(minimapLaneAtMinute(STARTS, 1380)).toBe(5)
    expect(minimapLaneAtMinute(STARTS, 2880)).toBe(5)
  })

  test("interpolates between two starts, so the grid glides rather than steps", () => {
    expect(minimapLaneAtMinute(STARTS, 60)).toBeCloseTo(0.5, 10)
    expect(minimapLaneAtMinute(STARTS, 210)).toBeCloseTo(1.5, 10)
    expect(minimapLaneAtMinute(STARTS, 480)).toBe(3)
  })

  test("never moves more than a fifth of a lane per minute", () => {
    // Continuity is the property that makes the pan readable: a jump would
    // teleport every line sideways mid-scroll. The bound follows from the
    // fixture's closest pair of starts (120 minutes); 0.2 is generous room.
    let worst = 0
    for (let minute = 0; minute < 1440; minute++) {
      const step = Math.abs(
        minimapLaneAtMinute(STARTS, minute + 1) - minimapLaneAtMinute(STARTS, minute),
      )
      worst = Math.max(worst, step)
    }
    expect(worst).toBeLessThanOrEqual(0.2)
  })

  test("spans that start at the same minute share a lane, and never divide by zero", () => {
    const tied = [0, 540, 540, 540, 900]
    expect(minimapLaneAtMinute(tied, 540)).toBe(3)
    expect(Number.isFinite(minimapLaneAtMinute(tied, 600))).toBe(true)
  })

  test("an empty day is lane 0", () => {
    expect(minimapLaneAtMinute([], 720)).toBe(0)
  })
})

describe("minimapLanes", () => {
  const lanesFor = (count: number, centerLane = 0) =>
    minimapLanes({ count, innerWidthPx: INNER_WIDTH, centerLane })

  test("one entry per span", () => {
    for (const count of [1, 2, 5, 12, 40]) {
      expect(lanesFor(count)).toHaveLength(count)
    }
  })

  test("every line is the same thickness, whatever the count", () => {
    // The whole reason the thickness is a constant: the same appointment has to
    // look the same on a quiet day and a busy one, or two days stop being
    // comparable at a glance.
    for (const count of [1, 2, 5, 12, 40]) {
      for (const lane of lanesFor(count)) expect(lane.width).toBe(MINIMAP_BAR_PX)
    }
  })

  test("lanes do not overlap while the grid still fits", () => {
    const lanes = lanesFor(5)
    for (let i = 1; i < lanes.length; i++) {
      expect(lanes[i].left).toBeGreaterThanOrEqual(lanes[i - 1].left + lanes[i - 1].width)
    }
  })

  test("nothing moves at all while the grid fits — any centre, same answer", () => {
    // The ride starts exactly where the width runs out, like a scrollbar that
    // appears only when it is needed.
    const reference = JSON.stringify(lanesFor(5, 0))
    for (let centre = 0; centre <= 5; centre += 0.25) {
      expect(JSON.stringify(lanesFor(5, centre))).toBe(reference)
    }
  })

  test("once it does not fit, a later centre moves the grid leftwards and never right", () => {
    let previous = lanesFor(20, 0)
    let moved = false
    for (let centre = 0.5; centre <= 19; centre += 0.5) {
      const next = lanesFor(20, centre)
      for (let i = 0; i < next.length; i++) {
        expect(next[i].left).toBeLessThanOrEqual(previous[i].left)
        if (next[i].left < previous[i].left) moved = true
      }
      previous = next
    }
    expect(moved).toBe(true)
  })

  test("the centred lane sits on the strip's midpoint", () => {
    const lanes = lanesFor(20, 10)
    expect(lanes[10].left + lanes[10].width / 2).toBeCloseTo(INNER_WIDTH / 2, 6)
  })

  test("nothing ever leaves the strip, for any count at any centre", () => {
    // Parking, not overflowing: a line that cannot fit stops on the edge.
    for (let count = 1; count <= 30; count++) {
      for (let centre = 0; centre <= count; centre += 0.5) {
        for (const lane of lanesFor(count, centre)) {
          expect(lane.left).toBeGreaterThanOrEqual(EDGE)
          expect(lane.left + lane.width).toBeLessThanOrEqual(INNER_WIDTH - EDGE)
        }
      }
    }
  })

  test("a fully panned grid parks its early lanes on the left edge", () => {
    const lanes = lanesFor(12, 11)
    expect(lanes[0].left).toBe(EDGE)
    expect(lanes[1].left).toBe(EDGE)
    expect(lanes[11].left + lanes[11].width).toBe(INNER_WIDTH - EDGE)
  })

  test("no width to draw in, or nothing to draw, is no lanes", () => {
    expect(minimapLanes({ count: 0, innerWidthPx: INNER_WIDTH })).toEqual([])
    expect(minimapLanes({ count: 5, innerWidthPx: 0 })).toEqual([])
    expect(minimapLanes({ count: 5, innerWidthPx: 2 * EDGE })).toEqual([])
    expect(minimapLanes({ count: Number.NaN, innerWidthPx: INNER_WIDTH })).toEqual([])
  })

  test("a strip too narrow for one line still draws one, as wide as there is room for", () => {
    const [only] = minimapLanes({ count: 3, innerWidthPx: 2 * EDGE + 3 })
    expect(only).toEqual({ left: EDGE, width: 3 })
  })
})

describe("minimapScrollTop", () => {
  // 1440 tall, showing 480 of it: a day at zoom 3, in round numbers.
  const centre = (fraction: number) => minimapScrollTop(fraction, 1440, 480)

  test("puts the minute you asked for in the middle of the window, not at its top", () => {
    // Half past noon at the centre means the window runs 08:30 to 16:30.
    expect(centre(0.5)).toBe(480)
    expect(centre(0.25)).toBe(120)
  })

  test("clamps at both ends rather than scrolling past the day", () => {
    expect(centre(0)).toBe(0)
    expect(centre(0.05)).toBe(0)
    expect(centre(1)).toBe(960)
    expect(centre(2)).toBe(960)
  })

  test("content shorter than the window does not scroll at all", () => {
    expect(minimapScrollTop(0.5, 400, 400)).toBe(0)
    expect(minimapScrollTop(0.9, 300, 400)).toBe(0)
  })
})

/**
 * Twelve spans a quarter of an hour apart: more lines than 34px holds, and
 * starting early enough that the window's midpoint sits past the last of them,
 * so the grid is panned as far right as it goes and the early lanes are parked.
 */
const CROWDED: DaySpan[] = Array.from({ length: 12 }, (_, i) => ({
  id: `slot-${i}`,
  label: `slot ${i + 1}`,
  start: i * 15,
  end: i * 15 + 45,
}))

/** The minimap's span lines, in DOM order — the rounded bars, not the rules or the window. */
const linesOf = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>(".rounded-full"))

function renderMinimap(spans: DaySpan[], scale: number) {
  const Harness = () => {
    const viewportRef = useRef<HTMLDivElement>(null)
    return (
      <div>
        <div ref={viewportRef} style={{ height: 200, overflowY: "auto" }}>
          <div style={{ height: 200 * scale }} />
        </div>
        <DayScheduleMinimap
          spans={spans.map((span) => ({ id: span.id, start: span.start, end: span.end }))}
          viewportRef={viewportRef}
          scale={scale}
        />
      </div>
    )
  }
  return render(<Harness />)
}

describe("the strip", () => {
  test("a line's x comes from the lane grid, never from a full-width class", () => {
    // `inset-x-0` here would be the fastest way to lose the whole horizontal
    // half of the design, and it would look fine on a day with two spans.
    const { container } = renderMinimap(CROWDED, 4)
    for (const line of linesOf(container)) {
      expect(line.className).not.toMatch(/\binset-x-/)
      expect(line.style.left).toMatch(/px$/)
      expect(line.style.width).toBe(`${MINIMAP_BAR_PX}px`)
    }
  })

  test("parked lines share an x but keep their own minute", () => {
    const { container } = renderMinimap(CROWDED, 4)
    const lines = linesOf(container)

    // Parking is an answer to running out of width. It must cost nothing
    // vertically, because the vertical axis is the entire point of the map.
    expect(lines[0].style.left).toBe(lines[1].style.left)
    expect(lines[0].style.top).not.toBe(lines[1].style.top)
    for (const [index, line] of lines.entries()) {
      expect(line.style.top).toBe(`${((CROWDED[index].start / 1440) * 100).toFixed(4)}%`)
    }
  })

  test("the window's height is 1/scale of the day, and it is there before anything is measured", () => {
    const { container } = renderMinimap(CROWDED, 4)
    const window_ = container.querySelector<HTMLElement>("[data-minimap-window]")
    expect(window_?.style.height).toBe("25.0000%")
    expect(window_?.style.top).toBe("0.0000%")
  })

  test("it is a scrollbar, so it is hidden from assistive tech and out of the tab order", () => {
    const { container } = renderMinimap(CROWDED, 4)
    const strip = container.querySelector("[aria-hidden='true'].w-9")
    expect(strip).not.toBeNull()
    expect(strip?.querySelector("[tabindex]")).toBeNull()
    expect(strip?.querySelector("button")).toBeNull()
  })
})

describe("DaySchedule's zoom and minimap", () => {
  /** The scrolling element, and the track inside it that the spans are drawn on. */
  const partsOf = (container: HTMLElement) => ({
    viewport: container.querySelector<HTMLElement>("[data-day-schedule-viewport]"),
    track: container.querySelector<HTMLElement>("[data-day-schedule-viewport] .relative.flex-1"),
    strip: container.querySelector<HTMLElement>("[aria-hidden='true'].w-9"),
  })

  test("without a zoom the track fills the viewport, and there is no strip", () => {
    const { container } = render(<DaySchedule defaultSpans={CROWDED} height={400} />)
    const { viewport, track, strip } = partsOf(container)
    expect(viewport?.style.height).toBe("400px")
    expect(track?.style.height).toBe("400px")
    expect(strip).toBeNull()
  })

  test("zoom makes the track taller while the viewport stays the height you asked for", () => {
    const { container } = render(<DaySchedule defaultSpans={CROWDED} height={400} zoom={3} />)
    const { viewport, track } = partsOf(container)
    expect(viewport?.style.height).toBe("400px")
    expect(track?.style.height).toBe("1200px")
  })

  test("the map replaces the viewport's scrollbar rather than joining it", () => {
    const { container } = render(
      <DaySchedule defaultSpans={CROWDED} height={400} zoom={3} minimap />,
    )
    const { viewport, strip } = partsOf(container)
    expect(strip).not.toBeNull()
    expect(viewport?.className).toContain("[scrollbar-width:none]")
    expect(viewport?.className).not.toContain("quebi-scrollbar")
  })

  test("a line takes the tone its bar was actually drawn in", () => {
    // The default alternates by array position, so a minimap that read
    // `span.tone` alone would colour every line brand and disagree with half
    // the schedule beside it.
    const { container } = render(
      <DaySchedule
        defaultSpans={[
          { id: "a", label: "a", start: 60, end: 120 },
          { id: "b", label: "b", start: 180, end: 240 },
        ]}
        height={400}
        zoom={3}
        minimap
      />,
    )
    const { strip } = partsOf(container)
    const lines = Array.from(strip?.querySelectorAll(".rounded-full") ?? [])
    expect(lines[0]?.className).toContain("bg-quebi-brand")
    expect(lines[1]?.className).toContain("bg-cyan-500")
  })
})
