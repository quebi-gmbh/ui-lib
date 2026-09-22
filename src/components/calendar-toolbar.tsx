"use client"

import type { CalendarDate, DateDuration, DateValue } from "@internationalized/date"
import { startOfWeek, today } from "@internationalized/date"
import { CalendarCheck, ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { useState } from "react"
import { useLocale } from "react-aria-components"
import { Button, buttonStyles } from "@/components/button"
import { ButtonGroup } from "@/components/button-group"
import { Calendar } from "@/components/calendar"
import { dayToDate, DEFAULT_CALENDAR_TIME_ZONE } from "@/components/calendar-shell"
import { Loader } from "@/components/loader"
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/menu"
import { MonthPicker } from "@/components/month-picker"
import { Popover, PopoverContent } from "@/components/popover"
import { Separator } from "@/components/separator"
import { ToggleGroup, ToggleGroupItem } from "@/components/toggle-group"
import { isoWeekNumber, WeekPicker } from "@/components/week-picker"
import { YearPicker } from "@/components/year-picker"
import { getDateTimeFormat, getNumberFormat } from "@/lib/intl"
import { cn } from "@/lib/utils"

/**
 * CalendarToolbar — quebi design system
 *
 * The chrome above an Outlook-style view: step back, step forward, jump to
 * today, the range you are looking at, and the switch between day, week, month
 * and timeline. `TableControls` to `CalendarShell`'s `TableShell` — it owns none
 * of the state and reports every press, so the same toolbar drives a view that
 * keeps its own date and one whose date lives in a URL.
 *
 * The heading and the three date controls are joined into one `ButtonGroup`.
 * They used to be four loose items in the order Today, back, forward, heading
 * — two bordered buttons with two borderless circles between them, and the one
 * thing that says what you are looking at arriving last. Read left to right
 * that spelled "Today 13.–19. Juli 2026", as though `Today` were a word in the
 * heading rather than a button. One segmented control fixes both halves: the
 * chevrons get a box, so all of them read as the same kind of thing, and the
 * heading is a segment in the bar instead of a stray label beside it. The
 * heading takes `text-base` in both variants for the same reason: the picker
 * trigger used to be a rung smaller than the static span, so the one line
 * naming the view was the smallest text in the toolbar.
 *
 * Every control is gated on its handler: no `onToday`, no today button, and no
 * group at all when none of the three is wired — an empty bordered box is worse
 * than no box. The group survives any subset, because `ButtonGroup` squares the
 * inner corners off `:first-child` / `:last-child` rather than off a fixed count,
 * so `‹ ›` with no today button and a lone `Today` with no chevrons both come out
 * as one properly rounded control.
 *
 * When the heading is a picker it is a button, so it joins that group rather
 * than standing beside it: one bar reading `[‹][21. September 2026 ⌄][Today][›]`
 * instead of a button, a gap, and a second box holding three more. Everything
 * that changes the date is then one control, and the gap that is left in the
 * toolbar separates the date from the view switcher — which is the only
 * division in it that means anything. Back sits left of the heading rather than
 * after it so the two chevrons bracket the bar: the ends point the two ways the
 * date moves, and what they move sits between them. A `static` heading is a
 * `<span>` and cannot join a group of buttons, so there the old two-box shape
 * stands — and with it the old `‹ Today ›`, which is symmetric because it has
 * no heading to bracket.
 *
 * Where the three of them are drawn is the caller's, one control at a time:
 * `navigationPlacement` and `todayPlacement` each move their control into the
 * picker's popover, so a toolbar can be as small as the date itself with
 * everything that moves it one press away, and `todayVariant` swaps the word
 * for a square icon when the bar is what has to stay short.
 *
 * The view switcher is the one that cannot be — it doubles as the read-only "which
 * view am I in" indicator, and dropping it would take that away — so it is
 * drawn `isDisabled` instead when no `onViewChange` is wired. The group is
 * fully controlled from `view`, so without a handler a press fires, changes
 * nothing, and the next render re-asserts the same selection; disabled says so
 * before the press rather than after it (task #169).
 *
 * `Calendar` exports `SelectMonth`, `StepMonth` and `StepYear`, and they are not
 * reused here: all three read react-aria's `CalendarStateContext`, so they only
 * work *inside* a `<Calendar>` and there is no such state above a week grid.
 * What is shared is the vocabulary — a chevron pair around a label — not the
 * code. `labelVariant="picker"` therefore mounts a grid of its own inside a
 * popover rather than borrowing one of those three (task #166).
 *
 * ## The four slots, and why they are four rather than one `children`
 *
 * `children` used to be the whole vocabulary, and it landed in one place: after
 * the view switcher, inside the right-hand cluster. Every reference calendar
 * puts things somewhere else. The sidebar toggle and the back-to-list control
 * sit *before* the date in Google, Outlook and Teams; "New event" is the most
 * prominent control on the bar and is conventionally its own end of it; and
 * `⋯` — print, export, settings, show weekends — is the standard trailing home
 * for everything that has not earned a permanent place. All three were
 * reachable through `children` and all three came out wedged against the
 * switcher with the same 8px gap, which reads as part of it (task #213).
 *
 * So: `startContent` before the date, `children` after the switcher,
 * `action` after that behind a rule of its own, and `menu` — items, not a
 * trigger — last, in a `⋯` the toolbar draws. The toolbar owns the *placement*,
 * which is the part five consumers would otherwise each answer differently; it
 * owns none of the controls, which is the part they each genuinely differ on.
 * A search field, a time-zone select and a density menu are an `Input`, a
 * `Select` and a `Menu` a page already has, and they go in a slot (task #214).
 *
 * ## The bar has to survive a phone
 *
 * A spelled-out `Dienstag, 22. September 2026` is 257px, four segments of view
 * switcher are another 300, and a 390px viewport has neither. The toolbar was
 * wider than its own card there, with the chevrons clipped off both edges
 * (task #208). Two things fix it and neither shortens the date on a wide
 * screen: the heading segment truncates rather than pushing the group past its
 * container, so the two chevrons stay reachable whatever the label says; and
 * `viewVariant` collapses the switcher to a `Week ⌄` menu below `sm`, which is
 * what Google does and for the same reason. The collapse is CSS — both shapes
 * are rendered and one is hidden — because a media query read during render is
 * a hydration bug on a prerendered page, which is the same argument that keeps
 * every number and date in this library inside an explicit formatter.
 *
 * `calendarRangeLabel(days, { length: "short" })` is the third lever, and the
 * caller's: `22.09.2026` where the bar is the whole page's width budget.
 *
 * ## It is a `<div>`, not a `role="toolbar"`
 *
 * The library ships `toolbar.tsx`, built on react-aria's `Toolbar` for roving
 * focus, and this component does not use it — so a full bar is seven tab stops
 * rather than one with arrow-key navigation inside it. That is a decision, not
 * an oversight (task #215).
 *
 * A `role="toolbar"` takes over arrow keys for the whole row, and two of the
 * things in this row already own theirs: the view switcher is a radiogroup,
 * where left/right moves *and changes the selection*, and the date controls are
 * a `ButtonGroup` whose heading opens a grid that owns every arrow key it can
 * reach. Roving focus above them would either shadow the radiogroup's own
 * handling or leave a reader with two different meanings for the same key
 * depending on where they are in the bar. Google Calendar's toolbar is plain tab
 * stops for the same reason. The name is about where the thing sits on the page,
 * not about the ARIA role — `TableControls` is not a `role="toolbar"` either.
 * The groups still carry names (`navigationLabel`, `viewLabel`), which is what a
 * screen reader actually navigates by here.
 */

/**
 * How the date label is drawn.
 *
 * - `picker` — a button opening a date grid in a popover, the way `Calendar`'s
 *   own header opens the Month Picker (task #160). What the four views draw by
 *   default: without it the only way to another date is `Today` or one chevron
 *   press at a time, which is not a way to reach next March.
 * - `static` — a `<span>`. Still the toolbar's own default, because a toolbar
 *   with no `date` and no `onDateChange` has nothing to open a grid on; ask for
 *   it on a view whose heading is not somewhere to jump from.
 */
export type CalendarToolbarLabelVariant = "static" | "picker"

/**
 * Which grid the picker opens.
 *
 * The choice belongs to whoever knows what the label names, and the answer is
 * the unit the heading is spelled in: `MonthView`'s heading reads
 * `September 2026`, so a day grid there would ask for something the heading
 * does not say and hand back a date the month grid cannot show. By the same
 * argument `WeekView`'s heading reads `21.–27. September 2026` and gets
 * `week` — a `WeekPicker`, where the row is the target and the ISO number is
 * in the gutter, rather than a day grid asking which of the seven you meant
 * when the view will show the whole row whichever you pick.
 *
 * - `day` — a `Calendar`. `DayView` and `CalendarTimeline`.
 * - `week` — a `WeekPicker`. `WeekView`.
 * - `month` — a `MonthPicker`. `MonthView`.
 * - `year` — a `YearPicker`. A heading reading `2026`, which is what an agenda
 *   or a year view spells itself in (task #212).
 *
 * There is no `range`. `RangeCalendar` exists and an agenda over an arbitrary
 * span would want it, but the toolbar holds one `date` and reports one back;
 * a range picker here would hand out a value the toolbar has nowhere to keep
 * and no other prop refers to. That is a second shape of this component rather
 * than a fourth branch of this one.
 */
export type CalendarToolbarPickerGranularity = "day" | "week" | "month" | "year"

/** How far one press of a chevron moves, per unit the heading is spelled in. */
const STEP_BY_GRANULARITY: Record<CalendarToolbarPickerGranularity, DateDuration> = {
  day: { days: 1 },
  week: { weeks: 1 },
  month: { months: 1 },
  year: { years: 1 },
}

/**
 * Where one of the date controls is drawn.
 *
 * - `bar` — in the toolbar, joined to the heading. The default, and the only
 *   answer a static heading can give.
 * - `popover` — inside the grid the heading opens, under the grid and a rule.
 *   The toolbar then carries the date and the view switcher and nothing else,
 *   which is what a page with its own chrome to fit in the same row wants.
 *
 * `popover` needs the picker label, for the same reason the picker needs
 * `date` and `onDateChange`: there is no popover to put a control in, and a
 * control placed in one that does not exist would not be drawn at all. So it
 * falls back to `bar` rather than vanishing — the same fallback, and the same
 * argument, as `labelVariant`.
 */
export type CalendarToolbarControlPlacement = "bar" | "popover"

/**
 * How the today button is drawn.
 *
 * - `text` — the word, which is also where it is translated (`todayLabel`).
 * - `icon` — a square button carrying `todayLabel` as its accessible name, so
 *   the word is still what a screen reader reads. Everything else in the bar is
 *   a square; this is the one control in it whose width is a word, and
 *   `Aujourd\u2019hui` next to a heading spelling out a date in full is the
 *   difference between a bar and a bar that wraps.
 */
export type CalendarToolbarTodayVariant = "text" | "icon"

/**
 * The views a toolbar can switch between. A subset is fine; the order is yours.
 *
 * Six names have a default word and a surface in this library behind them —
 * `agenda` is what `DaySchedule` draws and `year` what `YearPicker` does. The
 * union stays *open* on purpose (task #212): a calendar's fifth view is
 * whatever its product calls it, and "4 days", "Work week" and "Q3" are not
 * members anybody can anticipate. Autocomplete still offers the six; anything
 * else typechecks and needs a word, which is what the object form of `views`
 * is for. The cost is that a typo is a view rather than an error, so pass
 * `views` as a `const` array and let the switcher tell you.
 */
export type CalendarViewName =
  | "day"
  | "week"
  | "month"
  | "timeline"
  | "agenda"
  | "year"
  // `Record<never, never>` rather than `{}`: same "any string, but keep the
  // literals in autocomplete" trick, spelled in a way `noBannedTypes` accepts.
  | (string & Record<never, never>)

/** One switch: a name the library has a word for, or any key with its word. */
export type CalendarViewOption = CalendarViewName | { id: string; label: string }

/**
 * The word for each view the library names, when the caller does not.
 *
 * A lookup rather than an exhaustive `Record<CalendarViewName, string>`, which
 * an open union cannot be. An unknown key with no `viewLabels` entry and no
 * object form falls back to the key itself — visible, unstyled and obviously
 * yours to fix, rather than an empty segment.
 */
const DEFAULT_VIEW_LABELS: Record<string, string> = {
  day: "Day",
  week: "Week",
  month: "Month",
  timeline: "Timeline",
  agenda: "Agenda",
  year: "Year",
}

/**
 * How the view switcher is drawn.
 *
 * - `segmented` — the `ToggleGroup`. Every view visible, one press to any of
 *   them, and the widest of the three.
 * - `menu` — a `Week ⌄` button. One control wide whatever the view count.
 * - `responsive` — the menu below `sm` and the group above it. The default,
 *   because four segments and a spelled-out date do not fit a phone and the
 *   toolbar is the one row on a calendar page that cannot be scrolled away
 *   from (task #208). Both are rendered and CSS hides one: a media query read
 *   during render would disagree with the prerendered HTML.
 */
export type CalendarToolbarViewVariant = "segmented" | "menu" | "responsive"

/**
 * Where the two chevrons sit relative to the heading they step.
 *
 * - `bracketing` — back, heading, today, forward: the ends of the bar point the
 *   two ways the date moves and what they move sits between them. The default,
 *   and the argument for it is in `DateControls` below.
 * - `paired` — back and forward adjacent, then the heading: `[‹][›][22.
 *   September 2026 ⌄][Today]`. Bracketing puts 320px between the two chevrons
 *   with a spelled-out heading in between, and stepping back and forth through
 *   weeks is the single most repeated interaction on a calendar — Google,
 *   Outlook, Fantastical and Cron all keep the pair adjacent for that reason.
 *   Which argument wins depends on how often your reader steps, so it is a prop
 *   rather than a decision in the component (task #215).
 *
 * Both only mean something when there is a heading inside the group. Without
 * one the three controls are `‹ Today ›` either way — symmetric already,
 * because there is nothing between them to bracket.
 */
export type CalendarToolbarNavigationLayout = "bracketing" | "paired"

export interface CalendarToolbarProps {
  /** What you are looking at — usually `calendarRangeLabel(...)`. */
  label: React.ReactNode
  /**
   * Draw the label as a date picker instead of as text. Default `static`.
   *
   * `picker` needs `date` *and* `onDateChange`: the toolbar owns no state, so
   * with either missing there is nothing to open the grid on or to report a
   * choice to, and the label falls back to `static`. That fallback is not the
   * trap the view switcher had — the static label carries exactly the same
   * text, so nothing that looks pressable is left behind.
   *
   * A custom `label` is *wrapped* rather than ignored or warned about. `label`
   * says what you are looking at and `date` says where the picker opens, and
   * the two are independent: a page whose heading reads `Week 39 · Q3` still
   * wants to jump to an arbitrary day, and silently dropping the variant is
   * the class of bug task #169 was about.
   */
  labelVariant?: CalendarToolbarLabelVariant
  /** Where the picker opens, and what it reports relative to. */
  date?: CalendarDate
  /** Called with the day (or month) chosen in the picker. `useCalendarNavigation().goTo`. */
  onDateChange?: (date: CalendarDate) => void
  /** Which grid the label opens. Default `day`; each view passes its own unit. */
  pickerGranularity?: CalendarToolbarPickerGranularity
  /** Accessible name for the grid inside the popover — the place to translate it. */
  pickerLabel?: string
  /**
   * The locale and the first day the `week` grid lays its rows out on.
   *
   * Both default to the ambient locale's answer, and `WeekView` passes its own
   * for both, because they are the two things that decide which seven days a
   * row *is*. A grid that disagreed with the view about that would hand back a
   * week the view then redraws as a different one. The `day` and `month` grids
   * take neither: they read the ambient locale, which is all a day or a month
   * needs.
   */
  locale?: string
  firstDayOfWeek?: "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat"
  /**
   * Dates before / after these cannot be picked — *and cannot be stepped to*.
   *
   * Both reach the grid the heading opens and the two chevrons beside it. They
   * used to reach only the grid, so a `maxValue` the month picker refused to
   * select was one the `›` next to it walked straight past, one press at a time
   * (task #211). A chevron is disabled when the step would land outside the
   * bounds, and the step is `pickerGranularity`'s unit — the unit the heading
   * is spelled in. A view that steps by something else (a four-day view, a
   * fortnight) says so with `isPreviousDisabled` / `isNextDisabled`, because
   * the toolbar owns no state and cannot know.
   */
  minValue?: DateValue
  /** Dates after this cannot be picked, or stepped to. */
  maxValue?: DateValue
  /** Disable every control the toolbar draws. */
  isDisabled?: boolean
  /** Override the bound-derived disabled state of the back chevron. */
  isPreviousDisabled?: boolean
  /** Override the bound-derived disabled state of the forward chevron. */
  isNextDisabled?: boolean
  /**
   * Grey the today button out, the way every reference calendar does when the
   * view already contains today.
   *
   * A prop with no derived default, which is the one thing here that looks like
   * an omission and is not. Deriving it means `today(timeZone)` during render,
   * and this site prerenders: the build machine's day would be baked into the
   * HTML and the browser's day rolled at hydration, which is the same class of
   * bug as a bare `toLocaleString()`. The caller already holds today — it is
   * what `onToday` navigates to — so the honest owner of the answer is the
   * caller (task #211).
   */
  isTodayDisabled?: boolean
  /**
   * A press on a chevron is a fetch, and the toolbar says so.
   *
   * Every control that changes the date is disabled and the heading carries a
   * spinner, so a second press cannot queue a second query behind the first —
   * `ServerTable`'s bargain, in the surface that has the same one (task #214).
   * The view switcher stays live: switching view is the page's business and is
   * usually not the query in flight.
   */
  isPending?: boolean
  /** The active view. Omit to hide the switcher. */
  view?: CalendarViewName
  /** Which switches to offer. Defaults to the four the library draws grids for. */
  views?: readonly CalendarViewOption[]
  /** Override one or more switch labels — the place to translate them. */
  viewLabels?: Record<string, string>
  /** Accessible name for the switcher itself — the place to translate it. */
  viewLabel?: string
  /** Segmented, a menu, or a menu on a phone and segmented above it. */
  viewVariant?: CalendarToolbarViewVariant
  /** Omit to draw the switcher as a disabled indicator rather than a dead control. */
  onViewChange?: (view: CalendarViewName) => void
  onPrevious?: () => void
  onNext?: () => void
  onToday?: () => void
  /** Where the two chevrons are drawn. Default `bar`. */
  navigationPlacement?: CalendarToolbarControlPlacement
  /** Bracketing the heading, or adjacent to each other. Default `bracketing`. */
  navigationLayout?: CalendarToolbarNavigationLayout
  /** Where the today button is drawn. Default `bar`; independent of the chevrons. */
  todayPlacement?: CalendarToolbarControlPlacement
  /** The word or a square icon. Default `text`. */
  todayVariant?: CalendarToolbarTodayVariant
  /**
   * Accessible names for the two chevrons, and the text on the today button.
   *
   * The chevrons have no default string but two, because where they are drawn
   * decides how much they have to say. In the bar they are the only chevrons
   * in sight and `Previous` is enough. In the popover they sit under a grid
   * that pages itself with a chevron pair of its own — the ambiguity
   * `CalendarHeader` drops its paging pair to avoid — so there they name their
   * unit, `Previous week`, the way `CalendarStepper` names months and years.
   * Pass one and it is used in both places, which is what a translation wants.
   */
  previousLabel?: string
  nextLabel?: string
  todayLabel?: string
  /** Accessible name for the group the three of them are joined into. */
  navigationLabel?: string
  /**
   * Chrome placed *before* the date — the sidebar toggle, back to the list.
   *
   * Where a reader looks for those, and the far side of the bar from where
   * `children` lands (task #213).
   */
  startContent?: React.ReactNode
  /** Extra chrome, placed after the view switcher — a filter, a legend, a search. */
  children?: React.ReactNode
  /**
   * The primary action — "New event" — at the trailing end, behind a rule.
   *
   * Its own slot rather than a `children` convention because the rule is the
   * point: a `Button` in `children` sits 8px from the view switcher and reads
   * as the last segment of it.
   */
  action?: React.ReactNode
  /**
   * `MenuItem`s for the trailing `⋯` — print, export, settings, show weekends.
   *
   * The items, not a trigger: the trigger is the thing every consumer would
   * otherwise place differently, and it is the only part of an overflow menu
   * that is the same everywhere.
   */
  menu?: React.ReactNode
  /** Accessible name for the `⋯` — the place to translate it. */
  menuLabel?: string
  className?: string
}

export function CalendarToolbar({
  label,
  labelVariant = "static",
  date,
  onDateChange,
  pickerGranularity = "day",
  pickerLabel,
  locale,
  firstDayOfWeek,
  minValue,
  maxValue,
  isDisabled,
  isPreviousDisabled,
  isNextDisabled,
  isTodayDisabled,
  isPending,
  view,
  views = ["day", "week", "month", "timeline"],
  viewLabels,
  viewLabel = "Calendar view",
  viewVariant = "responsive",
  onViewChange,
  onPrevious,
  onNext,
  onToday,
  navigationPlacement = "bar",
  navigationLayout = "bracketing",
  todayPlacement = "bar",
  todayVariant = "text",
  previousLabel,
  nextLabel,
  todayLabel = "Today",
  navigationLabel = "Calendar navigation",
  menuLabel = "More options",
  startContent,
  children,
  action,
  menu,
  className,
}: CalendarToolbarProps) {
  const barPreviousLabel = previousLabel ?? "Previous"
  const barNextLabel = nextLabel ?? "Next"
  const popoverPreviousLabel = previousLabel ?? `Previous ${pickerGranularity}`
  const popoverNextLabel = nextLabel ?? `Next ${pickerGranularity}`

  // A press that fetches is a press that must not be repeated, so `isPending`
  // reaches every control that moves the date — including the heading, which
  // would otherwise ask for a second date while the first is in flight.
  const dateDisabled = isDisabled || isPending

  // The bounds the grid enforces, enforced on the chevrons as well. `date` is
  // what the toolbar has; the step is the unit the heading is spelled in.
  const step = STEP_BY_GRANULARITY[pickerGranularity]
  const isOutOfBounds = (candidate: CalendarDate) =>
    (minValue !== undefined && candidate.compare(minValue) < 0) ||
    (maxValue !== undefined && candidate.compare(maxValue) > 0)
  const previousDisabled = isPreviousDisabled ?? (date ? isOutOfBounds(date.subtract(step)) : false)
  const nextDisabled = isNextDisabled ?? (date ? isOutOfBounds(date.add(step)) : false)

  // Computed as the element rather than as a boolean, because the two things
  // that decide it are also the two the picker needs, and TypeScript only
  // narrows them here.
  const picker =
    labelVariant === "picker" && date && onDateChange ? (
      <CalendarToolbarPicker
        label={label}
        date={date}
        onDateChange={onDateChange}
        granularity={pickerGranularity}
        pickerLabel={pickerLabel}
        locale={locale}
        firstDayOfWeek={firstDayOfWeek}
        minValue={minValue}
        maxValue={maxValue}
        isDisabled={dateDisabled}
        isPending={isPending}
        onPrevious={navigationPlacement === "popover" ? onPrevious : undefined}
        onNext={navigationPlacement === "popover" ? onNext : undefined}
        onToday={todayPlacement === "popover" ? onToday : undefined}
        isPreviousDisabled={previousDisabled}
        isNextDisabled={nextDisabled}
        isTodayDisabled={isTodayDisabled}
        navigationLayout={navigationLayout}
        previousLabel={popoverPreviousLabel}
        nextLabel={popoverNextLabel}
        todayLabel={todayLabel}
        todayVariant={todayVariant}
        navigationLabel={navigationLabel}
      />
    ) : null

  // A placement of `popover` only moves a control when there is a popover; with
  // a static heading the control stays in the bar rather than going nowhere.
  const movedToPopover = (placement: CalendarToolbarControlPlacement) =>
    picker !== null && placement === "popover"

  const barPrevious = movedToPopover(navigationPlacement) ? undefined : onPrevious
  const barNext = movedToPopover(navigationPlacement) ? undefined : onNext
  const barToday = movedToPopover(todayPlacement) ? undefined : onToday
  const hasBarControls = Boolean(barPrevious || barToday || barNext)

  // `heading` is the picker or nothing: a static heading is a `<span>` and
  // cannot join a group of buttons, so there the slot renders nothing and the
  // bar is the three date controls exactly as it was.
  const barControls = (
    <DateControls
      heading={picker}
      layout={navigationLayout}
      onPrevious={barPrevious}
      onNext={barNext}
      onToday={barToday}
      previousLabel={barPreviousLabel}
      nextLabel={barNextLabel}
      todayLabel={todayLabel}
      todayVariant={todayVariant}
      isDisabled={dateDisabled}
      isPreviousDisabled={previousDisabled}
      isNextDisabled={nextDisabled}
      isTodayDisabled={isTodayDisabled}
    />
  )

  // Resolved once, because both shapes of the switcher draw from it: a bare
  // name takes the caller's word, then the library's, then the key itself.
  const viewOptions = views.map((option) =>
    typeof option === "string"
      ? { id: option, label: viewLabels?.[option] ?? DEFAULT_VIEW_LABELS[option] ?? option }
      : { id: option.id, label: viewLabels?.[option.id] ?? option.label },
  )
  const activeView = viewOptions.find((option) => option.id === view)
  const switcherDisabled = isDisabled || !onViewChange
  const changeView = (key: unknown) => {
    if (typeof key === "string") onViewChange?.(key)
  }

  return (
    <div
      data-slot="calendar-toolbar"
      aria-busy={isPending || undefined}
      className={cn("flex flex-wrap items-center justify-between gap-3", className)}
    >
      {/* `min-w-0` on the cluster and `max-w-full` on the group below are what
          let the heading's `truncate` take effect: a flex child's minimum size
          is its content unless it is told otherwise, so without them the group
          grows past the container instead of the label shortening. */}
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        {startContent}
        {picker ? (
          // No `data-slot` of its own on either group: `ButtonGroup` sets its
          // own before the spread, so one here would replace it and quietly
          // unhook the `has-[>[data-slot=button-group]]` rule a nested group
          // relies on. `role="group"` plus the name below is the handle, and it
          // is the one a test or a screen reader already reaches for.
          //
          // The heading is a button, so it joins the bar rather than standing
          // in front of it — `DateControls` draws it between the back chevron
          // and `Today`. With nothing left in the bar to join it to there is no
          // bar: a lone button in a group named for navigation it does not
          // contain says something untrue.
          hasBarControls ? (
            <ButtonGroup className="max-w-full" aria-label={navigationLabel}>
              {barControls}
            </ButtonGroup>
          ) : (
            picker
          )
        ) : (
          <>
            <span
              data-slot="calendar-toolbar-label"
              className="font-semibold text-base text-quebi-fg tracking-tight"
            >
              {label}
            </span>
            {isPending ? <Loader className="text-quebi-fg-muted" /> : null}
            {hasBarControls ? (
              <ButtonGroup aria-label={navigationLabel}>{barControls}</ButtonGroup>
            ) : null}
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {view && viewOptions.length > 1 ? (
          <>
            {viewVariant === "menu" ? null : (
              <ToggleGroup
                // 38px overall, which is what the date controls beside it are.
                // `size="xs"` drew a 36px group next to them (task #209).
                size="sm"
                height="control"
                aria-label={viewLabel}
                disallowEmptySelection
                isDisabled={switcherDisabled}
                selectedKeys={[view]}
                onSelectionChange={(keys) => changeView([...keys][0])}
                className={viewVariant === "responsive" ? "hidden sm:inline-flex" : undefined}
              >
                {viewOptions.map((option) => (
                  <ToggleGroupItem key={option.id} id={option.id}>
                    {option.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            )}
            {viewVariant === "segmented" ? null : (
              <Menu>
                <MenuTrigger
                  // The button says the view; the group name says what kind of
                  // thing it is. `TableDensityToggle` names itself the same way.
                  aria-label={`${viewLabel}: ${activeView?.label ?? view}`}
                  isDisabled={switcherDisabled}
                  className={cn(
                    buttonStyles({ intent: "outline", size: "sm" }),
                    viewVariant === "responsive" && "sm:hidden",
                  )}
                >
                  {activeView?.label ?? view}
                  <ChevronDown data-slot="icon" className="text-quebi-fg-muted" aria-hidden="true" />
                </MenuTrigger>
                <MenuContent
                  placement="bottom end"
                  selectionMode="single"
                  disallowEmptySelection
                  selectedKeys={[view]}
                  onSelectionChange={(keys) => {
                    if (keys === "all") return
                    changeView([...keys][0])
                  }}
                >
                  {viewOptions.map((option) => (
                    <MenuItem key={option.id} id={option.id}>
                      {option.label}
                    </MenuItem>
                  ))}
                </MenuContent>
              </Menu>
            )}
          </>
        ) : null}
        {children}
        {action ? (
          <>
            {/* The rule is the slot: without it the action reads as one more
                segment of the switcher rather than as the thing the bar is for. */}
            <Separator orientation="vertical" className="mx-1 h-5 self-center" />
            {action}
          </>
        ) : null}
        {menu ? (
          <Menu>
            <MenuTrigger
              aria-label={menuLabel}
              isDisabled={isDisabled}
              className={buttonStyles({ intent: "outline", size: "sq-sm" })}
            >
              <MoreHorizontal data-slot="icon" aria-hidden="true" />
            </MenuTrigger>
            <MenuContent placement="bottom end">{menu}</MenuContent>
          </Menu>
        ) : null}
      </div>
    </div>
  )
}

interface DateControlsProps {
  /** The picker heading, drawn between back and today. Nothing in the popover. */
  heading?: React.ReactNode
  layout: CalendarToolbarNavigationLayout
  onPrevious: (() => void) | undefined
  onNext: (() => void) | undefined
  onToday: (() => void) | undefined
  previousLabel: string
  nextLabel: string
  todayLabel: string
  todayVariant: CalendarToolbarTodayVariant
  isDisabled: boolean | undefined
  isPreviousDisabled: boolean | undefined
  isNextDisabled: boolean | undefined
  isTodayDisabled: boolean | undefined
}

/**
 * Back, the heading, today and forward, in that order, as bare buttons.
 *
 * A fragment rather than a group, because the box around them is the caller's
 * question and it has two answers: in the bar they share the heading's box, and
 * in the popover they are a row of their own under the grid. `ButtonGroup`
 * squares its inner corners off `:first-child` / `:last-child` rather than off a
 * fixed count, so any subset — with or without a heading among them — still
 * comes out as one properly rounded control.
 *
 * Back comes before the heading because the two chevrons are then the ends of
 * the bar, and everything between them is what they move: the date you are
 * looking at, and the one press that goes home. With the heading first the bar
 * read `[13.–19. Juli 2026 ⌄][‹][Today][›]`, which puts a date, a step back and
 * a step forward on the same side of the thing they step; bracketed, the shape
 * says which way each end goes and the heading stays the widest segment in the
 * middle rather than the one the eye starts at and then has to leave.
 *
 * Each is gated on its handler: no `onToday`, no today button. Without a
 * heading — in the popover, or behind a static label — the three of them are
 * back / today / forward again, `Today` in the middle of a symmetric unit,
 * which is what stops it reading as a word in the date the way it did when the
 * three of them came first.
 *
 * `layout="paired"` is the other answer, and the argument against bracketing:
 * it is 320px of mouse traverse between two buttons a reader presses in
 * alternation. See `CalendarToolbarNavigationLayout` above.
 */
function DateControls({
  heading,
  layout,
  onPrevious,
  onNext,
  onToday,
  previousLabel,
  nextLabel,
  todayLabel,
  todayVariant,
  isDisabled,
  isPreviousDisabled,
  isNextDisabled,
  isTodayDisabled,
}: DateControlsProps) {
  const previous = onPrevious ? (
    <Button
      intent="outline"
      size="sq-sm"
      aria-label={previousLabel}
      isDisabled={isDisabled || isPreviousDisabled}
      onPress={onPrevious}
    >
      <ChevronLeft data-slot="icon" className="size-4" aria-hidden="true" />
    </Button>
  ) : null

  const next = onNext ? (
    <Button
      intent="outline"
      size="sq-sm"
      aria-label={nextLabel}
      isDisabled={isDisabled || isNextDisabled}
      onPress={onNext}
    >
      <ChevronRight data-slot="icon" className="size-4" aria-hidden="true" />
    </Button>
  ) : null

  const jumpToToday = onToday ? (
    todayVariant === "icon" ? (
      // The word is still the accessible name: the icon is a width
      // decision, not a decision to say less.
      <Button
        intent="outline"
        size="sq-sm"
        aria-label={todayLabel}
        isDisabled={isDisabled || isTodayDisabled}
        onPress={onToday}
      >
        <CalendarCheck data-slot="icon" className="size-4" aria-hidden="true" />
      </Button>
    ) : (
      <Button
        intent="outline"
        size="sm"
        isDisabled={isDisabled || isTodayDisabled}
        onPress={onToday}
      >
        {todayLabel}
      </Button>
    )
  ) : null

  // `paired` only says something with a heading between them to pull apart.
  // Without one the two chevrons are already adjacent around `Today`.
  return layout === "paired" && heading ? (
    <>
      {previous}
      {next}
      {heading}
      {jumpToToday}
    </>
  ) : (
    <>
      {previous}
      {heading}
      {jumpToToday}
      {next}
    </>
  )
}

interface CalendarToolbarPickerProps {
  label: React.ReactNode
  date: CalendarDate
  onDateChange: (date: CalendarDate) => void
  granularity: CalendarToolbarPickerGranularity
  pickerLabel: string | undefined
  locale: string | undefined
  firstDayOfWeek: CalendarToolbarProps["firstDayOfWeek"]
  minValue: DateValue | undefined
  maxValue: DateValue | undefined
  isDisabled: boolean | undefined
  isPending: boolean | undefined
  /** The date controls placed in here rather than in the bar. Any subset. */
  onPrevious: (() => void) | undefined
  onNext: (() => void) | undefined
  onToday: (() => void) | undefined
  isPreviousDisabled: boolean | undefined
  isNextDisabled: boolean | undefined
  isTodayDisabled: boolean | undefined
  navigationLayout: CalendarToolbarNavigationLayout
  previousLabel: string
  nextLabel: string
  todayLabel: string
  todayVariant: CalendarToolbarTodayVariant
  navigationLabel: string
}

/**
 * The date label as a trigger, and the grid it opens.
 *
 * Its own component because the open state is a hook and the label is a
 * conditional. Shaped after `Calendar`'s `SelectMonthYear`, down to the two
 * things that are easy to get wrong there:
 *
 * - **No `aria-label` on the trigger.** It would *replace* the button's own
 *   text as the accessible name, and "Sunday, 20 September 2026" is the more
 *   useful of the two; `aria-expanded` already says it opens something. The
 *   stable handle for a test or a restyle is `data-slot`, as everywhere else.
 * - **The popover closes in `onChange`.** The toolbar keeps no date, so the
 *   choice goes upward and the surface gets out of the way; leaving it open
 *   would sit a grid over the view the press just changed.
 *
 * Whatever `navigationPlacement` / `todayPlacement` send in here is drawn under
 * the grid, behind a rule, as the same `‹ Today ›` unit the bar would have
 * drawn. `Today` is the easy one. The chevrons put a second chevron pair in a
 * surface that already has one — the day grid pages its month with `‹ ›`, the
 * month grid its year — and that is the exact ambiguity `CalendarHeader` drops
 * its own pair to avoid in month mode. Three things keep the two apart here,
 * and a toolbar that does not need it is better off leaving the chevrons in the
 * bar: they are named for the unit they step (`Previous week`, against the
 * grid's bare `Previous`), they are outline buttons in a group rather than
 * ghost circles in a header, and they are below a rule with `Today` between
 * them. The grid moving its selection with every press is what confirms which
 * is which.
 *
 * A month choice keeps the day the view was anchored on, and a week choice
 * keeps the weekday. `MonthPicker` reports the first of the month and
 * `WeekPicker` a whole week, because that is all either was asked for, but the
 * anchor is a date — dropping to the 1st, or to the Monday, would silently move
 * a consumer who switches back to Day. `era` travels with `year` and `month`:
 * in an era calendar the year counts from the start of the era, so two
 * different years can both be year 1.
 */
function CalendarToolbarPicker({
  label,
  date,
  onDateChange,
  granularity,
  pickerLabel,
  locale,
  firstDayOfWeek,
  minValue,
  maxValue,
  isDisabled,
  isPending,
  onPrevious,
  onNext,
  onToday,
  isPreviousDisabled,
  isNextDisabled,
  isTodayDisabled,
  navigationLayout,
  previousLabel,
  nextLabel,
  todayLabel,
  todayVariant,
  navigationLabel,
}: CalendarToolbarPickerProps) {
  const { locale: ambientLocale } = useLocale()
  const [isOpen, setIsOpen] = useState(false)
  const gridLabel = pickerLabel ?? DEFAULT_GRID_LABELS[granularity]

  // Computed here as well as inside the grid, and from the same two inputs, so
  // that the week handed down as the value and the week read back out of the
  // choice are the same seven days.
  const weekStart = startOfWeek(date, locale ?? ambientLocale, firstDayOfWeek)

  return (
    <Popover isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button
        data-slot="calendar-toolbar-label"
        intent="outline"
        size="sm"
        isDisabled={isDisabled}
        // `sq-sm` is 9.5 and `sm`'s own `py-2` around `text-base` is 10.5, so
        // the heading used to stand a rung taller than the chevrons beside it.
        // Unnoticeable across a gap; inside one box it is a step in the edge.
        //
        // `min-w-0` is what lets the label below shorten instead of the group
        // growing past its container — the heading is the only segment in the
        // bar whose width is a sentence, so it is the one that has to give
        // (task #208).
        className="min-w-0 py-1.5 font-semibold text-base tracking-tight"
      >
        <span className="truncate">{label}</span>
        {isPending ? (
          <Loader className="text-quebi-fg-muted" />
        ) : (
          <ChevronDown data-slot="icon" className="text-quebi-fg-muted" />
        )}
      </Button>
      <PopoverContent placement="bottom start" className="w-auto max-w-none p-3">
        {granularity === "year" ? (
          <YearPicker
            autoFocus
            aria-label={gridLabel}
            value={date}
            minValue={minValue}
            maxValue={maxValue}
            isDisabled={isDisabled}
            onChange={(next) => {
              setIsOpen(false)
              // `YearPicker` reports January 1; the anchor keeps its month and
              // day for the same reason a month choice keeps the day — a
              // consumer who switches back to Day should land where they were.
              onDateChange(date.set({ era: next.era, year: next.year }))
            }}
          />
        ) : granularity === "month" ? (
          <MonthPicker
            autoFocus
            aria-label={gridLabel}
            calendar={date.calendar}
            value={date}
            minValue={minValue}
            maxValue={maxValue}
            isDisabled={isDisabled}
            onChange={(next) => {
              setIsOpen(false)
              onDateChange(date.set({ era: next.era, year: next.year, month: next.month }))
            }}
          />
        ) : granularity === "week" ? (
          <WeekPicker
            autoFocus
            aria-label={gridLabel}
            value={{ start: weekStart, end: weekStart.add({ days: 6 }) }}
            locale={locale}
            firstDayOfWeek={firstDayOfWeek}
            minValue={minValue}
            maxValue={maxValue}
            isDisabled={isDisabled}
            onChange={(next) => {
              setIsOpen(false)
              // `compare` between two CalendarDates is their distance in
              // days, so this carries the anchor's weekday into the chosen
              // week — the promise the month grid already makes about the day
              // of the month. Step back to Day afterwards and you land on the
              // weekday you were on, not on everybody's Monday.
              onDateChange(next.start.add({ days: date.compare(weekStart) }))
            }}
          />
        ) : (
          <Calendar
            autoFocus
            aria-label={gridLabel}
            value={date}
            minValue={minValue}
            maxValue={maxValue}
            isDisabled={isDisabled}
            onChange={(next) => {
              setIsOpen(false)
              onDateChange(next)
            }}
          />
        )}
        {onPrevious || onToday || onNext ? (
          <div className="mt-3 flex justify-center border-quebi-line/10 border-t pt-3">
            <ButtonGroup aria-label={navigationLabel}>
              <DateControls
                layout={navigationLayout}
                onPrevious={onPrevious}
                onNext={onNext}
                // A step and a jump are different things. The chevrons leave the
                // popover open, because the grid is the feedback — press back
                // twice and you watch the selection walk back two weeks. `Today`
                // is a destination, so it gets out of the way exactly as picking
                // a day does; leaving it open would sit a grid over the view the
                // press just changed.
                onToday={
                  onToday
                    ? () => {
                        setIsOpen(false)
                        onToday()
                      }
                    : undefined
                }
                previousLabel={previousLabel}
                nextLabel={nextLabel}
                todayLabel={todayLabel}
                todayVariant={todayVariant}
                isDisabled={isDisabled}
                isPreviousDisabled={isPreviousDisabled}
                isNextDisabled={isNextDisabled}
                isTodayDisabled={isTodayDisabled}
              />
            </ButtonGroup>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}

/** The accessible name of the grid, when the caller does not translate one. */
const DEFAULT_GRID_LABELS: Record<CalendarToolbarPickerGranularity, string> = {
  day: "Choose date",
  week: "Choose week",
  month: "Choose month",
  year: "Choose year",
}

/** How much of the date the heading spells out. */
export type RangeLabelLength = "long" | "short"

export interface RangeLabelOptions {
  locale?: string
  timeZone?: string
  /**
   * `long` spells the weekday and the month out — `Dienstag, 22. September
   * 2026`, 257px of it. `short` is the numeric form the same locale writes
   * dates in, `22.09.2026`, which is a third of the width.
   *
   * A heading is the widest thing in the toolbar and the toolbar has to fit a
   * phone, so this is the caller's lever for that — the component's two are
   * truncation and the collapsing view switcher (task #208). Default `long`.
   */
  length?: RangeLabelLength
  /**
   * Put the ISO week number in front of the range: `KW 39 · 21.–27. September`.
   *
   * Conventional in European calendars and standard in Outlook, and the number
   * was already computed one file over — `WeekPicker` draws it in its gutter,
   * and this reads it from there rather than keeping a second answer to which
   * week a Thursday is in (task #214).
   *
   * The word is yours, because `Intl` has no name for it: `"KW"`, `"Week"`,
   * `"sem."`. `true` gives the bare number. The number itself still goes
   * through `getNumberFormat`, like every other number in this library.
   */
  weekNumber?: boolean | string
}

/**
 * The heading for a run of days: one date spelled out, or a range collapsed as
 * far as the two ends allow.
 *
 * `21.–27. September 2026` says the month once because both ends share it;
 * `28. Sep – 4. Okt 2026` cannot, and says the year once because they do. Every
 * part goes through `getDateTimeFormat`, so the site's prerender and the browser
 * that hydrates it produce the same string — a bare `toLocaleDateString()` here
 * is a hydration bug, not a shortcut.
 */
export function calendarRangeLabel(
  days: readonly CalendarDate[],
  {
    locale,
    timeZone = DEFAULT_CALENDAR_TIME_ZONE,
    length = "long",
    weekNumber,
  }: RangeLabelOptions = {},
): string {
  const first = days[0]
  const last = days.length > 0 ? days[days.length - 1] : undefined
  if (!first || !last || !locale) return ""

  const start = dayToDate(first, timeZone)
  const end = dayToDate(last, timeZone)

  const range =
    first.compare(last) === 0
      ? getDateTimeFormat(locale, {
          ...(length === "short"
            ? { day: "2-digit", month: "2-digit" }
            : { weekday: "long", day: "numeric", month: "long" }),
          year: "numeric",
          timeZone,
        }).format(start)
      : // `formatRange` is the part of Intl written for exactly this: it elides
        // the shared month or year itself, in whatever way the locale does it.
        getDateTimeFormat(locale, {
          ...(length === "short"
            ? { day: "2-digit", month: "2-digit" }
            : { day: "numeric", month: first.month === last.month ? "long" : "short" }),
          year: "numeric",
          timeZone,
        }).formatRange(start, end)

  if (!weekNumber) return range
  return `${weekNumberLabel(days, locale, weekNumber)} · ${range}`
}

/**
 * `KW 39` for the week these days sit in.
 *
 * The number is taken from the day three in from the run's start rather than
 * from its first: in a Sunday-first locale a row's Sunday belongs to the
 * *previous* ISO week, and three days in lands on a day the row's own week owns
 * whatever the locale's first day is. Same expression as `WeekPicker`'s gutter,
 * and the same reason.
 */
function weekNumberLabel(
  days: readonly CalendarDate[],
  locale: string,
  weekNumber: boolean | string,
): string {
  const dominant = days[Math.min(3, days.length - 1)] ?? days[0]
  const formatted = getNumberFormat(locale, {}).format(isoWeekNumber(dominant as CalendarDate))
  return typeof weekNumber === "string" ? `${weekNumber} ${formatted}` : formatted
}

/** `September 2026` — the month view's heading. `short` gives `Sep 2026`. */
export function calendarMonthLabel(
  month: CalendarDate,
  { locale, timeZone = DEFAULT_CALENDAR_TIME_ZONE, length = "long" }: RangeLabelOptions = {},
): string {
  if (!locale) return ""
  return getDateTimeFormat(locale, {
    month: length === "short" ? "short" : "long",
    year: "numeric",
    timeZone,
  }).format(dayToDate(month, timeZone))
}

/** `2026` — a year view's heading, through the same formatter as every other. */
export function calendarYearLabel(
  year: CalendarDate,
  { locale, timeZone = DEFAULT_CALENDAR_TIME_ZONE }: RangeLabelOptions = {},
): string {
  if (!locale) return ""
  return getDateTimeFormat(locale, { year: "numeric", timeZone }).format(dayToDate(year, timeZone))
}

/** The locale a view formats in: the prop, else the nearest `I18nProvider`. */
export function useCalendarLocale(override?: string): string {
  const { locale } = useLocale()
  return override ?? locale
}

export interface CalendarNavigationOptions {
  /** Controlled anchor date. */
  date?: CalendarDate
  /** Starting anchor date when uncontrolled. Defaults to today in `timeZone`. */
  defaultDate?: CalendarDate
  onDateChange?: (date: CalendarDate) => void
  /** How far one press of a chevron moves. `{ days: 7 }` for a week view. */
  step: DateDuration
  timeZone?: string
}

/**
 * The anchor date a view is drawn around, and the three things the toolbar does
 * to it.
 *
 * Controlled through `date` or self-managed from `defaultDate` — the same pair
 * every other stateful component here offers. The uncontrolled default reads the
 * clock, which on a prerendered page means the build machine's day, so a route
 * that is prerendered should pass `defaultDate` and decide for itself; the
 * examples in this library all do, which is also what keeps the gallery stable.
 */
export function useCalendarNavigation({
  date,
  defaultDate,
  onDateChange,
  step,
  timeZone = DEFAULT_CALENDAR_TIME_ZONE,
}: CalendarNavigationOptions) {
  const [uncontrolled, setUncontrolled] = useState<CalendarDate>(
    () => defaultDate ?? today(timeZone),
  )
  const current = date ?? uncontrolled

  const move = (next: CalendarDate) => {
    if (date === undefined) setUncontrolled(next)
    onDateChange?.(next)
  }

  return {
    date: current,
    goToPrevious: () => move(current.subtract(step)),
    goToNext: () => move(current.add(step)),
    goToToday: () => move(today(timeZone)),
    goTo: move,
  }
}
