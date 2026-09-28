/**
 * What Timeline promises beyond the pixels: every precision renders as its own
 * label and its own `<time dateTime>`, ranges share what their ends share and
 * keep a `<time>` per end, the list is an `<ol>` in the order it is read, `now`
 * (and only a `now` that was passed) decides which spans are future, the
 * two-sided placements collapse under a container query, and proportional
 * spacing compresses long gaps and gives overlapping items lanes.
 *
 * Locale and `now` are pinned everywhere, so nothing depends on the machine.
 */
import { describe, expect, test } from "bun:test"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  assignLanes,
  buildTimeScale,
  formatTimelineDate,
  formatTimelineRange,
  formatTimelineRelative,
  parseTimelineDate,
  Timeline,
  TimelineItem,
  TimelineNow,
  TimelineTitle,
} from "../../src/components/timeline"

const en = { locale: "en-GB" }

describe("precision", () => {
  test.each([
    ["2019", "2019", "2019"],
    ["2021-Q3", "Q3 2021", "2021-07"],
    ["2022-03", "March 2022", "2022-03"],
    ["2023-W12", "Week 12, 2023", "2023-W12"],
    ["2024-06-04", "4 Jun 2024", "2024-06-04"],
    ["2024-06-04T14:30", "4 Jun 2024, 14:30", "2024-06-04T14:30"],
  ])("%s renders as %s with dateTime %s", (input, label, dateTime) => {
    expect(formatTimelineDate(input, en)).toBe(label)
    expect(parseTimelineDate(input).dateTime).toBe(dateTime)
  })

  test("the string's shape is the precision", () => {
    expect(
      ["2019", "2021-Q3", "2022-03", "2023-W12", "2024-06-04", "2024-06-04T14:30"].map(
        (input) => parseTimelineDate(input).precision,
      ),
    ).toEqual(["year", "quarter", "month", "week", "day", "datetime"])
  })

  test("an instant is read on the wall clock of the time zone, and can be given a precision", () => {
    const instant = new Date("2024-06-04T12:30:00Z")
    expect(formatTimelineDate(instant, { ...en, timeZone: "Europe/Berlin" })).toBe("4 Jun 2024, 14:30")
    expect(formatTimelineDate(instant, { ...en, timeZone: "America/New_York" })).toBe(
      "4 Jun 2024, 08:30",
    )
    expect(formatTimelineDate({ date: instant, precision: "month" }, en)).toBe("June 2024")
    expect(parseTimelineDate(instant).dateTime).toBe("2024-06-04T12:30:00.000Z")
  })

  test("ISO weeks belong to their week-year", () => {
    expect(parseTimelineDate({ date: "2021-01-03", precision: "week" }).dateTime).toBe("2020-W53")
    expect(parseTimelineDate({ date: "2024-12-30", precision: "week" }).dateTime).toBe("2025-W01")
  })

  test("the words Intl does not have follow the locale, and can be overridden", () => {
    expect(formatTimelineDate("2023-W12", { locale: "de" })).toBe("KW 12/2023")
    expect(
      formatTimelineDate("2021-Q3", { ...en, labels: { quarter: (q, y) => `${y}/${q}` } }),
    ).toBe("2021/3")
  })

  test("an unreadable date is an error, not a silent Invalid Date", () => {
    expect(() => parseTimelineDate("soon")).toThrow(RangeError)
  })
})

describe("ranges", () => {
  test("ends at the same precision share what they have in common", () => {
    expect(formatTimelineRange("2019", "2022", en)).toBe("2019 – 2022")
    expect(formatTimelineRange("2024-03", "2024-06", en)).toBe("Mar – Jun 2024")
    expect(formatTimelineRange("2024-06-04", "2024-06-09", en)).toBe("4 – 9 Jun 2024")
  })

  test("an open range ends at present", () => {
    expect(formatTimelineRange("2023", "present", en)).toBe("2023 – present")
    expect(formatTimelineRange("2023", "present", { locale: "de" })).toBe("2023 – heute")
  })

  test("mixed precision keeps each end at its own", () => {
    expect(formatTimelineRange("2019", "2022-03", en)).toBe("2019 – March 2022")
    expect(formatTimelineRange("2024-Q1", "2024-Q3", en)).toBe("Q1 2024 – Q3 2024")
  })

  test("a range from a period to itself is the period", () => {
    expect(formatTimelineRange("2024-03", "2024-03", en)).toBe("March 2024")
  })
})

describe("relative labels", () => {
  const now = parseTimelineDate("2026-09-28T10:00")
  test("are in the unit of the item's precision", () => {
    expect(formatTimelineRelative(parseTimelineDate("2025"), now, "en-GB")).toBe("last year")
    expect(formatTimelineRelative(parseTimelineDate("2026-07"), now, "en-GB")).toBe("2 months ago")
    expect(formatTimelineRelative(parseTimelineDate("2026-09-27"), now, "en-GB")).toBe("yesterday")
    expect(formatTimelineRelative(parseTimelineDate("2026-09-28T07:00"), now, "en-GB")).toBe(
      "3 hours ago",
    )
  })

  test("render with the absolute date as the title", () => {
    render(
      <Timeline aria-label="Log" relative now="2026-09-28T10:00" locale="en-GB">
        <TimelineItem date="2026-09-27">
          <TimelineTitle>Deploy</TimelineTitle>
        </TimelineItem>
      </Timeline>,
    )
    const time = screen.getByText("yesterday")
    expect(time.tagName).toBe("TIME")
    expect(time).toHaveAttribute("title", "27 Sept 2026")
    expect(time).toHaveAttribute("dateTime", "2026-09-27")
  })
})

describe("semantics", () => {
  test("an ordered list of items, every date in a <time dateTime>", () => {
    render(
      <Timeline aria-label="History" locale="en-GB">
        <TimelineItem date="2019">
          <TimelineTitle>Founded</TimelineTitle>
        </TimelineItem>
        <TimelineItem start="2021-03" end="2021-06">
          <TimelineTitle>Pilot</TimelineTitle>
        </TimelineItem>
        <TimelineItem start="2023" end="present" isCurrent>
          <TimelineTitle>Growth</TimelineTitle>
        </TimelineItem>
      </Timeline>,
    )
    const list = screen.getByRole("list", { name: "History" })
    expect(list.tagName).toBe("OL")
    const items = within(list).getAllByRole("listitem")
    expect(items).toHaveLength(3)

    expect(items[0]?.querySelector("time")).toHaveAttribute("dateTime", "2019")
    // A range keeps a <time> per end, even when the label shares its year.
    const pilot = Array.from(items[1]?.querySelectorAll("time") ?? [])
    expect(pilot.map((t) => [t.getAttribute("dateTime"), t.textContent])).toEqual([
      ["2021-03", "Mar"],
      ["2021-06", "Jun 2021"],
    ])
    expect(items[1]).toHaveTextContent("Mar – Jun 2021")
    // "present" is not a date.
    expect(items[2]?.querySelectorAll("time")).toHaveLength(1)
    expect(items[2]).toHaveTextContent("2023 – present")
    expect(items[2]).toHaveAttribute("aria-current", "true")
  })

  test("markers and connectors are decoration", () => {
    render(
      <Timeline aria-label="History" locale="en-GB">
        <TimelineItem date="2019">
          <TimelineTitle>A</TimelineTitle>
        </TimelineItem>
        <TimelineItem date="2020">
          <TimelineTitle>B</TimelineTitle>
        </TimelineItem>
      </Timeline>,
    )
    for (const axis of Array.from(document.querySelectorAll('[data-slot="timeline-axis"]'))) {
      expect(axis).toHaveAttribute("aria-hidden", "true")
    }
  })

  test("order sorts newest first without the caller re-sorting", () => {
    render(
      <Timeline
        aria-label="Releases"
        order="desc"
        locale="en-GB"
        items={[
          { id: "a", date: "2024-01-10", title: "1.0" },
          { id: "b", date: "2024-03-02", title: "1.2" },
          { id: "c", date: "2024-02-14", title: "1.1" },
        ]}
      />,
    )
    const titles = screen
      .getAllByRole("listitem")
      .map((item) => item.querySelector('[data-slot="timeline-title"]')?.textContent)
    expect(titles).toEqual(["1.2", "1.1", "1.0"])
  })

  test("an empty timeline says so in words", () => {
    render(<Timeline aria-label="Log" locale="en-GB" />)
    expect(screen.getByText("Nothing has happened yet.")).toBeInTheDocument()
    expect(screen.queryByRole("list")).toBeNull()
  })

  test("collapseAfter folds the rest behind a toggle", async () => {
    render(
      <Timeline
        aria-label="Log"
        collapseAfter={2}
        locale="en-GB"
        items={["2020", "2021", "2022", "2023", "2024"].map((date) => ({
          id: date,
          date,
          title: date,
        }))}
      />,
    )
    expect(screen.getAllByRole("listitem")).toHaveLength(2)
    await userEvent.click(screen.getByRole("button", { name: "Show 3 more" }))
    expect(screen.getAllByRole("listitem")).toHaveLength(5)
    expect(screen.getByRole("button", { name: "Show less" })).toBeInTheDocument()
  })
})

describe("now", () => {
  const connectors = () =>
    Array.from(document.querySelectorAll('[data-slot="timeline-connector"]')).map((c) =>
      c.getAttribute("data-connector"),
    )

  test("dashes the connector from the first span that reaches past it", () => {
    render(
      <Timeline aria-label="Order" now="2026-09-26T09:00" order="asc" locale="en-GB">
        <TimelineItem date="2026-09-24">
          <TimelineTitle>Paid</TimelineTitle>
        </TimelineItem>
        <TimelineItem date="2026-09-25">
          <TimelineTitle>Shipped</TimelineTitle>
        </TimelineItem>
        <TimelineNow />
        <TimelineItem date="2026-09-27">
          <TimelineTitle>Delivered</TimelineTitle>
        </TimelineItem>
      </Timeline>,
    )
    const items = screen.getAllByRole("listitem")
    // TimelineNow was written third and sorted into place by `now`.
    expect(items[2]).toHaveAttribute("data-now")
    expect(items[2]).toHaveTextContent("Now")
    expect(connectors()).toEqual(["solid", "solid", "dashed"])
  })

  test("without a `now`, nothing is future", () => {
    render(
      <Timeline aria-label="Plan" locale="en-GB">
        <TimelineItem date="2000">
          <TimelineTitle>Then</TimelineTitle>
        </TimelineItem>
        <TimelineItem date="2999">
          <TimelineTitle>Later</TimelineTitle>
        </TimelineItem>
      </Timeline>,
    )
    expect(connectors()).toEqual(["solid"])
  })
})

describe("placement", () => {
  const renderPlaced = (placement: "end" | "alternating" | "opposite") =>
    render(
      <Timeline aria-label="History" placement={placement} locale="en-GB">
        {["2019", "2020", "2021"].map((date) => (
          <TimelineItem key={date} date={date}>
            <TimelineTitle>{date}</TimelineTitle>
          </TimelineItem>
        ))}
      </Timeline>,
    )

  test("alternating flips every other item to the start side", () => {
    renderPlaced("alternating")
    expect(screen.getAllByRole("listitem").map((item) => item.getAttribute("data-align"))).toEqual([
      "start",
      "end-wide",
      "start",
    ])
  })

  test("two-sided placements are one-sided until the container is wide enough", () => {
    for (const placement of ["alternating", "opposite"] as const) {
      const { unmount } = renderPlaced(placement)
      // The container is what the query measures.
      expect(document.querySelector('[data-slot="timeline"]')?.className).toContain("@container")
      const list = screen.getByRole("list")
      const templates = list.className.split(" ").filter((c) => c.includes("grid-cols-"))
      // One unprefixed template, and it is the one-sided one…
      expect(templates.filter((c) => !c.startsWith("@"))).toEqual(["grid-cols-[auto_minmax(0,1fr)]"])
      // …and the three-column template only exists behind the container query.
      expect(templates.filter((c) => c.startsWith("@xl:"))).toHaveLength(1)
      // The date gets its own cell rather than a duplicate.
      expect(list.querySelectorAll("time")).toHaveLength(3)
      unmount()
    }
  })

  test("a same-side timeline has no two-sided layout to collapse from", () => {
    renderPlaced("end")
    expect(screen.getByRole("list").className).not.toContain("@xl:")
  })
})

describe("grouping", () => {
  test("groupBy puts runs under headings, and the items stay in order", () => {
    render(
      <Timeline
        aria-label="Activity"
        groupBy="year"
        locale="en-GB"
        items={[
          { id: "a", date: "2023-05-01", title: "A" },
          { id: "b", date: "2023-09-01", title: "B" },
          { id: "c", date: "2024-02-01", title: "C" },
        ]}
      />,
    )
    const headings = screen.getAllByRole("heading")
    expect(headings.map((h) => h.textContent)).toEqual(["2023", "2024"])
    // The line runs on across the heading: only the very last item has no connector.
    expect(document.querySelectorAll('[data-slot="timeline-connector"]')).toHaveLength(2)
  })
})

describe("proportional spacing", () => {
  const YEAR = 365.25 * 86_400_000
  test("a long empty stretch is compressed; a stretch under a range is not", () => {
    const start = Date.UTC(2000, 0, 1)
    const scale = buildTimeScale(
      [
        { start, end: start },
        { start: start + 20 * YEAR, end: start + 30 * YEAR },
      ],
      { start, end: start + 30 * YEAR },
      "year",
    )
    const compressed = scale.segments.filter((s) => s.compressed)
    expect(compressed).toHaveLength(1)
    expect(compressed[0]?.to).toBe(start + 20 * YEAR)
    // Ten years under the range are drawn to scale: 96px a year.
    expect(Math.round(scale.at(start + 30 * YEAR) - scale.at(start + 20 * YEAR))).toBe(960)
  })

  test("overlapping items take lanes; one that fits after another reuses its lane", () => {
    expect(
      assignLanes([
        { x: 0, right: 100 },
        { x: 50, right: 150 },
        { x: 120, right: 200 },
        { x: 160, right: 260 },
      ]),
    ).toEqual([0, 1, 0, 1])
  })

  test("renders one ordered list, in time order, with ranges as bars", () => {
    render(
      <Timeline aria-label="Projects" spacing="proportional" now="2026-09" locale="en-GB">
        <TimelineItem start="2020-01" end="2022-10">
          <TimelineTitle>Billing</TimelineTitle>
        </TimelineItem>
        <TimelineItem start="2018-09" end="2021-02">
          <TimelineTitle>Scheduling</TimelineTitle>
        </TimelineItem>
        <TimelineItem start="2022-04" end="present">
          <TimelineTitle>Design system</TimelineTitle>
        </TimelineItem>
      </Timeline>,
    )
    const items = within(screen.getByRole("list", { name: "Projects" })).getAllByRole("listitem")
    expect(items.map((item) => item.querySelector('[data-slot="timeline-title"]')?.textContent)).toEqual([
      "Scheduling",
      "Billing",
      "Design system",
    ])
    expect(document.querySelectorAll('[data-slot="timeline-bar"]')).toHaveLength(3)
    // Scheduling and Billing overlap, so they are not in the same lane.
    expect(items[0]?.style.gridRow).not.toBe(items[1]?.style.gridRow)
  })
})
