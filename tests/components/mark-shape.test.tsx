/**
 * A checkbox must not be shaped like a radio.
 *
 * The shape of the mark is the only thing in either control that says whether
 * the group takes one answer or several — the label says what the option is,
 * not how many of them you may have, and nothing else in a `CheckboxGroup`
 * distinguishes it from a `RadioGroup` at a glance. So when the checkbox
 * indicator took `rounded-quebi-sm`, the token sized for a 38px button, it got
 * an 8px radius on an 18px box where the maximum possible radius is 9px: a
 * circle with a 2px flat run per side. Every multi-select in the library read
 * as single-select, including the one in `FilterPanel`, which is where it was
 * finally noticed (task #199).
 *
 * The fix was a new scale step, `--radius-quebi-xs` at 4px, and a one-class
 * edit — which is exactly the kind of change that a later "make the checkbox
 * match the inputs" tidy-up reverts without anyone seeing what it cost. So
 * what is pinned here is the invariant rather than the class: the mark's
 * radius, resolved through the theme, has to leave at least half of each edge
 * flat. At 18px that is 4.5px, and the token is 4px.
 *
 * The upper bound is not the whole statement. A hard square would pass it and
 * would be wrong for a different reason — it would be the only square corner
 * in a library whose every other surface is rounded, so the checkbox would
 * read as a foreign element rather than as a sibling of the input above it.
 * Hence the lower bound too: the mark is rounded, just not round.
 */
import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { render } from "@testing-library/react"
import { Checkbox } from "../../src/components/checkbox"
import { Radio, RadioGroup } from "../../src/components/radio"

const THEME = readFileSync(join(import.meta.dir, "..", "..", "src", "quebi-theme.css"), "utf8")

/** `--radius-quebi-xs: 0.25rem` -> 4. Throws rather than guessing a default. */
function radiusToken(name: string): number {
  const declared = THEME.match(new RegExp(`--radius-${name}:\\s*([0-9.]+)(rem|px)\\s*;`))
  if (!declared) throw new Error(`no --radius-${name} in quebi-theme.css`)
  return Number(declared[1]) * (declared[2] === "rem" ? 16 : 1)
}

/** The classes on the one `[data-slot=indicator]` of a rendered control. */
function markClasses(element: React.ReactElement): string[] {
  const { container } = render(element)
  const mark = container.querySelector<HTMLElement>('[data-slot="indicator"]')
  if (!mark) throw new Error("no [data-slot=indicator] in the rendered control")
  return Array.from(mark.classList)
}

/** The box the mark is drawn in, from its own `size-[18px]` / `size-4` class. */
function boxSize(classes: string[]): number {
  for (const className of classes) {
    const arbitrary = className.match(/^size-\[([0-9.]+)px\]$/)
    if (arbitrary) return Number(arbitrary[1])
    const scale = className.match(/^size-([0-9.]+)$/)
    if (scale) return Number(scale[1]) * 4
  }
  throw new Error(`no size class among ${classes.join(" ")}`)
}

/** The mark's corner radius in px: `rounded-full` is half the box. */
function markRadius(classes: string[], box: number): number {
  const rounded = classes.filter((className) => /^rounded(-|$)/.test(className))
  expect(rounded).toHaveLength(1)
  if (rounded[0] === "rounded-full") return box / 2
  const token = rounded[0].match(/^rounded-(quebi-[a-z]+)$/)
  if (!token) throw new Error(`${rounded[0]} is not a quebi radius token`)
  // CSS clamps a radius that would overrun the edge it shares, so a token
  // larger than half the box renders as a circle rather than as its own value.
  return Math.min(radiusToken(token[1]), box / 2)
}

const checkboxMark = () => markClasses(<Checkbox aria-label="Ship it" />)
const radioMark = () =>
  markClasses(
    <RadioGroup aria-label="Plan">
      <Radio value="pro">Pro</Radio>
    </RadioGroup>,
  )

describe("the checkbox mark is a square, the radio mark is a circle", () => {
  test("the radio mark is a full circle", () => {
    const classes = radioMark()
    expect(markRadius(classes, boxSize(classes))).toBe(boxSize(classes) / 2)
  })

  test("the checkbox mark leaves at least half of each edge flat", () => {
    const classes = checkboxMark()
    const box = boxSize(classes)
    // radius <= box / 4 on both corners of an edge leaves >= box / 2 straight.
    expect(markRadius(classes, box)).toBeLessThanOrEqual(box / 4)
  })

  test("the checkbox mark is still rounded, not a hard square", () => {
    const classes = checkboxMark()
    expect(markRadius(classes, boxSize(classes))).toBeGreaterThan(0)
  })

  test("the two marks are not the same shape", () => {
    const checkbox = checkboxMark()
    const radio = radioMark()
    expect(markRadius(checkbox, boxSize(checkbox))).not.toBe(
      markRadius(radio, boxSize(radio)) * (boxSize(checkbox) / boxSize(radio)),
    )
  })
})
