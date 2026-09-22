/**
 * The box `zoom` put around the track, and the overhang it turned into a
 * scrollbar.
 *
 * A DaySchedule used to be its own outermost box. `zoom` wrapped it in a
 * viewport that scrolls, and at zoom 1 — every schedule that existed before
 * that, and every one on the gallery page — the track is exactly as tall as the
 * viewport, so the claim was that the wrapper changed nothing.
 *
 * It changed two things, both of them at the ends of the day. A scroll
 * container clips: `00:00`, centred on minute 0, lost its top half, and `24:00`
 * lost its bottom half. And what hung below the last pixel — that label's other
 * half, plus the rule drawn at `top: 100%` — was scrollable overflow, so the
 * browser drew a 6px bar down a schedule with nothing to scroll.
 *
 * Both halves are pinned here, because both are invisible in a DOM without
 * layout and neither has an obvious owner: the ends of the hour axis tuck
 * inside the track, and the viewport only becomes a scroll container when there
 * is something to scroll.
 */
import { describe, expect, test } from "bun:test"
import { render } from "@testing-library/react"
import { DaySchedule, type DaySpan } from "../../src/components/day-schedule"

const WORKDAY: DaySpan[] = [
  { id: "pairing", label: "pairing", start: 780, end: 960 },
  { id: "deploy", label: "deploy", start: 990, end: 1080 },
]

const viewportOf = (container: HTMLElement) =>
  container.querySelector<HTMLElement>("[data-day-schedule-viewport]")

/** Each hour label as `[text, the shift it carries]`, top to bottom. */
const axisOf = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>(".w-10 > div")).map(
    (el) => [el.textContent, /-?translate-y-\S+/.exec(el.className)?.[0]] as const,
  )

/** Each gridline's shift, top to bottom. `undefined` is "drawn on its minute". */
const rulesOf = (container: HTMLElement) =>
  Array.from(
    container.querySelectorAll<HTMLElement>(".relative.flex-1 > [aria-hidden='true'].h-px"),
  ).map((el) => /-?translate-y-\S+/.exec(el.className)?.[0])

describe("the ends of the hour axis", () => {
  test("tuck inside the track — every tick between them stays on its minute", () => {
    const [first, ...rest] = axisOf(render(<DaySchedule defaultSpans={WORKDAY} />).container)
    const last = rest.pop()
    // Midnight hangs below its rule and 24:00 sits above its own; neither has
    // track on the side its other half would need.
    expect(first).toEqual(["00:00", "translate-y-0"])
    expect(last).toEqual(["24:00", "-translate-y-full"])
    expect(rest.map(([, shift]) => shift)).toEqual(Array(rest.length).fill("-translate-y-1/2"))
  })

  test("are the ends of the day, not the ends of the array", () => {
    // 500-minute ticks stop at 1000, which has track above and below it like
    // any other tick and is therefore centred on its minute.
    const axis = axisOf(render(<DaySchedule defaultSpans={WORKDAY} tickInterval={500} />).container)
    expect(axis).toEqual([
      ["00:00", "translate-y-0"],
      ["08:20", "-translate-y-1/2"],
      ["16:40", "-translate-y-1/2"],
    ])
  })

  test("the last gridline is drawn on the track's final pixel, not the row after it", () => {
    const rules = rulesOf(render(<DaySchedule defaultSpans={WORKDAY} />).container)
    // A 1px line has no half to centre, so only the last one moves at all.
    expect(rules.pop()).toBe("-translate-y-full")
    expect(rules).toEqual(Array(rules.length).fill(undefined))
  })
})

describe("the viewport", () => {
  test("at zoom 1 is not a scroll container, so nothing clips and no bar is drawn", () => {
    const viewport = viewportOf(render(<DaySchedule defaultSpans={WORKDAY} />).container)
    expect(viewport?.className).toContain("overflow-visible")
    expect(viewport?.className).not.toContain("overflow-y-auto")
    // No bar is asked for either: there would be nothing for it to scroll.
    expect(viewport?.className).not.toContain("quebi-scrollbar")
  })

  test("becomes one with a zoom, wearing the library's bar", () => {
    const viewport = viewportOf(
      render(<DaySchedule defaultSpans={WORKDAY} zoom={3} />).container,
    )
    expect(viewport?.className).toContain("overflow-y-auto")
    expect(viewport?.className).toContain("overscroll-y-contain")
    expect(viewport?.className).toContain("quebi-scrollbar")
    expect(viewport?.className).not.toContain("quebi-scrollbar-none")
  })
})
