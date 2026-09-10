/**
 * The `Intl` formatter cache — the guarantee, not the speed.
 *
 * A cache that quietly stops caching costs nothing a test can see: every string
 * it returns is still correct, and the only symptom is a table that got slower.
 * So what is pinned here is the observable half of the contract — the *same
 * instance* comes back for the same `(locale, options)` — plus the two ways the
 * key can be wrong in the direction that matters: an inline object literal (a
 * fresh object on every render, so keying on identity would be a cache that
 * never hits) and two literals spelling the same options in a different order.
 *
 * The rest swaps the `Intl` constructor for a counting stand-in and asserts what
 * the library's own entry points do with it: one formatter for many values, and
 * — since that is the whole reason this exists — one formatter for a column of
 * two hundred rendered cells, not two hundred.
 */
import { describe, expect, test } from "bun:test"
import { render } from "@testing-library/react"
import { FormattedDate } from "../src/components/formatted-date"
import {
  FormattedCurrency,
  formatCurrency,
  formatNumber,
} from "../src/components/formatted-number"
import { getDateTimeFormat, getNumberFormat, getRelativeTimeFormat } from "../src/lib/intl"

type FormatterKind = "NumberFormat" | "DateTimeFormat" | "RelativeTimeFormat"

/**
 * Count constructions of one `Intl` formatter while `body` runs, with the real
 * constructor restored afterwards whatever happens. The stand-in is a plain
 * function that returns a real formatter: called with `new`, the returned object
 * is what the caller gets, so every string in these tests is still the genuine
 * article and only the count is added.
 */
function countingConstructions(kind: FormatterKind, body: () => void): number {
  const real = Intl[kind] as unknown as new (...args: unknown[]) => object
  let constructed = 0
  // A declaration rather than an arrow: an arrow function has no [[Construct]]
  // slot, and `new` on one is a TypeError before the count is ever reached.
  function counting(...args: unknown[]) {
    constructed++
    return new real(...args)
  }

  Object.defineProperty(Intl, kind, { value: counting, configurable: true, writable: true })
  try {
    body()
  } finally {
    Object.defineProperty(Intl, kind, { value: real, configurable: true, writable: true })
  }
  return constructed
}

describe("getNumberFormat", () => {
  test("returns the identical instance for the same locale and options", () => {
    expect(getNumberFormat("de-DE")).toBe(getNumberFormat("de-DE"))
  })

  test("hits the cache for an options object built fresh at the call site", () => {
    // The shape a component prop takes: `options={{ style: "percent" }}` is a
    // new object on every render, so keying on identity would never hit.
    expect(getNumberFormat("de-DE", { style: "percent" })).toBe(
      getNumberFormat("de-DE", { style: "percent" }),
    )
  })

  test("keys on the option values, not the order they were written in", () => {
    expect(getNumberFormat("de-DE", { style: "currency", currency: "EUR" })).toBe(
      getNumberFormat("de-DE", { currency: "EUR", style: "currency" }),
    )
  })

  test("treats an absent option and an explicit undefined as the same request", () => {
    expect(getNumberFormat("de-DE", {})).toBe(getNumberFormat("de-DE"))
    expect(getNumberFormat("de-DE", {})).toBe(
      getNumberFormat("de-DE", { maximumFractionDigits: undefined }),
    )
  })

  test("keeps different locales and different options apart", () => {
    expect(getNumberFormat("de-DE")).not.toBe(getNumberFormat("en-US"))
    expect(getNumberFormat("de-DE", { style: "percent" })).not.toBe(
      getNumberFormat("de-DE", { style: "decimal" }),
    )
  })

  test("throws on invalid options exactly as the constructor would, every time", () => {
    // A currency style with no currency is a TypeError from `Intl` itself. The
    // second call has to throw too: a cache that stored the failed attempt would
    // hand back `undefined` and fail one frame later, at `.format()`.
    const invalid = { style: "currency" } as Intl.NumberFormatOptions
    expect(() => getNumberFormat("de-DE", invalid)).toThrow()
    expect(() => getNumberFormat("de-DE", invalid)).toThrow()
  })
})

describe("getDateTimeFormat", () => {
  test("hits the cache for options built fresh at the call site", () => {
    expect(getDateTimeFormat("de", { dateStyle: "medium", timeZone: "Europe/Berlin" })).toBe(
      getDateTimeFormat("de", { timeZone: "Europe/Berlin", dateStyle: "medium" }),
    )
  })

  test("keeps different time zones apart", () => {
    expect(getDateTimeFormat("de", { timeZone: "Europe/Berlin" })).not.toBe(
      getDateTimeFormat("de", { timeZone: "UTC" }),
    )
  })
})

describe("getRelativeTimeFormat", () => {
  test("returns the identical instance for the same locale and options", () => {
    expect(getRelativeTimeFormat("de", { numeric: "auto" })).toBe(
      getRelativeTimeFormat("de", { numeric: "auto" }),
    )
  })
})

// Each of these uses a locale that appears nowhere else in the file, so the
// count is not decided by whether an earlier test happened to warm the entry.
describe("the components and helpers go through the cache", () => {
  test("formatNumber and formatCurrency build one formatter each, not one per call", () => {
    const constructed = countingConstructions("NumberFormat", () => {
      expect(formatNumber(1000, "en-GB")).toBe("1,000")
      expect(formatNumber(2000, "en-GB")).toBe("2,000")
      expect(formatCurrency(10, "en-GB")).toBe("€10.00")
      expect(formatCurrency(20, "en-GB")).toBe("€20.00")
    })

    // One for formatNumber's options, one for formatCurrency's.
    expect(constructed).toBe(2)
  })

  test("a column of currency cells builds one formatter, not one per row", () => {
    // The case this cache exists for: react-aria's collections are complete even
    // when the DOM is virtualized, so every row of a DataTable renders its cell
    // contents whether or not it is on screen.
    const rows = Array.from({ length: 200 }, (_, index) => index * 1.5)

    const constructed = countingConstructions("NumberFormat", () => {
      render(
        <div>
          {rows.map((value) => (
            <FormattedCurrency key={value} value={value} locale="en-IE" />
          ))}
        </div>,
      )
    })

    expect(constructed).toBe(1)
  })

  test("a column of dates builds one formatter, not one per row", () => {
    const rows = Array.from({ length: 200 }, (_, index) => new Date(2024, 0, 1 + index))

    const constructed = countingConstructions("DateTimeFormat", () => {
      render(
        <div>
          {rows.map((date) => (
            <FormattedDate key={date.toISOString()} date={date} locale="en-AU" />
          ))}
        </div>,
      )
    })

    expect(constructed).toBe(1)
  })

  test("no component builds an Intl formatter directly", async () => {
    // The cache's real failure mode is silent: a `new Intl.NumberFormat(...)`
    // put back into a component body renders exactly the right string and costs
    // a formatter per value. There is nothing to assert about the output, so
    // this asserts about the source — including Calendar, whose month and year
    // labels are the third pair of call sites and have no cheap render test.
    const { readdir, readFile } = await import("node:fs/promises")
    const { join } = await import("node:path")

    const dir = join(import.meta.dir, "..", "src", "components")
    const offenders: string[] = []
    for (const file of await readdir(dir)) {
      if (!file.endsWith(".tsx") && !file.endsWith(".ts")) continue
      if (/new Intl\./.test(await readFile(join(dir, file), "utf8"))) offenders.push(file)
    }

    expect(offenders).toEqual([])
  })
})
