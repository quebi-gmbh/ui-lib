/**
 * The editable rotated times — `timeLabels="editable"` (task #123).
 *
 * The default rotated times are output: two `aria-hidden` divs per span, which
 * is why nobody could type a time into a schedule. The editable mode swaps them
 * for a TimeField and hands what is typed to the same `applyMove` a drag uses,
 * so `minDuration` and the day bounds keep living in one place.
 *
 * Three things about that are easy to break and silent when broken, so they are
 * asserted here rather than reviewed:
 *
 *   1. A typed time is taken as typed. `step` snaps a drag — a pointer lands
 *      anywhere on the track, so it needs rounding — but a keystroke already
 *      says the minute it means, and rounding 13:07 to 13:00 would be the
 *      control contradicting the keyboard.
 *   2. The field commits when focus leaves it, not on every keystroke. A
 *      segmented field reports mid-edit values (typing `17` emits `01:00`
 *      first), and committing one clamps the span and loses the rest of the
 *      input. Moving from the hour segment to the minute one must not commit.
 *   3. The lanes widen to fit the control. The gap is what keeps one span's
 *      rotated time off its neighbour's, and a 20px field in an 18px gap is
 *      the overlap this mode exists to avoid.
 *
 * happy-dom drives the segments with arrow keys: react-aria types digits
 * through `beforeinput`, which happy-dom does not synthesise, but the arrow
 * path runs through the identical `onChange`, so it exercises the same commit.
 */
import { describe, expect, test } from "bun:test"
import { useForm } from "@conform-to/react"
import { act, fireEvent, render } from "@testing-library/react"
import { ConformDaySchedule } from "../../src/components/conform-day-schedule"
import { DaySchedule, type DaySpan } from "../../src/components/day-schedule"

const WORKDAY: DaySpan[] = [
  { id: "pairing", label: "pairing", start: 780, end: 960 },
  { id: "deploy", label: "deploy", start: 990, end: 1080 },
]

/** The segments of one edge field, in reading order: `[hour, minute]`. */
function segmentsOf(container: HTMLElement, name: string) {
  const field = container.querySelector(`[role="group"][aria-label="${name}"]`)
  if (!field) throw new Error(`no time field labelled "${name}"`)
  return Array.from(field.querySelectorAll<HTMLElement>('[role="spinbutton"]'))
}

/** Focus a segment, press a key on it, and let React flush. */
const press = (segment: HTMLElement, key: string) =>
  act(() => {
    segment.focus()
    fireEvent.keyDown(segment, { key })
    fireEvent.keyUp(segment, { key })
  })

/** Move focus out of the field entirely — what commits a draft. */
const blurAway = (segment: HTMLElement) =>
  act(() => {
    fireEvent.focusOut(segment, { relatedTarget: null })
  })

describe("the rotated times", () => {
  test("are output by default and controls only when asked", () => {
    const { container: fixed } = render(<DaySchedule defaultSpans={WORKDAY} />)
    expect(fixed.querySelectorAll('[role="spinbutton"]')).toHaveLength(0)
    // Two per span, both hidden from the accessibility tree — the sliders carry
    // the values there.
    expect(fixed.querySelectorAll('[aria-hidden="true"].origin-top-left')).toHaveLength(4)

    const { container: typed } = render(
      <DaySchedule defaultSpans={WORKDAY} timeLabels="editable" />,
    )
    expect(typed.querySelectorAll('[aria-hidden="true"].origin-top-left')).toHaveLength(0)
    expect(
      Array.from(typed.querySelectorAll('[role="group"]')).map((g) =>
        g.getAttribute("aria-label"),
      ),
    ).toEqual([
      "pairing",
      "pairing start time",
      "pairing end time",
      "deploy",
      "deploy start time",
      "deploy end time",
    ])
  })

  test("`showTimeLabels={false}` still means none", () => {
    const { container } = render(<DaySchedule defaultSpans={WORKDAY} showTimeLabels={false} />)
    expect(container.querySelectorAll(".origin-top-left")).toHaveLength(0)
  })

  test("show the span's own time", () => {
    const { container } = render(
      <DaySchedule defaultSpans={WORKDAY} timeLabels="editable" />,
    )
    expect(segmentsOf(container, "pairing start time").map((s) => s.textContent)).toEqual([
      "13",
      "00",
    ])
    expect(segmentsOf(container, "deploy end time").map((s) => s.textContent)).toEqual(["18", "00"])
  })
})

describe("typing a time", () => {
  test("is taken as typed — the step snaps a drag, not a keystroke", () => {
    const seen: DaySpan[][] = []
    const { container } = render(
      <DaySchedule
        spans={WORKDAY}
        onSpansChange={(next) => seen.push(next)}
        timeLabels="editable"
        step={15}
      />,
    )

    const [, minute] = segmentsOf(container, "pairing start time")
    press(minute, "ArrowUp")
    blurAway(minute)

    // 781, not the 780 a 15-minute snap would give back.
    expect(seen).toHaveLength(1)
    expect(seen[0][0].start).toBe(781)
  })

  test("commits when focus leaves the field, not between its segments", () => {
    const seen: DaySpan[][] = []
    const { container } = render(
      <DaySchedule
        spans={WORKDAY}
        onSpansChange={(next) => seen.push(next)}
        timeLabels="editable"
      />,
    )

    const [hour, minute] = segmentsOf(container, "pairing start time")
    press(hour, "ArrowUp")
    // Focus steps to the minute segment — still inside the field.
    act(() => {
      fireEvent.focusOut(hour, { relatedTarget: minute })
    })
    expect(seen).toHaveLength(0)

    blurAway(minute)
    expect(seen).toHaveLength(1)
    expect(seen[0][0].start).toBe(840)
  })

  test("Enter commits without waiting for the blur", () => {
    const seen: DaySpan[][] = []
    const { container } = render(
      <DaySchedule
        spans={WORKDAY}
        onSpansChange={(next) => seen.push(next)}
        timeLabels="editable"
      />,
    )

    const [hour] = segmentsOf(container, "pairing start time")
    press(hour, "ArrowDown")
    press(hour, "Enter")
    expect(seen).toHaveLength(1)
    expect(seen[0][0].start).toBe(720)
  })

  test("Escape puts the span's own time back", () => {
    const seen: DaySpan[][] = []
    const { container } = render(
      <DaySchedule
        spans={WORKDAY}
        onSpansChange={(next) => seen.push(next)}
        timeLabels="editable"
      />,
    )

    const [hour] = segmentsOf(container, "pairing start time")
    press(hour, "ArrowUp")
    expect(hour.textContent).toBe("14")
    press(hour, "Escape")
    expect(hour.textContent).toBe("13")

    blurAway(hour)
    expect(seen).toHaveLength(0)
  })

  test("goes through the same clamp a drag does", () => {
    const seen: DaySpan[][] = []
    const { container } = render(
      <DaySchedule
        spans={[{ id: "pairing", label: "pairing", start: 780, end: 810 }]}
        onSpansChange={(next) => seen.push(next)}
        timeLabels="editable"
        minDuration={30}
      />,
    )

    // 14:00 would leave a negative span; minDuration pins the start at 13:30.
    const [hour] = segmentsOf(container, "pairing start time")
    press(hour, "ArrowUp")
    blurAway(hour)
    expect(seen[0][0].start).toBe(780)
  })
})

describe("the wider lanes", () => {
  test("default to 24px, and an explicit laneGap still wins", () => {
    const leftOf = (container: HTMLElement) =>
      Array.from(
        container.querySelectorAll<HTMLElement>('[role="slider"][aria-label$="span"]'),
      ).map((bar) => bar.style.left)

    const { container: fixed } = render(<DaySchedule defaultSpans={WORKDAY} />)
    expect(leftOf(fixed)).toEqual(["24px", "42px"])

    const { container: typed } = render(
      <DaySchedule defaultSpans={WORKDAY} timeLabels="editable" />,
    )
    expect(leftOf(typed)).toEqual(["24px", "48px"])

    const { container: forced } = render(
      <DaySchedule defaultSpans={WORKDAY} timeLabels="editable" laneGap={50} />,
    )
    expect(leftOf(forced)).toEqual(["24px", "74px"])
  })

  test("push the name column clear of the widest lane", () => {
    const nameLeft = (container: HTMLElement) =>
      Array.from(container.querySelectorAll<HTMLElement>("div"))
        .filter((el) => el.textContent === "pairing" && el.style.left)
        .map((el) => el.style.left)[0]

    // laneOffset 24 + one lane of 24 + the 28px clearance.
    expect(nameLeft(render(<DaySchedule defaultSpans={WORKDAY} timeLabels="editable" />).container))
      .toBe("76px")
  })
})

/**
 * The name column de-overlap (task #159).
 *
 * Every name is drawn at the same `left`, so the only thing separating two of
 * them is their `top` — and until this, that was each span's own midpoint and
 * nothing else. Two spans sharing a midpoint is not a corner case here: the
 * component exists to be dragged, the shipped example has a lunch whose
 * midpoint is 780, and dragging anything else onto 780 put two names in exactly
 * the same place, one drawn over the other.
 *
 * `layoutNames` sweeps the wanted positions apart by `LABEL_GAP` (18px — the
 * 16px `text-xs` line box, plus enough not to read as one block). What the
 * sweep must not do is move a name that had no reason to move, or push the
 * column out of the track, so both are pinned below. It is arithmetic on the
 * `height` prop rather than a measurement, which is what lets it run during
 * render: the site is prerendered, and a measured position would be missing
 * from the HTML and would jump one frame after hydration.
 */
describe("the name column", () => {
  /** Every name's `top`, in pixels, keyed by the name. */
  function nameTops(container: HTMLElement) {
    const labels = new Set(["deep work", "review", "lunch", "pairing", "deploy"])
    const tops: Record<string, number> = {}
    for (const el of Array.from(container.querySelectorAll<HTMLElement>("div"))) {
      const text = el.textContent ?? ""
      if (el.style.top && el.style.left && labels.has(text)) {
        tops[text] = Number.parseFloat(el.style.top)
      }
    }
    return tops
  }

  /** The midpoint a name would sit on if nothing were in its way. */
  const midpointOf = (start: number, end: number, height: number) =>
    (((start + end) / 2) * height) / 1440

  test("a name whose neighbours are far away keeps its own midpoint", () => {
    const { container } = render(
      <DaySchedule
        defaultSpans={[
          { id: "a", label: "deep work", start: 120, end: 240 },
          { id: "b", label: "review", start: 900, end: 1020 },
        ]}
        height={560}
        timeLabels="none"
      />,
    )

    const tops = nameTops(container)
    expect(tops["deep work"]).toBeCloseTo(midpointOf(120, 240, 560), 1)
    expect(tops.review).toBeCloseTo(midpointOf(900, 1020, 560), 1)
  })

  test("two spans sharing a midpoint get two readable names", () => {
    // The reported case: lunch's default midpoint is 780, and "deep work"
    // dragged to 690–870 lands on the same one.
    const { container } = render(
      <DaySchedule
        defaultSpans={[
          { id: "deep-work", label: "deep work", start: 690, end: 870 },
          { id: "lunch", label: "lunch", start: 750, end: 810 },
        ]}
        height={400}
        timeLabels="none"
      />,
    )

    const tops = nameTops(container)
    expect(Math.abs(tops.lunch - tops["deep work"])).toBeGreaterThanOrEqual(18)
    // The first of the pair is the one that keeps the midpoint; the tie breaks
    // by span order, so it is the same one on every render.
    expect(tops["deep work"]).toBeCloseTo(midpointOf(690, 870, 400), 1)
  })

  test("a whole crowd comes apart, in order, and in one pass", () => {
    const spans: DaySpan[] = [
      { id: "a", label: "deep work", start: 700, end: 740 },
      { id: "b", label: "review", start: 710, end: 750 },
      { id: "c", label: "lunch", start: 720, end: 760 },
      { id: "d", label: "pairing", start: 730, end: 770 },
    ]
    const { container } = render(
      <DaySchedule defaultSpans={spans} height={560} timeLabels="none" />,
    )

    const tops = nameTops(container)
    const inOrder = ["deep work", "review", "lunch", "pairing"].map((name) => tops[name])
    // Still reading top to bottom in midpoint order — a sweep that reordered
    // them would separate the text and mislabel every bar.
    for (let i = 1; i < inOrder.length; i++) {
      expect(inOrder[i] - inOrder[i - 1]).toBeGreaterThanOrEqual(18)
    }
  })

  test("the column stays inside the track when the crowd is at the bottom", () => {
    const { container } = render(
      <DaySchedule
        defaultSpans={[
          { id: "a", label: "deep work", start: 1380, end: 1440 },
          { id: "b", label: "review", start: 1370, end: 1440 },
          { id: "c", label: "lunch", start: 1360, end: 1440 },
        ]}
        height={300}
        timeLabels="none"
      />,
    )

    const tops = Object.values(nameTops(container))
    expect(Math.max(...tops)).toBeLessThanOrEqual(300)
    expect(Math.min(...tops)).toBeGreaterThanOrEqual(0)
  })

  test("a name that had to move gets a leader line back to its span", () => {
    const stacked = render(
      <DaySchedule
        defaultSpans={[
          { id: "deep-work", label: "deep work", start: 690, end: 870 },
          { id: "lunch", label: "lunch", start: 750, end: 810 },
        ]}
        height={400}
        timeLabels="none"
      />,
    ).container
    // One line, for the one name that moved.
    expect(stacked.querySelectorAll("svg line")).toHaveLength(1)

    const apart = render(
      <DaySchedule
        defaultSpans={[
          { id: "a", label: "deep work", start: 120, end: 240 },
          { id: "b", label: "review", start: 900, end: 1020 },
        ]}
        height={560}
        timeLabels="none"
      />,
    ).container
    expect(apart.querySelectorAll("svg line")).toHaveLength(0)
  })

  test("names carry their span's tone, so a moved one still says which bar", () => {
    const { container } = render(
      <DaySchedule
        defaultSpans={[
          { id: "a", label: "deep work", start: 120, end: 240, tone: "brand" },
          { id: "b", label: "review", start: 900, end: 1020, tone: "cyan" },
        ]}
        timeLabels="none"
      />,
    )

    const classOf = (text: string) =>
      Array.from(container.querySelectorAll<HTMLElement>("div")).find(
        (el) => el.textContent === text && el.style.left && el.style.top,
      )?.className

    expect(classOf("deep work")).toContain("text-quebi-brand-text")
    expect(classOf("review")).toContain("text-quebi-info")
  })
})

describe("guarded modes", () => {
  test("read-only keeps the fields visible and refuses the edit", () => {
    const seen: DaySpan[][] = []
    const { container } = render(
      <DaySchedule
        spans={WORKDAY}
        onSpansChange={(next) => seen.push(next)}
        timeLabels="editable"
        isReadOnly
      />,
    )

    const [hour] = segmentsOf(container, "pairing start time")
    expect(hour).toHaveAttribute("aria-readonly", "true")
    press(hour, "ArrowUp")
    blurAway(hour)
    expect(seen).toHaveLength(0)
  })

  test("disabled takes the fields out of the tab order", () => {
    const { container } = render(
      <DaySchedule defaultSpans={WORKDAY} timeLabels="editable" isDisabled />,
    )
    for (const segment of segmentsOf(container, "pairing start time")) {
      expect(segment).not.toHaveAttribute("tabindex", "0")
    }
  })
})

describe("bound to a form", () => {
  const Agenda = () => {
    const [form, fields] = useForm<{ agenda: string }>({})
    return (
      <form id={form.id} onSubmit={form.onSubmit} noValidate>
        <ConformDaySchedule
          field={fields.agenda}
          label="Agenda"
          defaultSpans={WORKDAY}
          timeLabels="editable"
        />
      </form>
    )
  }

  test("a typed time round-trips through the serialized spans", () => {
    const { container } = render(<Agenda />)
    const registered = container.querySelector<HTMLInputElement>('input[name="agenda"]')
    if (!registered) throw new Error("no registered control")
    expect(JSON.parse(registered.value)).toEqual(WORKDAY)

    const [hour] = segmentsOf(container, "pairing start time")
    press(hour, "ArrowUp")
    blurAway(hour)

    expect(JSON.parse(registered.value)[0]).toMatchObject({ id: "pairing", start: 840, end: 960 })
  })
})
