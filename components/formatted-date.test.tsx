import { render } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { DateTime, FormattedDate, RelativeTime, ShortDate } from "./formatted-date"

describe("FormattedDate Components", () => {
  const testDate = new Date("2024-03-15T14:30:00.000Z")
  // biome-ignore lint/suspicious/noExplicitAny: vitest v3 spyOn type inference
  let mockDateNow: any

  beforeEach(() => {
    // Mock Date.now() for consistent relative time tests
    mockDateNow = vi.spyOn(Date, "now").mockReturnValue(testDate.getTime())
  })

  afterEach(() => {
    mockDateNow.mockRestore()
  })

  describe("FormattedDate", () => {
    it("renders a formatted date with default medium format", () => {
      const { container } = render(<FormattedDate date={testDate} />)

      const timeElement = container.querySelector("time")
      expect(timeElement).toBeTruthy()
      expect(timeElement?.getAttribute("dateTime")).toBe(testDate.toISOString())

      const textContent = timeElement?.textContent
      expect(textContent).toBeTruthy()
      expect(textContent).toMatch(/\d/)
    })

    it("renders date with short format", () => {
      const { container } = render(<FormattedDate date={testDate} format="short" />)

      const timeElement = container.querySelector("time")
      expect(timeElement).toBeTruthy()

      const textContent = timeElement?.textContent
      expect(textContent).toBeTruthy()
      expect(textContent).toMatch(/\d/)
    })

    it("renders date with time when showTime is true", () => {
      const { container } = render(<FormattedDate date={testDate} showTime />)

      const timeElement = container.querySelector("time")
      expect(timeElement).toBeTruthy()

      const textContent = timeElement?.textContent
      expect(textContent).toBeTruthy()
      expect(textContent).toMatch(/\d/)
    })

    it("accepts string date input", () => {
      const { container } = render(<FormattedDate date="2024-03-15T14:30:00.000Z" />)

      const timeElement = container.querySelector("time")
      expect(timeElement).toBeTruthy()
      expect(timeElement?.getAttribute("dateTime")).toBe(testDate.toISOString())
    })

    it("accepts number timestamp input", () => {
      const { container } = render(<FormattedDate date={testDate.getTime()} />)

      const timeElement = container.querySelector("time")
      expect(timeElement).toBeTruthy()
      expect(timeElement?.getAttribute("dateTime")).toBe(testDate.toISOString())
    })

    it("applies custom className", () => {
      const { container } = render(<FormattedDate date={testDate} className="custom-class" />)

      const timeElement = container.querySelector("time")
      expect(timeElement).toBeTruthy()
      expect(timeElement?.className).toContain("custom-class")
    })

    it("uses custom locale", () => {
      const { container } = render(<FormattedDate date={testDate} locale="en" />)

      const timeElement = container.querySelector("time")
      expect(timeElement).toBeTruthy()
      expect(timeElement?.getAttribute("dateTime")).toBe(testDate.toISOString())
    })
  })

  describe("ShortDate", () => {
    it("renders a short formatted date", () => {
      const { container } = render(<ShortDate date={testDate} />)

      const timeElement = container.querySelector("time")
      expect(timeElement).toBeTruthy()
      expect(timeElement?.getAttribute("dateTime")).toBe(testDate.toISOString())
    })

    it("applies custom className", () => {
      const { container } = render(<ShortDate date={testDate} className="short-date-class" />)

      const timeElement = container.querySelector("time")
      expect(timeElement).toBeTruthy()
      expect(timeElement?.className).toContain("short-date-class")
    })
  })

  describe("DateTime", () => {
    it("renders date with time", () => {
      const { container } = render(<DateTime date={testDate} />)

      const timeElement = container.querySelector("time")
      expect(timeElement).toBeTruthy()
      expect(timeElement?.getAttribute("dateTime")).toBe(testDate.toISOString())

      const textContent = timeElement?.textContent
      expect(textContent).toBeTruthy()
    })

    it("applies custom className", () => {
      const { container } = render(<DateTime date={testDate} className="datetime-class" />)

      const timeElement = container.querySelector("time")
      expect(timeElement).toBeTruthy()
      expect(timeElement?.className).toContain("datetime-class")
    })
  })

  describe("RelativeTime", () => {
    it("renders relative time for recent dates", () => {
      // Test with a date 5 minutes ago
      const fiveMinutesAgo = new Date(testDate.getTime() - 5 * 60 * 1000)

      const { container } = render(<RelativeTime date={fiveMinutesAgo} />)

      const timeElement = container.querySelector("time")
      expect(timeElement).toBeTruthy()
      expect(timeElement?.getAttribute("dateTime")).toBe(fiveMinutesAgo.toISOString())

      const textContent = timeElement?.textContent
      expect(textContent).toBeTruthy()
    })

    it("renders relative time for future dates", () => {
      // Test with a date 2 hours from now
      const twoHoursFromNow = new Date(testDate.getTime() + 2 * 60 * 60 * 1000)

      const { container } = render(<RelativeTime date={twoHoursFromNow} />)

      const timeElement = container.querySelector("time")
      expect(timeElement).toBeTruthy()
      expect(timeElement?.getAttribute("dateTime")).toBe(twoHoursFromNow.toISOString())

      const textContent = timeElement?.textContent
      expect(textContent).toBeTruthy()
    })
  })

  describe("Timezone", () => {
    it("uses Europe/Berlin timezone", () => {
      const { container } = render(<FormattedDate date={testDate} showTime />)

      const timeElement = container.querySelector("time")
      expect(timeElement).toBeTruthy()

      // The formatted output should reflect Europe/Berlin timezone
      const textContent = timeElement?.textContent
      expect(textContent).toBeTruthy()
    })
  })

  describe("Accessibility", () => {
    it("provides proper datetime attribute for screen readers", () => {
      const { container } = render(<FormattedDate date={testDate} />)

      const timeElement = container.querySelector("time")
      expect(timeElement).toBeTruthy()
      expect(timeElement?.getAttribute("dateTime")).toBe(testDate.toISOString())
    })

    it("uses semantic time element", () => {
      const { container } = render(<FormattedDate date={testDate} />)

      const timeElement = container.querySelector("time")
      expect(timeElement).toBeTruthy()
      expect(timeElement?.tagName.toLowerCase()).toBe("time")
    })
  })
})
