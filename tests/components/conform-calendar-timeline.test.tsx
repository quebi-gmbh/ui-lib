/**
 * ConformCalendarTimeline owns the events; the timeline only reports them.
 *
 * `CalendarTimeline` applies nothing — `onEventChange` hands back the times a
 * gesture produced and the caller stores them — so in a form the store has to
 * be Conform's own state rather than a `useState` beside it. That is what makes
 * a dragged plan survive a failed submit and snap back on a reset, and it is
 * only observable through the registered control: the events go over the wire
 * as JSON, and `ZonedDateTime` is not JSON, so the round trip through
 * `toString()` and `parseZonedDateTime` is the thing under test.
 *
 * The other half is tolerance. A field may hold whatever a user, a fixture or
 * last month's release of an app put in it, and a timeline that throws while
 * parsing takes the whole form down with it.
 *
 * The by-hand mount comes from `tests/mount.ts`; the DOM from `tests/dom.ts`,
 * preloaded for every test file (see `bunfig.toml`).
 */
import { afterEach, describe, expect, test } from "bun:test"
import { useForm } from "@conform-to/react"
import {
  type CalendarDate,
  parseZonedDateTime,
  Time,
  toCalendarDate,
  toCalendarDateTime,
  toZoned,
} from "@internationalized/date"
import { act } from "react"
import userEvent from "@testing-library/user-event"
import type { CalendarEvent, CalendarSource } from "../../src/components/calendar-shell"
import { ConformCalendarTimeline } from "../../src/components/conform-calendar-timeline"
import { formOf, mount, unmountAll } from "../mount"

afterEach(unmountAll)

const ZONE = "Europe/Berlin"
const LOCALE = "de-DE"
const MONDAY: CalendarDate = toCalendarDate(parseZonedDateTime(`2026-09-21T00:00[${ZONE}]`))

const at = (day: CalendarDate, hour: number, minute = 0) =>
  toZoned(toCalendarDateTime(day, new Time(hour, minute)), ZONE)

const ROOMS: CalendarSource[] = [
  { id: "aurora", name: "Aurora", color: "blue" },
  { id: "borealis", name: "Borealis", color: "orange" },
]

/** The same booking as the form would have stored it. */
const STORED_PLANNING = JSON.stringify([
  {
    id: "planning",
    title: "Planning",
    calendarId: "aurora",
    start: "2026-09-21T09:00:00+02:00[Europe/Berlin]",
    end: "2026-09-21T11:00:00+02:00[Europe/Berlin]",
  },
])

const PLANNING: CalendarEvent = {
  id: "planning",
  title: "Planning",
  start: at(MONDAY, 9),
  end: at(MONDAY, 11),
  calendarId: "aurora",
}

/** A form whose field starts from whatever the caller stored in it. */
function App({ stored }: { stored?: string }) {
  const [form, fields] = useForm({
    defaultValue: stored === undefined ? undefined : { bookings: stored },
  })
  return (
    <form id={form.id} onSubmit={form.onSubmit} noValidate>
      <ConformCalendarTimeline
        field={fields.bookings}
        label="Room plan"
        defaultEvents={[PLANNING]}
        calendars={ROOMS}
        defaultDate={MONDAY}
        timeZone={ZONE}
        locale={LOCALE}
        now={null}
      />
    </form>
  )
}

/** The submitted value, parsed back into the entries a schema would see. */
function submitted(container: HTMLElement) {
  const value = new FormData(formOf(container)).get("bookings")
  expect(typeof value).toBe("string")
  return JSON.parse(String(value)) as Array<Record<string, unknown>>
}

const body = (container: HTMLElement, id = "planning") =>
  container.querySelector<HTMLElement>(`[data-event-id="${id}"] [data-drag-part="body"]`)

describe("the round trip", () => {
  test("the default events are the submitted value, instants and zone intact", async () => {
    const container = await mount(<App />)
    expect(submitted(container)).toEqual([
      {
        id: "planning",
        title: "Planning",
        calendarId: "aurora",
        start: "2026-09-21T09:00:00+02:00[Europe/Berlin]",
        end: "2026-09-21T11:00:00+02:00[Europe/Berlin]",
      },
    ])
  })

  test("an edit reaches the form value, and comes back as the bar's own label", async () => {
    const container = await mount(<App />)
    const user = userEvent.setup()
    body(container)?.focus()
    await user.keyboard("{ArrowRight}")

    const [booking] = submitted(container)
    expect(booking?.start).toBe("2026-09-21T09:15:00+02:00[Europe/Berlin]")
    expect(booking?.end).toBe("2026-09-21T11:15:00+02:00[Europe/Berlin]")
    // The value is the only store, so the bar is drawn from what was submitted.
    expect(body(container)?.getAttribute("aria-label")).toBe("Planning, 9:15 – 11:15")
  })

  test("a drop on another row is a change of calendar in the same value", async () => {
    const container = await mount(<App />)
    const user = userEvent.setup()
    body(container)?.focus()
    await user.keyboard("{ArrowDown}")

    expect(submitted(container)[0]?.calendarId).toBe("borealis")
  })

  test("a form reset snaps the plan back to the field's default", async () => {
    const container = await mount(<App stored={STORED_PLANNING} />)
    const user = userEvent.setup()
    body(container)?.focus()
    await user.keyboard("{ArrowRight}")
    expect(submitted(container)[0]?.start).toBe("2026-09-21T09:15:00+02:00[Europe/Berlin]")

    const form = formOf(container)
    await act(async () => {
      form.reset()
    })
    expect(submitted(container)[0]?.start).toBe("2026-09-21T09:00:00+02:00[Europe/Berlin]")
    expect(body(container)?.getAttribute("aria-label")).toBe("Planning, 9:00 – 11:00")
  })

  test("with no stored plan, a reset empties the control and the defaults are drawn again", async () => {
    // `defaultEvents` is the component's fallback, not the form's value: a
    // reset returns the registered control to the empty string the field
    // started at, and the timeline is redrawn from the fallback — the same
    // shape `conform-day-schedule` has with `defaultSpans`. An app that wants
    // a reset to restore a plan gives the *form* that plan, as the test above
    // does.
    const container = await mount(<App />)
    const user = userEvent.setup()
    body(container)?.focus()
    await user.keyboard("{ArrowRight}")
    expect(submitted(container)[0]?.start).toBe("2026-09-21T09:15:00+02:00[Europe/Berlin]")

    await act(async () => {
      formOf(container).reset()
    })
    expect(new FormData(formOf(container)).get("bookings")).toBe("")
    expect(body(container)?.getAttribute("aria-label")).toBe("Planning, 9:00 – 11:00")
  })

  // A failed submit is the other half of this and is not asserted here:
  // happy-dom's `requestSubmit` fires no submit event, so Conform's own
  // handler never runs and there is no failure to survive. The property it
  // rests on is the one above — the plan lives in the registered control, so
  // a re-render with errors redraws it from the same value a reset restores
  // from. The browser check on the gallery page covers the rest.
  test("a stored plan wins over the defaults", async () => {
    const stored = JSON.stringify([
      {
        id: "planning",
        title: "Planning",
        calendarId: "borealis",
        start: "2026-09-21T14:00:00+02:00[Europe/Berlin]",
        end: "2026-09-21T15:00:00+02:00[Europe/Berlin]",
      },
    ])
    const container = await mount(<App stored={stored} />)
    expect(body(container)?.getAttribute("aria-label")).toBe("Planning, 14:00 – 15:00")
  })
})

describe("a payload that is not a plan", () => {
  test("something that is not JSON falls back rather than throwing", async () => {
    const container = await mount(<App stored={"{ not json"} />)
    expect(body(container)?.getAttribute("aria-label")).toBe("Planning, 9:00 – 11:00")
    expect(submitted(container)).toHaveLength(1)
  })

  test("JSON that is not an array falls back too", async () => {
    const container = await mount(<App stored={'{"bookings":[]}'} />)
    expect(submitted(container)).toHaveLength(1)
  })

  test("an entry that is not an event is dropped, and the rest of the plan is kept", async () => {
    const stored = JSON.stringify([
      { id: "junk" },
      { id: "also-junk", title: "No times" },
      { id: "bad-instant", title: "Nonsense", start: "yesterday", end: "tomorrow" },
      null,
      42,
      {
        id: "standup",
        title: "Standup",
        calendarId: "aurora",
        start: "2026-09-21T09:30:00+02:00[Europe/Berlin]",
        end: "2026-09-21T09:45:00+02:00[Europe/Berlin]",
      },
    ])
    const container = await mount(<App stored={stored} />)
    expect(submitted(container)).toHaveLength(1)
    expect(body(container, "standup")?.getAttribute("aria-label")).toBe("Standup, 9:30 – 9:45")
  })

  test("an empty plan is a plan: no bars, and an empty array on the wire", async () => {
    const container = await mount(<App stored={"[]"} />)
    expect(container.querySelector('[data-slot="calendar-bar"]')).toBeNull()
    expect(submitted(container)).toEqual([])
  })
})
