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
  test("default to 36px, and an explicit laneGap still wins", () => {
    const leftOf = (container: HTMLElement) =>
      Array.from(
        container.querySelectorAll<HTMLElement>('[role="slider"][aria-label$="span"]'),
      ).map((bar) => bar.style.left)

    const { container: fixed } = render(<DaySchedule defaultSpans={WORKDAY} />)
    expect(leftOf(fixed)).toEqual(["24px", "42px"])

    const { container: typed } = render(
      <DaySchedule defaultSpans={WORKDAY} timeLabels="editable" />,
    )
    expect(leftOf(typed)).toEqual(["24px", "60px"])

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

    // laneOffset 24 + one lane of 36 + the 28px clearance.
    expect(nameLeft(render(<DaySchedule defaultSpans={WORKDAY} timeLabels="editable" />).container))
      .toBe("88px")
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
