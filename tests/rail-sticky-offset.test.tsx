/**
 * The sticky rail and the header it has to clear.
 *
 * `FilterRail` pins itself to the *viewport* when there is room for a sidebar,
 * and the viewport is the one box its container queries cannot ask about. Until
 * this test it pinned at a literal `top-6` and capped its scroll box at
 * `100svh - 48px`, both measured from the top of the window — which is right
 * only for a page with nothing sticky above it. This site has a `sticky top-0`
 * header 64px tall, so the stuck rail's heading and its Clear all button sat
 * inside the header band behind a translucent blur, and the bottom of its
 * scroll box fell 64px below the bottom of the window, taking the last facet
 * with it.
 *
 * The fix is a custom property, and the reason it needs a test is that its two
 * halves are in different files and neither fails without the other: the
 * component reads `--quebi-rail-top`, the site's shell declares it, and if the
 * declaration is dropped the component silently falls back to the bare-viewport
 * default and goes straight back under the header. Nothing renders differently
 * in a test DOM — happy-dom has no layout and no sticky positioning — so, like
 * `page-scroller.test.ts`, this names the cause rather than the symptom.
 */
import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { render, screen } from "@testing-library/react"
import { FilterRail } from "../src/components/filter-rail"
import type { FilterField } from "../src/lib/data-table"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const read = (path: string) => readFileSync(join(root, path), "utf8")

const PROPERTY = "--quebi-rail-top"

describe("the rail's sticky offset is the page's to declare", () => {
  const source = read("src/components/filter-rail.tsx")

  test("both the pin and the scroll box are derived from the property", () => {
    expect(source).toContain(`@3xl/rail-layout:top-[var(${PROPERTY},`)
    expect(source).toContain(`@3xl/rail-layout:max-h-[calc(100svh-var(${PROPERTY},`)
  })

  test("neither is a literal offset any more", () => {
    // The shape that put the rail behind the header. A bare `top-<n>` under the
    // layout's container query is measured from the window, so it cannot know
    // about chrome the page mounted above it.
    expect(source).not.toMatch(/@3xl\/rail-layout:top-\d/)
    expect(source).not.toMatch(/@3xl\/rail-layout:max-h-\[calc\(100svh---spacing/)
  })

  test("the site's shell declares it, because the site is what has a header", () => {
    // `root.tsx` holds `<Header>`, so it is the only file that knows how much
    // sticky chrome there is. Dropping this line is silent: the component keeps
    // working and goes back under the bar.
    expect(read("src/root.tsx")).toContain(`[${PROPERTY}:`)
  })
})

describe("the rail's title row", () => {
  const fields: FilterField[] = [
    { id: "maker", label: "Maker", variant: "enum", options: [{ value: "pulse", label: "Pulse" }] },
  ]

  /** The row holding the `<h2>` — the one the Clear all button appears in. */
  const titleRow = () => screen.getByRole("heading", { name: "Filters" }).parentElement

  test("reserves the Clear all button's height whether or not it is there", () => {
    // `Clear all` is an `xs` Button — taller than the bare heading beside it —
    // and it appears the moment the first facet is set. Without a floor on the
    // row, ticking one box pushed every facet below it down by the difference.
    const { rerender } = render(<FilterRail fields={fields} values={{}} onChange={() => {}} />)
    expect(screen.queryByRole("button", { name: /clear all/i })).toBeNull()
    const idle = titleRow()?.className

    rerender(<FilterRail fields={fields} values={{ maker: ["pulse"] }} onChange={() => {}} />)
    expect(screen.getByRole("button", { name: /clear all/i })).toBeInTheDocument()

    expect(titleRow()?.className).toBe(idle as string)
    expect(idle).toContain("min-h-8")
  })
})
