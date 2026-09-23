import type { CalendarEvent } from "@/components/calendar-shell"
import { MiniMonth, MiniMonthLegend, type MiniMonthSpan } from "@/components/mini-month"
import { OG_CALENDARS, OG_DAY, OG_MONTH_START, OG_TIME_ZONE, at } from "./og-calendar-data"
import type { OgScene } from "./types"

/** Weekday dots in both calendars, and one absence across a weekend. */
const EVENTS: CalendarEvent[] = [4, 5, 6, 7, 11, 12, 13, 14, 19, 20, 21, 25, 26, 27].flatMap(
  (offset) => {
    const day = OG_MONTH_START.add({ days: offset })
    const events: CalendarEvent[] = [
      { id: `me-${offset}`, title: "Focus", start: at(9, 0, day), end: at(10, 0, day), calendarId: "me" },
    ]
    if (offset % 3 === 0) {
      events.push({
        id: `team-${offset}`,
        title: "Sync",
        start: at(14, 0, day),
        end: at(15, 0, day),
        calendarId: "team",
      })
    }
    return events
  },
)

const SPANS: MiniMonthSpan[] = [
  {
    id: "leave",
    title: "Absence",
    start: OG_MONTH_START.add({ days: 14 }),
    end: OG_MONTH_START.add({ days: 17 }),
  },
]

/**
 * One month, not two: the grid is small by design, and the thumbnail has to
 * magnify it far enough that the dots are a mark rather than a speck. The
 * legend comes along because a dot with no key is decoration.
 */
export const miniMonthOgScene: OgScene = {
  // 1.5 puts every 36×40 cell on whole pixels, so the band has no seams, and
  // takes the 12px weekday row to exactly the 18px floor.
  scale: 1.5,
  render: () => (
    <div className="flex items-center gap-10">
      <MiniMonth
        aria-label="March"
        events={EVENTS}
        calendars={OG_CALENDARS}
        spans={SPANS}
        timeZone={OG_TIME_ZONE}
        defaultMonth={OG_MONTH_START}
        defaultDay={OG_DAY}
        now={null}
        showHeader={false}
      />
      <MiniMonthLegend calendars={OG_CALENDARS} spans={SPANS} className="flex-col items-start text-sm" />
    </div>
  ),
}
