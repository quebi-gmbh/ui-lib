/**
 * The Calendar Toolbar gallery's second half, and the vocabulary both halves
 * share.
 *
 * Split off so each file stays inside the 500-line limit the library publishes
 * for everyone else. The shared constants live *here* rather than in the
 * gallery so the import runs one way: `calendar-toolbar.examples.tsx` imports
 * this file, and this file imports nothing back.
 */
import { type CalendarDate, startOfWeek, today } from "@internationalized/date"
import { Download, PanelLeft, Plus, Printer } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/button"
import type { CalendarSource } from "@/components/calendar-shell"
import {
  calendarRangeLabel,
  CalendarToolbar,
  calendarYearLabel,
  type CalendarViewName,
} from "@/components/calendar-toolbar"
import { MenuItem } from "@/components/menu"
import { SearchField, SearchInput } from "@/components/search-field"
import type { ComponentExample } from "./types"

/** Pinned rather than read from the runtime — see the note in Calendar Shell. */
export const TIME_ZONE = "Europe/Berlin"

/**
 * The locale the labels below are spelled in. A real app passes the one it is
 * already using — the views read it from the nearest I18nProvider instead.
 */
export const LOCALE = "de-DE"

/**
 * Every word the toolbar draws, in the language the labels are already in.
 *
 * The toolbar's own defaults are English, and a bar reading `Dienstag, 22.
 * September 2026` next to `Today` and `Week` is half-translated — which is
 * exactly the shortcut these files must not teach, because an agent copies
 * them verbatim through `/api/components/calendar-toolbar.json`. Every prop
 * that carries a string is here, once, so the examples below stay one language
 * (task #210).
 */
export const DE = {
  todayLabel: "Heute",
  previousLabel: "Zurück",
  nextLabel: "Weiter",
  navigationLabel: "Kalendernavigation",
  viewLabel: "Ansicht",
  menuLabel: "Weitere Optionen",
  viewLabels: {
    day: "Tag",
    week: "Woche",
    month: "Monat",
    timeline: "Zeitstrahl",
    agenda: "Agenda",
    year: "Jahr",
  },
} as const

export const CALENDARS: CalendarSource[] = [
  { id: "me", name: "Mein Kalender", color: "blue" },
  { id: "team", name: "Team", color: "orange" },
]

export const week = (anchor: CalendarDate) => {
  const start = startOfWeek(anchor, LOCALE)
  return Array.from({ length: 7 }, (_, index) => start.add({ days: index }))
}

/**
 * Every example below sits in this.
 *
 * The toolbar's root is `justify-between` — the date at one end, the switcher
 * at the other — and at its intrinsic width there is nothing between them to
 * justify, so a centred cluster is what the gallery used to show for nine of
 * the ten (task #210). A consumer copying one got a toolbar that behaved
 * differently on their page from the one they had just looked at.
 */
export const Bar = ({ children }: { children: React.ReactNode }) => (
  <div className="flex w-full flex-col gap-3">{children}</div>
)

const AYearHeading = () => {
  const [view, setView] = useState<CalendarViewName>("year")
  const [anchor, setAnchor] = useState<CalendarDate>(() => today(TIME_ZONE))

  return (
    <Bar>
      <CalendarToolbar
        {...DE}
        label={calendarYearLabel(anchor, { locale: LOCALE, timeZone: TIME_ZONE })}
        labelVariant="picker"
        pickerGranularity="year"
        date={anchor}
        onDateChange={setAnchor}
        view={view}
        // Two names the library has a word for, and one it cannot: a view's
        // own key with its own label is how a calendar says "4 Tage".
        views={["month", "agenda", "year", { id: "four-day", label: "4 Tage" }]}
        onViewChange={setView}
        onPrevious={() => setAnchor(anchor.subtract({ years: 1 }))}
        onNext={() => setAnchor(anchor.add({ years: 1 }))}
        onToday={() => setAnchor(today(TIME_ZONE))}
      />
      <p className="text-quebi-fg-muted text-sm">Aktive Ansicht: {view}</p>
    </Bar>
  )
}

const TheSlots = () => {
  const [view, setView] = useState<CalendarViewName>("week")
  const [anchor, setAnchor] = useState<CalendarDate>(() => today(TIME_ZONE))

  return (
    <Bar>
      <CalendarToolbar
        {...DE}
        label={calendarRangeLabel(week(anchor), { locale: LOCALE, timeZone: TIME_ZONE })}
        labelVariant="picker"
        pickerGranularity="week"
        locale={LOCALE}
        date={anchor}
        onDateChange={setAnchor}
        view={view}
        views={["week", "month"]}
        onViewChange={setView}
        onPrevious={() => setAnchor(anchor.subtract({ weeks: 1 }))}
        onNext={() => setAnchor(anchor.add({ weeks: 1 }))}
        onToday={() => setAnchor(today(TIME_ZONE))}
        startContent={
          <Button intent="outline" size="sq-sm" aria-label="Seitenleiste umschalten">
            <PanelLeft data-slot="icon" aria-hidden="true" />
          </Button>
        }
        action={
          <Button size="sm">
            <Plus data-slot="icon" aria-hidden="true" />
            Termin
          </Button>
        }
        menu={
          <>
            <MenuItem id="print">
              <Printer data-slot="icon" aria-hidden="true" />
              Drucken
            </MenuItem>
            <MenuItem id="export">
              <Download data-slot="icon" aria-hidden="true" />
              Exportieren
            </MenuItem>
          </>
        }
      >
        <SearchField aria-label="Termine durchsuchen" className="w-44">
          <SearchInput size="sm" placeholder="Suchen" />
        </SearchField>
      </CalendarToolbar>
    </Bar>
  )
}

/**
 * The bounds a real calendar has: a booking window that opens today and closes
 * in four weeks. Pinned relative to `today` so the example reads the same in
 * June and in December.
 */
const WithinBounds = () => {
  const start = today(TIME_ZONE)
  const [anchor, setAnchor] = useState<CalendarDate>(() => start.add({ days: 2 }))

  return (
    <Bar>
      <CalendarToolbar
        {...DE}
        label={calendarRangeLabel([anchor], { locale: LOCALE, timeZone: TIME_ZONE })}
        labelVariant="picker"
        date={anchor}
        onDateChange={setAnchor}
        minValue={start}
        maxValue={start.add({ weeks: 4 })}
        // The toolbar cannot read the clock during render without disagreeing
        // with the prerendered HTML, so whether you are already on today is
        // the caller's to say — and the caller is the one that knows.
        isTodayDisabled={anchor.compare(start) === 0}
        onPrevious={() => setAnchor(anchor.subtract({ days: 1 }))}
        onNext={() => setAnchor(anchor.add({ days: 1 }))}
        onToday={() => setAnchor(start)}
      />
      <p className="text-quebi-fg-muted text-sm">
        Buchbar bis vier Wochen im Voraus. Am Rand des Fensters wird der Pfeil deaktiviert — nicht
        nur das Raster darunter.
      </p>
    </Bar>
  )
}

const WhileLoading = () => {
  const [anchor, setAnchor] = useState<CalendarDate>(() => today(TIME_ZONE))
  const [isPending, setIsPending] = useState(false)

  /** Stands in for the fetch a chevron press really is. */
  const load = (next: CalendarDate) => {
    setAnchor(next)
    setIsPending(true)
    setTimeout(() => setIsPending(false), 900)
  }

  return (
    <Bar>
      <CalendarToolbar
        {...DE}
        label={calendarRangeLabel(week(anchor), { locale: LOCALE, timeZone: TIME_ZONE })}
        labelVariant="picker"
        pickerGranularity="week"
        locale={LOCALE}
        date={anchor}
        onDateChange={load}
        isPending={isPending}
        view="week"
        views={["week", "month"]}
        onViewChange={() => {}}
        onPrevious={() => load(anchor.subtract({ weeks: 1 }))}
        onNext={() => load(anchor.add({ weeks: 1 }))}
        onToday={() => load(today(TIME_ZONE))}
      />
      <p className="text-quebi-fg-muted text-sm">
        Press a chevron: the date controls go quiet for as long as the week is being fetched, so a
        second press cannot queue a second query behind the first.
      </p>
    </Bar>
  )
}

const PairedChevrons = () => {
  const [anchor, setAnchor] = useState<CalendarDate>(() => today(TIME_ZONE))

  return (
    <Bar>
      <CalendarToolbar
        {...DE}
        label={calendarRangeLabel(week(anchor), { locale: LOCALE, timeZone: TIME_ZONE })}
        labelVariant="picker"
        pickerGranularity="week"
        locale={LOCALE}
        date={anchor}
        onDateChange={setAnchor}
        navigationLayout="paired"
        onPrevious={() => setAnchor(anchor.subtract({ weeks: 1 }))}
        onNext={() => setAnchor(anchor.add({ weeks: 1 }))}
        onToday={() => setAnchor(today(TIME_ZONE))}
      />
    </Bar>
  )
}

const OnAPhone = () => {
  const [view, setView] = useState<CalendarViewName>("week")
  const [anchor, setAnchor] = useState<CalendarDate>(() => today(TIME_ZONE))

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="w-full max-w-88 rounded-quebi-md border border-quebi-line/10 p-3">
        <CalendarToolbar
          {...DE}
          label={calendarRangeLabel(week(anchor), { locale: LOCALE, timeZone: TIME_ZONE })}
          labelVariant="picker"
          pickerGranularity="week"
          locale={LOCALE}
          date={anchor}
          onDateChange={setAnchor}
          todayVariant="icon"
          view={view}
          views={["day", "week", "month", "timeline"]}
          onViewChange={setView}
          onPrevious={() => setAnchor(anchor.subtract({ weeks: 1 }))}
          onNext={() => setAnchor(anchor.add({ weeks: 1 }))}
          onToday={() => setAnchor(today(TIME_ZONE))}
        />
      </div>
      <p className="max-w-88 text-quebi-fg-muted text-sm">
        A 352px column, which is a phone with its margins. Narrow the window and the switcher
        collapses to a menu at the same breakpoint.
      </p>
    </div>
  )
}

export const calendarToolbarChromeExamples: ComponentExample[] = [
  {
    title: "A year, an agenda, and a view the library has never heard of",
    description:
      "`pickerGranularity=\"year\"` opens the Year Picker, for a heading that reads `2026`. `views` takes a name the library has a word for (`agenda`, `year`) or an `{ id, label }` for one it cannot — “4 Tage”, “Work week”, “Q3” are what a real calendar's fifth view is called, and no closed union anticipates them. The identifier is what `onViewChange` reports back.",
    render: () => <AYearHeading />,
  },
  {
    title: "The four slots",
    description:
      "`startContent` sits before the date, which is where a sidebar toggle belongs and the far side of the bar from `children`. `children` is chrome after the switcher — a search field, a legend, a time zone. `action` is the primary button behind a rule of its own, so “Neuer Termin” does not read as one more segment of the switcher. `menu` takes the `MenuItem`s for the trailing `⋯`, and the toolbar draws the trigger: the placement is the part every consumer would otherwise answer differently.",
    render: () => <TheSlots />,
  },
  {
    title: "Bounds the chevrons honour",
    description:
      "`minValue` and `maxValue` reach the grid *and* the two chevrons — a bound the picker refuses to select used to be one the `›` beside it walked straight past, one press at a time. The step is `pickerGranularity`'s unit; a view that steps by something else says so with `isPreviousDisabled` / `isNextDisabled`. `isTodayDisabled` is a prop and not a default on purpose: deriving it means reading the clock during render, and this page is prerendered.",
    render: () => <WithinBounds />,
  },
  {
    title: "While the week is being fetched",
    description:
      "A chevron press in a real calendar is a query. `isPending` disables everything that would start another one and puts a spinner in the heading, so the bar says “asked, waiting” rather than looking idle — the bargain `ServerTable` makes in the other surface that reports its whole query outward. The view switcher stays live: changing view is the page's business, not the query in flight.",
    render: () => <WhileLoading />,
  },
  {
    title: "Chevrons side by side",
    description:
      "`navigationLayout=\"paired\"` puts back and forward next to each other instead of at the two ends of the bar. Bracketing reads better — the ends point the two ways the date moves — but it leaves 320px between two buttons a reader presses in alternation, which is the single most repeated interaction on a calendar. Which argument wins depends on how much your reader steps, so it is yours.",
    render: () => <PairedChevrons />,
  },
  {
    title: "In a phone-width column",
    description:
      "The toolbar used to break out of any container narrower than about 400px, with the chevrons clipped off both edges. Three things keep it inside one now: the heading truncates rather than pushing the group past its container, the view switcher collapses to a `Woche ⬇` menu below `sm`, and `calendarRangeLabel(days, { length: \"short\" })` is the caller's lever if even that is too wide.",
    render: () => <OnAPhone />,
  },
]
