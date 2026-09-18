/**
 * The overlap-packing pass behind the calendar views (task #158).
 *
 * `src/lib/calendar.ts` is the one place in the family where something can be
 * *wrong* rather than merely ugly: everything the day, week, month and timeline
 * views draw is a percentage computed here. It is also pure — no DOM, no React,
 * no time zone read from the runtime — so it is tested as arithmetic, which is
 * the only way the awkward cases get looked at at all.
 *
 * The awkward cases, and why each one is here:
 *
 * - **Touching intervals.** Back-to-back meetings are the most common shape on a
 *   real calendar. Treated as overlapping they split every column in half for no
 *   reason, and the bug reads as "our calendar looks cramped" rather than as an
 *   off-by-one in a comparison.
 * - **Nested spans and chains.** These are the two shapes a naive "does it
 *   overlap the previous one" sweep gets wrong in opposite directions: a chain
 *   A–B–C where A and C do not touch still needs one cluster, and a long
 *   containing event must not force everything inside it into its own column.
 * - **Zero-length events.** They overlap nothing mathematically and are still
 *   drawn with height. Packing them at their true length puts them full width
 *   underneath the meeting they start with — invisible in every screenshot and
 *   obvious to the one person whose stand-up is a point in time.
 * - **Cross-midnight.** The reason the model carries `ZonedDateTime` at all. A
 *   22:00–02:00 shift is two segments on two days, and an event ending *at*
 *   midnight is one segment, not one plus a zero-height ghost.
 * - **All-day.** The band is a different layout with a different overflow rule,
 *   and which events go in it is a decision (24 hours, absolute) rather than a
 *   flag lookup.
 */
import { describe, expect, test } from "bun:test"
import { type CalendarDate, parseZonedDateTime, toCalendarDate } from "@internationalized/date"
import {
  type CalendarEvent,
  calendarColorAt,
  eventsOnDay,
  isAllDayEvent,
  limitLanes,
  monthRange,
  packBands,
  packColumns,
  packIntervals,
  segmentByDay,
  wallMinutes,
  weekRange,
} from "../src/lib/calendar"

const ZONE = "Europe/Berlin"

/** `ev("a", "2026-09-21T09:00", "2026-09-21T10:00")` — Berlin, always. */
function ev(id: string, start: string, end: string, extra: Partial<CalendarEvent> = {}) {
  return {
    id,
    title: id,
    start: parseZonedDateTime(`${start}[${ZONE}]`),
    end: parseZonedDateTime(`${end}[${ZONE}]`),
    ...extra,
  } satisfies CalendarEvent
}

/** `"2026-09-21"` → the `CalendarDate` the grid indexes by. */
const asDay = (iso: string): CalendarDate =>
  toCalendarDate(parseZonedDateTime(`${iso}T00:00[${ZONE}]`))

const MONDAY = asDay("2026-09-21")

/** `count` consecutive days starting Monday 21 September 2026. */
const days = (count: number): CalendarDate[] =>
  Array.from({ length: count }, (_, index) => MONDAY.add({ days: index }))

/** The columns a single day's events pack into, keyed by event id. */
function columnsFor(events: CalendarEvent[], dayCount = 1) {
  const grid = days(dayCount)
  const segments = segmentByDay(events, grid, ZONE)
  const packed = packColumns(segments)
  return packed.map((segment) => ({
    id: segment.event.id,
    dayIndex: segment.dayIndex,
    start: segment.start,
    end: segment.end,
    column: segment.column,
    columns: segment.columns,
    span: segment.span,
    continuesBefore: segment.continuesBefore,
    continuesAfter: segment.continuesAfter,
  }))
}

describe("packIntervals", () => {
  test("half-open: back-to-back intervals share one lane", () => {
    // 09:00–10:00 then 10:00–11:00. A closed-interval comparison would call
    // these overlapping and halve both.
    const placed = packIntervals([
      { start: 540, end: 600 },
      { start: 600, end: 660 },
    ])
    expect(placed.map((p) => p.lane)).toEqual([0, 0])
    expect(placed.map((p) => p.lanes)).toEqual([1, 1])
  })

  test("a gap closes the cluster, so a later conflict cannot narrow an earlier event", () => {
    // Two overlapping at 09:00, one alone at 14:00. The 14:00 one is full width.
    const placed = packIntervals([
      { start: 540, end: 600 },
      { start: 570, end: 630 },
      { start: 840, end: 900 },
    ])
    expect(placed.map((p) => p.lanes)).toEqual([2, 2, 1])
    expect(placed[2]?.cluster).not.toBe(placed[0]?.cluster)
  })

  test("a chain of pairwise overlaps is one cluster even where the ends do not meet", () => {
    // A 09:00–10:00, B 09:30–10:30, C 10:15–11:00. A and C do not overlap, but
    // B holds them in the same cluster, so all three are measured against two
    // lanes — and C reuses A's lane rather than opening a third.
    const placed = packIntervals([
      { start: 540, end: 600 },
      { start: 570, end: 630 },
      { start: 615, end: 660 },
    ])
    expect(placed.map((p) => p.lane)).toEqual([0, 1, 0])
    expect(placed.map((p) => p.lanes)).toEqual([2, 2, 2])
    expect(new Set(placed.map((p) => p.cluster)).size).toBe(1)
  })

  test("the longest interval takes the leftmost lane", () => {
    // Same start, different lengths: the container goes left and the short ones
    // stack to its right, which is what reads as containment.
    const placed = packIntervals([
      { start: 540, end: 600 },
      { start: 540, end: 1020 },
    ])
    expect(placed[1]?.lane).toBe(0)
    expect(placed[0]?.lane).toBe(1)
  })

  test("equal intervals break the tie on input order, so the result is stable", () => {
    const intervals = [
      { start: 540, end: 600 },
      { start: 540, end: 600 },
      { start: 540, end: 600 },
    ]
    expect(packIntervals(intervals).map((p) => p.lane)).toEqual([0, 1, 2])
  })
})

describe("packColumns", () => {
  test("a nested pair does not push the containing event out of its column", () => {
    const packed = columnsFor([
      ev("all-morning", "2026-09-21T09:00", "2026-09-21T17:00"),
      ev("standup", "2026-09-21T10:00", "2026-09-21T11:00"),
      ev("lunch", "2026-09-21T12:00", "2026-09-21T13:00"),
    ])
    const byId = Object.fromEntries(packed.map((p) => [p.id, p]))
    expect(byId["all-morning"]?.column).toBe(0)
    expect(byId.standup?.column).toBe(1)
    // The 12:00 one reuses the 10:00 one's column — two columns, not three.
    expect(byId.lunch?.column).toBe(1)
    expect(packed.every((p) => p.columns === 2)).toBe(true)
  })

  test("a block widens into a column that is free beside it", () => {
    // A 09:00–12:00 | B 09:00–10:00 | C 09:00–10:00 forces three columns, and
    // D at 10:30 reuses B's. Nothing in column 2 overlaps D, so D is drawn two
    // columns wide instead of as a third of the day.
    const packed = columnsFor([
      ev("a", "2026-09-21T09:00", "2026-09-21T12:00"),
      ev("b", "2026-09-21T09:00", "2026-09-21T10:00"),
      ev("c", "2026-09-21T09:00", "2026-09-21T10:00"),
      ev("d", "2026-09-21T10:30", "2026-09-21T11:00"),
    ])
    const byId = Object.fromEntries(packed.map((p) => [p.id, p]))
    expect(byId.d).toMatchObject({ column: 1, columns: 3, span: 2 })
    // The containing event cannot widen — column 1 holds b, which overlaps it.
    expect(byId.a).toMatchObject({ column: 0, span: 1 })
  })

  test("a zero-length event is packed at the minimum the renderer draws", () => {
    // 10:00–10:00 overlaps nothing on the number line. Inflated to 15 minutes —
    // the height it will actually occupy — it conflicts with the 10:00 meeting
    // and gets its own column.
    const packed = columnsFor([
      ev("point", "2026-09-21T10:00", "2026-09-21T10:00"),
      ev("meeting", "2026-09-21T10:00", "2026-09-21T11:00"),
    ])
    expect(packed.every((p) => p.columns === 2)).toBe(true)
    // The segment keeps its true length; only the packing interval was inflated.
    const point = packed.find((p) => p.id === "point")
    expect(point?.start).toBe(600)
    expect(point?.end).toBe(600)
  })

  test("a zero-length event survives segmentation at all", () => {
    // Half-open clipping alone would drop it: `end > 0` is false at midnight.
    expect(columnsFor([ev("midnight", "2026-09-21T00:00", "2026-09-21T00:00")])).toHaveLength(1)
  })

  test("events on different days never share a cluster", () => {
    const packed = columnsFor(
      [
        ev("mon", "2026-09-21T09:00", "2026-09-21T10:00"),
        ev("tue", "2026-09-22T09:00", "2026-09-22T10:00"),
      ],
      2,
    )
    expect(packed.map((p) => p.dayIndex)).toEqual([0, 1])
    expect(packed.every((p) => p.columns === 1)).toBe(true)
  })
})

describe("segmentByDay", () => {
  test("a cross-midnight shift is two segments with the seam flagged", () => {
    const packed = columnsFor([ev("night", "2026-09-21T22:00", "2026-09-22T02:00")], 2)
    expect(packed).toHaveLength(2)
    expect(packed[0]).toMatchObject({
      dayIndex: 0,
      start: 1320,
      end: 1440,
      continuesBefore: false,
      continuesAfter: true,
    })
    expect(packed[1]).toMatchObject({
      dayIndex: 1,
      start: 0,
      end: 120,
      continuesBefore: true,
      continuesAfter: false,
    })
  })

  test("an event ending at midnight leaves no ghost on the following day", () => {
    const packed = columnsFor([ev("evening", "2026-09-21T22:00", "2026-09-22T00:00")], 2)
    expect(packed).toHaveLength(1)
    expect(packed[0]).toMatchObject({ dayIndex: 0, end: 1440, continuesAfter: false })
  })

  test("an event starting at midnight belongs to the day it starts, not the one before", () => {
    const packed = columnsFor([ev("early", "2026-09-22T00:00", "2026-09-22T01:00")], 2)
    expect(packed).toHaveLength(1)
    expect(packed[0]).toMatchObject({ dayIndex: 1, start: 0, end: 60 })
  })

  test("an event outside the visible days contributes nothing", () => {
    expect(columnsFor([ev("later", "2026-09-30T09:00", "2026-09-30T10:00")], 2)).toHaveLength(0)
  })

  test("the grid is drawn in clock minutes, so a DST day still runs 00:00–24:00", () => {
    // 2026-03-29 is the short day in Berlin: 02:00 never happens, and the day is
    // 23 hours long. An elapsed-minutes axis would put this 09:00 meeting an
    // hour high; the clock is what the reader is checking against.
    const dstDay = asDay("2026-03-29")
    const start = parseZonedDateTime(`2026-03-29T09:00[${ZONE}]`)
    expect(wallMinutes(start, dstDay, ZONE)).toBe(540)
  })

  test("an instant is placed by the zone the grid is drawn in", () => {
    // 23:30 in Berlin is 22:30 in London — the previous evening either way, but
    // 00:30 Berlin is still the 21st in London. The zone decides the day.
    const berlinMidnightish = parseZonedDateTime(`2026-09-22T00:30[${ZONE}]`)
    expect(wallMinutes(berlinMidnightish, MONDAY, ZONE)).toBe(1470)
    expect(wallMinutes(berlinMidnightish, MONDAY, "Europe/London")).toBe(1410)
  })
})

describe("all-day placement", () => {
  test("the flag wins, and 24 hours is the line without it", () => {
    expect(isAllDayEvent(ev("flagged", "2026-09-21T09:00", "2026-09-21T10:00", { allDay: true }))).toBe(true)
    expect(isAllDayEvent(ev("long", "2026-09-21T09:00", "2026-09-22T09:00"))).toBe(true)
    // One minute short of a day stays on the grid, where its times can be read.
    expect(isAllDayEvent(ev("nearly", "2026-09-21T09:00", "2026-09-22T08:59"))).toBe(false)
    expect(isAllDayEvent(ev("night", "2026-09-21T22:00", "2026-09-22T02:00"))).toBe(false)
  })

  test("all-day events are kept out of the time grid", () => {
    expect(
      columnsFor([ev("holiday", "2026-09-21T00:00", "2026-09-22T00:00", { allDay: true })]),
    ).toHaveLength(0)
  })

  test("a one-day band ending at midnight covers one column, not two", () => {
    const bands = packBands(
      [ev("holiday", "2026-09-21T00:00", "2026-09-22T00:00", { allDay: true })],
      days(7),
      ZONE,
    )
    expect(bands[0]).toMatchObject({ startIndex: 0, endIndex: 0, lane: 0 })
  })

  test("a band is clipped to the visible week and says which edge it ran past", () => {
    const bands = packBands(
      [ev("conference", "2026-09-19T00:00", "2026-09-30T00:00", { allDay: true })],
      days(7),
      ZONE,
    )
    expect(bands[0]).toMatchObject({
      startIndex: 0,
      endIndex: 6,
      continuesBefore: true,
      continuesAfter: true,
    })
  })

  test("overlapping bands stack into lanes", () => {
    const bands = packBands(
      [
        ev("a", "2026-09-21T00:00", "2026-09-24T00:00", { allDay: true }),
        ev("b", "2026-09-22T00:00", "2026-09-23T00:00", { allDay: true }),
        ev("c", "2026-09-24T00:00", "2026-09-25T00:00", { allDay: true }),
      ],
      days(7),
      ZONE,
    )
    expect(bands.map((band) => band.lane)).toEqual([0, 1, 0])
  })
})

describe("limitLanes", () => {
  const fiveOnMonday = () =>
    packBands(
      ["a", "b", "c", "d", "e"].map((id) =>
        ev(id, "2026-09-21T00:00", "2026-09-22T00:00", { allDay: true }),
      ),
      days(7),
      ZONE,
    )

  test("an overflowing day spends its last lane on the overflow link", () => {
    // Five events, three lanes of room: two are drawn and the third lane says
    // "+3 more". Keeping three and reporting "+2" would hide the link under an
    // event, which is the bug this rule exists to avoid.
    const { bands, hiddenPerDay } = limitLanes(fiveOnMonday(), 7, 3)
    expect(bands).toHaveLength(2)
    expect(hiddenPerDay[0]).toBe(3)
    expect(hiddenPerDay.slice(1)).toEqual([0, 0, 0, 0, 0, 0])
  })

  test("a day that fits keeps every lane", () => {
    const { bands, hiddenPerDay } = limitLanes(fiveOnMonday(), 7, 5)
    expect(bands).toHaveLength(5)
    expect(hiddenPerDay[0]).toBe(0)
  })

  test("a multi-day band is kept whole or not at all, and the long one wins the lane", () => {
    // Monday holds three bands with room for two, so its effective limit is one.
    // The three-day band sorted into lane 0 — longest first — so it survives and
    // the two single-day ones are what Monday hides. The alternative, cutting
    // the band at Monday night, reads as an event that ends on Monday, which is
    // a worse lie than not drawing it: a band is kept only if it fits on *every*
    // day it covers.
    const bands = packBands(
      [
        ev("x", "2026-09-21T00:00", "2026-09-22T00:00", { allDay: true }),
        ev("y", "2026-09-21T00:00", "2026-09-22T00:00", { allDay: true }),
        ev("week", "2026-09-21T00:00", "2026-09-24T00:00", { allDay: true }),
      ],
      days(7),
      ZONE,
    )
    const { bands: kept, hiddenPerDay } = limitLanes(bands, 7, 2)
    expect(kept.map((band) => band.event.id)).toEqual(["week"])
    expect(hiddenPerDay.slice(0, 4)).toEqual([2, 0, 0, 0])
  })

  test("a band too tall for a day in the middle of its run is dropped across its whole run", () => {
    // A five-day band takes lane 0 and a three-day one lane 1. Monday has room
    // for both; Tuesday also carries two single-day events, so its limit drops
    // to one and the three-day band no longer fits there. It is therefore hidden
    // on Monday as well — and Monday's "+N more" counts it, which is the whole
    // point of reporting the hidden count per day rather than per band.
    const bands = packBands(
      [
        ev("week", "2026-09-21T00:00", "2026-09-26T00:00", { allDay: true }),
        ev("trip", "2026-09-21T00:00", "2026-09-24T00:00", { allDay: true }),
        ev("t1", "2026-09-22T00:00", "2026-09-23T00:00", { allDay: true }),
        ev("t2", "2026-09-22T00:00", "2026-09-23T00:00", { allDay: true }),
      ],
      days(7),
      ZONE,
    )
    const { bands: kept, hiddenPerDay } = limitLanes(bands, 7, 2)
    expect(kept.map((band) => band.event.id)).toEqual(["week"])
    expect(hiddenPerDay.slice(0, 5)).toEqual([1, 3, 1, 0, 0])
  })

  test("a limit of one hides everything on an overflowing day", () => {
    const { bands, hiddenPerDay } = limitLanes(fiveOnMonday(), 7, 1)
    expect(bands).toHaveLength(0)
    expect(hiddenPerDay[0]).toBe(5)
  })
})

describe("eventsOnDay", () => {
  test("the overflow list is the bands first, then the timed events in order", () => {
    const grid = days(2)
    const events = [
      ev("holiday", "2026-09-21T00:00", "2026-09-22T00:00", { allDay: true }),
      ev("late", "2026-09-21T16:00", "2026-09-21T17:00"),
      ev("early", "2026-09-21T09:00", "2026-09-21T10:00"),
    ]
    const listed = eventsOnDay(
      packBands(events, grid, ZONE),
      segmentByDay(events, grid, ZONE),
      0,
    ).map((event) => event.id)
    expect(listed).toEqual(["holiday", "early", "late"])
  })
})

describe("ranges", () => {
  test("the week starts where the locale says it does", () => {
    expect(weekRange(MONDAY, "de-DE").map((d) => d.day)).toEqual([21, 22, 23, 24, 25, 26, 27])
    // en-US starts on Sunday, so the same date sits at the far end of its week.
    expect(weekRange(MONDAY, "en-US").map((d) => d.day)).toEqual([20, 21, 22, 23, 24, 25, 26])
  })

  test("a work week is the same range, cut short", () => {
    expect(weekRange(MONDAY, "de-DE", 5).map((d) => d.day)).toEqual([21, 22, 23, 24, 25])
  })

  test("the month grid is whole weeks and no more rows than the month needs", () => {
    // September 2026 begins on a Tuesday and has 30 days: five Monday-first rows.
    const grid = monthRange(MONDAY, "de-DE")
    expect(grid).toHaveLength(5)
    expect(grid.every((week) => week.length === 7)).toBe(true)
    expect(grid[0]?.[0]?.day).toBe(31)
    expect(grid[4]?.[6]?.day).toBe(4)
  })

  test("February 2027 starts on a Monday and needs four rows, not six", () => {
    const february = asDay("2027-02-10")
    expect(monthRange(february, "de-DE")).toHaveLength(4)
  })
})

describe("the palette", () => {
  test("slots are assigned in order and the last one is the end of the road", () => {
    expect(calendarColorAt(0)).toBe("blue")
    expect(calendarColorAt(2)).toBe("brand")
    // Never cycle: a ninth calendar reusing the first hue is a lie about identity.
    expect(calendarColorAt(99)).toBe("rose")
    expect(calendarColorAt(-1)).toBe("blue")
  })
})
