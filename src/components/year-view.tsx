"use client"

import {
  type CalendarDate,
  endOfYear,
  getDayOfWeek,
  startOfYear,
  toCalendarDate,
  toTimeZone,
} from "@internationalized/date"
import { useId, useMemo } from "react"
import {
  CALENDAR_COLORS,
  type CalendarEvent,
  type CalendarSource,
  DayOverflowPanel,
  dayToDate,
  DEFAULT_CALENDAR_TIME_ZONE,
  MoreLink,
  resolveEventColor,
  useCalendarToday,
} from "@/components/calendar-shell"
import {
  type CalendarToolbarLabelVariant,
  CalendarToolbar,
  type CalendarViewName,
  type CalendarViewOption,
  calendarYearLabel,
  useCalendarLocale,
  useCalendarNavigation,
} from "@/components/calendar-toolbar"
import { Card } from "@/components/card"
import { Heading } from "@/components/heading"
import { Link } from "@/components/link"
import { isAllDayEvent, weekRange } from "@/lib/calendar"
import { getDateTimeFormat, getNumberFormat } from "@/lib/intl"
import { cn } from "@/lib/utils"

/**
 * YearView — quebi design system
 *
 * A whole year as twelve small month cards: the view a reader opens to see
 * *when* things happen across a year rather than *what* happens on a day. Every
 * day with something on it is a link to that day, every month heading a link to
 * that month, and a day with nothing on it is inert — there is nowhere useful
 * for it to go.
 *
 * ## Three variants, one grid
 *
 * The cards, the weekday row, the offset of the 1st and the today ring are the
 * same in all three; what a day cell *says* is the variant.
 *
 * - `heatmap` — the cell's fill steps with the day's count. The pattern is the
 *   point: busy weeks, empty holidays, the month the project shipped. A legend
 *   under the grid keys the five steps.
 * - `count` — a neutral cell with the date and the exact number. For when "was
 *   it 3 or 4" matters more than the shape of the year, and for anyone who
 *   cannot tell five greys apart. No colour scale, so no swatch legend — a
 *   caption says what the number counts.
 * - `list` — bigger cells that name the day's first few events and fold the
 *   rest into the same "+N more" `MonthView` draws, opening the same panel.
 *   Fewer cards per row, because a title needs width.
 *
 * ## Where the numbers come from
 *
 * `events` and `calendars` are the ones every other view here takes, so one
 * list feeds the year, the month and the day. A day's count is the number of
 * events that touch it in `timeZone` — a night shift counts on both days.
 *
 * `counts` is the other feed: `{ "2026-09-07": 3 }`, keyed by ISO date. It is
 * what a server returns when the year is an aggregate — commits, sign-ups,
 * sessions — and loading a year of events to count them in the browser would be
 * the wrong shape of query. It is a plain record rather than a function because
 * it is what a route loader can serialize, and this site prerenders. Given
 * `counts`, the heatmap and count variants read it and ignore `events` for
 * counting. `list` names events, and a count cannot be named, so it always
 * reads `events`.
 *
 * ## The heatmap's steps
 *
 * Four steps above empty, and the rule is written out because the obvious one is
 * wrong. Scaling each count against the year's busiest day makes that day full
 * ink whatever it holds — a year whose busiest day has one event would paint
 * every event day full, which reads as "every day was as busy as it gets". So
 * the scale never runs below four: one step is at least one event, and the full
 * fill is reserved for a day that is busy in absolute terms as well as relative
 * ones. See `heatmapLevel`. Pass `maxCount` to pin the scale — two years side by
 * side are only comparable if they share one.
 *
 * ## Links, not routes
 *
 * The component knows no URLs. `dayHref` / `monthHref` return one (rendered as a
 * `Link`, so a `RouterProvider` makes it a client navigation), `onDayAction` /
 * `onMonthAction` are the alternative for a page that switches view in state.
 * With neither, a day is text with its count said in words, and a month heading
 * is a heading.
 *
 * ## Layout follows the view, not the window
 *
 * The number of cards per row is a container query on the view's own width, so
 * the year reads the same in a full page, a dashboard column and the gallery.
 *
 * ## The year
 *
 * `date` / `defaultDate` / `onDateChange` — any day in the year on show — the
 * pair `MonthView` and the others take, so a page that switches between views
 * holds one date rather than a date and a year. The toolbar (on by default)
 * steps a year at a time and opens a `YearPicker` from its heading. Today is
 * read after mount, never at render; pass `now` to pin it.
 */

export type YearViewVariant = "heatmap" | "count" | "list"

/** How many fills a heatmap day can take above empty. */
export const HEATMAP_LEVELS = 4

/**
 * The heatmap step, 0–4, for `count` events on a scale whose busiest day is `max`.
 *
 * 0 is empty and only empty. Above that, `ceil(count × 4 / scale)` where the
 * scale is `max` but never less than four, so each step is at least one event:
 *
 * | busiest day | 1 | 2 | 3 | 4 |
 * |---|---|---|---|---|
 * | 1 | 1 | | | |
 * | 2 | 1 | 2 | | |
 * | 4 | 1 | 2 | 3 | 4 |
 * | 8 | 1 (1–2) | 2 (3–4) | 3 (5–6) | 4 (7–8) |
 *
 * A count above `max` (a pinned `maxCount` the data outgrew) is the top step.
 */
export function heatmapLevel(count: number, max: number): number {
  if (!(count > 0)) return 0
  const scale = Math.max(max, HEATMAP_LEVELS)
  return Math.min(HEATMAP_LEVELS, Math.max(1, Math.ceil((count * HEATMAP_LEVELS) / scale)))
}

/**
 * The five fills, empty first. Ink at an alpha rather than five tokens: a
 * heatmap is one ink getting stronger, and the steps are fills, never marks.
 */
export const HEATMAP_FILLS = [
  "bg-quebi-raised",
  "bg-quebi-action/25",
  "bg-quebi-action/45",
  "bg-quebi-action/70",
  "bg-quebi-action",
] as const

/**
 * The two strongest fills carry `on-action` ink; the rest, the page's. Each
 * hover repeats the resting colour because a day is a `Link`, and a link's own
 * hover colour would otherwise land on a fill it was not chosen for.
 */
const HEATMAP_TEXT = [
  "text-quebi-fg-subtle",
  "text-quebi-fg hover:text-quebi-fg",
  "text-quebi-fg hover:text-quebi-fg",
  "text-quebi-on-action hover:text-quebi-on-action",
  "text-quebi-on-action hover:text-quebi-on-action",
] as const

const ALL_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const

export interface YearViewProps<E extends CalendarEvent = CalendarEvent> {
  /** What a day cell shows. Default `heatmap`. */
  variant?: YearViewVariant
  events?: readonly E[]
  /** Where each event's colour comes from, in the `list` variant. */
  calendars?: readonly CalendarSource[]
  /**
   * Counts per day, keyed `YYYY-MM-DD`, for a year that is an aggregate rather
   * than a list of events. Read by `heatmap` and `count` in place of `events`.
   */
  counts?: Readonly<Record<string, number>>
  /** Pin the heatmap's scale instead of reading it off the year's busiest day. */
  maxCount?: number
  /**
   * Which months to draw, 1–12, in the order given. Default all twelve. A
   * quarter or a school term; the heatmap is still scaled against the whole
   * year, so a month reads the same whichever others are beside it.
   */
  months?: readonly number[]
  /** Any day in the year on show. Controlled. */
  date?: CalendarDate
  /** Any day in the year on show at mount. Defaults to today. */
  defaultDate?: CalendarDate
  onDateChange?: (date: CalendarDate) => void
  timeZone?: string
  /** Formats every date and number here. Defaults to the nearest `I18nProvider`. */
  locale?: string
  /** Override the locale's first day of the week. */
  firstDayOfWeek?: "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat"
  /** Pin today, or `null` to ring no day. Read after mount otherwise. */
  now?: CalendarDate | null
  /** Where a day with something on it links to. */
  dayHref?: (day: CalendarDate) => string | undefined
  /** Called when a day with something on it is pressed, with everything on it. */
  onDayAction?: (day: CalendarDate, events: E[]) => void
  /** Where a month heading links to — the first of that month. */
  monthHref?: (month: CalendarDate) => string | undefined
  onMonthAction?: (month: CalendarDate) => void
  /**
   * A day cell's accessible name. `date` is already formatted —
   * `Mon 7 Sept 2026` — and so should the count be: use `formatCount`.
   */
  dayLabel?: (count: number, date: string, formatCount: (count: number) => string) => string
  /** `list` only: event lines per day before "+N more". Default 2. */
  maxItems?: number
  /** `list` only. Default `+N more`. */
  moreLabel?: (count: number) => string
  /** `list` only: take "+N more" over instead of opening the day's panel. */
  onMoreClick?: (day: CalendarDate, events: E[]) => void
  /** `list` only: an event row in the "+N more" panel was pressed. */
  onEventClick?: (event: E) => void
  /** The legend (`heatmap`) or caption (`count`) under the grid. Default on. */
  showLegend?: boolean
  /** The legend's words — the place to translate them. */
  legendLabels?: {
    fewer?: string
    more?: string
    /** `(up to 4 in a day)` */
    max?: (max: string) => string
    /** The `count` variant's caption. */
    count?: string
  }
  showToolbar?: boolean
  /** The toolbar heading. Defaults to the year, spelled by the locale. */
  label?: React.ReactNode
  labelVariant?: CalendarToolbarLabelVariant
  view?: CalendarViewName
  views?: readonly CalendarViewOption[]
  onViewChange?: (view: CalendarViewName) => void
  previousYearLabel?: string
  nextYearLabel?: string
  className?: string
}

/** Everything touching each day of `year`, keyed `YYYY-MM-DD`, in reading order. */
export function eventsByDay<E extends CalendarEvent>(
  events: readonly E[],
  year: CalendarDate,
  timeZone: string,
): Map<string, E[]> {
  const first = startOfYear(year)
  const last = endOfYear(year)
  const byDay = new Map<string, E[]>()
  for (const event of events) {
    const start = toCalendarDate(toTimeZone(event.start, timeZone))
    const end =
      event.end.compare(event.start) > 0
        ? toCalendarDate(toTimeZone(event.end.subtract({ milliseconds: 1 }), timeZone))
        : start
    if (end.compare(first) < 0 || start.compare(last) > 0) continue
    let day = start.compare(first) < 0 ? first : start
    const stop = end.compare(last) > 0 ? last : end
    for (; day.compare(stop) <= 0; day = day.add({ days: 1 })) {
      const key = day.toString()
      const list = byDay.get(key)
      if (list) list.push(event)
      else byDay.set(key, [event])
    }
  }
  // All-day first, then by start — the order `MonthView`'s panel lists a day in.
  for (const list of byDay.values()) {
    list.sort((a, b) => Number(isAllDayEvent(b)) - Number(isAllDayEvent(a)) || a.start.compare(b.start))
  }
  return byDay
}

/**
 * A year as twelve month cards whose day cells show a heatmap step, a count, or
 * the day's first few events and a "+N more". Days with something on them link
 * to the day, month headings to the month.
 */
export function YearView<E extends CalendarEvent = CalendarEvent>({
  variant = "heatmap",
  events = [],
  calendars,
  counts,
  maxCount,
  months: monthNumbers = ALL_MONTHS,
  date,
  defaultDate,
  onDateChange,
  timeZone = DEFAULT_CALENDAR_TIME_ZONE,
  locale: localeProp,
  firstDayOfWeek,
  now,
  dayHref,
  onDayAction,
  monthHref,
  onMonthAction,
  dayLabel = (count, day, formatCount) =>
    `${formatCount(count)} ${count === 1 ? "event" : "events"} on ${day}`,
  maxItems = 2,
  moreLabel = (count) => `+${count} more`,
  onMoreClick,
  onEventClick,
  showLegend = true,
  legendLabels,
  showToolbar = true,
  label,
  labelVariant = "picker",
  view,
  views,
  onViewChange,
  previousYearLabel = "Previous year",
  nextYearLabel = "Next year",
  className,
}: YearViewProps<E>) {
  const locale = useCalendarLocale(localeProp)
  const today = useCalendarToday(now, timeZone)
  const navigation = useCalendarNavigation({
    date,
    defaultDate,
    onDateChange,
    step: { years: 1 },
    timeZone,
  })
  const year = useMemo(() => startOfYear(navigation.date), [navigation.date])

  const byDay = useMemo(() => eventsByDay(events, year, timeZone), [events, year, timeZone])
  const countOf = (day: CalendarDate) => {
    const key = day.toString()
    if (variant !== "list" && counts) return counts[key] ?? 0
    return byDay.get(key)?.length ?? 0
  }

  // The busiest day of the year on show, from whichever feed is being read.
  const busiest = useMemo(() => {
    if (variant !== "list" && counts) {
      const prefix = `${String(year.year).padStart(4, "0")}-`
      return Object.entries(counts).reduce(
        (max, [key, value]) => (key.startsWith(prefix) && value > max ? value : max),
        0,
      )
    }
    let max = 0
    for (const list of byDay.values()) max = Math.max(max, list.length)
    return max
  }, [variant, counts, byDay, year.year])
  const scale = maxCount ?? busiest

  const numbers = getNumberFormat(locale, {})
  const formatCount = (count: number) => numbers.format(count)
  const dateFormat = getDateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone,
  })
  const dayNumber = getDateTimeFormat(locale, { day: "numeric", timeZone })
  const monthName = getDateTimeFormat(locale, { month: "long", timeZone })
  const weekdayInitial = getDateTimeFormat(locale, { weekday: "narrow", timeZone })
  const weekdays = weekRange(year, locale, 7, firstDayOfWeek).map((day) =>
    weekdayInitial.format(dayToDate(day, timeZone)),
  )

  const months = monthNumbers
    .filter((month) => Number.isInteger(month) && month >= 1 && month <= 12)
    .map((month) => year.set({ month }))

  return (
    <div
      data-slot="year-view"
      data-variant={variant}
      className={cn("@container/year-view flex w-full flex-col gap-6", className)}
    >
      {showToolbar ? (
        <CalendarToolbar
          label={label ?? calendarYearLabel(year, { locale, timeZone })}
          labelVariant={labelVariant}
          pickerGranularity="year"
          locale={locale}
          firstDayOfWeek={firstDayOfWeek}
          date={navigation.date}
          onDateChange={navigation.goTo}
          view={view}
          views={views}
          onViewChange={onViewChange}
          onPrevious={navigation.goToPrevious}
          onNext={navigation.goToNext}
          onToday={navigation.goToToday}
          isTodayDisabled={today !== null && today.year === year.year}
          previousLabel={previousYearLabel}
          nextLabel={nextYearLabel}
        />
      ) : null}

      <div
        className={cn(
          "grid grid-cols-1 gap-4",
          variant === "list"
            ? "@4xl/year-view:grid-cols-2 @7xl/year-view:grid-cols-3"
            : "@lg/year-view:grid-cols-2 @3xl/year-view:grid-cols-3 @5xl/year-view:grid-cols-4",
        )}
      >
        {months.map((month) => (
          <MonthCard
            key={month.toString()}
            month={month}
            name={monthName.format(dayToDate(month, timeZone))}
            weekdays={weekdays}
            lead={getDayOfWeek(month, locale, firstDayOfWeek)}
            renderDay={(day) => {
              const count = countOf(day)
              const dayEvents = byDay.get(day.toString()) ?? []
              return (
                <DayCell
                  key={day.toString()}
                  day={day}
                  count={count}
                  events={dayEvents}
                  variant={variant}
                  level={heatmapLevel(count, scale)}
                  isToday={today !== null && today.compare(day) === 0}
                  number={dayNumber.format(dayToDate(day, timeZone))}
                  countText={formatCount(count)}
                  label={dayLabel(count, dateFormat.format(dayToDate(day, timeZone)), formatCount)}
                  href={count > 0 ? dayHref?.(day) : undefined}
                  onAction={
                    count > 0 && onDayAction ? () => onDayAction(day, dayEvents) : undefined
                  }
                  calendars={calendars}
                  locale={locale}
                  timeZone={timeZone}
                  maxItems={Math.max(0, Math.trunc(maxItems))}
                  moreLabel={moreLabel}
                  onMoreClick={onMoreClick}
                  onEventClick={onEventClick}
                />
              )
            }}
            href={monthHref?.(month)}
            onAction={onMonthAction ? () => onMonthAction(month) : undefined}
          />
        ))}
      </div>

      {showLegend && variant === "heatmap" ? (
        <HeatmapLegend
          max={formatCount(scale)}
          fewer={legendLabels?.fewer ?? "Fewer"}
          more={legendLabels?.more ?? "More"}
          maxText={legendLabels?.max ?? ((max) => `(up to ${max} in a day)`)}
          hasScale={scale > 0}
        />
      ) : null}
      {showLegend && variant === "count" ? (
        <p data-slot="year-view-legend" className="text-quebi-fg-muted text-xs">
          {legendLabels?.count ?? "The number on a day is how many events it has."}
        </p>
      ) : null}
    </div>
  )
}

interface MonthCardProps {
  month: CalendarDate
  name: string
  weekdays: string[]
  /** Blank cells before the 1st. */
  lead: number
  renderDay: (day: CalendarDate) => React.ReactNode
  href: string | undefined
  onAction: (() => void) | undefined
}

/** One month: a `Card` named by its heading, the weekday row, then the days. */
function MonthCard({ month, name, weekdays, lead, renderDay, href, onAction }: MonthCardProps) {
  const headingId = useId()
  const days = Array.from({ length: month.calendar.getDaysInMonth(month) }, (_, index) =>
    month.add({ days: index }),
  )
  return (
    <Card
      data-slot="year-view-month"
      role="region"
      aria-labelledby={headingId}
      className="h-auto gap-3 p-4"
    >
      <Heading level={3} id={headingId} className="font-display font-light text-quebi-fg text-quebi-nav">
        {href || onAction ? (
          <Link
            {...(href ? { href } : {})}
            onPress={onAction}
            className="text-quebi-fg"
          >
            {name}
          </Link>
        ) : (
          name
        )}
      </Heading>
      <div className="grid grid-cols-7 gap-1">
        {weekdays.map((weekday, index) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: the column *is* the identity — two narrow weekday names are the same letter in most locales
            key={index}
            aria-hidden="true"
            className="quebi-eyebrow block pb-1 text-center"
          >
            {weekday}
          </span>
        ))}
        {Array.from({ length: lead }, (_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: blank offset cells have no identity but their position
          <span key={`lead-${index}`} aria-hidden="true" />
        ))}
        {days.map(renderDay)}
      </div>
    </Card>
  )
}

interface DayCellProps<E extends CalendarEvent> {
  day: CalendarDate
  count: number
  events: E[]
  variant: YearViewVariant
  level: number
  isToday: boolean
  /** The date as the locale writes a day number. */
  number: string
  countText: string
  label: string
  href: string | undefined
  onAction: (() => void) | undefined
  calendars: readonly CalendarSource[] | undefined
  locale: string
  timeZone: string
  maxItems: number
  moreLabel: (count: number) => string
  onMoreClick: ((day: CalendarDate, events: E[]) => void) | undefined
  onEventClick: ((event: E) => void) | undefined
}

/** Today is an ink outline just outside the cell, so it clears every fill. */
const TODAY_RING = "outline-1 outline-solid outline-offset-1 outline-quebi-fg"

/**
 * A pressable day takes a subtle outline on hover. The focus ring is `Link`'s own; what
 * is taken away is the underline, which on a cell would underline one digit.
 *
 * Every `Link` here spreads `href` only when there is one: a press-only link
 * handed `href={undefined}` still ends up with an empty `href` attribute, which
 * React warns about.
 */
const DAY_LINK =
  "no-underline hover:no-underline hover:outline-1 hover:outline-solid hover:outline-quebi-fg-subtle"

function DayCell<E extends CalendarEvent>(props: DayCellProps<E>) {
  if (props.variant === "list") return <ListDayCell {...props} />

  const { day, count, variant, level, isToday, number, countText, label, href, onAction } = props
  const isHeatmap = variant === "heatmap"
  const surface = cn(
    "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-(--q-radius-mark) text-xs tabular-nums",
    isHeatmap ? cn(HEATMAP_FILLS[level], HEATMAP_TEXT[level]) : "bg-quebi-raised",
    isToday && TODAY_RING,
  )

  if (count === 0) {
    return (
      <span
        data-slot="year-view-day"
        data-date={day.toString()}
        data-current-day={isToday || undefined}
        aria-hidden="true"
        className={cn(surface, !isHeatmap && "text-quebi-fg-subtle")}
      >
        {number}
      </span>
    )
  }

  const content = isHeatmap ? (
    <>
      <span aria-hidden="true">{number}</span>
      <span className="sr-only">{label}</span>
    </>
  ) : (
    <>
      <span aria-hidden="true" className="text-quebi-fg-subtle leading-none">
        {number}
      </span>
      <span aria-hidden="true" className="font-medium text-quebi-fg leading-none">
        {countText}
      </span>
      <span className="sr-only">{label}</span>
    </>
  )

  const shared = {
    "data-slot": "year-view-day",
    "data-date": day.toString(),
    "data-count": count,
    "data-level": isHeatmap ? level : undefined,
    "data-current-day": isToday || undefined,
  }

  if (href || onAction) {
    return (
      <Link
        {...shared}
        {...(href ? { href } : {})}
        onPress={onAction}
        className={cn(surface, !isHeatmap && "text-quebi-fg hover:text-quebi-fg", DAY_LINK)}
      >
        {content}
      </Link>
    )
  }
  return (
    <span {...shared} className={cn(surface, !isHeatmap && "text-quebi-fg")}>
      {content}
    </span>
  )
}

/** A `list` day: the date, the first `maxItems` titles, then "+N more". */
function ListDayCell<E extends CalendarEvent>({
  day,
  count,
  events,
  isToday,
  number,
  label,
  href,
  onAction,
  calendars,
  locale,
  timeZone,
  maxItems,
  moreLabel,
  onMoreClick,
  onEventClick,
}: DayCellProps<E>) {
  const surface = cn(
    "flex min-h-20 min-w-0 flex-col gap-0.5 rounded-(--q-radius-mark) bg-quebi-raised p-1 text-xs",
    isToday && TODAY_RING,
  )

  if (count === 0) {
    return (
      <span
        data-slot="year-view-day"
        data-date={day.toString()}
        data-current-day={isToday || undefined}
        aria-hidden="true"
        className={cn(surface, "text-quebi-fg-subtle tabular-nums")}
      >
        {number}
      </span>
    )
  }

  const shown = events.slice(0, maxItems)
  const hidden = events.length - shown.length
  const dateMark = (
    <>
      <span aria-hidden="true">{number}</span>
      <span className="sr-only">{label}</span>
    </>
  )

  return (
    <div
      data-slot="year-view-day"
      data-date={day.toString()}
      data-count={count}
      data-current-day={isToday || undefined}
      className={surface}
    >
      {href || onAction ? (
        <Link
          {...(href ? { href } : {})}
          onPress={onAction}
          className={cn(
            "self-start px-0.5 font-medium text-quebi-fg tabular-nums hover:text-quebi-fg",
            DAY_LINK,
          )}
        >
          {dateMark}
        </Link>
      ) : (
        <span className="px-0.5 font-medium text-quebi-fg tabular-nums">{dateMark}</span>
      )}
      {shown.map((event) => (
        <span
          key={event.id}
          data-slot="year-view-item"
          className={cn(
            "truncate px-1 text-quebi-fg leading-4",
            CALENDAR_COLORS[resolveEventColor(event, calendars)].band,
          )}
        >
          {event.title}
        </span>
      ))}
      {hidden > 0 ? (
        onMoreClick ? (
          <MoreLink count={hidden} label={moreLabel} onPress={() => onMoreClick(day, events)} />
        ) : (
          <MoreLink count={hidden} label={moreLabel}>
            <DayOverflowPanel
              day={day}
              events={events}
              calendars={calendars}
              locale={locale}
              timeZone={timeZone}
              selectedId={null}
              onActivate={(event) => onEventClick?.(event)}
            />
          </MoreLink>
        )
      ) : null}
    </div>
  )
}

interface HeatmapLegendProps {
  max: string
  fewer: string
  more: string
  maxText: (max: string) => string
  hasScale: boolean
}

/** "Fewer ■■■■■ More (up to N in a day)". The swatches are decoration; the words carry it. */
function HeatmapLegend({ max, fewer, more, maxText, hasScale }: HeatmapLegendProps) {
  return (
    <div
      data-slot="year-view-legend"
      className="flex flex-wrap items-center gap-x-2 gap-y-1 text-quebi-fg-muted text-xs"
    >
      <span>{fewer}</span>
      <span aria-hidden="true" className="flex items-center gap-1">
        {HEATMAP_FILLS.map((fill) => (
          <span key={fill} className={cn("size-3", fill)} />
        ))}
      </span>
      <span>{more}</span>
      {hasScale ? <span className="text-quebi-fg-subtle">{maxText(max)}</span> : null}
    </div>
  )
}
