"use client"

import {
  Children,
  createContext,
  isValidElement,
  type ReactElement,
  type ReactNode,
  use,
  useEffect,
  useState,
} from "react"
import { useLocale } from "react-aria-components"
import { Avatar } from "@/components/avatar"
import { Disclosure, DisclosurePanel, DisclosureTrigger } from "@/components/disclosure-group"
import { Link } from "@/components/link"
import { ScrollArea } from "@/components/scroll-area"
import { ShowMore } from "@/components/show-more"
import { getDateTimeFormat, getNumberFormat, getRelativeTimeFormat } from "@/lib/intl"
import { cn } from "@/lib/utils"

/**
 * Timeline — quebi design system
 *
 * What happened when: a changelog, a company's story, a CV, an order's
 * tracking events, an audit log. Not `CalendarTimeline` (a resource schedule
 * on an hour axis), not `Stepper` (progress through a process), not
 * `CommitGraph` (branches).
 *
 * ## Shape
 *
 * `Timeline` is an `<ol>` and every `TimelineItem` is an `<li>`, so the order
 * is the list's order for a screen reader too. Items are written as children
 * (`TimelineItem` > `TimelineTitle`, `TimelineDescription`, `TimelineMeta`,
 * anything else), or handed over as data through `items`, which builds the
 * same children. The marker and the connector are decoration — `aria-hidden`
 * — so a state a marker's colour shows ("delivered", "failed") has to be in
 * the item's words as well.
 *
 * ## Dates carry their own precision
 *
 * An item's `date` (or `start` / `end`) is a string whose shape *is* its
 * precision — `"2019"`, `"2021-Q3"`, `"2022-03"`, `"2023-W12"`,
 * `"2024-06-04"`, `"2024-06-04T14:30"` — or `{ date, precision }` for a `Date`
 * or a timestamp. So a mixed-precision history is just items with different
 * strings, and each label renders at its own item's precision ("2019",
 * "Q3 2021", "March 2022", "Week 12, 2023", "4 Jun 2024", "4 Jun 2024,
 * 14:30"). Every date is a `<time dateTime>` with the HTML form of the same
 * precision (a quarter is written as its first month — HTML has no quarter).
 *
 * The strings are read as calendar values, not as instants, and are
 * formatted in UTC, so the label cannot move with the machine's time zone —
 * the site is prerendered, and a label that depended on the zone would be one
 * string in the HTML and another after hydration. A `Date` or a timestamp *is*
 * an instant, and is read on the wall clock of `timeZone`.
 *
 * ## Nothing reads the clock during render
 *
 * `now` is a prop. It places a `TimelineNow`, turns the connector dashed from
 * the first span that reaches into the future, and is the reference for
 * `relative` labels. Without it, relative labels render absolute until mount
 * and pick the clock up in an effect — the same contract as `FormattedDate`.
 *
 * ## Layout
 *
 * Vertical items share one grid through `subgrid`, so the marker column is as
 * wide as the widest marker and an `opposite` date column as wide as the
 * widest date. `alternating` and `opposite` are two-sided only above the
 * `@xl` container width and collapse to one side below it — a container query,
 * so it follows the space the timeline is given rather than the window.
 * Horizontal timelines scroll in a `ScrollArea` that is a focusable region
 * (arrow keys scroll it) and snap to items by proximity, never mandatorily.
 *
 * `spacing="proportional"` is a different drawing of the same items: position
 * along a horizontal axis follows real time, ticks fall at a unit chosen from
 * the span, ranges are bars, overlapping items take lanes, and a long empty
 * stretch is compressed behind a break mark instead of drawn to scale.
 */

// ---------------------------------------------------------------------------
// Date model
// ---------------------------------------------------------------------------

export type TimelinePrecision = "year" | "quarter" | "month" | "week" | "day" | "datetime"

/** A `Date`, timestamp or string with the precision spelled out. */
export interface TimelinePointInput {
  date: Date | string | number
  precision: TimelinePrecision
}

/**
 * A date on the timeline. A string's shape is its precision: `"2019"`,
 * `"2021-Q3"`, `"2022-03"`, `"2023-W12"`, `"2024-06-04"`,
 * `"2024-06-04T14:30"`. Any other string, a `Date` or a timestamp is an
 * instant at `datetime` precision unless wrapped in `{ date, precision }`.
 */
export type TimelineDateInput = string | number | Date | TimelinePointInput

/** The end of a range: a date, or `"present"` for a range that is still open. */
export type TimelineRangeEnd = TimelineDateInput | "present"

/** A date resolved to a calendar period. */
export interface TimelinePoint {
  precision: TimelinePrecision
  year: number
  month: number
  day: number
  hour: number
  minute: number
  /** ISO week-numbering year and week, for `week` precision. */
  weekYear: number
  week: number
  /** First instant of the period, as UTC milliseconds of the wall clock. */
  start: number
  /** First instant after the period. */
  end: number
  /** The value of the `<time dateTime>` attribute. */
  dateTime: string
}

const DAY = 86_400_000
const DEFAULT_TIME_ZONE = "Europe/Berlin"

const PATTERNS: [RegExp, TimelinePrecision][] = [
  [/^(\d{4})$/, "year"],
  [/^(\d{4})-Q([1-4])$/i, "quarter"],
  [/^(\d{4})-(\d{2})$/, "month"],
  [/^(\d{4})-W(\d{2})$/i, "week"],
  [/^(\d{4})-(\d{2})-(\d{2})$/, "day"],
  [/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/, "datetime"],
]

interface Components {
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

const pad = (value: number, length = 2) => String(value).padStart(length, "0")

/** Monday of ISO week 1 of `weekYear`, plus `week - 1` weeks. */
function isoWeekStart(weekYear: number, week: number): number {
  const jan4 = Date.UTC(weekYear, 0, 4)
  const weekday = (new Date(jan4).getUTCDay() + 6) % 7
  return jan4 - weekday * DAY + (week - 1) * 7 * DAY
}

function isoWeekOf(year: number, month: number, day: number): { weekYear: number; week: number } {
  const date = Date.UTC(year, month - 1, day)
  const weekday = (new Date(date).getUTCDay() + 6) % 7
  const thursday = date - weekday * DAY + 3 * DAY
  const weekYear = new Date(thursday).getUTCFullYear()
  return { weekYear, week: 1 + Math.floor((thursday - Date.UTC(weekYear, 0, 1)) / DAY / 7) }
}

function componentsOf(ms: number): Components {
  const date = new Date(ms)
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
  }
}

/** An instant on the wall clock of `timeZone`. */
function wallClock(instant: number, timeZone: string): Components {
  const parts = getDateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(instant))
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0)
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour") % 24,
    minute: get("minute"),
  }
}

function pointFrom(precision: TimelinePrecision, c: Components, instant?: number): TimelinePoint {
  const { weekYear, week } = isoWeekOf(c.year, c.month, c.day)
  const quarterMonth = Math.floor((c.month - 1) / 3) * 3
  const day = `${pad(c.year, 4)}-${pad(c.month)}-${pad(c.day)}`
  const [start, end, dateTime] = ((): [number, number, string] => {
    switch (precision) {
      case "year":
        return [Date.UTC(c.year, 0, 1), Date.UTC(c.year + 1, 0, 1), pad(c.year, 4)]
      case "quarter":
        return [
          Date.UTC(c.year, quarterMonth, 1),
          Date.UTC(c.year, quarterMonth + 3, 1),
          `${pad(c.year, 4)}-${pad(quarterMonth + 1)}`,
        ]
      case "month":
        return [
          Date.UTC(c.year, c.month - 1, 1),
          Date.UTC(c.year, c.month, 1),
          `${pad(c.year, 4)}-${pad(c.month)}`,
        ]
      case "week": {
        const monday = isoWeekStart(weekYear, week)
        return [monday, monday + 7 * DAY, `${pad(weekYear, 4)}-W${pad(week)}`]
      }
      case "day": {
        const midnight = Date.UTC(c.year, c.month - 1, c.day)
        return [midnight, midnight + DAY, day]
      }
      case "datetime": {
        const at = Date.UTC(c.year, c.month - 1, c.day, c.hour, c.minute)
        return [
          at,
          at + 60_000,
          instant === undefined
            ? `${day}T${pad(c.hour)}:${pad(c.minute)}`
            : new Date(instant).toISOString(),
        ]
      }
    }
  })()
  // Named rather than spread: `atPrecision` passes a whole point as `c`, and a
  // spread would carry its old precision, start and end over the new ones.
  const { year, month, day: date, hour, minute } = c
  return { precision, year, month, day: date, hour, minute, weekYear, week, start, end, dateTime }
}

function parseString(value: string): { components: Components; precision: TimelinePrecision } | null {
  for (const [pattern, precision] of PATTERNS) {
    const match = pattern.exec(value.trim())
    if (!match) continue
    const n = match.slice(1).map(Number)
    const year = n[0] ?? 0
    switch (precision) {
      case "year":
        return { precision, components: { year, month: 1, day: 1, hour: 0, minute: 0 } }
      case "quarter":
        return {
          precision,
          components: { year, month: ((n[1] ?? 1) - 1) * 3 + 1, day: 1, hour: 0, minute: 0 },
        }
      case "week":
        return { precision, components: componentsOf(isoWeekStart(year, n[1] ?? 1)) }
      default:
        return {
          precision,
          components: {
            year,
            month: n[1] ?? 1,
            day: n[2] ?? 1,
            hour: n[3] ?? 0,
            minute: n[4] ?? 0,
          },
        }
    }
  }
  return null
}

/** Resolve a timeline date to the calendar period it names. */
export function parseTimelineDate(
  input: TimelineDateInput,
  timeZone: string = DEFAULT_TIME_ZONE,
): TimelinePoint {
  const value = typeof input === "object" && !(input instanceof Date) ? input.date : input
  const requested =
    typeof input === "object" && !(input instanceof Date) ? input.precision : undefined

  if (typeof value === "string") {
    const parsed = parseString(value)
    if (parsed) return pointFrom(requested ?? parsed.precision, parsed.components)
  }
  const instant = new Date(value).getTime()
  if (Number.isNaN(instant)) throw new RangeError(`Timeline: cannot read ${String(value)} as a date`)
  return pointFrom(requested ?? "datetime", wallClock(instant, timeZone), instant)
}

/** The same moment at another precision — the period that contains it. */
function atPrecision(point: TimelinePoint, precision: TimelinePrecision): TimelinePoint {
  return pointFrom(precision, point)
}

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

/** The words the timeline says that `Intl` cannot say for it. */
export interface TimelineLabels {
  quarter: (quarter: string, year: string) => string
  week: (week: string, year: string) => string
  /** The end of an open range: "2023 – present". */
  present: string
  /** The label of a `TimelineNow`. */
  now: string
  showMore: (count: string) => string
  showLess: string
  details: string
  empty: string
}

const LABELS: Record<string, TimelineLabels> = {
  en: {
    quarter: (q, y) => `Q${q} ${y}`,
    week: (w, y) => `Week ${w}, ${y}`,
    present: "present",
    now: "Now",
    showMore: (n) => `Show ${n} more`,
    showLess: "Show less",
    details: "Details",
    empty: "Nothing has happened yet.",
  },
  de: {
    quarter: (q, y) => `Q${q} ${y}`,
    week: (w, y) => `KW ${w}/${y}`,
    present: "heute",
    now: "Jetzt",
    showMore: (n) => `${n} weitere anzeigen`,
    showLess: "Weniger anzeigen",
    details: "Details",
    empty: "Bisher ist nichts passiert.",
  },
}

function labelsFor(locale: string, overrides?: Partial<TimelineLabels>): TimelineLabels {
  const base = LABELS[locale.split("-")[0]?.toLowerCase() ?? "en"] ?? (LABELS.en as TimelineLabels)
  return { ...base, ...overrides }
}

const POINT_FORMATS: Partial<Record<TimelinePrecision, Intl.DateTimeFormatOptions>> = {
  year: { year: "numeric" },
  month: { month: "long", year: "numeric" },
  day: { day: "numeric", month: "short", year: "numeric" },
  datetime: { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" },
}

/** In a range the month is short: "Mar – Jun 2024", not "March – June 2024". */
const RANGE_FORMATS: Partial<Record<TimelinePrecision, Intl.DateTimeFormatOptions>> = {
  ...POINT_FORMATS,
  month: { month: "short", year: "numeric" },
}

function dateFormat(locale: string, options: Intl.DateTimeFormatOptions) {
  // UTC because `start` is the wall clock already: see "Dates carry their own precision".
  return getDateTimeFormat(locale, { ...options, timeZone: "UTC" })
}

interface FormatOptions {
  locale: string
  labels?: Partial<TimelineLabels>
  timeZone?: string
}

function formatPoint(point: TimelinePoint, locale: string, labels: TimelineLabels): string {
  const integer = getNumberFormat(locale, { useGrouping: false })
  switch (point.precision) {
    case "quarter":
      return labels.quarter(integer.format(Math.ceil(point.month / 3)), integer.format(point.year))
    case "week":
      return labels.week(integer.format(point.week), integer.format(point.weekYear))
    default:
      return dateFormat(locale, POINT_FORMATS[point.precision] ?? {}).format(point.start)
  }
}

/** A range split where its two dates meet, so each half can be its own `<time>`. */
interface RangeText {
  start: string
  separator: string
  end: string
}

const SEPARATOR = " – "

function rangeText(
  start: TimelinePoint,
  end: TimelinePoint | "present",
  locale: string,
  labels: TimelineLabels,
): RangeText | string {
  const from = formatPoint(start, locale, labels)
  if (end === "present") return { start: from, separator: SEPARATOR, end: labels.present }
  if (end.precision === start.precision && end.start === start.start) return from

  const options = RANGE_FORMATS[start.precision]
  if (end.precision === start.precision && options) {
    // `formatRangeToParts` shares what the two ends have in common ("Mar – Jun
    // 2024"). Everything up to the last part of the start and everything from
    // the first part of the end is kept with its own date.
    const parts = dateFormat(locale, options).formatRangeToParts(start.start, end.start)
    const lastStart = parts.map((part) => part.source).lastIndexOf("startRange")
    const firstEnd = parts.findIndex((part) => part.source === "endRange")
    if (lastStart >= 0 && firstEnd > lastStart) {
      const join = (from: number, to?: number) =>
        parts
          .slice(from, to)
          .map((part) => part.value)
          .join("")
      return {
        start: join(0, lastStart + 1),
        separator: join(lastStart + 1, firstEnd),
        end: join(firstEnd),
      }
    }
  }
  return { start: from, separator: SEPARATOR, end: formatPoint(end, locale, labels) }
}

/** The label a timeline renders for one date, at the date's own precision. */
export function formatTimelineDate(input: TimelineDateInput, options: FormatOptions): string {
  const labels = labelsFor(options.locale, options.labels)
  return formatPoint(parseTimelineDate(input, options.timeZone), options.locale, labels)
}

/** The label a timeline renders for a range: "2019 – 2022", "Mar – Jun 2024", "2023 – present". */
export function formatTimelineRange(
  start: TimelineDateInput,
  end: TimelineRangeEnd,
  options: FormatOptions,
): string {
  const labels = labelsFor(options.locale, options.labels)
  const text = rangeText(
    parseTimelineDate(start, options.timeZone),
    end === "present" ? "present" : parseTimelineDate(end, options.timeZone),
    options.locale,
    labels,
  )
  return typeof text === "string" ? text : `${text.start}${text.separator}${text.end}`
}

/** "last year", "in 3 weeks", "yesterday" — in the unit of the date's own precision. */
export function formatTimelineRelative(
  point: TimelinePoint,
  now: TimelinePoint,
  locale: string,
): string {
  const rtf = getRelativeTimeFormat(locale, { numeric: "auto" })
  const ref = atPrecision(now, point.precision)
  switch (point.precision) {
    case "year":
      return rtf.format(point.year - ref.year, "year")
    case "quarter":
      return rtf.format(
        point.year * 4 + Math.ceil(point.month / 3) - (ref.year * 4 + Math.ceil(ref.month / 3)),
        "quarter",
      )
    case "month":
      return rtf.format(point.year * 12 + point.month - (ref.year * 12 + ref.month), "month")
    case "week":
      return rtf.format(Math.round((point.start - ref.start) / (7 * DAY)), "week")
    case "day":
      return rtf.format(Math.round((point.start - ref.start) / DAY), "day")
    case "datetime": {
      const minutes = Math.round((point.start - ref.start) / 60_000)
      if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute")
      if (Math.abs(minutes) < 24 * 60) return rtf.format(Math.round(minutes / 60), "hour")
      const days = Math.round(
        (atPrecision(point, "day").start - atPrecision(ref, "day").start) / DAY,
      )
      return rtf.format(days, "day")
    }
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export type TimelineOrientation = "vertical" | "horizontal"
/**
 * Where the content sits relative to the axis. `end` (the default) is after it
 * — right of a vertical axis, below a horizontal one; `start` is before it;
 * `alternating` flips per item; `opposite` puts the date on one side and the
 * content on the other.
 */
export type TimelinePlacement = "start" | "end" | "alternating" | "opposite"
export type TimelineDensity = "compact" | "comfortable"
/** `dashed` is for what is planned, uncertain or not yet reached. */
export type TimelineConnector = "solid" | "dashed" | "none"
export type TimelineTone = "neutral" | "brand" | "success" | "warning" | "danger" | "muted"

interface TimelineContextValue {
  orientation: TimelineOrientation
  placement: TimelinePlacement
  density: TimelineDensity
  connector: TimelineConnector
  locale: string
  timeZone: string
  labels: TimelineLabels
  relative: boolean
  /** The reference for relative labels: the caller's `now`, or the clock after mount. */
  now: TimelinePoint | null
  /** The caller's `now` only — what decides which spans are future. */
  boundary: TimelinePoint | null
  order: "asc" | "desc" | undefined
}

const TimelineContext = createContext<TimelineContextValue | null>(null)

function useTimeline(part: string): TimelineContextValue {
  const context = use(TimelineContext)
  if (!context) throw new Error(`${part} must be used within a Timeline`)
  return context
}

/** Where one child sits in the list, worked out by the list rather than the child. */
interface Slot {
  index: number
  isLast: boolean
  /** The span from this item to the next reaches past `now`. */
  isFuture: boolean
  /** More items are folded away below this one. */
  trailing: boolean
}

const SlotContext = createContext<Slot | null>(null)

const ItemContext = createContext<{ tone: TimelineTone; isCurrent: boolean }>({
  tone: "neutral",
  isCurrent: false,
})

// ---------------------------------------------------------------------------
// Children as entries
// ---------------------------------------------------------------------------

interface DatedProps {
  date?: TimelineDateInput
  start?: TimelineDateInput
  end?: TimelineRangeEnd
}

interface Entry {
  element: ReactElement<DatedProps>
  start: TimelinePoint | null
  end: TimelinePoint | "present" | null
}

function toEntries(children: ReactNode, context: TimelineContextValue): Entry[] {
  const entries = Children.toArray(children)
    .filter((child): child is ReactElement<DatedProps> => isValidElement(child))
    .map((element): Entry => {
      const first =
        element.props.start ??
        element.props.date ??
        (element.type === TimelineNow && context.boundary ? context.boundary : undefined)
      const start =
        first === undefined
          ? null
          : typeof first === "object" && "dateTime" in first
            ? first
            : parseTimelineDate(first, context.timeZone)
      const last = element.props.end
      const end: Entry["end"] =
        last === undefined
          ? null
          : last === "present"
            ? "present"
            : parseTimelineDate(last, context.timeZone)
      return { element, start, end }
    })
  if (!context.order) return entries
  // Undated children have nowhere to go in a sorted list, so they go last.
  const direction = context.order === "desc" ? -1 : 1
  return [...entries].sort((a, b) => {
    if (!a.start || !b.start) return a.start ? -1 : b.start ? 1 : 0
    return (a.start.start - b.start.start) * direction
  })
}

/** The latest moment an entry touches, for deciding whether a span is still ahead. */
function latest(entry: Entry | undefined, now: TimelinePoint | null): number | null {
  if (!entry?.start) return null
  if (entry.end === "present") return now?.start ?? entry.start.start
  return entry.end ? entry.end.start : entry.start.start
}

function slotted(entries: Entry[], context: TimelineContextValue, offset = 0, trailing = false) {
  return entries.map((entry, index) => {
    const here = latest(entry, context.boundary)
    const next = latest(entries[index + 1], context.boundary)
    const isLast = index === entries.length - 1
    const isFuture =
      !isLast &&
      context.boundary !== null &&
      here !== null &&
      next !== null &&
      Math.max(here, next) > context.boundary.start
    return (
      <SlotContext
        key={entry.element.key}
        value={{ index: offset + index, isLast, isFuture, trailing: isLast && trailing }}
      >
        {entry.element}
      </SlotContext>
    )
  })
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

/** Column templates for the vertical list; items take them over through `subgrid`. */
const VERTICAL_COLUMNS: Record<TimelinePlacement, string> = {
  end: "grid-cols-[auto_minmax(0,1fr)]",
  start: "grid-cols-[minmax(0,1fr)_auto]",
  opposite: "grid-cols-[auto_minmax(0,1fr)] @xl:grid-cols-[auto_auto_minmax(0,1fr)]",
  alternating:
    "grid-cols-[auto_minmax(0,1fr)] @xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]",
}

interface ItemLayout {
  /** The date has a cell of its own rather than sitting at the top of the content. */
  split: boolean
  /** `end` right-aligns always; `end-wide` only once the two-sided layout applies. */
  align: "start" | "end" | "end-wide"
  item: string
  axis: string
  time: string
  body: string
}

function itemLayout(orientation: TimelineOrientation, placement: TimelinePlacement, index: number) {
  const flipped = placement === "alternating" && index % 2 === 1
  const split = placement === "alternating" || placement === "opposite"

  if (orientation === "horizontal") {
    const above = "row-start-1 self-end pb-3"
    const below = "row-start-3 pt-3"
    return {
      split,
      align: "start",
      item: "row-span-3 grid snap-start grid-rows-subgrid",
      axis: "row-start-2 flex items-center",
      time: cn("pe-6", flipped ? below : above),
      body: cn("pe-6", placement === "start" || flipped ? above : below),
    } satisfies ItemLayout
  }

  const base = {
    item: "col-span-full grid grid-cols-subgrid grid-rows-[auto_1fr]",
    axis: "row-start-1 row-end-3 flex flex-col items-center",
  }
  if (placement === "end") {
    return {
      ...base,
      split,
      align: "start",
      axis: cn(base.axis, "col-start-1"),
      time: "",
      body: "col-start-2 row-start-1 row-end-3",
    } satisfies ItemLayout
  }
  if (placement === "start") {
    return {
      ...base,
      split,
      align: "end",
      axis: cn(base.axis, "col-start-2"),
      time: "",
      body: "col-start-1 row-start-1 row-end-3 text-end",
    } satisfies ItemLayout
  }
  // Two-sided: below `@xl` this is the `end` layout with the date in a row of
  // its own above the content; from `@xl` on the date crosses the axis.
  return {
    ...base,
    split,
    align: flipped ? "end-wide" : "start",
    axis: cn(base.axis, "col-start-1 @xl:col-start-2"),
    time: cn(
      "col-start-2 row-start-1",
      flipped ? "@xl:col-start-3" : "@xl:col-start-1 @xl:row-end-3 @xl:text-end",
    ),
    body: cn(
      "col-start-2 row-start-2 @xl:row-start-1 @xl:row-end-3",
      flipped ? "@xl:col-start-1 @xl:text-end" : "@xl:col-start-3",
    ),
  } satisfies ItemLayout
}

/**
 * A marker taller than the first line of text (a 24–40px disc or avatar) is
 * centred on its row, so the text beside it moves down by half the difference
 * and the first line stays level with the marker's centre.
 */
const DISC_OFFSET = [
  "group-has-[[data-disc=sm]]/timeline-item:pt-0.5",
  "group-has-[[data-disc=md]]/timeline-item:pt-1.5",
  "group-has-[[data-disc=lg]]/timeline-item:pt-2.5",
]

/** Flex rows inside the content follow the text to the end side when it is there. */
const FLEX_ALIGN =
  "group-data-[align=end]/timeline-item:justify-end @xl:group-data-[align=end-wide]/timeline-item:justify-end"

/**
 * Marks are ink. `brand` is the action fill — the item the reader is on —
 * `neutral` is ink, `muted` the subtle grey; the three state tokens are for an
 * item whose state is the point (delivered, delayed, failed).
 */
const DOT_TONES: Record<TimelineTone, string> = {
  neutral: "bg-quebi-fg",
  brand: "bg-quebi-action",
  success: "bg-quebi-success",
  warning: "bg-quebi-warn",
  danger: "bg-quebi-danger",
  muted: "bg-quebi-fg-subtle",
}

const RING_TONES: Record<TimelineTone, string> = {
  neutral: "border-quebi-rule",
  brand: "border-quebi-action",
  success: "border-quebi-success",
  warning: "border-quebi-warn",
  danger: "border-quebi-danger",
  muted: "border-quebi-fg-subtle",
}

/**
 * Icon and number markers are discs: the raised ground for `neutral`, the
 * action fill for `brand`, a hairline ring for `muted`, and a state token's own
 * tint for the three states.
 */
const TINT_TONES: Record<TimelineTone, string> = {
  neutral: "border-quebi-hairline bg-quebi-raised text-quebi-fg",
  brand: "border-quebi-action bg-quebi-action text-quebi-on-action",
  success: "border-quebi-success/20 bg-quebi-success/10 text-quebi-success",
  warning: "border-quebi-warn/20 bg-quebi-warn/10 text-quebi-warn",
  danger: "border-quebi-danger/20 bg-quebi-danger/10 text-quebi-danger",
  muted: "border-quebi-hairline bg-transparent text-quebi-fg-subtle",
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

/** One item as data, for `items`. Builds the same `TimelineItem` children would. */
export interface TimelineItemData extends DatedProps {
  id: string
  title: ReactNode
  description?: ReactNode
  /** A line of small print under the title: an author, a version, a place. */
  meta?: ReactNode
  /** Badges, or anything else that belongs in a row beside the meta. */
  badges?: ReactNode
  /** Makes the title a link. */
  href?: string
  tone?: TimelineTone
  isCurrent?: boolean
  connector?: TimelineConnector
  /** Marker shorthands; `marker` wins over `icon`, which wins over `avatar` and `number`. */
  marker?: ReactNode
  icon?: ReactNode
  avatar?: { src?: string; initials?: string; alt?: string }
  number?: number | string
  /** Folded behind a "Details" disclosure. */
  details?: ReactNode
  /** Anything else, after the description. */
  content?: ReactNode
}

export interface TimelineProps extends Omit<React.ComponentProps<"ol">, "children"> {
  children?: ReactNode
  /** Items as data; used instead of `children`. */
  items?: TimelineItemData[]
  orientation?: TimelineOrientation
  placement?: TimelinePlacement
  density?: TimelineDensity
  /** `sequential` spaces items evenly; `proportional` places them on a time axis. */
  spacing?: "sequential" | "proportional"
  /** Sort by date — `desc` is newest first. Without it, children keep the order written. */
  order?: "asc" | "desc"
  /** Sticky headers per year, month or day. Vertical, sequential timelines only. */
  groupBy?: "year" | "month" | "day"
  /** Show the first N items and fold the rest behind a "Show N more" toggle. */
  collapseAfter?: number
  /** The default connector. A span that reaches past `now` is `dashed` regardless. */
  connector?: TimelineConnector
  /** The present moment. Never read from the clock during render — see the component docs. */
  now?: TimelineDateInput
  /** Render point dates as "3 days ago", with the absolute date in the tooltip. */
  relative?: boolean
  /** BCP 47 locale. Defaults to the one react-aria resolves. */
  locale?: string
  /** Time zone that `Date`s and timestamps are read in. Strings do not need one. */
  timeZone?: string
  labels?: Partial<TimelineLabels>
  /** What to render when there are no items. */
  emptyState?: ReactNode
}

export function Timeline({
  children,
  items,
  orientation = "vertical",
  placement = "end",
  density = "comfortable",
  spacing = "sequential",
  order,
  groupBy,
  collapseAfter,
  connector = "solid",
  now,
  relative = false,
  locale: localeProp,
  timeZone = DEFAULT_TIME_ZONE,
  labels: labelOverrides,
  emptyState,
  className,
  ...props
}: TimelineProps) {
  const { locale: ariaLocale } = useLocale()
  const locale = localeProp ?? ariaLocale
  const [expanded, setExpanded] = useState(false)

  // "3 days ago" needs a clock, and a clock read during render is a different
  // answer in the prerender and in the browser. Picked up after mount instead.
  const [mountedNow, setMountedNow] = useState<number | null>(null)
  useEffect(() => {
    if (relative && now === undefined) setMountedNow(Date.now())
  }, [relative, now])

  const nowPoint =
    now !== undefined
      ? parseTimelineDate(now, timeZone)
      : mountedNow !== null
        ? parseTimelineDate(mountedNow, timeZone)
        : null

  const context: TimelineContextValue = {
    orientation: spacing === "proportional" ? "horizontal" : orientation,
    placement,
    density,
    connector,
    locale,
    timeZone,
    labels: labelsFor(locale, labelOverrides),
    relative,
    now: nowPoint,
    // Only a `now` the caller gave decides what is future: a clock picked up
    // after mount would redraw the connectors after hydration.
    boundary: now !== undefined ? nowPoint : null,
    order,
  }

  const entries = toEntries(items ? items.map(itemFromData) : children, context)

  if (entries.length === 0) {
    return (
      <div
        data-slot="timeline-empty"
        className={cn(
          "border border-dashed border-quebi-hairline px-4 py-6 text-center text-quebi-body-s text-quebi-fg-muted",
          className,
        )}
      >
        {emptyState ?? context.labels.empty}
      </div>
    )
  }

  if (spacing === "proportional") {
    return (
      <TimelineContext value={context}>
        <ProportionalTimeline entries={entries} className={className} {...props} />
      </TimelineContext>
    )
  }

  const isCollapsed = collapseAfter !== undefined && !expanded && entries.length > collapseAfter
  const visible = isCollapsed ? entries.slice(0, collapseAfter) : entries
  const hidden = entries.length - visible.length

  const slots = slotted(visible, context, 0, isCollapsed)
  // Slots are worked out over the whole list, so the line and its future
  // dashing run on across group headings rather than restarting under each.
  const listItems =
    groupBy && context.orientation === "vertical"
      ? groupRuns(visible, groupBy).map((run) => (
          <GroupShell
            key={run.key}
            label={run.label ? formatPoint(run.label, locale, context.labels) : null}
          >
            {slots.slice(run.offset, run.offset + run.entries.length)}
          </GroupShell>
        ))
      : slots

  const list = (
    <ol
      data-slot="timeline-list"
      data-orientation={context.orientation}
      data-placement={placement}
      {...props}
      className={cn(
        "grid",
        context.orientation === "vertical"
          ? [VERTICAL_COLUMNS[placement], density === "compact" ? "gap-x-3" : "gap-x-4"]
          : [
              "w-max grid-flow-col grid-rows-[auto_auto_auto]",
              density === "compact" ? "auto-cols-[11rem]" : "auto-cols-[15rem]",
            ],
      )}
    >
      {listItems}
    </ol>
  )

  return (
    <TimelineContext value={context}>
      <div
        data-slot="timeline"
        data-density={density}
        className={cn("@container flex min-w-0 flex-col", className)}
      >
        {context.orientation === "horizontal" ? (
          <ScrollArea
            orientation="horizontal"
            scrollFade
            // A focusable region, so the arrow keys scroll it for a keyboard user.
            tabIndex={0}
            role="region"
            aria-label={props["aria-label"] ?? "Timeline"}
            className="snap-x snap-proximity pb-3 focus-visible:ring-2 focus-visible:ring-quebi-focus focus-visible:ring-inset"
          >
            {list}
          </ScrollArea>
        ) : (
          list
        )}
        {collapseAfter !== undefined && entries.length > collapseAfter ? (
          <ShowMore className="mt-5" isSelected={expanded} onChange={setExpanded}>
            {expanded
              ? context.labels.showLess
              : context.labels.showMore(getNumberFormat(locale).format(hidden))}
          </ShowMore>
        ) : null}
      </div>
    </TimelineContext>
  )
}

function groupRuns(entries: Entry[], groupBy: "year" | "month" | "day") {
  const runs: { key: string; label: TimelinePoint | null; offset: number; entries: Entry[] }[] = []
  entries.forEach((entry, index) => {
    const label = entry.start ? atPrecision(entry.start, groupBy) : null
    const key = label?.dateTime ?? runs.at(-1)?.key ?? "undated"
    const run = runs.at(-1)
    if (run && run.key === key) run.entries.push(entry)
    else runs.push({ key, label, offset: index, entries: [entry] })
  })
  return runs
}

function itemFromData(data: TimelineItemData): ReactElement<DatedProps> {
  const marker =
    data.marker ??
    (data.icon ? (
      <TimelineMarker icon={data.icon} />
    ) : data.avatar ? (
      <TimelineMarker {...data.avatar} />
    ) : data.number !== undefined ? (
      <TimelineMarker number={data.number} />
    ) : undefined)
  return (
    <TimelineItem
      key={data.id}
      date={data.date}
      start={data.start}
      end={data.end}
      tone={data.tone}
      isCurrent={data.isCurrent}
      connector={data.connector}
      marker={marker}
    >
      <TimelineTitle href={data.href}>{data.title}</TimelineTitle>
      {data.meta || data.badges ? (
        <TimelineMeta>
          {data.meta}
          {data.badges}
        </TimelineMeta>
      ) : null}
      {data.description ? <TimelineDescription>{data.description}</TimelineDescription> : null}
      {data.content}
      {data.details ? <TimelineDetails>{data.details}</TimelineDetails> : null}
    </TimelineItem>
  )
}

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

export interface TimelineItemProps extends Omit<React.ComponentProps<"li">, "children">, DatedProps {
  /** Replaces the rendered date label. The date props still place and sort the item. */
  time?: ReactNode
  tone?: TimelineTone
  /** Replaces the default dot — usually a `TimelineMarker` with an icon, avatar or number. */
  marker?: ReactNode
  /** The connector from this item to the next. */
  connector?: TimelineConnector
  /** The item the timeline is at: `aria-current`, and a pulsing marker. */
  isCurrent?: boolean
  children?: ReactNode
}

export function TimelineItem({
  date,
  start,
  end,
  time,
  tone = "neutral",
  marker,
  connector,
  isCurrent = false,
  className,
  children,
  ...props
}: TimelineItemProps) {
  const context = useTimeline("TimelineItem")
  const slot = use(SlotContext) ?? { index: 0, isLast: true, isFuture: false, trailing: false }
  const layout = itemLayout(context.orientation, context.placement, slot.index)
  const vertical = context.orientation === "vertical"
  const line = connector ?? (slot.isFuture ? "dashed" : context.connector)
  const hasDate = (start ?? date) !== undefined
  const timeNode = time ?? (hasDate ? <TimelineTime date={date} start={start} end={end} /> : null)
  const compact = context.density === "compact"

  return (
    <ItemContext value={{ tone, isCurrent }}>
      <li
        {...props}
        data-slot="timeline-item"
        data-align={layout.align}
        data-current={isCurrent || undefined}
        aria-current={isCurrent || undefined}
        className={cn("group/timeline-item", layout.item, className)}
      >
        <div data-slot="timeline-axis" aria-hidden="true" className={layout.axis}>
          <span
            className={cn("flex shrink-0 items-center justify-center", vertical ? "min-h-5" : "min-w-5")}
          >
            {marker ?? <TimelineMarker />}
          </span>
          {!slot.isLast || slot.trailing ? (
            <span
              data-slot="timeline-connector"
              data-connector={line}
              className={cn(
                "flex-1 border-quebi-hairline",
                vertical ? "my-1 min-h-3 w-0 border-s" : "mx-1 h-0 min-w-3 border-t",
                line === "dashed" && "border-dashed",
                line === "none" && "border-transparent",
                slot.trailing &&
                  (vertical
                    ? "[mask-image:linear-gradient(to_bottom,black,transparent)]"
                    : "[mask-image:linear-gradient(to_right,black,transparent)]"),
              )}
            />
          ) : null}
        </div>
        {layout.split && timeNode ? (
          <div
            data-slot="timeline-time-cell"
            className={cn(
              "font-mono text-xs/5 text-quebi-fg-subtle tabular-nums",
              vertical && DISC_OFFSET,
              layout.time,
            )}
          >
            {timeNode}
          </div>
        ) : null}
        <div
          data-slot="timeline-body"
          className={cn(
            "flex min-w-0 flex-col",
            compact ? "gap-0.5" : "gap-1",
            layout.body,
            vertical && DISC_OFFSET,
            vertical && !slot.isLast && (compact ? "pb-4" : "pb-7"),
            vertical && slot.isLast && slot.trailing && "pb-4",
          )}
        >
          {!layout.split && timeNode ? (
            <div
              data-slot="timeline-time-cell"
              className={cn(
                "font-mono text-xs/5 text-quebi-fg-subtle tabular-nums",
              )}
            >
              {timeNode}
            </div>
          ) : null}
          {children}
        </div>
      </li>
    </ItemContext>
  )
}

export interface TimelineMarkerProps extends Omit<React.ComponentProps<"span">, "children"> {
  /** A plain marker's shape: a filled dot or a hollow ring. */
  variant?: "dot" | "ring"
  size?: "sm" | "md" | "lg"
  /** Defaults to the item's tone. */
  tone?: TimelineTone
  icon?: ReactNode
  /** Avatar image; `initials` is the fallback. */
  src?: string
  initials?: string
  alt?: string
  number?: number | string
  /** Defaults to the item's `isCurrent`. Dropped under reduced motion. */
  pulse?: boolean
  /** A custom node, drawn as given. */
  children?: ReactNode
}

const DOT_SIZES = { sm: "size-2", md: "size-3", lg: "size-4" }
const DISC_SIZES = { sm: "size-6 text-xs [&_svg]:size-3.5", md: "size-8 text-sm [&_svg]:size-4", lg: "size-10 text-base [&_svg]:size-5" }
const AVATAR_SIZES = { sm: "sm", md: "md", lg: "lg" } as const

export function TimelineMarker({
  variant = "dot",
  size: sizeProp,
  tone: toneProp,
  icon,
  src,
  initials,
  alt,
  number,
  pulse,
  children,
  className,
  ...props
}: TimelineMarkerProps) {
  const item = use(ItemContext)
  const context = use(TimelineContext)
  const tone = toneProp ?? item.tone
  const size = sizeProp ?? (context?.density === "compact" ? "sm" : "md")
  const isPulsing = pulse ?? item.isCurrent

  const kind = children
    ? "custom"
    : icon
      ? "icon"
      : src || initials
        ? "avatar"
        : number !== undefined
          ? "number"
          : variant

  const body =
    kind === "custom" ? (
      children
    ) : kind === "avatar" ? (
      <Avatar src={src} initials={initials} alt={alt} size={AVATAR_SIZES[size]} />
    ) : kind === "icon" || kind === "number" ? (
      <span
        className={cn(
          "flex items-center justify-center rounded-full border font-mono tabular-nums",
          DISC_SIZES[size],
          TINT_TONES[tone],
        )}
      >
        {kind === "icon" ? icon : number}
      </span>
    ) : (
      <span
        className={cn(
          "block rounded-full forced-colors:outline forced-colors:outline-1",
          DOT_SIZES[size],
          kind === "ring" ? ["border bg-quebi-bg", RING_TONES[tone]] : DOT_TONES[tone],
        )}
      />
    )

  return (
    <span
      {...props}
      data-slot="timeline-marker"
      data-kind={kind}
      data-disc={kind === "icon" || kind === "number" || kind === "avatar" ? size : undefined}
      data-tone={tone}
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
    >
      {isPulsing ? (
        <span
          data-slot="timeline-marker-pulse"
          className={cn(
            "absolute inset-0 animate-ping rounded-full opacity-60 motion-reduce:hidden",
            DOT_TONES[tone],
          )}
        />
      ) : null}
      <span className="relative inline-flex">{body}</span>
    </span>
  )
}

export interface TimelineTimeProps extends DatedProps {
  className?: string
}

/** The date label of an item, as `<time>` elements. `TimelineItem` renders it for you. */
export function TimelineTime({ date, start, end, className }: TimelineTimeProps) {
  const context = useTimeline("TimelineTime")
  const first = start ?? date
  if (first === undefined) return null
  const from = parseTimelineDate(first, context.timeZone)

  if (end === undefined) {
    const absolute = formatPoint(from, context.locale, context.labels)
    const showRelative = context.relative && context.now
    return (
      <time
        dateTime={from.dateTime}
        title={showRelative ? absolute : undefined}
        className={className}
      >
        {showRelative && context.now
          ? formatTimelineRelative(from, context.now, context.locale)
          : absolute}
      </time>
    )
  }

  const to = end === "present" ? "present" : parseTimelineDate(end, context.timeZone)
  const text = rangeText(from, to, context.locale, context.labels)
  if (typeof text === "string") {
    return (
      <time dateTime={from.dateTime} className={className}>
        {text}
      </time>
    )
  }
  return (
    <span data-slot="timeline-range" className={className}>
      <time dateTime={from.dateTime}>{text.start}</time>
      {text.separator}
      {to === "present" ? text.end : <time dateTime={to.dateTime}>{text.end}</time>}
    </span>
  )
}

export interface TimelineTitleProps extends React.ComponentProps<"div"> {
  /** Makes the title a library `Link`. */
  href?: string
}

export function TimelineTitle({ href, className, children, ...props }: TimelineTitleProps) {
  return (
    <div
      {...props}
      data-slot="timeline-title"
      className={cn("font-display text-base/5 font-light tracking-wide text-quebi-fg", className)}
    >
      {href ? (
        <Link href={href} className="no-underline hover:underline">
          {children}
        </Link>
      ) : (
        children
      )}
    </div>
  )
}

export function TimelineDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      {...props}
      data-slot="timeline-description"
      className={cn("text-quebi-body-s text-quebi-fg-muted", className)}
    />
  )
}

/** Small print in a row: an author, a version, badges. */
export function TimelineMeta({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      {...props}
      data-slot="timeline-meta"
      className={cn(
        "flex flex-wrap items-center gap-x-2 gap-y-1 text-quebi-caption text-quebi-fg-subtle",
        FLEX_ALIGN,
        className,
      )}
    />
  )
}

/** Detail folded behind a plain `Disclosure`, for an item worth expanding. */
export function TimelineDetails({
  label,
  children,
  className,
}: {
  label?: ReactNode
  children: ReactNode
  className?: string
}) {
  const context = useTimeline("TimelineDetails")
  return (
    <Disclosure
      variant="plain"
      className={cn(
        "w-auto self-start",
        "group-data-[align=end]/timeline-item:self-end @xl:group-data-[align=end-wide]/timeline-item:self-end",
        className,
      )}
    >
      <DisclosureTrigger className="w-auto px-0">{label ?? context.labels.details}</DisclosureTrigger>
      <DisclosurePanel>
        <div className="pb-1">{children}</div>
      </DisclosurePanel>
    </Disclosure>
  )
}

export interface TimelineNowProps extends Omit<TimelineItemProps, "marker" | "tone" | "start" | "end"> {
  /** Defaults to the timeline's `labels.now`. */
  label?: ReactNode
}

/**
 * The present, between the items either side of it. With `order` set it is
 * sorted into place by the timeline's `now` (or its own `date`).
 */
export function TimelineNow({ label, date, time, children, ...props }: TimelineNowProps) {
  const context = useTimeline("TimelineNow")
  const vertical = context.orientation === "vertical"
  return (
    <TimelineItem
      {...props}
      data-now=""
      date={date}
      time={time}
      marker={
        <span
          className={cn(
            "bg-quebi-action",
            vertical ? "h-0.5 w-5" : "h-5 w-0.5",
          )}
        />
      }
    >
      <span className="quebi-eyebrow text-quebi-fg">{label ?? context.labels.now}</span>
      {children}
    </TimelineItem>
  )
}

export interface TimelineGroupProps extends Omit<React.ComponentProps<"li">, "children"> {
  /** The sticky heading: "2024", "March 2024". */
  label: ReactNode
  /** Places the group when the timeline is sorted. */
  date?: TimelineDateInput
  headingLevel?: 2 | 3 | 4 | 5 | 6
  children?: ReactNode
}

/** A run of items under a sticky heading. `groupBy` builds these for you. */
export function TimelineGroup({ label, date: _date, children, ...props }: TimelineGroupProps) {
  const context = useTimeline("TimelineGroup")
  return (
    <GroupShell label={label} {...props}>
      {slotted(toEntries(children, context), context)}
    </GroupShell>
  )
}

function GroupShell({
  label,
  headingLevel = 3,
  className,
  children,
  ...props
}: Omit<TimelineGroupProps, "date">) {
  const context = useTimeline("TimelineGroup")
  const Heading = `h${headingLevel}` as const
  if (context.orientation === "horizontal") {
    // A horizontal list has no room for a heading row; the name stays for a reader.
    return (
      <li {...props} data-slot="timeline-group" className={cn("contents", className)}>
        <Heading className="sr-only">{label}</Heading>
        <ol className="contents">{children}</ol>
      </li>
    )
  }
  return (
    <li
      {...props}
      data-slot="timeline-group"
      className={cn("col-span-full grid grid-cols-subgrid", className)}
    >
      {label ? (
        <Heading
          data-slot="timeline-group-heading"
          className="quebi-eyebrow sticky top-0 z-10 col-span-full bg-quebi-bg py-2 text-quebi-fg-muted"
        >
          {label}
        </Heading>
      ) : null}
      <ol className="col-span-full grid grid-cols-subgrid">{children}</ol>
    </li>
  )
}

// ---------------------------------------------------------------------------
// Proportional spacing
// ---------------------------------------------------------------------------

type TickUnit = "year" | "month" | "week" | "day"

const UNIT_MS: Record<TickUnit, number> = {
  year: 365.25 * DAY,
  month: 30.44 * DAY,
  week: 7 * DAY,
  day: DAY,
}
/** Pixels per unit: enough for a tick label, and the scale of everything else. */
const UNIT_PX: Record<TickUnit, number> = { year: 96, month: 64, week: 56, day: 36 }
/** A gap longer than this many units, with no range across it, is compressed. */
const GAP_UNITS = 5
const BREAK_PX = 40
const LABEL_PX = { compact: 128, comfortable: 176 }
const MIN_TICK_SPACING = 40

function unitFor(span: number): TickUnit {
  if (span > 4 * UNIT_MS.year) return "year"
  if (span > 5 * UNIT_MS.month) return "month"
  if (span > 4 * UNIT_MS.week) return "week"
  return "day"
}

function floorTo(ms: number, unit: TickUnit): number {
  const c = componentsOf(ms)
  if (unit === "year") return Date.UTC(c.year, 0, 1)
  if (unit === "month") return Date.UTC(c.year, c.month - 1, 1)
  if (unit === "week") return atPrecision(pointFrom("day", c), "week").start
  return Date.UTC(c.year, c.month - 1, c.day)
}

function stepFrom(ms: number, unit: TickUnit): number {
  const c = componentsOf(ms)
  if (unit === "year") return Date.UTC(c.year + 1, 0, 1)
  if (unit === "month") return Date.UTC(c.year, c.month, 1)
  return ms + (unit === "week" ? 7 : 1) * DAY
}

interface Segment {
  from: number
  to: number
  x: number
  width: number
  compressed: boolean
}

/**
 * Time to pixels, piecewise: linear everywhere except across a long empty
 * stretch, which gets `BREAK_PX` whatever its length.
 */
export function buildTimeScale(
  intervals: { start: number; end: number }[],
  domain: { start: number; end: number },
  unit: TickUnit,
) {
  const pxPerMs = UNIT_PX[unit] / UNIT_MS[unit]
  const boundaries = [
    ...new Set([domain.start, domain.end, ...intervals.flatMap((i) => [i.start, i.end])]),
  ]
    .filter((b) => b >= domain.start && b <= domain.end)
    .sort((a, b) => a - b)
  const segments: Segment[] = []
  let x = 0
  for (let i = 0; i < boundaries.length - 1; i++) {
    const from = boundaries[i] as number
    const to = boundaries[i + 1] as number
    const covered = intervals.some((range) => range.end - range.start > 0 && range.start <= from && range.end >= to)
    const compressed = !covered && to - from > GAP_UNITS * UNIT_MS[unit]
    const width = compressed ? BREAK_PX : (to - from) * pxPerMs
    segments.push({ from, to, x, width, compressed })
    x += width
  }
  const at = (ms: number) => {
    const segment =
      segments.find((s) => ms >= s.from && ms <= s.to) ??
      (ms < domain.start ? segments[0] : segments.at(-1))
    if (!segment) return 0
    if (segment.compressed) return segment.x + (ms <= segment.from ? 0 : segment.width)
    return segment.x + ((ms - segment.from) / (segment.to - segment.from || 1)) * segment.width
  }
  return { at, segments, width: x }
}

/** Greedy lanes: each item goes in the first lane whose last item ends before it starts. */
export function assignLanes(extents: { x: number; right: number }[]): number[] {
  const laneEnds: number[] = []
  return extents.map(({ x, right }) => {
    const lane = laneEnds.findIndex((laneEnd) => laneEnd <= x)
    const index = lane === -1 ? laneEnds.length : lane
    laneEnds[index] = right
    return index
  })
}

function ProportionalTimeline({
  entries: allEntries,
  className,
  ...props
}: { entries: Entry[] } & Omit<TimelineProps, "children" | "items">) {
  const context = useTimeline("Timeline")
  // The axis draws its own "now", so a `TimelineNow` has nothing to add here.
  const entries = allEntries
    .filter((entry): entry is Entry & { start: TimelinePoint } => entry.start !== null)
    .filter((entry) => entry.element.type !== TimelineNow)
    .sort((a, b) => a.start.start - b.start.start)

  const closed = entries.map((entry) =>
    entry.end && entry.end !== "present" ? entry.end.end : entry.start.start,
  )
  // An open range runs to `now`, or to the last thing the timeline knows of.
  const present = context.boundary?.start ?? Math.max(...closed)
  const intervals = entries.map((entry, index) => ({
    start: entry.start.start,
    end: entry.end === "present" ? Math.max(present, entry.start.end) : (closed[index] as number),
  }))
  const min = Math.min(...intervals.map((i) => i.start))
  const max = Math.max(...intervals.map((i) => i.end), context.boundary?.start ?? min)
  const unit = unitFor(max - min)
  const domain = { start: floorTo(min, unit), end: stepFrom(floorTo(max, unit), unit) }
  const scale = buildTimeScale(intervals, domain, unit)
  const labelPx = LABEL_PX[context.density]

  const placed = entries.map((entry, index) => {
    const interval = intervals[index] as { start: number; end: number }
    const x = scale.at(interval.start)
    const barWidth = entry.end ? Math.max(8, scale.at(interval.end) - x) : 0
    return { entry, x, barWidth, right: x + Math.max(barWidth, labelPx) + 12 }
  })
  const lanes = assignLanes(placed)

  const ticks: { x: number; label: string; key: number }[] = []
  for (let t = domain.start; t <= domain.end; t = stepFrom(t, unit)) {
    if (scale.segments.some((s) => s.compressed && t > s.from && t < s.to)) continue
    const x = scale.at(t)
    const previous = ticks.at(-1)
    if (previous && x - previous.x < MIN_TICK_SPACING) continue
    const c = componentsOf(t)
    const label =
      unit === "year" || (unit === "month" && c.month === 1)
        ? dateFormat(context.locale, { year: "numeric" }).format(t)
        : unit === "month"
          ? dateFormat(context.locale, { month: "short", year: ticks.length ? undefined : "numeric" }).format(t)
          : dateFormat(context.locale, { day: "numeric", month: "short" }).format(t)
    ticks.push({ x, label, key: t })
  }
  const width = scale.width + labelPx
  const nowX =
    context.boundary &&
    context.boundary.start >= domain.start &&
    context.boundary.start <= domain.end
      ? scale.at(context.boundary.start)
      : null

  return (
    <div
      data-slot="timeline"
      data-spacing="proportional"
      className={cn("flex min-w-0 flex-col", className)}
    >
      <ScrollArea
        orientation="horizontal"
        scrollFade
        tabIndex={0}
        role="region"
        aria-label={props["aria-label"] ?? "Timeline"}
        className="pb-3 focus-visible:ring-2 focus-visible:ring-quebi-focus focus-visible:ring-inset"
      >
        {/* The bottom padding is the "Now" label's row, clear of the tick labels. */}
        <div className={cn("relative", nowX !== null && "pb-6")} style={{ width }}>
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            {ticks.map((tick) => (
              <span
                key={tick.key}
                className="absolute top-6 bottom-0 border-s border-quebi-hairline"
                style={{ insetInlineStart: tick.x }}
              />
            ))}
            {scale.segments
              .filter((s) => s.compressed)
              .map((s) => (
                <span
                  key={s.from}
                  data-slot="timeline-break"
                  className="absolute top-0 bottom-0 border-x border-dashed border-quebi-hairline"
                  style={{ insetInlineStart: s.x + 6, width: s.width - 12 }}
                />
              ))}
            {nowX !== null ? (
              <span
                data-slot="timeline-now-line"
                className="absolute top-0 bottom-0 border-s-2 border-quebi-rule"
                style={{ insetInlineStart: nowX }}
              >
                <span className="quebi-eyebrow absolute bottom-0 ms-1.5 text-quebi-fg">
                  {context.labels.now}
                </span>
              </span>
            ) : null}
          </div>
          <div
            aria-hidden="true"
            data-slot="timeline-ticks"
            className="relative h-6 border-b border-quebi-hairline"
          >
            {ticks.map((tick) => (
              <span
                key={tick.key}
                className="absolute bottom-1 ps-1 font-mono text-xs whitespace-nowrap text-quebi-fg-subtle tabular-nums"
                style={{ insetInlineStart: tick.x }}
              >
                {tick.label}
              </span>
            ))}
          </div>
          <ol
            data-slot="timeline-list"
            data-orientation="horizontal"
            {...props}
            className="relative grid gap-y-3 pt-3"
          >
            {placed.map(({ entry, x, barWidth }, index) => (
              <ProportionalItem
                key={entry.element.key}
                entry={entry}
                lane={lanes[index] ?? 0}
                x={x}
                barWidth={barWidth}
                labelPx={labelPx}
              />
            ))}
          </ol>
        </div>
      </ScrollArea>
    </div>
  )
}

function ProportionalItem({
  entry,
  lane,
  x,
  barWidth,
  labelPx,
}: {
  entry: Entry
  lane: number
  x: number
  barWidth: number
  labelPx: number
}) {
  const props = entry.element.props as TimelineItemProps
  const tone = props.tone ?? "neutral"
  const isRange = props.end !== undefined
  return (
    <li
      data-slot="timeline-item"
      aria-current={props.isCurrent || undefined}
      className="col-start-1 flex flex-col gap-1.5"
      style={{
        gridRow: lane + 1,
        marginInlineStart: isRange ? x : x - 6,
        width: Math.max(barWidth, labelPx),
      }}
    >
      <span aria-hidden="true" className="flex h-3 items-center">
        {isRange ? (
          <span
            data-slot="timeline-bar"
            className={cn(
              "h-2",
              DOT_TONES[tone],
              props.end === "present" && "mask-r-from-60%",
            )}
            style={{ width: barWidth }}
          />
        ) : (
          <span className={cn("size-3 rounded-full", DOT_TONES[tone])} />
        )}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5 pe-3">
        <span className="font-mono text-xs text-quebi-fg-subtle tabular-nums">
          {props.time ?? <TimelineTime date={props.date} start={props.start} end={props.end} />}
        </span>
        {props.children}
      </span>
    </li>
  )
}
