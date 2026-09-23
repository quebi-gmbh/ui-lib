"use client"

import {
  type CalendarDate,
  endOfMonth,
  getDayOfWeek,
  startOfMonth,
  toCalendarDate,
  toTimeZone,
} from "@internationalized/date"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { use, useId, useMemo } from "react"
import {
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  Calendar as CalendarPrimitive,
  CalendarStateContext,
  Heading,
  useLocale,
} from "react-aria-components"
import { Button } from "@/components/button"
import {
  CALENDAR_COLORS,
  type CalendarEvent,
  type CalendarSource,
  DEFAULT_CALENDAR_TIME_ZONE,
  dayToDate,
  resolveEventColor,
  useCalendarToday,
} from "@/components/calendar-shell"
import type { CalendarColorName } from "@/lib/calendar"
import { getDateTimeFormat } from "@/lib/intl"
import { cn } from "@/lib/utils"

/**
 * MiniMonth — quebi design system
 *
 * The month at a glance: seven narrow columns, a date in each cell and a row
 * of dots under it, one per calendar that has something on that day. Runs of
 * days that are *not* appointments — a holiday, a leave, an on-call week —
 * are drawn as a tinted band behind the dates rather than as dots, because
 * they are the thing the reader plans *around* rather than a thing on the
 * list. The grid is the one for a dashboard card or a sidebar, where
 * `MonthView` would be all chips and no room.
 *
 * It sits between the other two month grids and is neither:
 *
 * - `Calendar` is an input. Its cells hold a date and nothing else.
 * - `MonthView` is a reader. Its cells hold every event, titled.
 * - This one holds *whether* there is something, and which calendar it is in,
 *   and lets the reader pick a day to find out what. The day it reports through
 *   `onDayChange` is where the app shows the agenda — beside the grid, under
 *   it, in a drawer; that is layout, and layout is yours.
 *
 * It takes the same `CalendarEvent` and `CalendarSource` as every other view in
 * the library, so a page that has a `MonthView` behind a "open the calendar"
 * link can feed this card from the same list.
 *
 * ## The dots are not the only channel
 *
 * A dot is six pixels of hue, and the cell's own label is react-aria's
 * ("Thursday, 17 September 2026"), which cannot be extended per cell without
 * replacing the name it computes. So the grid carries a visually-hidden
 * summary of every marked day in the visible range — the titles, in order,
 * and every span with its first and last day — and points the grid at it with
 * `aria-describedby`. A screen reader hears the month's contents once, on
 * entering the grid, instead of a dot count on every cell.
 *
 * ## Whose locale
 *
 * There is no `locale` prop, and that is not an oversight: react-aria draws the
 * weekday row and names every cell from its `I18nProvider`, and a prop here
 * could only reach the half of the grid this file formats itself — the summary
 * in one language, the cells in another. Set the provider around the app, as
 * for `Calendar`, and the whole grid follows it.
 *
 * ## Today, the picked day, and focus
 *
 * Three states, three treatments, none of them sharing a property: the picked
 * day fills the date with brand teal (as `Calendar` does), today rings it, and
 * keyboard focus rings the whole cell. Today is read after mount, never at
 * render, for the same prerender reason `useCalendarToday` gives; pass `now`
 * to pin it.
 */

/**
 * A run of whole days drawn as a band behind the dates — an absence, a
 * holiday, a freeze. `end` is inclusive: a span from Monday to Friday covers
 * Friday, because that is how anyone says it.
 */
export interface MiniMonthSpan {
  id: string
  /** What the span is — read out in the summary, and the key's label. */
  title: string
  start: CalendarDate
  /** Inclusive. */
  end: CalendarDate
  /**
   * The band's hue. Leave it out for the neutral band, which is right for the
   * one kind of span most views have: time the reader is *not* available.
   */
  color?: CalendarColorName
}

export interface MiniMonthProps<E extends CalendarEvent = CalendarEvent> {
  events: readonly E[]
  /** Where each event's dot colour comes from, and the order the dots are drawn in. */
  calendars?: readonly CalendarSource[]
  spans?: readonly MiniMonthSpan[]
  /** Any day in the (first) month on show. Controlled. */
  month?: CalendarDate
  /** Any day in the (first) month on show at mount. Defaults to the picked day, else today. */
  defaultMonth?: CalendarDate
  /** Called with the first of the month when the grid pages. */
  onMonthChange?: (month: CalendarDate) => void
  /** How many months side by side. Default 1. */
  months?: number
  /** The picked day. Controlled; `null` for none. */
  day?: CalendarDate | null
  defaultDay?: CalendarDate | null
  onDayChange?: (day: CalendarDate) => void
  /** Pin today, or `null` to mark no day as today. Read after mount otherwise. */
  now?: CalendarDate | null
  timeZone?: string
  firstDayOfWeek?: "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat"
  /** Dots per day at most. Default 3 — a fourth does not fit a 36px cell. */
  maxDots?: number
  /**
   * The prev/next row above the grid. Leave it on unless something else on the
   * page already pages the month (a `CalendarToolbar` in the card header) —
   * then control `month` from there and turn this off.
   */
  showHeader?: boolean
  previousLabel?: string
  nextLabel?: string
  /** Names the grid. Required in spirit: "Your month", "Team availability". */
  "aria-label"?: string
  className?: string
}

/** What the grid knows about one day: its dots, and what they stand for. */
interface DayMarks {
  colors: CalendarColorName[]
  titles: string[]
}

/** The calendar days an event touches, in `timeZone`. `end` is exclusive. */
function daysTouched(event: CalendarEvent, timeZone: string): CalendarDate[] {
  const first = toCalendarDate(toTimeZone(event.start, timeZone))
  const last =
    event.end.compare(event.start) > 0
      ? toCalendarDate(toTimeZone(event.end.subtract({ milliseconds: 1 }), timeZone))
      : first
  const days: CalendarDate[] = []
  // A year is the most one event can mark; a malformed end date should not
  // turn one render into a loop over the rest of the century.
  for (let day = first; day.compare(last) <= 0 && days.length < 366; day = day.add({ days: 1 })) {
    days.push(day)
  }
  return days
}

/** Every marked day, keyed `YYYY-MM-DD`, dots ordered as `calendars` is. */
export function markDays<E extends CalendarEvent>(
  events: readonly E[],
  calendars: readonly CalendarSource[] | undefined,
  timeZone: string,
): Map<string, DayMarks> {
  const order = (color: CalendarColorName) => {
    const index = calendars?.findIndex((calendar) => calendar.color === color) ?? -1
    return index === -1 ? Number.MAX_SAFE_INTEGER : index
  }
  const sorted = [...events].sort((a, b) => a.start.compare(b.start))
  const marks = new Map<string, DayMarks>()
  for (const event of sorted) {
    const color = resolveEventColor(event, calendars)
    for (const day of daysTouched(event, timeZone)) {
      const key = day.toString()
      const entry = marks.get(key) ?? { colors: [], titles: [] }
      if (!entry.colors.includes(color)) entry.colors.push(color)
      entry.titles.push(event.title)
      marks.set(key, entry)
    }
  }
  for (const entry of marks.values()) entry.colors.sort((a, b) => order(a) - order(b))
  return marks
}

/** The span covering `day`, if any. The first listed wins an overlap. */
function spanOn(spans: readonly MiniMonthSpan[], day: CalendarDate) {
  return spans.find((span) => day.compare(span.start) >= 0 && day.compare(span.end) <= 0)
}

/**
 * The neutral band. Opaque rather than an alpha'd `quebi-fg`, for the reason
 * `CALENDAR_COLORS` gives for its washes: the band sits behind a date that has
 * to keep its contrast, and a mix resolved against the page is the same colour
 * in both themes without anything showing through it.
 */
const NEUTRAL_BAND =
  "bg-[color-mix(in_oklab,var(--color-quebi-fg)_16%,var(--color-quebi-bg))]"

function bandClass(color: CalendarColorName | undefined) {
  return color ? CALENDAR_COLORS[color].band : NEUTRAL_BAND
}

/**
 * A compact month grid that marks days rather than listing what is on them:
 * one dot per calendar with an event that day, a band behind runs of days such
 * as absences, today ringed and the picked day filled. Pick a day to show its
 * agenda wherever the page wants it.
 */
export function MiniMonth<E extends CalendarEvent = CalendarEvent>({
  events,
  calendars,
  spans = [],
  month,
  defaultMonth,
  onMonthChange,
  months = 1,
  day,
  defaultDay,
  onDayChange,
  now,
  timeZone = DEFAULT_CALENDAR_TIME_ZONE,
  firstDayOfWeek,
  maxDots = 3,
  showHeader = true,
  previousLabel = "Previous month",
  nextLabel = "Next month",
  "aria-label": ariaLabel,
  className,
}: MiniMonthProps<E>) {
  const { locale, direction } = useLocale()
  const today = useCalendarToday(now, timeZone)
  const marks = useMemo(() => markDays(events, calendars, timeZone), [events, calendars, timeZone])
  const summaryId = useId()
  const count = Math.max(1, Math.trunc(months))

  return (
    <CalendarPrimitive
      data-slot="mini-month"
      aria-label={ariaLabel}
      aria-describedby={summaryId}
      className={cn("w-fit max-w-full", className)}
      visibleDuration={{ months: count }}
      firstDayOfWeek={firstDayOfWeek}
      value={day}
      defaultValue={defaultDay}
      onChange={onDayChange}
      // The focused date *is* the visible month in react-aria, so the month is
      // controlled through it. Only a change of month is reported: the focus
      // moving from the 3rd to the 4th is not the page turning.
      focusedValue={month}
      defaultFocusedValue={defaultMonth ?? defaultDay ?? undefined}
      onFocusChange={
        onMonthChange
          ? (focused) => {
              const first = startOfMonth(focused)
              if (!month || startOfMonth(month).compare(first) !== 0) onMonthChange(first)
            }
          : undefined
      }
    >
      <header
        className={cn(
          "flex items-center justify-between gap-2 pb-3",
          // The heading stays for the grid's accessible name whether or not
          // the chevrons are drawn; a page that pages the month elsewhere
          // already shows which month it is.
          !showHeader && "sr-only",
        )}
      >
        <Heading className="ps-1 font-semibold text-quebi-fg text-sm" />
        <div className="flex items-center gap-0.5">
          <Button
            slot="previous"
            size="sq-sm"
            intent="ghost"
            isCircle
            aria-label={previousLabel}
            className="size-7 **:data-[slot=icon]:text-quebi-fg-muted"
          >
            {direction === "rtl" ? (
              <ChevronRight data-slot="icon" />
            ) : (
              <ChevronLeft data-slot="icon" />
            )}
          </Button>
          <Button
            slot="next"
            size="sq-sm"
            intent="ghost"
            isCircle
            aria-label={nextLabel}
            className="size-7 **:data-[slot=icon]:text-quebi-fg-muted"
          >
            {direction === "rtl" ? (
              <ChevronLeft data-slot="icon" />
            ) : (
              <ChevronRight data-slot="icon" />
            )}
          </Button>
        </div>
      </header>
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:gap-8">
        {Array.from({ length: count }, (_, offset) => (
          <MiniMonthGrid
            // biome-ignore lint/suspicious/noArrayIndexKey: the offset *is* the grid's identity — the first month on show, the second, …
            key={offset}
            offset={offset}
            showLabel={count > 1}
            marks={marks}
            spans={spans}
            today={today}
            locale={locale}
            timeZone={timeZone}
            firstDayOfWeek={firstDayOfWeek}
            maxDots={maxDots}
          />
        ))}
      </div>
      <MiniMonthSummary
        id={summaryId}
        marks={marks}
        spans={spans}
        locale={locale}
        timeZone={timeZone}
      />
    </CalendarPrimitive>
  )
}

interface MiniMonthGridProps {
  offset: number
  showLabel: boolean
  marks: Map<string, DayMarks>
  spans: readonly MiniMonthSpan[]
  today: CalendarDate | null
  locale: string
  timeZone: string
  firstDayOfWeek: MiniMonthProps["firstDayOfWeek"]
  maxDots: number
}

function MiniMonthGrid({
  offset,
  showLabel,
  marks,
  spans,
  today,
  locale,
  timeZone,
  firstDayOfWeek,
  maxDots,
}: MiniMonthGridProps) {
  const state = use(CalendarStateContext)
  const first = state ? startOfMonth(state.visibleRange.start.add({ months: offset })) : null
  const last = first ? endOfMonth(first) : null

  return (
    <div className="shrink-0">
      {showLabel && first && (
        // Hidden from assistive tech: each grid is already named by react-aria
        // with its own month, and the heading above names the whole range.
        <p aria-hidden="true" className="mb-2 text-center font-medium text-quebi-fg-muted text-sm">
          {getDateTimeFormat(locale, { month: "long", year: "numeric", timeZone }).format(
            dayToDate(first, timeZone),
          )}
        </p>
      )}
      <CalendarGrid offset={{ months: offset }}>
        <CalendarGridHeader>
          {(weekday) => (
            <CalendarHeaderCell className="w-9 pb-2 text-center font-semibold text-quebi-fg-muted text-xs uppercase tracking-[0.08em]">
              {weekday}
            </CalendarHeaderCell>
          )}
        </CalendarGridHeader>
        <CalendarGridBody>
          {(date) => {
            const entry = marks.get(date.toString())
            const span = spanOn(spans, date)
            const column = getDayOfWeek(date, locale, firstDayOfWeek)
            // A band is a run, and a run breaks at the edge of a week and of
            // the month as well as where the span itself starts and stops.
            const opens =
              !!span &&
              (date.compare(span.start) === 0 || column === 0 || date.compare(first ?? date) === 0)
            const closes =
              !!span &&
              (date.compare(span.end) === 0 || column === 6 || date.compare(last ?? date) === 0)
            const isToday = !!today && date.compare(today) === 0

            return (
              <CalendarCell
                date={date}
                // Not `data-today`: react-aria sets that one itself, from the
                // runtime's clock, and it would overwrite the pinned answer.
                data-current-day={isToday || undefined}
                data-span={span ? span.id : undefined}
                className={({ isOutsideMonth, isFocusVisible, isDisabled, isUnavailable, isHovered }) =>
                  cn(
                    "relative flex h-10 w-9 cursor-default flex-col items-center justify-center gap-0.5 text-quebi-fg text-sm tabular-nums outline-hidden transition-colors",
                    // The hover wash is a background, and so is the band: on a
                    // banded day it would replace the band and punch a hole in
                    // the run. The band stays, and the date's circle takes the
                    // hover instead.
                    span && !isOutsideMonth ? bandClass(span.color) : isHovered && "bg-quebi-surface/[0.04]",
                    opens && "rounded-s-quebi-sm",
                    closes && "rounded-e-quebi-sm",
                    isFocusVisible && "rounded-quebi-sm ring-2 ring-quebi-brand-mark ring-inset",
                    isOutsideMonth && "text-quebi-fg-subtle",
                    (isDisabled || isUnavailable) && "text-quebi-fg-subtle",
                  )
                }
              >
                {({ formattedDate, isSelected, isOutsideMonth, isHovered }) => (
                  <>
                    <span
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full leading-none",
                        isSelected && "bg-quebi-brand font-semibold text-quebi-on-brand",
                        span && isHovered && !isSelected && "bg-quebi-surface/[0.08]",
                        isToday &&
                          !isSelected &&
                          "font-semibold text-quebi-brand-text ring-1 ring-quebi-brand-mark ring-inset",
                      )}
                    >
                      {formattedDate}
                    </span>
                    <span aria-hidden="true" className="flex h-1.5 items-center gap-0.5">
                      {!isOutsideMonth &&
                        entry?.colors.slice(0, maxDots).map((color) => (
                          <span
                            key={color}
                            className={cn("size-1.5 rounded-full", CALENDAR_COLORS[color].dot)}
                          />
                        ))}
                    </span>
                  </>
                )}
              </CalendarCell>
            )
          }}
        </CalendarGridBody>
      </CalendarGrid>
    </div>
  )
}

interface MiniMonthSummaryProps {
  id: string
  marks: Map<string, DayMarks>
  spans: readonly MiniMonthSpan[]
  locale: string
  timeZone: string
}

/**
 * What the dots say, in words, for the visible range only — the month the
 * reader is on, not every event the page was handed.
 */
function MiniMonthSummary({ id, marks, spans, locale, timeZone }: MiniMonthSummaryProps) {
  const state = use(CalendarStateContext)
  if (!state) return null
  const { start, end } = state.visibleRange
  const format = getDateTimeFormat(locale, { day: "numeric", month: "long", timeZone })
  const label = (day: CalendarDate) => format.format(dayToDate(day, timeZone))

  const lines: string[] = []
  for (let day = start; day.compare(end) <= 0; day = day.add({ days: 1 })) {
    const entry = marks.get(day.toString())
    if (entry) lines.push(`${label(day)}: ${entry.titles.join(", ")}.`)
  }
  for (const span of spans) {
    if (span.end.compare(start) < 0 || span.start.compare(end) > 0) continue
    lines.push(`${label(span.start)} – ${label(span.end)}: ${span.title}.`)
  }

  return (
    <p id={id} data-slot="mini-month-summary" className="sr-only">
      {lines.join(" ")}
    </p>
  )
}

export interface MiniMonthLegendProps {
  calendars?: readonly CalendarSource[]
  /** One key per kind of span. Only `title` and `color` are read. */
  spans?: readonly Pick<MiniMonthSpan, "title" | "color">[]
  className?: string
}

/**
 * The key for a `MiniMonth`: a dot per calendar and a bar per kind of span.
 *
 * `CalendarLegend` keys a view where every calendar is a dot; this one has to
 * key a band as well, and a band keyed with a dot is a key that does not match
 * what it keys. Spans are listed by title once each, so pass the kinds rather
 * than every absence in the year.
 */
export function MiniMonthLegend({ calendars = [], spans = [], className }: MiniMonthLegendProps) {
  const kinds = spans.filter(
    (span, index) => spans.findIndex((other) => other.title === span.title) === index,
  )
  return (
    <ul
      data-slot="mini-month-legend"
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-1 text-quebi-fg-muted text-xs",
        className,
      )}
    >
      {kinds.map((span) => (
        <li key={`span-${span.title}`} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={cn("h-2 w-5 shrink-0 rounded-full", bandClass(span.color))}
          />
          {span.title}
        </li>
      ))}
      {calendars.map((calendar) => (
        <li key={calendar.id} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={cn("size-1.5 shrink-0 rounded-full", CALENDAR_COLORS[calendar.color].dot)}
          />
          {calendar.name}
        </li>
      ))}
    </ul>
  )
}
