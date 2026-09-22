import { type CalendarDate, today } from "@internationalized/date"
import { useState } from "react"
import { CalendarLegend } from "@/components/calendar-shell"
import {
  calendarMonthLabel,
  calendarRangeLabel,
  CalendarToolbar,
  type CalendarViewName,
} from "@/components/calendar-toolbar"
import {
  Bar,
  CALENDARS,
  calendarToolbarChromeExamples,
  DE,
  LOCALE,
  TIME_ZONE,
  week,
} from "./calendar-toolbar-chrome.examples"
import type { ComponentExample } from "./types"

const Switching = () => {
  const [view, setView] = useState<CalendarViewName>("week")
  const [anchor, setAnchor] = useState<CalendarDate>(() => today(TIME_ZONE))

  const step = view === "month" ? { months: 1 } : view === "week" ? { weeks: 1 } : { days: 1 }
  const label =
    view === "month"
      ? calendarMonthLabel(anchor, { locale: LOCALE, timeZone: TIME_ZONE })
      : calendarRangeLabel(view === "week" ? week(anchor) : [anchor], {
          locale: LOCALE,
          timeZone: TIME_ZONE,
        })

  return (
    <Bar>
      <CalendarToolbar
        {...DE}
        label={label}
        view={view}
        onViewChange={setView}
        onPrevious={() => setAnchor(anchor.subtract(step))}
        onNext={() => setAnchor(anchor.add(step))}
        onToday={() => setAnchor(today(TIME_ZONE))}
      />
      <p className="text-quebi-fg-muted text-sm">
        The label follows the view: a day spells itself out, a week collapses to its two ends, a
        month names itself.
      </p>
    </Bar>
  )
}

const NavigationOnly = () => {
  const [anchor, setAnchor] = useState<CalendarDate>(() => today(TIME_ZONE))

  return (
    <Bar>
      <CalendarToolbar
        {...DE}
        label={calendarRangeLabel([anchor], { locale: LOCALE, timeZone: TIME_ZONE })}
        onPrevious={() => setAnchor(anchor.subtract({ days: 1 }))}
        onNext={() => setAnchor(anchor.add({ days: 1 }))}
        onToday={() => setAnchor(today(TIME_ZONE))}
      />
    </Bar>
  )
}

const SubsetOfViews = () => {
  const [view, setView] = useState<CalendarViewName>("day")
  const anchor = today(TIME_ZONE)

  return (
    <Bar>
      <CalendarToolbar
        {...DE}
        label={calendarRangeLabel([anchor], { locale: LOCALE, timeZone: TIME_ZONE })}
        view={view}
        views={["day", "week"]}
        onViewChange={setView}
      />
    </Bar>
  )
}

const ReadOnlySwitcher = () => {
  const anchor = today(TIME_ZONE)

  return (
    <Bar>
      <CalendarToolbar
        {...DE}
        label={calendarRangeLabel(week(anchor), { locale: LOCALE, timeZone: TIME_ZONE })}
        view="week"
        views={["week", "month"]}
      />
    </Bar>
  )
}

const WithExtraChrome = () => {
  const [view, setView] = useState<CalendarViewName>("week")
  const [shown, setShown] = useState<string[]>(["me", "team"])
  const anchor = today(TIME_ZONE)

  return (
    <Bar>
      <CalendarToolbar
        {...DE}
        label={calendarRangeLabel(week(anchor), { locale: LOCALE, timeZone: TIME_ZONE })}
        view={view}
        views={["week", "month"]}
        onViewChange={setView}
      >
        <CalendarLegend
          calendars={CALENDARS}
          aria-label="Kalender"
          value={shown}
          onChange={setShown}
        />
      </CalendarToolbar>
      <p className="text-quebi-fg-muted text-sm">
        {shown.length} von {CALENDARS.length} Kalendern sichtbar.
      </p>
    </Bar>
  )
}

const PickerLabel = () => {
  const [anchor, setAnchor] = useState<CalendarDate>(() => today(TIME_ZONE))

  return (
    <Bar>
      <CalendarToolbar
        {...DE}
        label={calendarRangeLabel([anchor], { locale: LOCALE, timeZone: TIME_ZONE })}
        labelVariant="picker"
        date={anchor}
        onDateChange={setAnchor}
        onPrevious={() => setAnchor(anchor.subtract({ days: 1 }))}
        onNext={() => setAnchor(anchor.add({ days: 1 }))}
        onToday={() => setAnchor(today(TIME_ZONE))}
      />
    </Bar>
  )
}

const TodayInThePopover = () => {
  const [anchor, setAnchor] = useState<CalendarDate>(() => today(TIME_ZONE))

  return (
    <Bar>
      <CalendarToolbar
        {...DE}
        label={calendarRangeLabel([anchor], { locale: LOCALE, timeZone: TIME_ZONE })}
        labelVariant="picker"
        date={anchor}
        onDateChange={setAnchor}
        todayPlacement="popover"
        onPrevious={() => setAnchor(anchor.subtract({ days: 1 }))}
        onNext={() => setAnchor(anchor.add({ days: 1 }))}
        onToday={() => setAnchor(today(TIME_ZONE))}
      />
    </Bar>
  )
}

const EverythingInThePopover = () => {
  const [view, setView] = useState<CalendarViewName>("week")
  const [anchor, setAnchor] = useState<CalendarDate>(() => today(TIME_ZONE))

  const byMonth = view === "month"
  const step = byMonth ? { months: 1 } : { weeks: 1 }

  return (
    <Bar>
      <CalendarToolbar
        {...DE}
        label={
          byMonth
            ? calendarMonthLabel(anchor, { locale: LOCALE, timeZone: TIME_ZONE })
            : calendarRangeLabel(week(anchor), { locale: LOCALE, timeZone: TIME_ZONE })
        }
        labelVariant="picker"
        pickerGranularity={byMonth ? "month" : "week"}
        locale={LOCALE}
        date={anchor}
        onDateChange={setAnchor}
        navigationPlacement="popover"
        todayPlacement="popover"
        view={view}
        views={["week", "month"]}
        onViewChange={setView}
        onPrevious={() => setAnchor(anchor.subtract(step))}
        onNext={() => setAnchor(anchor.add(step))}
        onToday={() => setAnchor(today(TIME_ZONE))}
      >
        <CalendarLegend calendars={CALENDARS} />
      </CalendarToolbar>
    </Bar>
  )
}

const TodayAsAnIcon = () => {
  const [anchor, setAnchor] = useState<CalendarDate>(() => today(TIME_ZONE))

  return (
    <Bar>
      <CalendarToolbar
        {...DE}
        label={calendarRangeLabel([anchor], { locale: LOCALE, timeZone: TIME_ZONE })}
        labelVariant="picker"
        date={anchor}
        onDateChange={setAnchor}
        todayVariant="icon"
        onPrevious={() => setAnchor(anchor.subtract({ days: 1 }))}
        onNext={() => setAnchor(anchor.add({ days: 1 }))}
        onToday={() => setAnchor(today(TIME_ZONE))}
      />
    </Bar>
  )
}

const PickerLabelByMonth = () => {
  const [anchor, setAnchor] = useState<CalendarDate>(() => today(TIME_ZONE))

  return (
    <Bar>
      <CalendarToolbar
        {...DE}
        label={calendarMonthLabel(anchor, { locale: LOCALE, timeZone: TIME_ZONE })}
        labelVariant="picker"
        pickerGranularity="month"
        date={anchor}
        onDateChange={setAnchor}
        onPrevious={() => setAnchor(anchor.subtract({ months: 1 }))}
        onNext={() => setAnchor(anchor.add({ months: 1 }))}
        onToday={() => setAnchor(today(TIME_ZONE))}
      />
    </Bar>
  )
}

const PickerLabelByWeek = () => {
  const [anchor, setAnchor] = useState<CalendarDate>(() => today(TIME_ZONE))

  return (
    <Bar>
      <CalendarToolbar
        {...DE}
        label={calendarRangeLabel(week(anchor), {
          locale: LOCALE,
          timeZone: TIME_ZONE,
          // The number Outlook puts in the same place. The word is yours
          // because Intl has no name for it; the number is formatted for you.
          weekNumber: "KW",
        })}
        labelVariant="picker"
        pickerGranularity="week"
        // The two things that decide which seven days a row is. Pass what the
        // grid beneath the toolbar is drawn with, or the row and the view mean
        // different weeks.
        locale={LOCALE}
        date={anchor}
        onDateChange={setAnchor}
        onPrevious={() => setAnchor(anchor.subtract({ weeks: 1 }))}
        onNext={() => setAnchor(anchor.add({ weeks: 1 }))}
        onToday={() => setAnchor(today(TIME_ZONE))}
      />
    </Bar>
  )
}

export const calendarToolbarExamples: ComponentExample[] = [
  {
    title: "Switching views",
    description:
      "The toolbar reports presses and owns nothing. Here the page keeps the view and the anchor date, which is what lets one toolbar drive four different grids. Every string it draws is a prop — `todayLabel`, `viewLabels`, `viewLabel`, the two chevron names — so the bar speaks one language rather than the label's and the library's.",
    render: () => <Switching />,
  },
  {
    title: "Navigation only",
    description:
      "Leave out `view` and the switcher disappears; leave out a handler and its control does too. What you wire up is what is drawn.",
    render: () => <NavigationOnly />,
  },
  {
    title: "A subset, translated",
    description:
      "`views` narrows the switch to the modes your page actually has, and `viewLabels` is where the words are translated — the identifiers stay in English.",
    render: () => <SubsetOfViews />,
  },
  {
    title: "A switcher that only reports",
    description:
      "No `onViewChange`. The switcher is the one control that cannot be gated on its handler, because it doubles as the read-only “which view am I in” indicator and dropping it would take that away. The group is fully controlled from `view`, so without a handler a press would fire, change nothing and be re-asserted on the next render — `isDisabled` says so before the press instead of after it.",
    render: () => <ReadOnlySwitcher />,
  },
  {
    title: "Extra chrome",
    description:
      "Children are placed after the switcher. A legend belongs here: it names the calendar colours, which is what stops hue being the only thing telling two calendars apart. Give it `value` and `onChange` and the same row becomes the filter it always looked like — a list of calendars with dots beside them invites the press whether or not it takes one.",
    render: () => <WithExtraChrome />,
  },
  {
    title: "Jump to a date",
    description:
      "`labelVariant=\"picker\"` turns the heading into a button opening a calendar, the way the Calendar’s own header opens the Month Picker. Without it the only way to a distant day is Today or one chevron press at a time. It needs `date` and `onDateChange` — the toolbar still owns nothing. Being a button, the heading joins the chevrons and Today in one bar rather than standing beside their box: everything that moves the date is one control, and the only gap left in the toolbar is the one before the view switcher.",
    render: () => <PickerLabel />,
  },
  {
    title: "Today in the popover",
    description:
      "`todayPlacement=\"popover\"` moves the today button under the grid the heading opens, so the bar is the date and the two chevrons. The word is still `todayLabel`, and pressing it closes the popover — a jump is a destination, so the surface gets out of the way exactly as it does when a day is picked.",
    render: () => <TodayInThePopover />,
  },
  {
    title: "Nothing in the bar but the date",
    description:
      "`navigationPlacement` moves the chevrons too, which leaves the toolbar with the date, the view switcher and whatever chrome you put beside it — the shape to reach for when the row is crowded. The chevrons then step the *view* while the grid above them pages its own month, so they name their unit: `Zurück` here is the caller’s word for both places. That second chevron pair is the cost of this variant; a toolbar with room for a bar is better off keeping them in it.",
    render: () => <EverythingInThePopover />,
  },
  {
    title: "Today as an icon",
    description:
      "`todayVariant=\"icon\"` keeps the button in the bar and drops the word, which is the one control in it whose width is a language — `Aujourd’hui` beside a heading spelling out a date in full is the difference between a bar and a bar that wraps. `todayLabel` is still the accessible name, so nothing is said less.",
    render: () => <TodayAsAnIcon />,
  },
  {
    title: "A week grid, for a week heading",
    description:
      "`pickerGranularity=\"week\"` opens the Week Picker, where the whole row is the target — what Week View passes for you. A heading reading `21.–27. September 2026` names a week, and a day grid there would ask which of the seven you meant when all seven show the same view. The weekday you were anchored on survives the choice, so stepping back to Day lands where you were. `weekNumber` puts the ISO number in front of the range, the way Outlook does — the word is yours, because Intl has no name for it.",
    render: () => <PickerLabelByWeek />,
  },
  {
    title: "A month grid, for a month heading",
    description:
      "`pickerGranularity=\"month\"` opens the Month Picker instead. A heading that reads `September 2026` names a month, so that is what the grid should offer — Month View passes this for you. The day you were anchored on survives the choice.",
    render: () => <PickerLabelByMonth />,
  },
  ...calendarToolbarChromeExamples,
]
