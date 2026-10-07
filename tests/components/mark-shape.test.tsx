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
 * Ink & Paper settles it the plain way: controls are square, so the checkbox
 * is a hard square and the radio a full circle, and the two cannot be read as
 * each other. What is pinned is the invariant rather than the class — the
 * mark's radius leaves at least half of each edge flat, and the two shapes
 * differ — so a later "make the checkbox match something" edit that rounds it
 * fails here with the reason attached.
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

/** A `--q-*` length's default, from the theme's shape block. */
function themeLength(name: string): number {
  const declared = THEME.match(new RegExp(`${name}:\\s*([0-9.]+)(px|rem)\\s*;`))
  if (!declared) throw new Error(`no ${name} length in quebi-theme.css`)
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
  expect(rounded.length).toBeLessThanOrEqual(1)
  // No radius class is a 0px corner.
  if (rounded.length === 0 || rounded[0] === "rounded-none") return 0
  if (rounded[0] === "rounded-full") return box / 2
  // A theme variable: measured at its default.
  const variable = rounded[0].match(/^rounded-\((--q-[a-z-]+)\)$/)
  if (variable) return Math.min(themeLength(variable[1]), box / 2)
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
  // Shape is the only thing that says whether a group takes one answer or
  // several. The checkbox is a square with 4px corners (app-radius-s); the radio stays round.
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

  test("the two marks are not the same shape", () => {
    const checkbox = checkboxMark()
    const radio = radioMark()
    expect(markRadius(checkbox, boxSize(checkbox))).not.toBe(
      markRadius(radio, boxSize(radio)) * (boxSize(checkbox) / boxSize(radio)),
    )
  })
})
