/**
 * Two-digit day and month segments, across the four date controls.
 *
 * `shouldForceLeadingZeros` is react-aria's prop and has always worked here —
 * every quebi date wrapper spreads `{...props}` onto its primitive. That is
 * exactly why it is worth pinning: nothing in this repo's own source mentions
 * it, so the only thing standing between `30.06.2026` and a silent regression
 * is a spread that a later refactor could narrow. `ConformDateField` is the
 * sharp one — it reaches `DateField` through a hand-maintained `Omit` list, and
 * adding one name to that list would drop the prop with no type error at the
 * call site.
 *
 * The locale is pinned per-render rather than inherited, because the padding
 * question only exists relative to what a locale would do on its own: `de-DE`
 * writes a bare `6` for June, `en-US` a bare `6` for the month too, and the
 * prop is what makes both `06`.
 */
import { Time, parseDate } from "@internationalized/date"
import { useForm } from "@conform-to/react"
import { describe, expect, test } from "bun:test"
import { render, screen } from "@testing-library/react"
import { I18nProvider } from "react-aria-components"
import { ConformDateField } from "../../src/components/conform-date-field"
import { DateField, DateInput } from "../../src/components/date-field"
import { DatePicker, DatePickerTrigger } from "../../src/components/date-picker"
import { DateRangePicker, DateRangePickerTrigger } from "../../src/components/date-range-picker"
import { Label } from "../../src/components/field"
import { TimeField, TimeInput } from "../../src/components/time-field"

const inLocale = (locale: string, ui: React.ReactNode) =>
  render(<I18nProvider locale={locale}>{ui}</I18nProvider>)

/**
 * The text of a segmented control, literals included — "30.6.2026".
 *
 * Intl wraps a time's clock portion in bidi isolates (U+2066…U+2069) so a
 * 12-hour reading cannot be flipped by the surrounding text direction. They are
 * invisible, they carry no information about padding, and they would make every
 * assertion below unreadable, so they are stripped here.
 */
const BIDI_MARKS = /[\u2066-\u2069\u200e\u200f]/g
const segments = (index = 0) =>
  screen.getAllByRole("group")[index]?.textContent?.replace(BIDI_MARKS, "")

const JUNE_30 = parseDate("2026-06-30")

describe("DateField", () => {
  test("follows the locale by default, which is why de-DE writes a bare 6", () => {
    inLocale(
      "de-DE",
      <DateField defaultValue={JUNE_30}>
        <Label>Start date</Label>
        <DateInput />
      </DateField>,
    )

    expect(segments()).toBe("30.6.2026")
  })

  test("shouldForceLeadingZeros pads day and month, and leaves the year alone", () => {
    inLocale(
      "de-DE",
      <DateField defaultValue={JUNE_30} shouldForceLeadingZeros>
        <Label>Start date</Label>
        <DateInput />
      </DateField>,
    )

    expect(segments()).toBe("30.06.2026")
  })

  test("pads under en-US too — it is not a de-DE special case", () => {
    inLocale(
      "en-US",
      <DateField defaultValue={JUNE_30} shouldForceLeadingZeros>
        <Label>Start date</Label>
        <DateInput />
      </DateField>,
    )

    expect(segments()).toBe("06/30/2026")
  })
})

describe("DatePicker", () => {
  test("the trigger's segments pad, without opening the calendar", () => {
    inLocale(
      "de-DE",
      <DatePicker defaultValue={JUNE_30} shouldForceLeadingZeros>
        <Label>Start date</Label>
        <DatePickerTrigger />
      </DatePicker>,
    )

    expect(segments()).toContain("30.06.2026")
  })
})

describe("DateRangePicker", () => {
  test("one prop pads both halves of the range", () => {
    inLocale(
      "de-DE",
      <DateRangePicker
        defaultValue={{ start: JUNE_30, end: parseDate("2026-07-07") }}
        shouldForceLeadingZeros
      >
        <Label>Trip</Label>
        <DateRangePickerTrigger />
      </DateRangePicker>,
    )

    // Only the trigger wrapper is a group here — the two inner DateInputs are
    // slotted into it and drop their own role — so both dates read out of the
    // one element, back to back.
    expect(segments()).toBe("30.06.202607.07.2026")
  })
})

describe("TimeField", () => {
  // de-DE's 24-hour clock pads the hour on its own, so the prop is a no-op
  // there and en-US is the locale that shows what it does. That asymmetry is
  // why the time field gets a documented sentence rather than a gallery card:
  // on this site the two would render identically.
  const NINE_OH_FIVE = new Time(9, 5)

  test("follows the locale by default, which is why en-US writes a bare 9", () => {
    inLocale(
      "en-US",
      <TimeField defaultValue={NINE_OH_FIVE} aria-label="Start time">
        <TimeInput />
      </TimeField>,
    )

    expect(segments()).toBe("9:05 AM")
  })

  test("shouldForceLeadingZeros pads the hour", () => {
    inLocale(
      "en-US",
      <TimeField defaultValue={NINE_OH_FIVE} aria-label="Start time" shouldForceLeadingZeros>
        <TimeInput />
      </TimeField>,
    )

    expect(segments()).toBe("09:05 AM")
  })
})

describe("ConformDateField", () => {
  const BoundField = ({ forceZeros }: { forceZeros?: boolean }) => {
    const [, fields] = useForm({
      defaultValue: { startDate: "2026-06-30" },
      // No route action behind this fixture, so there is no lastResult to gate.
    })
    return (
      <ConformDateField
        field={fields.startDate}
        label="Start date"
        shouldForceLeadingZeros={forceZeros}
      />
    )
  }

  test("passes the prop through its Omit list to the DateField underneath", () => {
    inLocale("de-DE", <BoundField forceZeros />)

    expect(segments()).toBe("30.06.2026")
  })

  test("and still follows the locale when it is not asked for", () => {
    inLocale("de-DE", <BoundField />)

    expect(segments()).toBe("30.6.2026")
  })
})
