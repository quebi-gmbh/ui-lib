/**
 * Every strip in the Activity Pulse gallery moves.
 *
 * This is the one regression the component cannot survive quietly. `samples` is
 * a plain array, so an example written with a literal in it renders perfectly,
 * reviews perfectly, screenshots perfectly — and publishes a page of frozen
 * strips for a component whose entire claim is that it looks different when the
 * work stops. It happened once already, in the first cut of this gallery, and
 * nothing in the type system, the lint rules or the build would have said so.
 *
 * So the assertion is over `activityPulseExamples` rather than over one
 * fixture: a seventh example added with a static array fails here.
 */
import { describe, expect, test } from "bun:test"
import { act } from "react"
import { render } from "@testing-library/react"
import { activityPulseExamples } from "../../src/registry/activity-pulse.examples"
import { PULSE_TICK_MS } from "../../src/components/activity-pulse"

/** Three ticks: enough for the buffer to shift even if a render is skipped. */
const WATCH_MS = PULSE_TICK_MS * 3

/** The drawn state of every strip in one example, as a comparable string. */
function snapshot(): string[] {
  return Array.from(document.querySelectorAll<HTMLElement>("[data-example]")).map((example) =>
    Array.from(example.querySelectorAll<HTMLElement>('[data-slot="activity-pulse-bar"]'))
      .map((bar) => `${bar.style.height}/${bar.style.opacity}`)
      .join("|"),
  )
}

describe("the gallery is alive", () => {
  test("every example redraws within three ticks", async () => {
    const { unmount } = render(
      activityPulseExamples.map((example, index) => (
        <div key={example.title} data-example={index}>
          {example.render()}
        </div>
      )),
    )

    const before = snapshot()
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, WATCH_MS))
    })
    const after = snapshot()
    act(() => {
      unmount()
    })

    expect(before).toHaveLength(activityPulseExamples.length)
    const frozen = activityPulseExamples
      .map((example, index) => (before[index] === after[index] ? example.title : null))
      .filter((title): title is string => title !== null)
    expect(frozen).toEqual([])
  })
})
