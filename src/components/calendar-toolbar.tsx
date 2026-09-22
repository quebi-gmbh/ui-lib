"use client"

import type { CalendarDate, DateDuration, DateValue } from "@internationalized/date"
import { startOfWeek, today } from "@internationalized/date"
import { CalendarCheck, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"
import { useLocale } from "react-aria-components"
import { Button } from "@/components/button"
import { ButtonGroup } from "@/components/button-group"
import { Calendar } from "@/components/calendar"
import { dayToDate, DEFAULT_CALENDAR_TIME_ZONE } from "@/components/calendar-shell"
import { MonthPicker } from "@/components/month-picker"
import { Popover, PopoverContent } from "@/components/popover"
import { ToggleGroup, ToggleGroupItem } from "@/components/toggle-group"
import { WeekPicker } from "@/components/week-picker"
import { getDateTimeFormat } from "@/lib/intl"
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
 */
export type CalendarToolbarPickerGranularity = "day" | "week" | "month"

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

/** The views a toolbar can switch between. A subset is fine; the order is yours. */
export type CalendarViewName = "day" | "week" | "month" | "timeline"

const DEFAULT_VIEW_LABELS: Record<CalendarViewName, string> = {
  day: "Day",
  week: "Week",
  month: "Month",
  timeline: "Timeline",
}

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
  /** Dates before this cannot be picked. */
  minValue?: DateValue
  /** Dates after this cannot be picked. */
  maxValue?: DateValue
  /** Disable every control the toolbar draws. */
  isDisabled?: boolean
  /** The active view. Omit to hide the switcher. */
  view?: CalendarViewName
  /** Which switches to offer. Defaults to all four. */
  views?: readonly CalendarViewName[]
  /** Override one or more switch labels — the place to translate them. */
  viewLabels?: Partial<Record<CalendarViewName, string>>
  /** Omit to draw the switcher as a disabled indicator rather than a dead control. */
  onViewChange?: (view: CalendarViewName) => void
  onPrevious?: () => void
  onNext?: () => void
  onToday?: () => void
  /** Where the two chevrons are drawn. Default `bar`. */
  navigationPlacement?: CalendarToolbarControlPlacement
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
  /** Extra chrome, placed after the view switcher — a filter, a legend, a menu. */
  children?: React.ReactNode
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
  view,
  views = ["day", "week", "month", "timeline"],
  viewLabels,
  onViewChange,
  onPrevious,
  onNext,
  onToday,
  navigationPlacement = "bar",
  todayPlacement = "bar",
  todayVariant = "text",
  previousLabel,
  nextLabel,
  todayLabel = "Today",
  navigationLabel = "Calendar navigation",
  children,
  className,
}: CalendarToolbarProps) {
  const barPreviousLabel = previousLabel ?? "Previous"
  const barNextLabel = nextLabel ?? "Next"
  const popoverPreviousLabel = previousLabel ?? `Previous ${pickerGranularity}`
  const popoverNextLabel = nextLabel ?? `Next ${pickerGranularity}`

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
        isDisabled={isDisabled}
        onPrevious={navigationPlacement === "popover" ? onPrevious : undefined}
        onNext={navigationPlacement === "popover" ? onNext : undefined}
        onToday={todayPlacement === "popover" ? onToday : undefined}
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
      onPrevious={barPrevious}
      onNext={barNext}
      onToday={barToday}
      previousLabel={barPreviousLabel}
      nextLabel={barNextLabel}
      todayLabel={todayLabel}
      todayVariant={todayVariant}
      isDisabled={isDisabled}
    />
  )

  return (
    <div
      data-slot="calendar-toolbar"
      className={cn("flex flex-wrap items-center justify-between gap-3", className)}
    >
      <div className="flex flex-wrap items-center gap-3">
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
            <ButtonGroup aria-label={navigationLabel}>{barControls}</ButtonGroup>
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
            {hasBarControls ? (
              <ButtonGroup aria-label={navigationLabel}>{barControls}</ButtonGroup>
            ) : null}
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {view && views.length > 1 ? (
          <ToggleGroup
            size="xs"
            aria-label="Calendar view"
            disallowEmptySelection
            isDisabled={isDisabled || !onViewChange}
            selectedKeys={[view]}
            onSelectionChange={(keys) => {
              const next = [...keys][0]
              if (typeof next === "string") onViewChange?.(next as CalendarViewName)
            }}
          >
            {views.map((name) => (
              <ToggleGroupItem key={name} id={name}>
                {viewLabels?.[name] ?? DEFAULT_VIEW_LABELS[name]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        ) : null}
        {children}
      </div>
    </div>
  )
}

interface DateControlsProps {
  /** The picker heading, drawn between back and today. Nothing in the popover. */
  heading?: React.ReactNode
  onPrevious: (() => void) | undefined
  onNext: (() => void) | undefined
  onToday: (() => void) | undefined
  previousLabel: string
  nextLabel: string
  todayLabel: string
  todayVariant: CalendarToolbarTodayVariant
  isDisabled: boolean | undefined
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
 */
function DateControls({
  heading,
  onPrevious,
  onNext,
  onToday,
  previousLabel,
  nextLabel,
  todayLabel,
  todayVariant,
  isDisabled,
}: DateControlsProps) {
  return (
    <>
      {onPrevious ? (
        <Button
          intent="outline"
          size="sq-sm"
          aria-label={previousLabel}
          isDisabled={isDisabled}
          onPress={onPrevious}
        >
          <ChevronLeft data-slot="icon" className="size-4" aria-hidden="true" />
        </Button>
      ) : null}
      {heading}
      {onToday ? (
        todayVariant === "icon" ? (
          // The word is still the accessible name: the icon is a width
          // decision, not a decision to say less.
          <Button
            intent="outline"
            size="sq-sm"
            aria-label={todayLabel}
            isDisabled={isDisabled}
            onPress={onToday}
          >
            <CalendarCheck data-slot="icon" className="size-4" aria-hidden="true" />
          </Button>
        ) : (
          <Button intent="outline" size="sm" isDisabled={isDisabled} onPress={onToday}>
            {todayLabel}
          </Button>
        )
      ) : null}
      {onNext ? (
        <Button
          intent="outline"
          size="sq-sm"
          aria-label={nextLabel}
          isDisabled={isDisabled}
          onPress={onNext}
        >
          <ChevronRight data-slot="icon" className="size-4" aria-hidden="true" />
        </Button>
      ) : null}
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
  /** The date controls placed in here rather than in the bar. Any subset. */
  onPrevious: (() => void) | undefined
  onNext: (() => void) | undefined
  onToday: (() => void) | undefined
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
  onPrevious,
  onNext,
  onToday,
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
        className="py-1.5 font-semibold text-base tracking-tight"
      >
        {label}
        <ChevronDown data-slot="icon" className="text-quebi-fg-muted" />
      </Button>
      <PopoverContent placement="bottom start" className="w-auto max-w-none p-3">
        {granularity === "month" ? (
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
}

export interface RangeLabelOptions {
  locale?: string
  timeZone?: string
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
  { locale, timeZone = DEFAULT_CALENDAR_TIME_ZONE }: RangeLabelOptions = {},
): string {
  const first = days[0]
  const last = days.length > 0 ? days[days.length - 1] : undefined
  if (!first || !last || !locale) return ""

  const start = dayToDate(first, timeZone)
  const end = dayToDate(last, timeZone)

  if (first.compare(last) === 0) {
    return getDateTimeFormat(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone,
    }).format(start)
  }

  // `formatRange` is the part of Intl written for exactly this: it elides the
  // shared month or year itself, in whatever way the locale does it.
  return getDateTimeFormat(locale, {
    day: "numeric",
    month: first.month === last.month ? "long" : "short",
    year: "numeric",
    timeZone,
  }).formatRange(start, end)
}

/** `September 2026` — the month view's heading. */
export function calendarMonthLabel(
  month: CalendarDate,
  { locale, timeZone = DEFAULT_CALENDAR_TIME_ZONE }: RangeLabelOptions = {},
): string {
  if (!locale) return ""
  return getDateTimeFormat(locale, { month: "long", year: "numeric", timeZone }).format(
    dayToDate(month, timeZone),
  )
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
