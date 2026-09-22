"use client"

import {
  type CalendarDate,
  endOfMonth,
  endOfYear,
  getLocalTimeZone,
  maxDate,
  minDate,
  startOfMonth,
  startOfYear,
  toCalendarDate,
  today,
} from "@internationalized/date"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { createContext, use, useCallback, useEffect, useId, useRef, useState } from "react"
import {
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader as CalendarGridHeaderPrimitive,
  CalendarHeaderCell,
  Calendar as CalendarPrimitive,
  type CalendarProps as CalendarPrimitiveProps,
  CalendarStateContext,
  composeRenderProps,
  type DateValue,
  Heading,
  RangeCalendarStateContext,
  useLocale,
} from "react-aria-components"
import { Button } from "@/components/button"
import { MonthPicker } from "@/components/month-picker"
import { Select, SelectContent, SelectItem, SelectLabel, SelectTrigger } from "@/components/select"
import { getDateTimeFormat } from "@/lib/intl"
import { cn } from "@/lib/utils"

/**
 * Calendar — quebi design system
 *
 * An accessible month calendar built on react-aria-components and
 * @internationalized/date, with a choice of header: `variant="select"` (the
 * default) swaps the Month Picker grid into the calendar body from one control
 * naming the visible month, `variant="stepper"` walks them with a chevron on
 * each side. Restyled to quebi tokens: the selected day fills with brand teal,
 * today is ringed in brand teal, and days hover with a faint white wash.
 * Foundational — Range Calendar and Date Picker compose this.
 */

/**
 * Which header the calendar draws.
 *
 * - `select` — one control reading `September 2026` on the left, swapping the
 *   library's own Month Picker into the body in place of the day grid; one
 *   prev/next pair on the right that pages the visible range, shown while the
 *   day grid is.
 * - `stepper` — `‹ Sep ›` and `‹ 2026 ›`. The paging pair is dropped, or the
 *   month would carry two sets of chevrons meaning slightly different things.
 */
type CalendarHeaderVariant = "select" | "stepper"

interface CalendarProps<T extends DateValue>
  extends Omit<CalendarPrimitiveProps<T>, "visibleDuration"> {
  className?: string
  /** Header treatment — the in-body month picker (default) or chevron steppers. */
  variant?: CalendarHeaderVariant
}

const Calendar = <T extends DateValue>({ className, variant, ...props }: CalendarProps<T>) => {
  const now = today(getLocalTimeZone())

  return (
    /*
      `w-fit`, so the calendar is exactly as wide as the grid inside it.

      It is a block element, so without this it takes whatever width its
      container offers — but the grid it draws is a table of fixed-size cells
      that shrinks to fit, and the header is `w-full justify-between`. In any
      container wider than the grid those two disagree: the day grid sits flush
      left at its intrinsic width while the month/year control and the
      prev/next pair are pushed out to the container's edges, leaving the
      chevrons hanging in space to the right of the last column. That is what a
      `w-fit` field root was supposed to prevent, and it cannot: `w-fit` is
      max-content, and a field's description line is usually wider than seven
      day cells, so the root sizes to the hint and the calendar stretches to
      match. Sizing the calendar itself is the fix that holds wherever it is
      put. `MonthPicker` is `w-fit` for the same reason.
    */
    <CalendarPrimitive data-slot="calendar" className="w-fit" {...props}>
      <CalendarBodyModeProvider>
        <CalendarHeader variant={variant} />
        <CalendarBody>
          <CalendarGrid>
            <CalendarGridHeader />
            <CalendarGridBody>
              {(date) => (
                <CalendarCell
                  date={date}
                  className={composeRenderProps(
                    className,
                    (className, { isSelected, isDisabled }) =>
                      cn(
                        "relative flex h-9 w-9 cursor-default items-center justify-center rounded-quebi-sm text-sm text-quebi-fg tabular-nums outline-hidden transition-colors hover:bg-quebi-surface/[0.04]",
                        isSelected &&
                          "bg-quebi-brand text-quebi-on-brand hover:bg-quebi-brand-hover",
                        isDisabled && "text-quebi-fg-subtle",
                        date.compare(now) === 0 &&
                          !isSelected &&
                          "ring-1 ring-inset ring-quebi-brand-mark",
                        className,
                      ),
                  )}
                />
              )}
            </CalendarGridBody>
          </CalendarGrid>
        </CalendarBody>
      </CalendarBodyModeProvider>
    </CalendarPrimitive>
  )
}

interface CalendarHeaderProps extends React.ComponentProps<"header"> {
  /** Header treatment — the in-body month picker (default) or chevron steppers. */
  variant?: CalendarHeaderVariant
}

const CalendarHeader = ({ className, variant = "select", ...props }: CalendarHeaderProps) => {
  const { direction } = useLocale()
  const { mode } = useCalendarBodyMode("CalendarHeader")
  return (
    <header
      data-slot="calendar-header"
      data-variant={variant}
      data-mode={mode}
      className={cn("flex w-full justify-between gap-1.5 ps-1.5 pe-1 pt-1 pb-5 sm:pb-4", className)}
      {...props}
    >
      {variant === "stepper" ? (
        <>
          <StepMonth />
          <Heading className="sr-only" />
          <StepYear />
        </>
      ) : (
        <>
          <SelectMonthYear />
          <Heading className="sr-only" />
          {/*
            The paging pair belongs to the day grid: it walks the visible
            *month*, and the month grid that replaces that grid carries a year
            stepper of its own a row below. Two chevron pairs in one surface
            stepping different units is the ambiguity the `stepper` variant
            drops this pair to avoid — so month mode drops it for the same
            reason, and it returns with the day grid.
          */}
          {mode === "day" && (
            <div className="flex items-center gap-1">
              <Button
                size="sq-sm"
                className="size-8 sm:size-7 **:data-[slot=icon]:text-quebi-fg-muted"
                isCircle
                intent="ghost"
                slot="previous"
              >
                {direction === "rtl" ? (
                  <ChevronRight data-slot="icon" />
                ) : (
                  <ChevronLeft data-slot="icon" />
                )}
              </Button>
              <Button
                size="sq-sm"
                className="size-8 sm:size-7 **:data-[slot=icon]:text-quebi-fg-muted"
                isCircle
                intent="ghost"
                slot="next"
              >
                {direction === "rtl" ? (
                  <ChevronLeft data-slot="icon" />
                ) : (
                  <ChevronRight data-slot="icon" />
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </header>
  )
}

/**
 * What the calendar body is drawing.
 *
 * The month grid is not a second surface floating over the first (task #170 —
 * it was, for the length of #160). Inside a Date Picker that made two react-aria
 * overlays out of one trigger chain, portalled to `body` as siblings at the same
 * z-index rather than nested, and the inner one covered every cell of the day
 * grid the user was orienting against while hanging ~20px past the bottom edge
 * of the surface it was anchored in — over the backdrop, on the mobile path,
 * where the outer surface is a modal. Swapping the body in place is what the
 * native and shadcn-style pickers do: one surface, one thing to dismiss, and the
 * month grid sized by the popover that was already open.
 */
type CalendarBodyMode = "day" | "month"

interface CalendarBodyModeValue {
  /** Which grid the body is drawing. */
  mode: CalendarBodyMode
  /** Swap it. Returning to the day grid puts focus back on the trigger. */
  setMode: (mode: CalendarBodyMode) => void
  /** The body's id, so the trigger's `aria-controls` can name what it swaps. */
  bodyId: string
  /** The month/year trigger, so leaving month mode can restore focus to it. */
  triggerRef: React.RefObject<HTMLButtonElement | null>
}

const CalendarBodyModeContext = createContext<CalendarBodyModeValue | null>(null)

/**
 * The toggle's two ends are siblings — `SelectMonthYear` sits in the header and
 * the grid it replaces sits beside it — so the state joining them belongs to
 * whatever owns both, which is `Calendar` and `RangeCalendar`. A consumer
 * composing a calendar out of the exported parts wants `CalendarBodyModeProvider`
 * around them and `CalendarBody` around the grid; the throw is for the case where
 * neither happened, since a month/year control with no body to swap is the
 * live-control-that-does-nothing this file avoids everywhere else.
 */
const useCalendarBodyMode = (component: string) => {
  const value = use(CalendarBodyModeContext)
  if (!value) throw new Error(`${component} must be used within a CalendarBodyModeProvider`)
  return value
}

/**
 * Is `element` somewhere focus was *parked* rather than somewhere a user put it?
 *
 * A `tabindex="-1"` container — the popover's own dialog div — and `<body>` are
 * both "focus had nowhere to go". Neither is reachable by tabbing, so neither is
 * a place the user chose, and taking focus back off one of them cannot interrupt
 * anything they were doing.
 */
const isStrandedFocus = (element: Element | null) =>
  !element || element === document.body || element.getAttribute("tabindex") === "-1"

const CalendarBodyModeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setModeState] = useState<CalendarBodyMode>("day")
  const bodyId = useId()
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  // Set by `setMode`, read by the effect below: only a swap the user asked for
  // moves focus, so the first render does not steal it from the page.
  const shouldRestoreFocus = useRef(false)

  // Stable, so the Escape listener in `CalendarBody` subscribes once per swap
  // rather than once per render of the calendar above it.
  const setMode = useCallback((next: CalendarBodyMode) => {
    setModeState(next)
    if (next === "day") shouldRestoreFocus.current = true
  }, [])

  /**
   * Put focus back on the trigger when the month grid goes away.
   *
   * It has to go somewhere deliberate: the grid unmounts under whatever inside
   * it had focus, and the trigger is what the user pressed to get here. Doing it
   * synchronously in `setMode` is not enough, and this is the part worth
   * knowing — react-aria restores focus on behalf of the collection that just
   * unmounted, and defers that through `runAfterTransition`, so in a real
   * browser (where the cells have a colour transition and the trigger has one
   * too) its restore lands *after* both the press handler and this effect. What
   * the user was left with was the popover's own `tabindex="-1"` dialog div.
   *
   * So the focus is asserted once here and re-asserted on the next frame, by
   * which point react-aria has finished. The `isStrandedFocus` guard is what
   * keeps that second assert from being a yank: if focus has meanwhile reached
   * anything tabbable, someone meant it, and the trigger does not take it back.
   */
  useEffect(() => {
    if (mode !== "day" || !shouldRestoreFocus.current) return
    shouldRestoreFocus.current = false
    const trigger = triggerRef.current
    if (!trigger) return

    trigger.focus()
    const frame = requestAnimationFrame(() => {
      if (isStrandedFocus(document.activeElement)) trigger.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [mode])

  return (
    <CalendarBodyModeContext value={{ mode, setMode, bodyId, triggerRef }}>
      {children}
    </CalendarBodyModeContext>
  )
}

/**
 * The calendar's body: the day grid, or the Month Picker in its place.
 *
 * Three wiring details, all inherited from the popover this replaced.
 *
 * - **The calendar system comes from the state.** `MonthPicker` is Gregorian
 *   where it is handed nothing, so `state.focusedDate.calendar` goes down with
 *   the value. Without it a Japanese or Hebrew calendar's header would name
 *   months its own grid does not have.
 * - **The day survives.** `MonthPicker` reports the first of the month, but the
 *   thing being chosen is a month, not a date: focus moves to the same day of
 *   it, exactly as `SelectMonth`'s `set({ month })` did. `constrain` then does
 *   what it does for the steppers — react-aria clamps every focus move anyway,
 *   and asking first is what keeps the control from appearing to ignore a click.
 * - **Escape has one meaning, and it is the innermost one.** The grid keeps
 *   `escapeKeyBehavior="none"`, so the key belongs to whatever is above it; that
 *   used to be a popover of its own and is now this. Stopping propagation is
 *   what keeps the same keypress from also closing the Date Picker popover the
 *   calendar sits in — the second Escape does that, from the day grid, which is
 *   the order the two were opened in. Two nested popovers got this right for
 *   free and the swap would otherwise lose it.
 *
 *   The listener is a native one on the body rather than an `onKeyDown` prop,
 *   for two reasons. React delegates synthetic events to the root container, so
 *   a native listener here runs *before* React has dispatched anything and
 *   `stopPropagation` reliably keeps the overlay's own `onKeyDown` from ever
 *   seeing the key — a synthetic handler would be racing siblings in the same
 *   dispatch. And a `<div>` carrying an `onKeyDown` is a static element with an
 *   interaction, which Biome's `noStaticElementInteractions` flags and is right
 *   to: the interactive things here are the cells inside, which react-aria
 *   gives their own roles. This is a key scope, not a control.
 */
const CalendarBody = ({ children }: { children: React.ReactNode }) => {
  const state = useCalendarHeaderState("CalendarBody")
  const { mode, setMode, bodyId } = useCalendarBodyMode("CalendarBody")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = ref.current
    if (mode !== "month" || !node) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      event.preventDefault()
      event.stopPropagation()
      setMode("day")
    }
    node.addEventListener("keydown", onKeyDown)
    return () => node.removeEventListener("keydown", onKeyDown)
  }, [mode, setMode])

  return (
    <div id={bodyId} data-slot="calendar-body" ref={ref}>
      {mode === "month" ? (
        <MonthPicker
          autoFocus
          aria-label="Month and year"
          // `mx-auto` for the RangeCalendar case: two months of day grid are far
          // wider than one year of months, and an off-centre grid in a surface
          // sized for the other one reads as a mistake.
          className="mx-auto"
          calendar={state.focusedDate.calendar}
          value={state.focusedDate}
          minValue={state.minValue ?? undefined}
          maxValue={state.maxValue ?? undefined}
          isDisabled={state.isDisabled}
          onChange={(next) => {
            state.setFocusedDate(
              constrain(
                state.focusedDate.set({ era: next.era, year: next.year, month: next.month }),
                state.minValue,
                state.maxValue,
              ),
            )
            setMode("day")
          }}
        />
      ) : (
        children
      )}
    </div>
  )
}

/**
 * The Calendar or RangeCalendar state above this header, whichever is there.
 * Both contexts are read unconditionally — one of them is always null, and a
 * hook cannot be skipped — so the throw names the component that asked.
 */
const useCalendarHeaderState = (component: string) => {
  const calendarState = use(CalendarStateContext)
  const rangeCalendarState = use(RangeCalendarStateContext)
  const state = calendarState || rangeCalendarState
  if (!state) throw new Error(`${component} must be used within a Calendar or RangeCalendar`)
  return state
}

interface CalendarDropdown {
  /** The collection key — a month number, or an era-qualified year. */
  id: string | number
  /** Where picking this entry puts focus, already inside the bounds. */
  date: CalendarDate
  /** The label, formatted in the calendar's locale. */
  formatted: string
}

/** A stepper walks one of these, and its buttons say which. */
type CalendarStepperUnit = "month" | "year"

/**
 * The date a focus move to `date` would actually land on.
 *
 * react-aria clamps every focus move to `minValue`/`maxValue`, so a step past
 * the bound snaps back and nothing on screen changes. Asking the same question
 * up front is what lets the chevron disable itself instead — the hand-rolled
 * equivalent of the `isPreviousVisibleRangeInvalid` that the `slot="previous"`
 * button gets for free.
 */
const constrain = (
  date: CalendarDate,
  minValue?: DateValue | null,
  maxValue?: DateValue | null,
): CalendarDate => {
  let constrained = date
  if (minValue) constrained = maxDate(constrained, toCalendarDate(minValue)) ?? constrained
  if (maxValue) constrained = minDate(constrained, toCalendarDate(maxValue)) ?? constrained
  return constrained
}

/**
 * Is any day of `date`'s month — or of its year — inside the bounds?
 *
 * The unit is the question, not the date that stands for it: a `minValue` of
 * 15 June leaves June and 2026 reachable while May and 2025 are not. Asking per
 * unit is the same thing `CalendarStepper` asks before it offers a chevron, and
 * the same thing `isMonthAvailable` / `isYearAvailable` ask in the month and
 * year pickers.
 */
const isUnitReachable = (
  unit: CalendarStepperUnit,
  date: CalendarDate,
  minValue?: DateValue | null,
  maxValue?: DateValue | null,
) => {
  const first = unit === "year" ? startOfYear(date) : startOfMonth(date)
  const last = unit === "year" ? endOfYear(date) : endOfMonth(date)
  if (minValue && last.compare(toCalendarDate(minValue)) < 0) return false
  if (maxValue && first.compare(toCalendarDate(maxValue)) > 0) return false
  return true
}

/**
 * The `select` header's one control: `September 2026`, swapping the library's
 * own `MonthPicker` into the calendar body in place of the day grid.
 *
 * It replaced a month `Select` beside a year `Select` (task #160). Two flat
 * lists — the year one forty-one rows of `2006 … 2046` — asked the user to
 * scroll for something a 3×4 grid says in one glance, and that grid is a
 * component this library already publishes: the header had been rebuilding a
 * worse one out of dropdowns. `SelectMonth` and `SelectYear` are still exported
 * for anyone who had composed a header of their own out of them.
 *
 * #160 put that grid in a popover of its own, which is what task #170 took back
 * out; the argument is on `CalendarBodyMode`, and everything about *choosing* a
 * month is now on `CalendarBody`. What is left here is the trigger, and two
 * details of it:
 *
 * - **It is a toggle, so it is `aria-pressed`.** Not `aria-expanded`: nothing
 *   expands. The body is the same size and in the same place either way, and
 *   what changes is which of two grids it draws — which is a two-state control,
 *   pressed or not. `aria-controls` names the body as well, so the relationship
 *   survives for the readers that expose it, but the state is the pressed one.
 * - **The trigger opts out of the calendar's `ButtonContext`.** See the note in
 *   `CalendarStepper`; `slot={null}` is the same fix for the same reason, and
 *   it matters more now that the button carries an `onPress` of its own.
 *
 * Reaching a distant year is the year chevrons, one at a time — deliberately,
 * and not what the old year dropdown did with its ±20-year window. A calendar
 * is for dates near the one you are looking at; a birth year belongs in a date
 * field you can type into, or in `YearPickerField`, which is the whole grid.
 */
const SelectMonthYear = () => {
  const state = useCalendarHeaderState("SelectMonthYear")
  const { mode, setMode, bodyId, triggerRef } = useCalendarBodyMode("SelectMonthYear")
  const { locale } = useLocale()
  const formatter = getDateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: state.timeZone,
  })
  const isShowingMonths = mode === "month"

  return (
    /*
      No `aria-label`: it would *replace* the button's own text as the
      accessible name, and "September 2026" is the more useful of the two —
      `aria-pressed` already says it toggles something. What that costs is a
      constant to query it by, so the stable handle for tests and for a consumer
      restyling the header is the `data-slot`, the way it is everywhere else in
      this library.
    */
    <Button
      ref={triggerRef}
      data-slot="calendar-month-year"
      intent="outline"
      size="sm"
      slot={null}
      isDisabled={state.isDisabled}
      aria-pressed={isShowingMonths}
      aria-controls={bodyId}
      onPress={() => setMode(isShowingMonths ? "day" : "month")}
      // The old dropdown pair's own padding, so the header keeps its height:
      // `Button`'s `sm` is a form control's, and this is a calendar's title.
      className="px-3 py-2.5 text-sm/5 tabular-nums sm:px-2.5 sm:py-1.5"
    >
      {formatter.format(state.focusedDate.toDate(state.timeZone))}
      <ChevronDown
        data-slot="icon"
        className={cn(
          "text-quebi-fg-muted transition-transform duration-150",
          isShowingMonths && "rotate-180",
        )}
      />
    </Button>
  )
}

/**
 * @deprecated Since task #160 the `select` header is `SelectMonthYear`, and
 * these two are exported only for a consumer who built a header out of them.
 * New code wants `MonthPicker` (in a popover, as `SelectMonthYear` does it) or
 * the `stepper` variant. They still work, and everything below still holds.
 *
 * Both dropdowns offer only what the bounds can reach, for the reason the
 * stepper chevrons disable themselves: `setFocusedDate` runs through react-aria's
 * `focusCell`, which clamps to `minValue`/`maxValue`. An out-of-range entry is
 * therefore not inert — picking it snaps to the nearest legal date and re-renders
 * the dropdown showing a month or year nobody chose, which reads as a control
 * that ignored the click.
 *
 * Dropping the entries rather than marking them `isDisabled` is the choice:
 * disabled entries keep the list one length, but a booking calendar open for a
 * year would spend 39 of its 41 rows on years that cannot be picked, and the
 * list a user scrolls is then mostly dead. The stability that argument is really
 * about is the list not moving under them, and that is what the anchor in
 * `SelectYear` buys.
 */
const SelectMonth = () => {
  const state = useCalendarHeaderState("SelectMonth")
  const { locale } = useLocale()
  const formatter = getDateTimeFormat(locale, {
    month: "short",
    timeZone: state.timeZone,
  })

  const months: CalendarDropdown[] = []
  const numMonths = state.focusedDate.calendar.getMonthsInYear(state.focusedDate)
  for (let i = 1; i <= numMonths; i++) {
    const date = state.focusedDate.set({ month: i })
    if (!isUnitReachable("month", date, state.minValue, state.maxValue)) continue
    months.push({
      id: i,
      // A month reachable only in part — `minValue` on the 15th — is offered,
      // and lands on the first day of it that the bounds allow.
      date: constrain(date, state.minValue, state.maxValue),
      formatted: formatter.format(date.toDate(state.timeZone)),
    })
  }

  return (
    <Select
      className="[popover-width:8rem]"
      aria-label="Month"
      style={{ flex: 1, width: "fit-content" }}
      selectedKey={state.focusedDate.month}
      onSelectionChange={(key) => {
        // By key, not by index: the list is only the reachable months, so the
        // nth entry is not the nth month of the year.
        const month = months.find((candidate) => candidate.id === key)
        if (month) state.setFocusedDate(month.date)
      }}
    >
      <SelectTrigger className="w-22 text-sm/5 **:data-[slot=select-value]:inline-block **:data-[slot=select-value]:truncate sm:px-2.5 sm:py-1.5 sm:*:text-sm/5" />
      <SelectContent className="min-w-0" items={months}>
        {(item) => (
          <SelectItem id={item.id} textValue={item.formatted}>
            <SelectLabel>{item.formatted}</SelectLabel>
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  )
}

/**
 * How many years to each side of the anchor the dropdown offers where a bound
 * does not say otherwise.
 */
const YEAR_WINDOW = 20

/**
 * A collection key for a year. Era-qualified, because in an era calendar `year`
 * counts from the start of the era and two different years are both year 1.
 */
const yearKey = (date: CalendarDate) => `${date.era}-${date.year}`

const SelectYear = () => {
  const state = useCalendarHeaderState("SelectYear")
  const { locale } = useLocale()
  const formatter = getDateTimeFormat(locale, {
    year: "numeric",
    timeZone: state.timeZone,
  })

  /**
   * The year the calendar opened on. The window is measured from here and not
   * from `state.focusedDate`, which is what it used to be: a window centred on
   * the focused year re-centres itself every time the user picks from it, so
   * the row under the pointer means a different year on the second pick than it
   * did on the first. Bounds, when there are any, still win over the window.
   */
  const anchor = useRef(state.focusedDate).current

  const entry = (date: CalendarDate): CalendarDropdown => ({
    id: yearKey(date),
    // Only the year is being chosen — keep the month the user is looking at.
    date: constrain(
      state.focusedDate.set({ era: date.era, year: date.year }),
      state.minValue,
      state.maxValue,
    ),
    formatted: formatter.format(date.toDate(state.timeZone)),
  })

  const years: CalendarDropdown[] = []
  for (let i = -YEAR_WINDOW; i <= YEAR_WINDOW; i++) {
    const date = anchor.add({ years: i })
    if (!isUnitReachable("year", date, state.minValue, state.maxValue)) continue
    years.push(entry(date))
  }

  const focusedKey = yearKey(state.focusedDate)
  if (!years.some((year) => year.id === focusedKey)) {
    // Paging with the prev/next pair can walk focus off the end of the window.
    // The selected key has to be in the collection or the trigger renders empty.
    if (state.focusedDate.compare(anchor) < 0) years.unshift(entry(state.focusedDate))
    else years.push(entry(state.focusedDate))
  }

  return (
    <Select
      aria-label="Year"
      selectedKey={focusedKey}
      onSelectionChange={(key) => {
        const year = years.find((candidate) => candidate.id === key)
        if (year) state.setFocusedDate(year.date)
      }}
    >
      <SelectTrigger className="text-sm/5 sm:px-2.5 sm:py-1.5 sm:*:text-sm/5" />
      <SelectContent items={years}>
        {(item) => (
          <SelectItem id={item.id} textValue={item.formatted}>
            <SelectLabel>{item.formatted}</SelectLabel>
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  )
}

/**
 * Do `a` and `b` fall in the same month (or the same year)? `era` is part of
 * the answer: in an era calendar `year` counts from the start of the era, so
 * two different years can both be year 1.
 */
const isSameUnit = (unit: CalendarStepperUnit, a: CalendarDate, b: CalendarDate) =>
  a.era === b.era && a.year === b.year && (unit === "year" || a.month === b.month)

interface CalendarStepperProps {
  /** Which unit a press moves, and the word the button labels use. */
  unit: CalendarStepperUnit
  /** The formatted month or year sitting between the two chevrons. */
  label: string
  /** Minimum width for the label, so a step does not resize the header. */
  labelClassName?: string
}

/**
 * `‹ label ›` — one ghost chevron on each side of a month or year, styled as
 * the header's own prev/next pair. The icons swap under RTL so "previous" stays
 * on the leading edge.
 *
 * A chevron is disabled when the step it offers would not leave the current
 * month (or year): `constrain` clamps the move to the bounds first, so at
 * `maxValue` "next month" would land back inside the month on screen — a live
 * control that does nothing, which is exactly what `isNextVisibleRangeInvalid`
 * spares the paging pair. Asking per unit rather than per date matters at a
 * bound *inside* a month: with `maxValue` ten days out, "next month" still
 * moves focus, just not out of June.
 */
const CalendarStepper = ({ unit, label, labelClassName }: CalendarStepperProps) => {
  const state = useCalendarHeaderState("CalendarStepper")
  const { direction } = useLocale()
  const step = (delta: number) =>
    constrain(
      state.focusedDate.add(unit === "year" ? { years: delta } : { months: delta }),
      state.minValue,
      state.maxValue,
    )
  const previous = step(-1)
  const next = step(1)
  const buttonClassName = "size-8 sm:size-7 **:data-[slot=icon]:text-quebi-fg-muted"

  return (
    <div className="flex items-center gap-0.5">
      {/*
        A Button under a Calendar reads react-aria's ButtonContext, which is a
        slot map — `previous` and `next`, the paging pair. Without a `slot` it
        throws ("A slot prop is required"), and with either of those names it
        would page the visible range instead of running `onPress`. `slot={null}`
        opts out of the context: this is an ordinary button that happens to live
        in the header.
      */}
      <Button
        size="sq-sm"
        className={buttonClassName}
        isCircle
        intent="ghost"
        slot={null}
        aria-label={`Previous ${unit}`}
        isDisabled={state.isDisabled || isSameUnit(unit, previous, state.focusedDate)}
        onPress={() => state.setFocusedDate(previous)}
      >
        {direction === "rtl" ? (
          <ChevronRight data-slot="icon" />
        ) : (
          <ChevronLeft data-slot="icon" />
        )}
      </Button>
      <span
        className={cn(
          "select-none px-0.5 text-center text-quebi-fg text-sm/5 tabular-nums",
          labelClassName,
        )}
      >
        {label}
      </span>
      <Button
        size="sq-sm"
        className={buttonClassName}
        isCircle
        intent="ghost"
        slot={null}
        aria-label={`Next ${unit}`}
        isDisabled={state.isDisabled || isSameUnit(unit, next, state.focusedDate)}
        onPress={() => state.setFocusedDate(next)}
      >
        {direction === "rtl" ? (
          <ChevronLeft data-slot="icon" />
        ) : (
          <ChevronRight data-slot="icon" />
        )}
      </Button>
    </div>
  )
}

const StepMonth = () => {
  const state = useCalendarHeaderState("StepMonth")
  const { locale } = useLocale()
  const formatter = getDateTimeFormat(locale, {
    month: "short",
    timeZone: state.timeZone,
  })

  return (
    <CalendarStepper
      unit="month"
      label={formatter.format(state.focusedDate.toDate(state.timeZone))}
      labelClassName="min-w-11"
    />
  )
}

const StepYear = () => {
  const state = useCalendarHeaderState("StepYear")
  const { locale } = useLocale()
  const formatter = getDateTimeFormat(locale, {
    year: "numeric",
    timeZone: state.timeZone,
  })

  return (
    <CalendarStepper
      unit="year"
      label={formatter.format(state.focusedDate.toDate(state.timeZone))}
      labelClassName="min-w-11"
    />
  )
}

const CalendarGridHeader = () => {
  return (
    <CalendarGridHeaderPrimitive>
      {(day) => (
        <CalendarHeaderCell className="w-9 pb-2 text-center font-semibold text-[11px] text-quebi-fg-muted uppercase tracking-[0.08em]">
          {day}
        </CalendarHeaderCell>
      )}
    </CalendarGridHeaderPrimitive>
  )
}

export type { CalendarBodyMode, CalendarHeaderProps, CalendarHeaderVariant, CalendarProps }
export {
  Calendar,
  CalendarBody,
  CalendarBodyModeProvider,
  CalendarGridHeader,
  CalendarHeader,
  SelectMonth,
  SelectMonthYear,
  SelectYear,
  StepMonth,
  StepYear,
}
