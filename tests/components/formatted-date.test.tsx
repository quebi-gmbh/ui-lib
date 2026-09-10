/**
 * FormattedDate's defaults.
 *
 * The component's value is in what it does when the caller says nothing: German
 * locale, Europe/Berlin time zone, and a semantic `<time dateTime>` carrying the
 * unambiguous ISO instant next to the human-readable text. A default flipped to
 * the host's locale or UTC would still render a plausible date — half the year
 * it would even render the right one — so these are pinned rather than smoke
 * tested.
 */
import { afterEach, describe, expect, setSystemTime, test } from "bun:test"
import { render } from "@testing-library/react"
import {
  DateTime,
  FormattedDate,
  RelativeTime,
  ShortDate,
} from "../../src/components/formatted-date"

// 15:30 in Berlin (CET, before the DST switch), 14:30 UTC — so a formatter that
// forgot the time zone renders a visibly different string.
const INSTANT = new Date("2024-03-15T14:30:00.000Z")

const time = (ui: React.ReactElement) => {
  const { container } = render(ui)
  return container.querySelector("time")
}

afterEach(() => {
  setSystemTime()
})

describe("FormattedDate", () => {
  test("renders a <time> whose dateTime is the ISO instant", () => {
    const element = time(<FormattedDate date={INSTANT} />)

    expect(element?.tagName).toBe("TIME")
    expect(element).toHaveAttribute("datetime", INSTANT.toISOString())
  })

  test("defaults to a medium German date", () => {
    expect(time(<FormattedDate date={INSTANT} />)).toHaveTextContent("15.03.2024")
  })

  test("honours the format shorthand", () => {
    expect(time(<FormattedDate date={INSTANT} format="short" />)).toHaveTextContent("15.03.24")
  })

  test("honours an explicit locale", () => {
    expect(time(<FormattedDate date={INSTANT} locale="en" />)).toHaveTextContent("Mar 15, 2024")
  })

  test("formats the time in Europe/Berlin, not UTC", () => {
    const element = time(<FormattedDate date={INSTANT} dateStyle="medium" timeStyle="short" />)

    expect(element).toHaveTextContent("15:30")
  })

  test.each([
    ["a Date", INSTANT],
    ["an ISO string", INSTANT.toISOString()],
    ["a timestamp", INSTANT.getTime()],
  ])("accepts %s", (_label, date) => {
    expect(time(<FormattedDate date={date} />)).toHaveAttribute("datetime", INSTANT.toISOString())
  })

  test("passes className through to the <time>", () => {
    expect(time(<FormattedDate date={INSTANT} className="text-quebi-fg-muted" />)).toHaveClass(
      "text-quebi-fg-muted",
    )
  })
})

describe("the convenience wrappers", () => {
  test("ShortDate is the short date style", () => {
    expect(time(<ShortDate date={INSTANT} />)).toHaveTextContent("15.03.24")
  })

  test("DateTime adds a short time to a medium date", () => {
    expect(time(<DateTime date={INSTANT} />)).toHaveTextContent("15.03.2024, 15:30")
  })

  test.each([
    [-5 * 60 * 1000, "vor 5 Minuten"],
    [2 * 60 * 60 * 1000, "in 2 Stunden"],
    [-2 * 24 * 60 * 60 * 1000, "vorgestern"],
  ])("RelativeTime renders an offset of %pms as %p", (offset, expected) => {
    setSystemTime(INSTANT)

    const element = time(<RelativeTime date={new Date(INSTANT.getTime() + offset)} />)

    expect(element).toHaveTextContent(expected)
    // Relative text is friendly but imprecise — the exact instant stays in the
    // attribute for anything that needs it.
    expect(element).toHaveAttribute("datetime", new Date(INSTANT.getTime() + offset).toISOString())
  })
})
