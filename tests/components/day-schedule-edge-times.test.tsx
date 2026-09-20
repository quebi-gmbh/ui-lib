/**
 * What size a DaySchedule's edge times are.
 *
 * Task #173: the editable times rendered at the library default of 14px
 * beside static ones at 10.5px, and no className could bring them into line.
 */
import { describe, expect, test } from "bun:test"
import { render } from "@testing-library/react"
import { DaySchedule, type DaySpan } from "../../src/components/day-schedule"

const WORKDAY: DaySpan[] = [
  { id: "pairing", label: "pairing", start: 780, end: 960 },
  { id: "deploy", label: "deploy", start: 990, end: 1080 },
]

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
