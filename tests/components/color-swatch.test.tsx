/**
 * ColorSwatch: a consumer's `size-*` wins, at every breakpoint (task #130).
 *
 * The size used to be two class groups — `size-[calc(var(--color-swatch-size)
 * +--spacing(1))]` for the base and `sm:size-(--color-swatch-size)` for `sm`
 * and up. tailwind-merge collapses a caller's `size-8` against the first of
 * those and drops it, but the `sm:` one is a different variant group, so it
 * survived *and* won on sheet order above 640px: every size passed to this
 * component was silently a 36px square on anything wider than a phone. That is
 * invisible to types, to lint and to a test that only asks "did it render" —
 * the class is present in the attribute, it is just outvoted — so what is
 * asserted here is the merged class attribute itself.
 *
 * The fix moves the responsive step onto the variable, leaving one plain
 * `size-(--color-swatch-size)` for the merge to collapse. The rule that keeps
 * it fixed: no `size` utility on this component may carry a variant.
 */
import { describe, expect, test } from "bun:test"
import { render } from "@testing-library/react"
import { ColorSwatch } from "../../src/components/color-swatch"

const swatchClasses = (element: React.ReactElement) => {
  const { container } = render(element)
  const swatch = container.querySelector<HTMLElement>('[data-slot="color-swatch"]')
  expect(swatch).not.toBeNull()
  return Array.from((swatch as HTMLElement).classList)
}

/** Every `size-*` utility in the list, including a variant-prefixed one. */
const sizeUtilities = (classes: string[]) =>
  classes.filter((klass) => /(^|:)size-/.test(klass))

describe("ColorSwatch sizing", () => {
  test.each(["size-8", "size-5", "size-full", "size-10.5"])(
    "%s from the caller is the only size left after the merge",
    (size) => {
      const classes = swatchClasses(<ColorSwatch color="#14b8a6" aria-label="Teal" className={size} />)

      expect(sizeUtilities(classes)).toEqual([size])
    },
  )

  test("no size utility is variant-scoped — that is what beat the caller", () => {
    // A `sm:size-*` in the base cannot be overridden by an unprefixed class,
    // whatever tailwind-merge does, so the component may not ship one.
    const classes = swatchClasses(<ColorSwatch color="#14b8a6" aria-label="Teal" />)

    expect(sizeUtilities(classes).filter((klass) => klass.includes(":"))).toEqual([])
  })

  test("the default is still 40px, stepping to 36px from sm up", () => {
    // Unchanged from before the fix; the responsive step moved from the `size`
    // utility onto the variable it reads.
    const classes = swatchClasses(<ColorSwatch color="#14b8a6" aria-label="Teal" />)

    expect(classes).toContain("size-(--color-swatch-size)")
    expect(classes).toContain("[--color-swatch-size:--spacing(10)]")
    expect(classes).toContain("sm:[--color-swatch-size:--spacing(9)]")
  })

  test("the color is still the caller's, verbatim", () => {
    const { container } = render(<ColorSwatch color="#14b8a6" aria-label="Teal" />)
    const swatch = container.querySelector<HTMLElement>('[data-slot="color-swatch"]')

    expect(swatch?.style.backgroundColor).toBe("rgba(20, 184, 166, 1)")
  })
})
