/**
 * The Controlled examples in the date/time family, read the way the reporter
 * read them: the description under the field, in the site's own locale.
 *
 * `CalendarDate#toString()` and `Time#toString()` return ISO 8601 — the wire
 * format — so an example that echoes the value straight into a `Description`
 * prints `2026-06-30` a few pixels under a trigger whose segments spell the
 * same day `30.6.2026`. Nothing throws and nothing looks broken, which is why
 * it survived; and these files are consumer-facing copy, so the shortcut
 * propagates. What this pins is the property the eye checks: the description
 * renders the localized spelling, and does not render the ISO one.
 */
import { describe, expect, test } from "bun:test"
import { render } from "@testing-library/react"
// A rendering fixture, not app code: the site mounts this same provider in
// `src/root.tsx`, and the segments only speak German underneath it.
import { I18nProvider } from "react-aria-components"
import { dateFieldExamples } from "../../src/registry/date-field.examples"
import { datePickerExamples } from "../../src/registry/date-picker.examples"
import { dateRangePickerExamples } from "../../src/registry/date-range-picker.examples"
import { timeFieldExamples } from "../../src/registry/time-field.examples"
import type { ComponentExample } from "../../src/registry/types"

/** Same locale as `SITE_LOCALE` in src/root.tsx. */
const SITE_LOCALE = "de-DE"

function controlled(examples: ComponentExample[]): ComponentExample {
  const example = examples.find((candidate) => candidate.title === "Controlled")
  if (!example) throw new Error("no Controlled example")
  return example
}

function descriptionOf(example: ComponentExample): string {
  const { container } = render(
    <I18nProvider locale={SITE_LOCALE}>{example.render()}</I18nProvider>,
  )
  const description = container.querySelector('[slot="description"]')
  if (!description) throw new Error("no description rendered")
  return description.textContent ?? ""
}

describe("the Controlled description reads like the field, not like the wire", () => {
  test("date-picker", () => {
    const text = descriptionOf(controlled(datePickerExamples))
    expect(text).toBe("30.06.2026")
    expect(text).not.toContain("2026-06-30")
  })

  test("date-field", () => {
    const text = descriptionOf(controlled(dateFieldExamples))
    expect(text).toBe("30.06.2026")
    expect(text).not.toContain("2026-06-30")
  })

  test("date-range-picker", () => {
    const text = descriptionOf(controlled(dateRangePickerExamples))
    expect(text).toBe("30.06.2026 → 07.07.2026")
    expect(text).not.toContain("2026-06-30")
    expect(text).not.toContain("2026-07-07")
  })

  test("time-field", () => {
    const text = descriptionOf(controlled(timeFieldExamples))
    expect(text).toBe("08:00")
    expect(text).not.toContain("08:00:00")
  })
})

describe("the description carries a machine-readable date", () => {
  // FormattedDate renders a <time>, so the ISO form did not disappear — it
  // moved to the attribute that is meant to hold it.
  test("date-picker", () => {
    const { container } = render(
      <I18nProvider locale={SITE_LOCALE}>{controlled(datePickerExamples).render()}</I18nProvider>,
    )
    const time = container.querySelector('[slot="description"] time')
    expect(time?.getAttribute("datetime")).toContain("2026-06-29T22:00")
  })
})
