"use client"

import {
  type CalendarDate,
  fromDate,
  Time,
  toCalendarDate,
  toCalendarDateTime,
  toZoned,
  type ZonedDateTime,
} from "@internationalized/date"
import { useEffect, useMemo, useState } from "react"
import { Button, useLocale } from "react-aria-components"
import {
  type CalendarColorName,
  type CalendarEvent,
  type CalendarSource,
  type DaySegment,
  type EventBand,
  eventsOnDay,
  limitLanes,
  MINUTES_PER_DAY,
  packBands,
  packColumns,
  segmentByDay,
} from "@/lib/calendar"
import { getDateTimeFormat } from "@/lib/intl"
import { cn } from "@/lib/utils"

/**
 * CalendarShell — quebi design system
 *
 * The parts every Outlook-style view is drawn from: a time axis, the hour
 * gridlines, the all-day band with its "+N more" overflow, the now-marker, and
 * the event blocks laid out by `@/lib/calendar`'s packing pass. `DayView`,
 * `WeekView` and `MonthView` are assemblies over this; `CalendarTimeline` reuses
 * the palette and the blocks and draws its own axis, because its time runs
 * horizontally.
 *
 * This is the `TableShell` of the calendar family: it renders, it does not
 * decide. Which days are visible, what the toolbar says and who owns the date
 * are the assembly's business, and none of it is reachable from here.
 *
 * ## Read-only plus selection
 *
 * There is no drag-to-create, drag-to-move or resize. That is a deliberate v1
 * line, not an oversight — `DaySchedule` is the component that owns dragging a
 * time span around, and porting its interaction surface onto four views is more
 * work than all of the layout put together. What is here is the display and the
 * two things a display still has to answer: `onEventClick` when something is
 * activated, and `onSelectionChange` for the one event drawn as selected.
 */

/**
 * The calendar palette, as classes.
 *
 * `calendarColorNames` in `@/lib/calendar` fixes the *order* — it is the
 * `dataviz` skill's validated categorical ordering, whose adjacent pairs clear
 * the colour-vision gate in both themes — and this is the only place that turns
 * a slot into pixels. Three rules from that skill shape what each entry says:
 *
 * - **The fill is a wash, not a block.** The hue at low opacity, with the solid
 *   hue kept for a 2px edge that reads as the series line. A saturated block
 *   behind text is the thing that makes a week view look like a bar chart.
 * - **Text wears text tokens.** The title is `quebi-fg`, never the series hue,
 *   so it keeps its contrast whichever slot the calendar landed in.
 * - **Colour is never the only channel.** Every block carries its title and its
 *   time as text, and a timeline row is labelled with the calendar's name, so
 *   the hue is a second signal rather than the signal.
 *
 * The scales here are Tailwind's rather than quebi tokens because quebi has one
 * accent, and one accent cannot tell eight calendars apart. That is the same
 * argument `chart.tsx` makes for its series palette, and the same exception
 * `no-hardcoded-design-values` already grants the library source — the values
 * are argued about here, once, instead of in a consumer's lint run.
 */
export const CALENDAR_COLORS: Record<
  CalendarColorName,
  { block: string; edge: string; dot: string; band: string }
> = {
  blue: {
    block: "bg-blue-500/15 hover:bg-blue-500/25",
    edge: "border-l-blue-500",
    dot: "bg-blue-500",
    band: "bg-blue-500/20",
  },
  orange: {
    block: "bg-orange-500/15 hover:bg-orange-500/25",
    edge: "border-l-orange-500",
    dot: "bg-orange-500",
    band: "bg-orange-500/20",
  },
  brand: {
    block: "bg-quebi-brand/15 hover:bg-quebi-brand/25",
    edge: "border-l-quebi-brand-mark",
    dot: "bg-quebi-brand",
    band: "bg-quebi-brand/20",
  },
  amber: {
    block: "bg-amber-500/15 hover:bg-amber-500/25",
    edge: "border-l-amber-500",
    dot: "bg-amber-500",
    band: "bg-amber-500/20",
  },
  pink: {
    block: "bg-pink-500/15 hover:bg-pink-500/25",
    edge: "border-l-pink-500",
    dot: "bg-pink-500",
    band: "bg-pink-500/20",
  },
  emerald: {
    block: "bg-emerald-500/15 hover:bg-emerald-500/25",
    edge: "border-l-emerald-500",
    dot: "bg-emerald-500",
    band: "bg-emerald-500/20",
  },
  violet: {
    block: "bg-violet-500/15 hover:bg-violet-500/25",
    edge: "border-l-violet-500",
    dot: "bg-violet-500",
    band: "bg-violet-500/20",
  },
  rose: {
    block: "bg-rose-500/15 hover:bg-rose-500/25",
    edge: "border-l-rose-500",
    dot: "bg-rose-500",
    band: "bg-rose-500/20",
  },
}

/** The zone every view is drawn in unless told otherwise — pinned, never read
 * from the runtime. A prerendered calendar and the browser that hydrates it are
 * two machines with two `Intl.DateTimeFormat().resolvedOptions().timeZone`s, and
 * a day grid that disagrees about which day it is re-renders every event. Same
 * argument, same default as `FormattedDate`. */
export const DEFAULT_CALENDAR_TIME_ZONE = "Europe/Berlin"

/** The event's own colour, else its calendar's, else the first slot. */
export function resolveEventColor(
  event: CalendarEvent,
  calendars: readonly CalendarSource[] | undefined,
): CalendarColorName {
  if (event.color) return event.color
  const source = calendars?.find((candidate) => candidate.id === event.calendarId)
  return source?.color ?? "brand"
}

/** `09:00` / `9:00 AM` — the locale decides, the cache builds the formatter once. */
export function formatEventTime(instant: ZonedDateTime, locale: string, timeZone: string) {
  return getDateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone }).format(
    instant.toDate(),
  )
}

/** The gutter label for an hour — `09 Uhr`, `9 AM`. */
function formatHourLabel(day: CalendarDate, hour: number, locale: string, timeZone: string) {
  const instant = toZoned(toCalendarDateTime(day, new Time(hour)), timeZone)
  return getDateTimeFormat(locale, { hour: "numeric", timeZone }).format(instant.toDate())
}

/** A `CalendarDate` as a `Date`, at midnight in `timeZone`, for a formatter. */
export function dayToDate(day: CalendarDate, timeZone: string): Date {
  return toZoned(toCalendarDateTime(day, new Time(0)), timeZone).toDate()
}

/**
 * The current instant, or `null` until the component has mounted.
 *
 * Reading the clock during render puts one time in the prerendered HTML and a
 * different one in the hydrated tree, so the now-marker is absent from the
 * server's output by construction and appears on mount. It then re-reads once a
 * minute, which is the resolution the marker is drawn at. Pass `now` explicitly
 * to pin it — the tests do, and so should anything that needs a stable
 * screenshot.
 */
export function useCalendarNowInstant(
  provided: ZonedDateTime | null | undefined,
  timeZone: string,
): ZonedDateTime | null {
  const [tick, setTick] = useState<Date | null>(null)

  useEffect(() => {
    if (provided !== undefined) return
    setTick(new Date())
    const id = setInterval(() => setTick(new Date()), 60_000)
    return () => clearInterval(id)
  }, [provided])

  return useMemo(() => {
    if (provided !== undefined) return provided
    if (!tick) return null
    // `fromDate` is the instant → wall-clock conversion done *in the grid's
    // zone*, not the runtime's: the marker sits an hour out for anyone reading a
    // Berlin calendar from London if the browser's zone is allowed in here.
    return fromDate(tick, timeZone)
  }, [provided, tick, timeZone])
}

/**
 * Today's date in `timeZone`, or `null` until mount.
 *
 * The same prerender argument as `useCalendarNowInstant`, for the views that
 * only need the day:
 * the month grid highlights today, and a build machine's idea of today is not
 * the reader's. Pass a `CalendarDate` to pin it, or `null` to highlight nothing.
 */
export function useCalendarToday(
  provided: CalendarDate | null | undefined,
  timeZone: string,
): CalendarDate | null {
  const instant = useCalendarNowInstant(provided === undefined ? undefined : null, timeZone)
  if (provided !== undefined) return provided
  return instant ? toCalendarDate(instant) : null
}

export interface CalendarShellProps<E extends CalendarEvent = CalendarEvent> {
  /** The visible days, left to right. One for a day view, seven for a week. */
  days: readonly CalendarDate[]
  events: readonly E[]
  /** Colour and naming for the calendars the events belong to. */
  calendars?: readonly CalendarSource[]
  /** IANA zone the grid is drawn in. Pinned by default — see the constant. */
  timeZone?: string
  /** BCP 47 tag. Defaults to the nearest `I18nProvider`'s locale. */
  locale?: string
  /**
   * First hour on the axis. Default 0.
   *
   * The axis is the grid's extent, not a scroll position: an event outside
   * `[startHour, endHour)` is not drawn, and one reaching across either edge is
   * cut at it and gets the same flat edge a midnight crossing does. Narrow the
   * axis and you are choosing what the grid shows, so pair it with a filter the
   * reader can see if events can fall outside it.
   */
  startHour?: number
  /** Last hour on the axis, exclusive. Default 24. See `startHour`. */
  endHour?: number
  /** Pixels per hour. Default 48. */
  hourHeight?: number
  /** Minutes between the faint intermediate gridlines. Default 30. */
  slotMinutes?: number
  /** Width of the time gutter in pixels. Default 60. */
  axisWidth?: number
  /** Height of the scrolling area in pixels. Default 520. */
  height?: number
  /** Pin the now-marker, or pass `null` to omit it. Undefined reads the clock after mount. */
  now?: ZonedDateTime | null
  /** Draw the all-day band above the grid. Default true. */
  showAllDayRow?: boolean
  /** Lanes the all-day band may grow to before it folds into "+N more". Default 2. */
  maxAllDayLanes?: number
  /** Accessible name and gutter label for the all-day band. */
  allDayLabel?: string
  /** `(n) => "+2 more"`. */
  moreLabel?: (count: number) => string
  /** Draw the weekday/date row above the grid. Default true. */
  showDayHeaders?: boolean
  /** Replace the default weekday + date header for one column. */
  renderDayHeader?: (day: CalendarDate, index: number) => React.ReactNode
  /** The event drawn as selected. Controlled. */
  selectedEventId?: string | null
  /** The initially selected event, for the uncontrolled case. */
  defaultSelectedEventId?: string | null
  /** Fires with the new selection, or `null` when the selected event is clicked again. */
  onSelectionChange?: (id: string | null) => void
  /** Fires on every activation, selected or not. */
  onEventClick?: (event: E) => void
  /** Fires when an overflow link is activated, with everything on that day. */
  onMoreClick?: (day: CalendarDate, events: E[]) => void
  className?: string
}

/**
 * The time grid: a gutter, `days.length` columns, and the events packed into
 * them. Every geometric decision here comes out of `@/lib/calendar`; what is
 * left is turning minutes into pixels.
 */
export function CalendarShell<E extends CalendarEvent = CalendarEvent>({
  days,
  events,
  calendars,
  timeZone = DEFAULT_CALENDAR_TIME_ZONE,
  locale: localeProp,
  startHour = 0,
  endHour = 24,
  hourHeight = 48,
  slotMinutes = 30,
  axisWidth = 60,
  height = 520,
  now,
  showAllDayRow = true,
  maxAllDayLanes = 2,
  allDayLabel = "all day",
  moreLabel = (count) => `+${count} more`,
  showDayHeaders = true,
  renderDayHeader,
  selectedEventId,
  defaultSelectedEventId = null,
  onSelectionChange,
  onEventClick,
  onMoreClick,
  className,
}: CalendarShellProps<E>) {
  const { locale: contextLocale } = useLocale()
  const locale = localeProp ?? contextLocale
  const selection = useSelection(selectedEventId, defaultSelectedEventId, onSelectionChange)
  const currentInstant = useCalendarNowInstant(now, timeZone)

  const axisStart = Math.max(0, Math.min(23, Math.trunc(startHour)))
  const axisEnd = Math.max(axisStart + 1, Math.min(24, Math.trunc(endHour)))
  const axisMinutes = (axisEnd - axisStart) * 60
  const gridHeight = (axisEnd - axisStart) * hourHeight

  // Cut against the axis, not against midnight: `toTop` is a linear map with no
  // clamp in it, so a segment the window does not contain is drawn outside the
  // grid rather than not at all — see `DayWindow`.
  const segments = useMemo(
    () =>
      segmentByDay(events, days, timeZone, {
        startMinute: axisStart * 60,
        endMinute: axisEnd * 60,
      }),
    [events, days, timeZone, axisStart, axisEnd],
  )
  const packed = useMemo(() => packColumns(segments), [segments])
  const bands = useMemo(() => packBands(events, days, timeZone), [events, days, timeZone])
  const limited = useMemo(
    () => limitLanes(bands, days.length, maxAllDayLanes),
    [bands, days.length, maxAllDayLanes],
  )

  const toTop = (minutes: number) => ((minutes - axisStart * 60) / axisMinutes) * gridHeight
  const hours = Array.from({ length: axisEnd - axisStart }, (_, index) => axisStart + index)
  const firstDay = days[0]

  // Where the now-marker goes, or `null` when there is no line to draw on any
  // column: no clock read yet, or a reading this axis does not cover. The second
  // half is the guard `CalendarTimeline` has always had — without it 19:04 on a
  // 09:00–13:00 axis is placed 388px below the last gridline, which is scrollable
  // space the grid never drew (task #161).
  const markerMinutes = currentInstant ? currentInstant.hour * 60 + currentInstant.minute : null
  const markerTop =
    markerMinutes !== null && markerMinutes >= axisStart * 60 && markerMinutes <= axisEnd * 60
      ? toTop(markerMinutes)
      : null

  const columns = { gridTemplateColumns: `repeat(${Math.max(1, days.length)}, minmax(0, 1fr))` }

  const activate = (event: E) => {
    selection.toggle(event.id)
    onEventClick?.(event)
  }

  return (
    <div
      data-slot="calendar-shell"
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-quebi-md",
        "border border-quebi-line/10 bg-quebi-bg",
        className,
      )}
    >
      {showDayHeaders ? (
        <div className="flex border-quebi-line/10 border-b">
          <div className="shrink-0" style={{ width: axisWidth }} />
          <div className="grid flex-1" style={columns}>
            {days.map((day, index) => (
              <div
                key={day.toString()}
                data-slot="calendar-day-header"
                className="border-quebi-line/10 border-l px-2 py-2 text-center first:border-l-0"
              >
                {renderDayHeader ? (
                  renderDayHeader(day, index)
                ) : (
                  <DayHeading
                    day={day}
                    locale={locale}
                    timeZone={timeZone}
                    isToday={isSameDayAs(currentInstant, day)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {showAllDayRow ? (
        <div className="flex border-quebi-line/10 border-b">
          <div
            className="shrink-0 px-2 py-1 text-right text-quebi-fg-subtle text-xs"
            style={{ width: axisWidth }}
          >
            {allDayLabel}
          </div>
          <AllDayBand
            days={days}
            bands={limited.bands}
            hiddenPerDay={limited.hiddenPerDay}
            allBands={bands}
            segments={segments}
            calendars={calendars}
            columns={columns}
            selectedId={selection.value}
            moreLabel={moreLabel}
            onActivate={activate}
            onMoreClick={onMoreClick}
          />
        </div>
      ) : null}

      <div className="relative overflow-y-auto" style={{ maxHeight: height }}>
        <div className="flex" style={{ height: gridHeight }}>
          <div className="relative shrink-0" style={{ width: axisWidth }}>
            {firstDay
              ? hours.map((hour) => (
                  <div
                    key={hour}
                    className="-translate-y-1/2 absolute right-2 text-quebi-fg-subtle text-xs tabular-nums"
                    style={{ top: toTop(hour * 60) }}
                  >
                    {hour === axisStart ? null : formatHourLabel(firstDay, hour, locale, timeZone)}
                  </div>
                ))
              : null}
          </div>

          <div className="relative grid flex-1" style={columns}>
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="absolute inset-x-0 border-quebi-line/10 border-t"
                  style={{ top: toTop(hour * 60) }}
                />
              ))}
              {slotMinutes > 0 && slotMinutes < 60
                ? hours.flatMap((hour) =>
                    subSlots(slotMinutes).map((offset) => (
                      <div
                        key={`${hour}:${offset}`}
                        className="absolute inset-x-0 border-quebi-line/5 border-t"
                        style={{ top: toTop(hour * 60 + offset) }}
                      />
                    )),
                  )
                : null}
            </div>

            {days.map((day, index) => (
              <div
                key={day.toString()}
                className="relative border-quebi-line/10 border-l first:border-l-0"
              >
                {packed
                  .filter((segment) => segment.dayIndex === index)
                  .map((segment) => (
                    <TimedBlock
                      key={`${segment.event.id}:${segment.dayIndex}`}
                      segment={segment}
                      color={resolveEventColor(segment.event, calendars)}
                      top={toTop(segment.start)}
                      bottom={toTop(segment.end)}
                      gridHeight={gridHeight}
                      locale={locale}
                      timeZone={timeZone}
                      isSelected={selection.value === segment.event.id}
                      onActivate={activate}
                    />
                  ))}
                {markerTop !== null && currentInstant && isSameDayAs(currentInstant, day) ? (
                  <NowMarker
                    top={markerTop}
                    label={formatEventTime(currentInstant, locale, timeZone)}
                  />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Faint lines inside an hour, at `every` minutes — 30 gives the half-hour rule. */
function subSlots(every: number): number[] {
  const offsets: number[] = []
  for (let minute = every; minute < 60; minute += every) offsets.push(minute)
  return offsets
}

/** Is `instant` on `day`, read in `timeZone`? Used for "today" and the marker. */
function isSameDayAs(instant: ZonedDateTime | null, day: CalendarDate): boolean {
  if (!instant) return false
  return toCalendarDate(instant).compare(day) === 0
}

/** Controlled-or-not selection of a single event id. */
function useSelection(
  controlled: string | null | undefined,
  initial: string | null,
  onChange: ((id: string | null) => void) | undefined,
) {
  const [uncontrolled, setUncontrolled] = useState<string | null>(initial)
  const value = controlled === undefined ? uncontrolled : controlled

  return {
    value,
    toggle(id: string) {
      const next = value === id ? null : id
      if (controlled === undefined) setUncontrolled(next)
      onChange?.(next)
    },
  }
}

interface DayHeadingProps {
  day: CalendarDate
  locale: string
  timeZone: string
  isToday: boolean
}

/** `Mo` over `21`, with today's number filled in brand teal. */
export function DayHeading({ day, locale, timeZone, isToday }: DayHeadingProps) {
  const date = dayToDate(day, timeZone)
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-quebi-fg-subtle text-xs uppercase">
        {getDateTimeFormat(locale, { weekday: "short", timeZone }).format(date)}
      </span>
      <span
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full font-semibold text-sm tabular-nums",
          isToday ? "bg-quebi-brand text-quebi-on-brand" : "text-quebi-fg",
        )}
      >
        {getDateTimeFormat(locale, { day: "numeric", timeZone }).format(date)}
      </span>
    </div>
  )
}

interface TimedBlockProps<E extends CalendarEvent> {
  segment: DaySegment<E> & { column: number; columns: number; span: number }
  color: CalendarColorName
  top: number
  bottom: number
  /** The axis's full height, so a block short enough to need padding stays in it. */
  gridHeight: number
  locale: string
  timeZone: string
  isSelected: boolean
  onActivate: (event: E) => void
}

/** The shortest block that still holds a line of text. */
const MIN_BLOCK_HEIGHT = 18

function TimedBlock<E extends CalendarEvent>({
  segment,
  color,
  top,
  bottom,
  gridHeight,
  locale,
  timeZone,
  isSelected,
  onActivate,
}: TimedBlockProps<E>) {
  const palette = CALENDAR_COLORS[color]
  const height = Math.max(MIN_BLOCK_HEIGHT, bottom - top)
  // The minimum grows a short block downwards, so a five-minute event against
  // the end of the axis would hang past the last gridline — the same escape the
  // now-marker used to make, in miniature. Push it up onto the axis instead.
  const y = Math.max(0, Math.min(top, gridHeight - height))
  const left = (segment.column / segment.columns) * 100
  const width = (segment.span / segment.columns) * 100

  return (
    <Button
      data-slot="calendar-event"
      data-event-id={segment.event.id}
      onPress={() => onActivate(segment.event)}
      // The 2px inset is the negative space that separates touching blocks. A
      // border round each one would be ink that is not data — see the palette
      // note above — and two adjacent borders read as one thick divider.
      style={{ top: y, height, left: `${left}%`, width: `calc(${width}% - 2px)` }}
      className={cn(
        "absolute cursor-pointer overflow-hidden text-left",
        "border-l-2 px-1.5 py-0.5 transition-colors duration-150",
        "outline-none focus-visible:ring-2 focus-visible:ring-quebi-brand-mark focus-visible:ring-inset",
        palette.block,
        palette.edge,
        // A segment continuing past midnight loses the radius on that edge, so
        // the two halves of one event read as one thing cut, not two events.
        segment.continuesBefore ? "rounded-t-none" : "rounded-tr-quebi-sm",
        segment.continuesAfter ? "rounded-b-none" : "rounded-br-quebi-sm",
        isSelected && "ring-2 ring-quebi-brand-mark ring-inset",
      )}
    >
      <BlockText
        event={segment.event}
        locale={locale}
        timeZone={timeZone}
        height={height}
      />
    </Button>
  )
}

interface BlockTextProps {
  event: CalendarEvent
  locale: string
  timeZone: string
  height: number
}

/**
 * Title, time and location, dropped one at a time as the block gets shorter.
 *
 * Text is what makes the colour a second channel rather than the only one, so
 * the title is never the thing that goes: a 20-pixel block is title-only, and
 * the time moves onto the same line where there is room for it.
 */
function BlockText({ event, locale, timeZone, height }: BlockTextProps) {
  const time = formatEventTime(event.start, locale, timeZone)

  if (height < 34) {
    return (
      <span className="flex items-baseline gap-1.5 truncate text-xs leading-tight">
        <span className="font-semibold text-quebi-fg">{event.title}</span>
        <span className="text-quebi-fg-subtle tabular-nums">{time}</span>
      </span>
    )
  }

  return (
    <span className="flex flex-col gap-0.5 text-xs leading-tight">
      <span className="truncate font-semibold text-quebi-fg">{event.title}</span>
      <span className="truncate text-quebi-fg-muted tabular-nums">
        {time}
        {" – "}
        {formatEventTime(event.end, locale, timeZone)}
      </span>
      {event.location && height >= 56 ? (
        <span className="truncate text-quebi-fg-subtle">{event.location}</span>
      ) : null}
    </span>
  )
}

/** The red line across today's column, with the clock time in the gutter end. */
function NowMarker({ top, label }: { top: number; label: string }) {
  return (
    <div
      data-slot="calendar-now-marker"
      className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
      style={{ top }}
    >
      {/* The line is the sighted channel and the text is the other one: a
          horizontal rule at a y offset is not information a screen reader can
          recover, and `aria-label` on a plain div is dropped. */}
      <span className="sr-only">{label}</span>
      <span className="-ml-1 h-2 w-2 shrink-0 rounded-full bg-red-500" aria-hidden="true" />
      <span className="h-px flex-1 bg-red-500" aria-hidden="true" />
    </div>
  )
}

interface AllDayBandProps<E extends CalendarEvent> {
  days: readonly CalendarDate[]
  bands: EventBand<E>[]
  allBands: EventBand<E>[]
  segments: readonly DaySegment<E>[]
  hiddenPerDay: number[]
  calendars: readonly CalendarSource[] | undefined
  columns: React.CSSProperties
  selectedId: string | null
  moreLabel: (count: number) => string
  onActivate: (event: E) => void
  onMoreClick: ((day: CalendarDate, events: E[]) => void) | undefined
}

/** The band above the grid: multi-day and all-day events, stacked in lanes. */
function AllDayBand<E extends CalendarEvent>({
  days,
  bands,
  allBands,
  segments,
  hiddenPerDay,
  calendars,
  columns,
  selectedId,
  moreLabel,
  onActivate,
  onMoreClick,
}: AllDayBandProps<E>) {
  const lanes = bands.reduce((max, band) => Math.max(max, band.lane + 1), 0)
  const overflow = hiddenPerDay.some((count) => count > 0)

  return (
    <div className="relative flex-1 py-1" style={{ minHeight: 28 }}>
      <div className="grid" style={columns}>
        {days.map((day) => (
          <div key={day.toString()} className="border-quebi-line/10 border-l first:border-l-0">
            <div style={{ height: lanes * 22 }} />
          </div>
        ))}
      </div>

      {bands.map((band) => {
        const palette = CALENDAR_COLORS[resolveEventColor(band.event, calendars)]
        const left = (band.startIndex / days.length) * 100
        const width = ((band.endIndex - band.startIndex + 1) / days.length) * 100
        return (
          <Button
            key={band.event.id}
            data-slot="calendar-band"
            data-event-id={band.event.id}
            onPress={() => onActivate(band.event)}
            style={{
              top: 4 + band.lane * 22,
              left: `${left}%`,
              width: `calc(${width}% - 4px)`,
              marginLeft: 2,
            }}
            className={cn(
              "absolute flex h-5 cursor-pointer items-center gap-1.5 overflow-hidden px-2 text-left",
              "border-l-2 text-xs transition-colors duration-150",
              "outline-none focus-visible:ring-2 focus-visible:ring-quebi-brand-mark focus-visible:ring-inset",
              palette.band,
              palette.edge,
              band.continuesBefore ? "rounded-l-none" : "rounded-l-quebi-sm",
              band.continuesAfter ? "rounded-r-none" : "rounded-r-quebi-sm",
              selectedId === band.event.id && "ring-2 ring-quebi-brand-mark ring-inset",
            )}
          >
            <span className="truncate font-semibold text-quebi-fg">{band.event.title}</span>
          </Button>
        )
      })}

      {overflow ? (
        <div className="grid" style={columns}>
          {days.map((day, index) => (
            <div key={day.toString()} className="px-1">
              {(hiddenPerDay[index] ?? 0) > 0 ? (
                <MoreLink
                  count={hiddenPerDay[index] ?? 0}
                  label={moreLabel}
                  onPress={() =>
                    onMoreClick?.(day, eventsOnDay(allBands, segments, index))
                  }
                />
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

    </div>
  )
}

export interface CalendarLegendProps {
  calendars: readonly CalendarSource[]
  className?: string
}

/**
 * The key: one dot and one name per calendar.
 *
 * Two or more series always get a legend — that is the rule that keeps hue a
 * second channel rather than the only one — and it lives in the library because
 * the palette does. An app that hand-rolled this row would be writing the series
 * colours into its own markup, which is the thing `no-hardcoded-design-values`
 * exists to stop; `CalendarTimeline` needs no legend because every row is
 * already labelled with its calendar's name.
 */
export function CalendarLegend({ calendars, className }: CalendarLegendProps) {
  return (
    <div
      data-slot="calendar-legend"
      className={cn("flex flex-wrap items-center gap-x-4 gap-y-1", className)}
    >
      {calendars.map((calendar) => (
        <span key={calendar.id} className="flex items-center gap-1.5 text-quebi-fg-muted text-xs">
          <span
            className={cn("size-2 shrink-0 rounded-full", CALENDAR_COLORS[calendar.color].dot)}
            aria-hidden="true"
          />
          {calendar.name}
        </span>
      ))}
    </div>
  )
}

export interface MoreLinkProps {
  count: number
  label: (count: number) => string
  onPress?: () => void
}

/** The "+N more" affordance, shared by the all-day band and the month cells. */
export function MoreLink({ count, label, onPress }: MoreLinkProps) {
  return (
    <Button
      data-slot="calendar-more"
      data-more-count={count}
      onPress={() => onPress?.()}
      className={cn(
        "w-full cursor-pointer truncate rounded-quebi-sm px-1 text-left text-xs",
        "text-quebi-fg-subtle transition-colors duration-150",
        "hover:bg-quebi-surface/[0.06] hover:text-quebi-fg",
        "outline-none focus-visible:ring-2 focus-visible:ring-quebi-brand-mark focus-visible:ring-inset",
      )}
    >
      {label(count)}
    </Button>
  )
}

/**
 * Everything a grid view forwards to the shell untouched.
 *
 * `DayView` and `WeekView` differ in which days they hand over and in nothing
 * else, so the props they merely pass through are named once here rather than
 * re-declared twice and drifting apart on the third change.
 */
export interface CalendarGridViewProps<E extends CalendarEvent = CalendarEvent>
  extends Pick<
    CalendarShellProps<E>,
    | "events"
    | "calendars"
    | "timeZone"
    | "locale"
    | "startHour"
    | "endHour"
    | "hourHeight"
    | "slotMinutes"
    | "axisWidth"
    | "height"
    | "now"
    | "showAllDayRow"
    | "maxAllDayLanes"
    | "allDayLabel"
    | "moreLabel"
    | "selectedEventId"
    | "defaultSelectedEventId"
    | "onSelectionChange"
    | "onEventClick"
    | "onMoreClick"
    | "className"
  > {}

export type { CalendarColorName, CalendarEvent, CalendarSource }
export { MINUTES_PER_DAY }
