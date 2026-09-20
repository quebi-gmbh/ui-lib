/**
 * Where a DaySchedule's edge times sit, and what size they are.
 *
 * Two reports about the same two elements, so they are asserted in one place.
 * Task #173: the editable times rendered at the library default of 14px beside
 * static ones at 10.5px. Task #175: they were only ever available rotated a
 * quarter turn, and the rotation was also hiding a collision.
 */
import { describe, expect, test } from "bun:test"
import { render } from "@testing-library/react"
import { DaySchedule, type DaySpan } from "../../src/components/day-schedule"

const WORKDAY: DaySpan[] = [
  { id: "pairing", label: "pairing", start: 780, end: 960 },
  { id: "deploy", label: "deploy", start: 990, end: 1080 },
]

/**
 * The upright orientation (task #175).
 *
 * Rotating an edge time is what lets a lane be 18px wide, and it is also what
 * has been hiding a collision: rotated, a span's start and end run away from
 * each other *along* the lane and can never meet. Upright they are two boxes in
 * one column with nothing but the span's own length between them, and a span of
 * `minDuration` on a 400px track is 8px of it — so the case the orientation has
 * to survive is the ordinary one, not a corner.
 *
 * Three things are pinned here. The default has not moved (every schedule that
 * existed before this is still rotated); the lane and the name column widen to
 * the measured width of an upright time rather than to its line box; and the
 * pair is de-overlapped by the same sweep the name column uses, which means
 * both stay inside the track rather than trading one overlap for an overflow.
 */
describe("the upright orientation", () => {
  /** Every edge time's inline `transform`, in DOM order. */
  const transformsOf = (container: HTMLElement) =>
    Array.from(container.querySelectorAll('[aria-hidden="true"].origin-top-left')).map(
      (el) => (el as HTMLElement).style.transform,
    )

  /** One editable edge time's positioned wrapper. */
  function boxOf(container: HTMLElement, name: string) {
    const group = container.querySelector(`[role="group"][aria-label="${name}"]`)
    const box = group?.closest(".origin-top-left")
    if (!box) throw new Error(`no edge field labelled "${name}"`)
    return box as HTMLElement
  }

  test("is rotated unless asked otherwise, so nothing existing moves", () => {
    const { container } = render(<DaySchedule defaultSpans={WORKDAY} />)
    for (const transform of transformsOf(container)) {
      expect(transform).toContain("rotate(-90deg)")
    }
  })

  test("drops the rotation from static labels too — one prop, both kinds", () => {
    const { container } = render(
      <DaySchedule defaultSpans={WORKDAY} timeLabelOrientation="upright" />,
    )
    const transforms = transformsOf(container)
    expect(transforms).toHaveLength(4)
    for (const transform of transforms) {
      expect(transform).not.toContain("rotate")
      expect(transform).toContain("translate(10px, -50%)")
    }
  })

  test("drops the rotation from the fields", () => {
    const { container } = render(
      <DaySchedule defaultSpans={WORKDAY} timeLabels="editable" timeLabelOrientation="upright" />,
    )
    expect(boxOf(container, "pairing start time").style.transform).toBe("translate(10px, -50%)")
  })
})

describe("the upright lanes", () => {
  const leftOf = (container: HTMLElement) =>
    Array.from(
      container.querySelectorAll<HTMLElement>('[role="slider"][aria-label$="span"]'),
    ).map((bar) => bar.style.left)

  test("default to 64px — an upright time is as wide as a time", () => {
    const { container } = render(
      <DaySchedule defaultSpans={WORKDAY} timeLabels="editable" timeLabelOrientation="upright" />,
    )
    expect(leftOf(container)).toEqual(["24px", "88px"])
  })

  test("stay at 18px when there is no time to make room for", () => {
    const { container } = render(
      <DaySchedule defaultSpans={WORKDAY} timeLabels="none" timeLabelOrientation="upright" />,
    )
    expect(leftOf(container)).toEqual(["24px", "42px"])
  })

  test("push the name column a whole lane past the last one", () => {
    const { container } = render(
      <DaySchedule defaultSpans={WORKDAY} timeLabels="editable" timeLabelOrientation="upright" />,
    )
    const name = Array.from(container.querySelectorAll<HTMLElement>("div")).find(
      (el) => el.textContent === "pairing" && el.style.left,
    )
    // laneOffset 24 + one lane of 64 + a last lane's worth of clearance.
    expect(name?.style.left).toBe("152px")
  })
})

describe("the upright edge times", () => {
  /** Where a span's two edge times are drawn, in DOM order: start then end. */
  function edgeTops(container: HTMLElement, label: string) {
    const sel = `[role="group"][aria-label="${label}"]`
    const group = container.querySelector(sel)
    if (!group) throw new Error(sel)
    const boxes = group.querySelectorAll('[aria-hidden="true"]')
    return Array.from(boxes).map((el) => (el as HTMLElement).style.top)
  }

  const oneSpan = [{ id: "s", label: "standup", start: 540, end: 555 }]

  test("rotated, each stays on its own minute — the pair cannot collide", () => {
    const { container } = render(<DaySchedule defaultSpans={oneSpan} height={400} />)
    // Percentages of the day, untouched: 540 and 555 of 1440.
    expect(edgeTops(container, "standup")).toEqual(["37.5000%", "38.5417%"])
  })

  test("upright, a short span's two times are swept apart", () => {
    const { container } = render(
      <DaySchedule defaultSpans={oneSpan} height={400} timeLabelOrientation="upright" />,
    )
    // 15 minutes is 4.17px of a 400px track and each box measures ~16px, so
    // the end is pushed to a full UPRIGHT_EDGE_GAP below the start.
    expect(edgeTops(container, "standup")).toEqual(["150px", "170px"])
  })

  test("upright, a span against midnight is pushed up, not off the end", () => {
    const midnight = [{ id: "s", label: "handover", start: 1425, end: 1440 }]
    const { container } = render(
      <DaySchedule defaultSpans={midnight} height={400} timeLabelOrientation="upright" />,
    )
    // The down sweep would put the end at 415.83, outside the track; the up
    // sweep pulls it back to the edge and the start clear above it.
    expect(edgeTops(container, "handover")).toEqual(["380px", "400px"])
  })

  test("upright, a span long enough to separate them keeps its own minutes", () => {
    const longSpan = [{ id: "s", label: "pairing", start: 780, end: 960 }]
    const { container } = render(
      <DaySchedule defaultSpans={longSpan} height={400} timeLabelOrientation="upright" />,
    )
    // 50px apart on their own, so the sweep has nothing to do.
    expect(edgeTops(container, "pairing")).toEqual(["216.67px", "266.67px"])
  })
})

/**
 * The editable times’ type (task #173).
 *
 * Every other sample on the page draws its edge times at 10.5px, muted and
 * tabular; the editable one drew them at the library default of 14px in full
 * `text-quebi-fg`, beside span names that are only 12px. The two modes are
 * the same label in the same place, so they are asserted against each other
 * rather than against a number written twice.
 */
describe("the editable times' type", () => {
  const TYPE = ["text-[10.5px]", "text-quebi-fg-muted", "tabular-nums"]

  test("is the static labels' type, not the TimeInput default", () => {
    const typed = render(<DaySchedule defaultSpans={WORKDAY} timeLabels="editable" />)
    const field = typed.container.querySelector('[role="group"][aria-label$="start time"]')
    if (!field) throw new Error("no edge field")
    for (const cls of TYPE) expect(field.className).toContain(cls)
    expect(field.className).not.toContain("text-sm")
  })

  test("is the same type the static mode draws", () => {
    const fixed = render(<DaySchedule defaultSpans={WORKDAY} />)
    const label = fixed.container.querySelector('[aria-hidden="true"].origin-top-left')
    if (!label) throw new Error("no static label")
    for (const cls of TYPE) expect(label.className).toContain(cls)
  })
})
