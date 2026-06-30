import { render } from "@testing-library/react"
import { I18nProvider } from "react-aria-components"
import { describe, expect, it } from "vitest"
import {
  FormattedCurrency,
  FormattedNumber,
  FormattedPercentage,
  formatCurrency,
  formatNumber,
  useFormatNumber,
} from "./formatted-number"

describe("formatCurrency (utility)", () => {
  it("formats EUR with 2 decimal places in German locale", () => {
    expect(formatCurrency(1234.56, "de")).toBe("1.234,56 €")
  })

  it("formats EUR with 2 decimal places in English locale", () => {
    expect(formatCurrency(1234.56, "en")).toBe("€1,234.56")
  })

  it("always shows 2 decimal places even for whole numbers", () => {
    expect(formatCurrency(100, "de")).toBe("100,00 €")
    expect(formatCurrency(100, "en")).toBe("€100.00")
  })

  it("handles zero", () => {
    expect(formatCurrency(0, "de")).toBe("0,00 €")
    expect(formatCurrency(0, "en")).toBe("€0.00")
  })
})

describe("FormattedNumber", () => {
  it("reads locale from I18nProvider (de)", () => {
    const { container } = render(
      <I18nProvider locale="de">
        <FormattedNumber value={1234.5} options={{ minimumFractionDigits: 2 }} />
      </I18nProvider>,
    )
    expect(container.querySelector("span")?.textContent).toBe("1.234,50")
  })

  it("reads locale from I18nProvider (en)", () => {
    const { container } = render(
      <I18nProvider locale="en">
        <FormattedNumber value={1234.5} options={{ minimumFractionDigits: 2 }} />
      </I18nProvider>,
    )
    expect(container.querySelector("span")?.textContent).toBe("1,234.50")
  })

  it("locale prop overrides I18nProvider", () => {
    const { container } = render(
      <I18nProvider locale="de">
        <FormattedNumber value={1234.5} locale="en" options={{ minimumFractionDigits: 2 }} />
      </I18nProvider>,
    )
    expect(container.querySelector("span")?.textContent).toBe("1,234.50")
  })

  it("renders dash for NaN input", () => {
    const { container } = render(
      <I18nProvider locale="de">
        <FormattedNumber value="not-a-number" />
      </I18nProvider>,
    )
    expect(container.querySelector("span")?.textContent).toBe("-")
  })

  it("accepts string number input", () => {
    const { container } = render(
      <I18nProvider locale="en">
        <FormattedNumber value="42.5" options={{ minimumFractionDigits: 1 }} />
      </I18nProvider>,
    )
    expect(container.querySelector("span")?.textContent).toBe("42.5")
  })

  it("supports children render prop", () => {
    const { container } = render(
      <I18nProvider locale="de">
        <FormattedNumber value={99} options={{ style: "currency", currency: "EUR" }}>
          {(formatted) => <strong>{formatted}</strong>}
        </FormattedNumber>
      </I18nProvider>,
    )
    expect(container.querySelector("strong")).toBeTruthy()
  })
})

describe("FormattedCurrency", () => {
  it("formats EUR with German locale from I18nProvider", () => {
    const { container } = render(
      <I18nProvider locale="de">
        <FormattedCurrency value={1234.56} />
      </I18nProvider>,
    )
    expect(container.querySelector("span")?.textContent).toBe("1.234,56 €")
  })

  it("formats EUR with English locale from I18nProvider", () => {
    const { container } = render(
      <I18nProvider locale="en">
        <FormattedCurrency value={1234.56} />
      </I18nProvider>,
    )
    expect(container.querySelector("span")?.textContent).toBe("€1,234.56")
  })

  it("always shows 2 decimal places for whole numbers (de)", () => {
    const { container } = render(
      <I18nProvider locale="de">
        <FormattedCurrency value={100} />
      </I18nProvider>,
    )
    expect(container.querySelector("span")?.textContent).toBe("100,00 €")
  })

  it("always shows 2 decimal places for whole numbers (en)", () => {
    const { container } = render(
      <I18nProvider locale="en">
        <FormattedCurrency value={100} />
      </I18nProvider>,
    )
    expect(container.querySelector("span")?.textContent).toBe("€100.00")
  })

  it("locale prop overrides I18nProvider", () => {
    const { container } = render(
      <I18nProvider locale="de">
        <FormattedCurrency value={50} locale="en" />
      </I18nProvider>,
    )
    expect(container.querySelector("span")?.textContent).toBe("€50.00")
  })

  it("renders dash for NaN", () => {
    const { container } = render(
      <I18nProvider locale="de">
        <FormattedCurrency value="not-a-number" />
      </I18nProvider>,
    )
    expect(container.querySelector("span")?.textContent).toBe("-")
  })
})

describe("formatNumber (utility)", () => {
  it("formats with locale-specific grouping in German", () => {
    expect(formatNumber(1024, "de")).toBe("1.024")
  })

  it("formats with locale-specific grouping in English", () => {
    expect(formatNumber(1024, "en")).toBe("1,024")
  })

  it("does not show decimal places", () => {
    expect(formatNumber(99.9, "en")).toBe("100")
    expect(formatNumber(99.9, "de")).toBe("100")
  })

  it("handles small numbers without grouping", () => {
    expect(formatNumber(64, "de")).toBe("64")
    expect(formatNumber(64, "en")).toBe("64")
  })

  it("handles zero", () => {
    expect(formatNumber(0, "de")).toBe("0")
    expect(formatNumber(0, "en")).toBe("0")
  })
})

describe("useFormatNumber (hook)", () => {
  function TestComponent({ value }: { value: number }) {
    const fmt = useFormatNumber()
    return <span>{fmt(value)}</span>
  }

  it("formats using locale from I18nProvider (de)", () => {
    const { container } = render(
      <I18nProvider locale="de">
        <TestComponent value={1024} />
      </I18nProvider>,
    )
    expect(container.querySelector("span")?.textContent).toBe("1.024")
  })

  it("formats using locale from I18nProvider (en)", () => {
    const { container } = render(
      <I18nProvider locale="en">
        <TestComponent value={1024} />
      </I18nProvider>,
    )
    expect(container.querySelector("span")?.textContent).toBe("1,024")
  })
})

describe("FormattedPercentage", () => {
  it("formats percentage with German locale", () => {
    const { container } = render(
      <I18nProvider locale="de">
        <FormattedPercentage value={0.1234} />
      </I18nProvider>,
    )
    expect(container.querySelector("span")?.textContent).toBe("12,34 %")
  })

  it("formats percentage with English locale", () => {
    const { container } = render(
      <I18nProvider locale="en">
        <FormattedPercentage value={0.1234} />
      </I18nProvider>,
    )
    expect(container.querySelector("span")?.textContent).toBe("12.34%")
  })
})
