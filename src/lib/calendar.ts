/**
 * The headless half of the calendar-view family — one event model, one geometry
 * vocabulary, and the interval packing that `@/components/calendar-shell`,
 * `DayView`, `WeekView`, `MonthView` and `CalendarTimeline` all lay out with.
 *
 * Nothing here renders: no JSX, no `cn`, no `@/components/*` import, and no
 * `@/lib/*` import either. That is a hard constraint rather than a preference —
 * the API generator ships `@/lib/*` modules as `registry:lib` items with
 * `registryDependencies: []`, so a lib module importing a sibling would land in
 * a consumer's project with a dangling import. Formatting therefore lives in
 * the components, which may reach for `@/lib/intl`; the geometry lives here.
 *
 * ## Why `ZonedDateTime` and not `Date`
 *
 * A calendar is the one widget where "which day is this on" is a question the
 * value has to answer, and a `Date` cannot: it is an instant, and the instant
 * 2026-03-29T00:30Z is the 29th in Berlin and the 28th in São Paulo. Every
 * event here carries a `ZonedDateTime`, and every view carries the time zone it
 * is *drawn* in, so the two are never confused. `DaySchedule` ducked the
 * question by storing minutes from midnight with no date at all; that works for
 * a one-day planner and stops working the moment an event crosses midnight.
 *
 * ## Wall-clock minutes, not elapsed minutes
 *
 * A DST day is 23 or 25 hours long, so "minutes since the start of this day" and
 * "minutes on the clock" disagree twice a year. The grid is drawn in *clock*
 * minutes: 09:00 sits nine hours down the axis on every day of the year, which
 * is what every calendar UI does and what a reader checking a meeting time
 * expects. The absolute duration is still available where it is the right
 * question — `isAllDayEvent` uses it, because "24 hours or more" must not become
 * "23 hours or more" on the last Sunday in March.
 *
 * ## The packing pass
 *
 * `packIntervals` is the only non-trivial algorithm in the family and everything
 * else is a use of it: side-by-side columns in a day grid, stacked lanes in an
 * all-day row, stacked lanes in a month cell, stacked lanes inside one timeline
 * row. It is the standard sweep — sort by start, greedy first-fit into lanes,
 * close a cluster when a gap appears — with two details that libraries get wrong
 * differently and that `tests/calendar-packing.test.ts` pins:
 *
 * 1. **Intervals are half-open.** An event ending at 10:00 and one starting at
 *    10:00 do not overlap, so back-to-back meetings render full width instead of
 *    splitting the column for no reason.
 * 2. **Packing and rendering agree about the minimum.** A zero-length event
 *    overlaps nothing mathematically and is still drawn as a block with height,
 *    so packing it at its true length puts it full-width *underneath* the
 *    meeting it starts with. `packColumns` inflates every interval to
 *    `minMinutes` before packing — the same minimum the renderer draws with.
 */
import {
  type CalendarDate,
  startOfMonth,
  startOfWeek,
  toCalendarDate,
  toTimeZone,
  type ZonedDateTime,
} from "@internationalized/date"

/** Minutes on the clock in one day. A DST day still spans 0–1440; see the header. */
export const MINUTES_PER_DAY = 1440

const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * The categorical palette, in slot order.
 *
 * The order is the accessibility mechanism, not a preference: it is the
 * `dataviz` skill's validated categorical ordering, whose adjacent pairs clear
 * the colour-vision-deficiency gate in both themes. Assign in order and never
 * cycle — a ninth calendar wants a "+N others" fold, not a ninth hue that
 * repeats the first. The slot that would be the skill's aqua is quebi's brand
 * teal, which is the one slot the brand can occupy without disturbing the
 * ordering; `brand` is also the default for a view with a single calendar,
 * where there is no adjacency to clear because there is nothing to tell apart.
 *
 * The names are keys, not classes. `CALENDAR_COLORS` in
 * `@/components/calendar-shell` is what turns one into pixels, so this module
 * stays free of styling and a consumer can map them somewhere else.
 */
export const calendarColorNames = [
  "blue",
  "orange",
  "brand",
  "amber",
  "pink",
  "emerald",
  "violet",
  "rose",
] as const

export type CalendarColorName = (typeof calendarColorNames)[number]

/** The slot `index` lands in, counting from zero and stopping at the last one. */
export function calendarColorAt(index: number): CalendarColorName {
  const slot = Math.min(Math.max(Math.trunc(index), 0), calendarColorNames.length - 1)
  return calendarColorNames[slot] as CalendarColorName
}

/**
 * One entry on a calendar.
 *
 * `start` and `end` are instants with a zone attached, and `end` is exclusive —
 * a 09:00–10:00 meeting ends at 10:00 and does not touch the 10:00 one. An
 * `allDay` event still carries both, and they are read as the boundaries of the
 * days it covers; the flag says how it is *placed*, not that the times are
 * meaningless.
 */
export interface CalendarEvent {
  /** Stable identity — the React key, and what the selection callbacks report. */
  id: string
  title: string
  start: ZonedDateTime
  /** Exclusive. An event ending at midnight does not reach the following day. */
  end: ZonedDateTime
  /** Place in the all-day band rather than on the time grid. */
  allDay?: boolean
  /** Which `CalendarSource` owns it. Required by CalendarTimeline, optional elsewhere. */
  calendarId?: string
  /** Overrides the owning calendar's colour for this one event. */
  color?: CalendarColorName
  /** Rendered under the title when the block is tall enough to hold it. */
  location?: string
}

/** A calendar (or resource, or room) — one row in a `CalendarTimeline`. */
export interface CalendarSource {
  id: string
  name: string
  color: CalendarColorName
  /** Secondary line under the name in a timeline row — a room number, an owner. */
  description?: string
}

/** Clamp, written once because every geometry helper below needs it. */
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/**
 * Clock minutes of `instant` relative to midnight starting `day`, in `timeZone`.
 *
 * Negative for an instant before that midnight, past 1440 for one after the next
 * — which is exactly what `segmentByDay` needs to decide whether an event
 * reaches into a day and by how much. The day offset comes from the Julian day
 * difference, so it is exact across month and year boundaries.
 */
export function wallMinutes(instant: ZonedDateTime, day: CalendarDate, timeZone: string): number {
  const local = toTimeZone(instant, timeZone)
  const dayOffset = toCalendarDate(local).compare(day)
  return dayOffset * MINUTES_PER_DAY + local.hour * 60 + local.minute + local.second / 60
}

/**
 * Does this event belong in the all-day band rather than on the time grid?
 *
 * The flag wins. Without it the test is the absolute duration: 24 hours or more
 * goes in the band, anything shorter stays on the grid and is cut at midnight if
 * it crosses one. That is the line Outlook and Google draw, and it is the reason
 * a 22:00–02:00 shift renders as two blocks on two days instead of vanishing
 * into a band where its times cannot be read.
 */
export function isAllDayEvent(event: CalendarEvent): boolean {
  if (event.allDay) return true
  return event.end.toDate().getTime() - event.start.toDate().getTime() >= MS_PER_DAY
}

/** One event's presence on one day of the grid, in clock minutes within that day. */
export interface DaySegment<E extends CalendarEvent = CalendarEvent> {
  event: E
  /** Index into the `days` array the segment was cut against. */
  dayIndex: number
  /** Clock minutes from midnight, clamped to the visible window. */
  start: number
  /** Clock minutes from midnight, clamped to the visible window. */
  end: number
  /** The event started before the window — draw a flat top edge. */
  continuesBefore: boolean
  /** The event runs past the window — draw a flat bottom edge. */
  continuesAfter: boolean
}

/**
 * The slice of a day an axis actually draws, in clock minutes from midnight.
 *
 * A grid that starts at 09:00 is not showing the first 540 minutes of the day,
 * so an event inside them is not something it can draw — and a segment cut
 * against the whole day would be positioned outside the grid by whatever it is
 * asked to turn minutes into pixels. Defaults to the whole day.
 */
export interface DayWindow {
  /** First minute on the axis. Default 0. */
  startMinute?: number
  /** Last minute on the axis, exclusive. Default 1440. */
  endMinute?: number
}

/**
 * Cut timed events into per-day segments against `days`, inside `visible`.
 *
 * All-day events are skipped — `packBands` places those. An event ending exactly
 * at the start of the window produces no zero-height segment inside it, which is
 * the case that otherwise leaves a one-pixel ghost at the top of every Tuesday.
 *
 * The window is the same clamp as midnight, applied to a narrower day: an event
 * reaching across either edge is cut at it and flagged `continuesBefore` /
 * `continuesAfter`, so the block draws the flat edge that says "this is one
 * thing cut", and an event wholly outside contributes nothing. Without it a
 * 21:00 meeting on a 09:00–13:00 axis is not merely invisible — it is drawn
 * hundreds of pixels below the last gridline, where it inflates the scroll area
 * of whichever ancestor scrolls and gives the reader empty space to scroll
 * through (task #161).
 */
export function segmentByDay<E extends CalendarEvent>(
  events: readonly E[],
  days: readonly CalendarDate[],
  timeZone: string,
  visible: DayWindow = {},
): DaySegment<E>[] {
  const windowStart = clamp(visible.startMinute ?? 0, 0, MINUTES_PER_DAY)
  const windowEnd = clamp(visible.endMinute ?? MINUTES_PER_DAY, windowStart, MINUTES_PER_DAY)
  const segments: DaySegment<E>[] = []

  for (const event of events) {
    if (isAllDayEvent(event)) continue

    for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
      const day = days[dayIndex]
      if (!day) continue
      const rawStart = wallMinutes(event.start, day, timeZone)
      const rawEnd = wallMinutes(event.end, day, timeZone)

      // Half-open, with one carve-out: a zero-length event has no interior to
      // overlap the window with, so it is placed by its start alone.
      const overlaps = rawStart < windowEnd && rawEnd > windowStart
      const zeroLength = rawEnd === rawStart
      const startsWithin = rawStart >= windowStart && rawStart < windowEnd
      if (!overlaps && !(zeroLength && startsWithin)) continue

      segments.push({
        event,
        dayIndex,
        start: clamp(rawStart, windowStart, windowEnd),
        end: clamp(rawEnd, windowStart, windowEnd),
        continuesBefore: rawStart < windowStart,
        continuesAfter: rawEnd > windowEnd,
      })
    }
  }

  return segments
}

/** A half-open interval in whatever unit the caller is packing. */
export interface PackInterval {
  start: number
  end: number
}

/** Where one interval landed: its lane, and how many lanes its cluster needed. */
export interface PackPlacement {
  /** Zero-based lane within the cluster. */
  lane: number
  /** Lanes the whole cluster was packed into — the denominator for a width. */
  lanes: number
  /** Which connected run of overlapping intervals this one belongs to. */
  cluster: number
}

/**
 * Greedy first-fit lane packing over half-open intervals.
 *
 * Returns one placement per input interval, in input order. The sweep:
 *
 * - Intervals are visited by start ascending, then by end *descending*, so a
 *   long event takes the leftmost lane and the short ones stack to its right —
 *   the arrangement that reads as "this is the containing block" rather than as
 *   three unrelated slivers. Ties break on input index, so the result is stable.
 * - An interval starting at or after every open lane's end closes the cluster:
 *   the lane count is a property of the cluster, not of the day, or a single
 *   08:00 conflict would narrow the 17:00 meeting to half width.
 * - Within a cluster, the first lane whose last interval has ended takes it,
 *   and a new lane opens only when none has.
 */
export function packIntervals(intervals: readonly PackInterval[]): PackPlacement[] {
  const order = intervals
    .map((interval, index) => ({ interval, index }))
    .sort((a, b) => {
      if (a.interval.start !== b.interval.start) return a.interval.start - b.interval.start
      if (a.interval.end !== b.interval.end) return b.interval.end - a.interval.end
      return a.index - b.index
    })

  const placements: PackPlacement[] = intervals.map(() => ({ lane: 0, lanes: 1, cluster: 0 }))

  let laneEnds: number[] = []
  let members: number[] = []
  let clusterEnd = Number.NEGATIVE_INFINITY
  let cluster = 0

  const closeCluster = () => {
    for (const index of members) {
      const placement = placements[index]
      if (placement) placement.lanes = laneEnds.length
    }
    laneEnds = []
    members = []
    cluster += 1
  }

  for (const { interval, index } of order) {
    if (laneEnds.length > 0 && interval.start >= clusterEnd) closeCluster()

    let lane = laneEnds.findIndex((end) => end <= interval.start)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(interval.end)
    } else {
      laneEnds[lane] = interval.end
    }

    placements[index] = { lane, lanes: laneEnds.length, cluster }
    members.push(index)
    clusterEnd = members.length === 1 ? interval.end : Math.max(clusterEnd, interval.end)
  }

  if (laneEnds.length > 0) closeCluster()

  return placements
}

/** A day segment with its column assignment — what a day or week grid draws. */
export interface PackedSegment<E extends CalendarEvent = CalendarEvent> extends DaySegment<E> {
  /** Zero-based column within the day. */
  column: number
  /** Columns the overlapping cluster needed — the denominator for a width. */
  columns: number
  /**
   * Columns this segment may widen into, itself included, so `span / columns` is
   * its width. A block expands rightwards until it meets one that would overlap
   * it, which is what keeps a 09:00–17:00 block wide when the two meetings
   * inside it are at different times.
   */
  span: number
}

export interface PackColumnsOptions {
  /**
   * The shortest interval packing will consider, in minutes. It must match the
   * minimum height the renderer draws, or a very short event is packed as if it
   * were invisible and then drawn on top of its neighbour. Defaults to 15.
   */
  minMinutes?: number
}

/**
 * Assign side-by-side columns to day segments, one day at a time.
 *
 * Segments from different days never interact, so they are grouped by
 * `dayIndex` before packing; the result keeps the input order.
 */
export function packColumns<E extends CalendarEvent>(
  segments: readonly DaySegment<E>[],
  options: PackColumnsOptions = {},
): PackedSegment<E>[] {
  const minMinutes = options.minMinutes ?? 15
  const byDay = new Map<number, number[]>()

  for (let index = 0; index < segments.length; index++) {
    const segment = segments[index]
    if (!segment) continue
    const bucket = byDay.get(segment.dayIndex)
    if (bucket) bucket.push(index)
    else byDay.set(segment.dayIndex, [index])
  }

  const packed: PackedSegment<E>[] = segments.map((segment) => ({
    ...segment,
    column: 0,
    columns: 1,
    span: 1,
  }))

  for (const indices of byDay.values()) {
    const intervals = indices.map((index) => {
      const segment = segments[index] as DaySegment<E>
      return { start: segment.start, end: Math.max(segment.end, segment.start + minMinutes) }
    })
    const placements = packIntervals(intervals)

    for (let slot = 0; slot < indices.length; slot++) {
      const index = indices[slot] as number
      const placement = placements[slot] as PackPlacement
      const target = packed[index] as PackedSegment<E>
      target.column = placement.lane
      target.columns = placement.lanes
      target.span = expansion(slot, intervals, placements)
    }
  }

  return packed
}

/**
 * How many columns the interval at `slot` may occupy, itself included.
 *
 * It widens rightwards one column at a time and stops at the first column
 * holding something it overlaps. Without this pass a day with one long event and
 * two short ones renders as three permanently thin ribbons; with it, each block
 * uses the room actually free beside it.
 */
function expansion(
  slot: number,
  intervals: readonly PackInterval[],
  placements: readonly PackPlacement[],
): number {
  const self = intervals[slot] as PackInterval
  const here = placements[slot] as PackPlacement
  let span = 1

  for (let column = here.lane + 1; column < here.lanes; column++) {
    const blocked = placements.some((other, index) => {
      if (index === slot || other.cluster !== here.cluster || other.lane !== column) return false
      const candidate = intervals[index] as PackInterval
      return candidate.start < self.end && self.start < candidate.end
    })
    if (blocked) break
    span += 1
  }

  return span
}

/** An all-day or multi-day event as a horizontal band across day columns. */
export interface EventBand<E extends CalendarEvent = CalendarEvent> {
  event: E
  /** First visible day index the band covers. */
  startIndex: number
  /** Last visible day index the band covers, inclusive. */
  endIndex: number
  /** Zero-based stacking lane within the band area. */
  lane: number
  /** The event began before the first visible day. */
  continuesBefore: boolean
  /** The event runs past the last visible day. */
  continuesAfter: boolean
}

export interface PackBandsOptions {
  /**
   * Which events become bands.
   *
   * `"all-day"` — the default — takes only what `isAllDayEvent` claims, which is
   * what a day or week grid wants: everything else belongs on its time axis.
   * `"all"` takes every event, which is what a month grid wants, where a 09:00
   * meeting is a chip in a cell and has no axis to sit on.
   */
  include?: "all-day" | "all"
}

/**
 * Lay out events as horizontal bands over `days`, stacked into lanes.
 *
 * The end day is the day the event is last *present* on: an event ending at
 * midnight ends on the previous day, or every one-day all-day event would draw
 * across two columns. Events entirely outside the visible range are dropped;
 * ones that merely start or end outside it are clipped and flagged.
 */
export function packBands<E extends CalendarEvent>(
  events: readonly E[],
  days: readonly CalendarDate[],
  timeZone: string,
  options: PackBandsOptions = {},
): EventBand<E>[] {
  const first = days[0]
  const last = days.length > 0 ? days[days.length - 1] : undefined
  if (!first || !last) return []

  const spans: { event: E; rawStart: number; rawEnd: number }[] = []

  const include = options.include ?? "all-day"

  for (const event of events) {
    if (include === "all-day" && !isAllDayEvent(event)) continue

    const localStart = toTimeZone(event.start, timeZone)
    const localEnd = toTimeZone(event.end, timeZone)
    const rawStart = toCalendarDate(localStart).compare(first)
    let rawEnd = toCalendarDate(localEnd).compare(first)

    const endsAtMidnight = localEnd.hour === 0 && localEnd.minute === 0 && localEnd.second === 0
    if (endsAtMidnight && rawEnd > rawStart) rawEnd -= 1

    if (rawEnd < 0 || rawStart > days.length - 1) continue
    spans.push({ event, rawStart, rawEnd })
  }

  // Half-open in day units — a band covering only Monday is [0, 1).
  const placements = packIntervals(
    spans.map((span) => ({
      start: clamp(span.rawStart, 0, days.length - 1),
      end: clamp(span.rawEnd, 0, days.length - 1) + 1,
    })),
  )

  return spans.map((span, index) => ({
    event: span.event,
    startIndex: clamp(span.rawStart, 0, days.length - 1),
    endIndex: clamp(span.rawEnd, 0, days.length - 1),
    lane: (placements[index] as PackPlacement).lane,
    continuesBefore: span.rawStart < 0,
    continuesAfter: span.rawEnd > days.length - 1,
  }))
}

/** What survived a lane limit, and how much each day is still hiding. */
export interface LimitedBands<E extends CalendarEvent = CalendarEvent> {
  bands: EventBand<E>[]
  /** Hidden event count per day index — the number behind each "+N more". */
  hiddenPerDay: number[]
}

/**
 * Trim `bands` to `maxLanes` and count what that hid, per day.
 *
 * On a day that overflows, the last lane is spent on the "+N more" affordance
 * itself, so the effective limit there is one lower — otherwise the overflow
 * link covers an event that was drawn underneath it. A band is kept only if it
 * fits on *every* day it covers: a band truncated halfway across a week reads as
 * an event that ends on Wednesday, which is a worse lie than not drawing it.
 */
export function limitLanes<E extends CalendarEvent>(
  bands: readonly EventBand<E>[],
  dayCount: number,
  maxLanes: number,
): LimitedBands<E> {
  const cap = Math.max(1, Math.trunc(maxLanes))
  const total = new Array<number>(dayCount).fill(0)

  const covers = (band: EventBand<E>, day: number) => day >= band.startIndex && day <= band.endIndex

  for (const band of bands) {
    for (let day = band.startIndex; day <= band.endIndex; day++) {
      if (day >= 0 && day < dayCount) total[day] = (total[day] ?? 0) + 1
    }
  }

  const limit = total.map((count) => (count > cap ? cap - 1 : cap))
  const kept = bands.filter((band) => {
    for (let day = band.startIndex; day <= band.endIndex; day++) {
      if (band.lane >= (limit[day] ?? cap)) return false
    }
    return true
  })

  const hiddenPerDay = total.map((count, day) => {
    const shown = kept.filter((band) => covers(band, day)).length
    return count - shown
  })

  return { bands: kept, hiddenPerDay }
}

/** Every event present on `dayIndex`, band or not — what a "+N more" opens onto. */
export function eventsOnDay<E extends CalendarEvent>(
  bands: readonly EventBand<E>[],
  segments: readonly DaySegment<E>[],
  dayIndex: number,
): E[] {
  const banded = bands
    .filter((band) => dayIndex >= band.startIndex && dayIndex <= band.endIndex)
    .map((band) => band.event)
  const timed = segments
    .filter((segment) => segment.dayIndex === dayIndex)
    .sort((a, b) => a.start - b.start || a.end - b.end)
    .map((segment) => segment.event)
  return [...banded, ...timed]
}

/**
 * `count` consecutive days starting at the first day of `date`'s week.
 *
 * The week's first day is the locale's — Monday in `de-DE`, Sunday in `en-US` —
 * unless `firstDayOfWeek` overrides it. `count` below seven is the work-week
 * view; above seven is a rolling multi-week strip.
 */
export function weekRange(
  date: CalendarDate,
  locale: string,
  count = 7,
  firstDayOfWeek?: Parameters<typeof startOfWeek>[2],
): CalendarDate[] {
  const start = startOfWeek(date, locale, firstDayOfWeek)
  return Array.from({ length: Math.max(1, Math.trunc(count)) }, (_, index) => start.add({ days: index }))
}

/**
 * The month grid `date` falls in: whole weeks, starting on the locale's first
 * day, covering every day of the month and the leading and trailing days that
 * complete the first and last weeks.
 *
 * The row count follows the month rather than being pinned at six, so a
 * February beginning on a Monday draws four rows instead of four rows and two
 * empty ones. A caller wanting a fixed height should fix the container's, not
 * the grid's.
 */
export function monthRange(
  date: CalendarDate,
  locale: string,
  firstDayOfWeek?: Parameters<typeof startOfWeek>[2],
): CalendarDate[][] {
  const first = startOfMonth(date)
  const start = startOfWeek(first, locale, firstDayOfWeek)
  const daysInMonth = first.calendar.getDaysInMonth(first)
  const lead = first.compare(start)
  const weeks = Math.ceil((lead + daysInMonth) / 7)

  return Array.from({ length: weeks }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => start.add({ days: week * 7 + day })),
  )
}

/** True if `day` is one of the days of `month`'s own month — the grid's dimming test. */
export function isInMonth(day: CalendarDate, month: CalendarDate): boolean {
  return day.month === month.month && day.year === month.year
}
