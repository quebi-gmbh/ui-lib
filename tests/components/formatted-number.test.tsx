/**
 * FormattedNumber's rendering half.
 *
 * `tests/formatted-number.test.ts` pins what the two string helpers produce.
 * This is the part that needed a DOM: the components read their locale from the
 * nearest react-aria `I18nProvider`, which is the mechanism a whole page relies
 * on to switch language in one place — and a component that quietly formatted
 * in the host's default locale would still render a number that looks right to
 * whoever wrote it.
 */
import { describe, expect, test } from "bun:test"
import { render, screen } from "@testing-library/react"
import { I18nProvider } from "react-aria-components"
import {
  FormattedCurrency,
  FormattedNumber,
  FormattedPercentage,
} from "../../src/components/formatted-number"

const inLocale = (locale: string, ui: React.ReactNode) =>
  render(<I18nProvider locale={locale}>{ui}</I18nProvider>)

describe("FormattedNumber", () => {
  test("takes its locale from the nearest I18nProvider", () => {
    inLocale("de-DE", <FormattedNumber value={1024.5} />)

    expect(screen.getByText("1.024,5")).toBeInTheDocument()
  })

  test("the same value under an English provider groups the other way", () => {
    inLocale("en-US", <FormattedNumber value={1024.5} />)

    expect(screen.getByText("1,024.5")).toBeInTheDocument()
  })

  test("an explicit locale prop overrides the provider", () => {
    inLocale("de-DE", <FormattedNumber value={1024.5} locale="en-US" />)

    expect(screen.getByText("1,024.5")).toBeInTheDocument()
  })

  test("accepts a numeric string", () => {
    inLocale("de-DE", <FormattedNumber value="1024" />)

    expect(screen.getByText("1.024")).toBeInTheDocument()
  })

  test("renders a dash rather than NaN for a value that is not a number", () => {
    inLocale("de-DE", <FormattedNumber value="not a number" />)

    expect(screen.getByText("-")).toBeInTheDocument()
  })

  test("hands the formatted string to a children render prop instead of wrapping it", () => {
    const { container } = inLocale(
      "de-DE",
      <FormattedNumber value={1024}>
        {(formatted) => <strong>{formatted}</strong>}
      </FormattedNumber>,
    )

    expect(screen.getByText("1.024").tagName).toBe("STRONG")
    expect(container.querySelector("span")).toBeNull()
  })

  test("passes className to the default span", () => {
    inLocale("de-DE", <FormattedNumber value={1024} className="tabular-nums" />)

    expect(screen.getByText("1.024")).toHaveClass("tabular-nums")
  })
})

describe("FormattedCurrency", () => {
  test("puts the euro sign where the locale puts it", () => {
    inLocale("de-DE", <FormattedCurrency value={1234.5} />)
    inLocale("en-US", <FormattedCurrency value={1234.5} />)

    // German puts a U+00A0 before the sign; Testing Library's text matcher
    // normalises that to a plain space, so the expectations are written with
    // one. (`tests/formatted-number.test.ts` pins the raw U+00A0 on the string
    // helper, where nothing normalises it away.)
    expect(screen.getByText("1.234,50 €")).toBeInTheDocument()
    expect(screen.getByText("€1,234.50")).toBeInTheDocument()
  })

  test("always shows two decimal places", () => {
    inLocale("de-DE", <FormattedCurrency value={7} />)

    expect(screen.getByText("7,00 €")).toBeInTheDocument()
  })

  test("honours a different currency", () => {
    inLocale("en-US", <FormattedCurrency value={7} currency="USD" />)

    expect(screen.getByText("$7.00")).toBeInTheDocument()
  })
})

describe("FormattedPercentage", () => {
  test("scales the fraction and appends the locale's percent sign", () => {
    inLocale("de-DE", <FormattedPercentage value={0.1234} />)

    expect(screen.getByText("12,34 %")).toBeInTheDocument()
  })
})
