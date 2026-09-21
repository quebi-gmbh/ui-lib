/**
 * ElapsedTime's two promises: the arithmetic, and the one about the prerender.
 *
 * The second is the one worth a test file. This site is `ssr: false` plus a
 * `prerender()` list, so every page is HTML generated in Node and hydrated in a
 * browser some time later — and a duration component is the single easiest way
 * to bake one number into that HTML and compute a different one at hydration.
 * The check for it is `renderToStaticMarkup`, which runs the render path with
 * no effects, exactly as the build does.
 */
import { describe, expect, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"
import { render } from "@testing-library/react"
import { ElapsedTime } from "../../src/components/elapsed-time"

const START = new Date("2026-03-13T09:41:00Z")
const at = (seconds: number) => new Date(START.getTime() + seconds * 1000)

const rendered = () => document.querySelector("time")

describe("the clock format", () => {
  test.each([
    [0, "0:00"],
    [9, "0:09"],
    [69, "1:09"],
    [252, "4:12"],
    [3723, "1:02:03"],
  ])("%i seconds reads as %s", (seconds, expected) => {
    render(<ElapsedTime start={START} now={at(seconds)} locale="en" />)
    expect(rendered()?.textContent).toBe(expected)
  })

  test("hours appear only once there are hours", () => {
    render(<ElapsedTime start={START} now={at(3599)} locale="en" />)
    expect(rendered()?.textContent).toBe("59:59")
  })

  test("a negative elapsed time is clamped, not rendered as a countdown", () => {
    render(<ElapsedTime start={START} now={at(-30)} locale="en" />)
    expect(rendered()?.textContent).toBe("0:00")
  })
})

describe("the units format", () => {
  test("spells two units through Intl, most significant first", () => {
    render(<ElapsedTime start={START} now={at(252)} format="units" locale="en" />)
    // Not pinned to an exact ICU spelling — what matters is that it is two
    // numbers with unit text around them rather than a bare clock.
    const text = rendered()?.textContent ?? ""
    expect(text).toMatch(/\b4\D+12\D*$/)
    expect(text).not.toContain(":")
  })

  test("never leads with a zero unit", () => {
    render(<ElapsedTime start={START} now={at(9)} format="units" locale="en" />)
    expect(rendered()?.textContent ?? "").not.toMatch(/^0/)
  })

  test("the locale is the one named in the code, not the runtime's", () => {
    const { container } = render(
      <ElapsedTime start={START} now={at(252)} format="units" locale="de" />,
    )
    const german = container.textContent
    render(<ElapsedTime start={START} now={at(252)} format="units" locale="en" />)
    expect(german).not.toBe(document.querySelectorAll("time")[1]?.textContent)
  })
})

describe("the machine-readable value", () => {
  test.each([
    [0, "PT0S"],
    [252, "PT4M12S"],
    [3723, "PT1H2M3S"],
  ])("%i seconds serialises as %s", (seconds, expected) => {
    render(<ElapsedTime start={START} now={at(seconds)} />)
    expect(rendered()?.getAttribute("datetime")).toBe(expected)
  })
})

describe("nothing reads the clock during render", () => {
  test("with no `now`, the prerender is the zero duration whatever time it is", () => {
    // Two renders a moment apart must produce the same bytes, because the
    // browser that hydrates them will produce those bytes too.
    const first = renderToStaticMarkup(<ElapsedTime start={START} isRunning locale="en" />)
    const second = renderToStaticMarkup(
      <ElapsedTime start={new Date("2020-01-01T00:00:00Z")} isRunning locale="en" />,
    )
    expect(first).toContain(">0:00<")
    expect(first).toBe(second)
  })

  test("with `now`, the prerender carries the real duration", () => {
    const markup = renderToStaticMarkup(<ElapsedTime start={START} now={at(252)} locale="en" />)
    expect(markup).toContain(">4:12<")
    // React's server renderer spells it `dateTime`; HTML attribute names are
    // case-insensitive, so the parsed attribute is the same one the client sets.
    expect(markup).toMatch(/datetime="PT4M12S"/i)
  })

  test("after mount the reference point is picked up", () => {
    // `render` flushes effects, so this is the post-hydration state: the
    // component has read the clock exactly once, in an effect.
    render(<ElapsedTime start={at(-252)} locale="en" now={undefined} />)
    expect(rendered()?.textContent).not.toBe("0:00")
  })
})
