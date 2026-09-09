/**
 * The locale contract of the number formatters.
 *
 * `formatNumber` and `formatCurrency` are the string-context escape hatches for
 * callers who cannot render a component — table cell renderers, chart tick
 * callbacks, aria-labels. Because they are called from those places their output
 * is never eyeballed in review, so the two things that actually vary — the
 * grouping separator and the currency placement, which flip between `de` and
 * `en` — are pinned here.
 *
 * These assertions were carried over from the Cellestial-era
 * `components/formatted-number.test.tsx`, which never ran: it imported
 * `@testing-library/react`, which the repo does not depend on. Only the
 * DOM-free half survived the move; the component-rendering half needs a test
 * environment this repo does not have yet.
 */
import { describe, expect, test } from "bun:test"
import { formatCurrency, formatNumber } from "../src/components/formatted-number"

describe("formatNumber", () => {
  test("groups thousands the way the locale does", () => {
    expect(formatNumber(1024, "de")).toBe("1.024")
    expect(formatNumber(1024, "en")).toBe("1,024")
  })

  test("shows no decimal places — it rounds", () => {
    expect(formatNumber(99.9, "de")).toBe("100")
    expect(formatNumber(99.9, "en")).toBe("100")
  })

  test("leaves numbers below the grouping threshold alone", () => {
    expect(formatNumber(64, "de")).toBe("64")
    expect(formatNumber(64, "en")).toBe("64")
    expect(formatNumber(0, "de")).toBe("0")
    expect(formatNumber(0, "en")).toBe("0")
  })
})

// German puts the euro sign after the amount, separated by a NON-BREAKING space
// (U+00A0), not the ordinary one. Written as an escape because the two are
// indistinguishable in a source file — the Cellestial-era copy of this test
// asserted a plain space and would have failed had it ever been run.
const NBSP = "\u00A0"

describe("formatCurrency", () => {
  test("places the euro sign where the locale puts it", () => {
    expect(formatCurrency(1234.56, "de")).toBe(`1.234,56${NBSP}€`)
    expect(formatCurrency(1234.56, "en")).toBe("€1,234.56")
  })

  test("always shows two decimal places, whole numbers included", () => {
    expect(formatCurrency(100, "de")).toBe(`100,00${NBSP}€`)
    expect(formatCurrency(100, "en")).toBe("€100.00")
    expect(formatCurrency(0, "de")).toBe(`0,00${NBSP}€`)
    expect(formatCurrency(0, "en")).toBe("€0.00")
  })
})
