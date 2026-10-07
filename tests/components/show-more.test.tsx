/**
 * ShowMore's chips are the Buttons they sit beside (task #185).
 *
 * `show-more.tsx` used to carry its own transcription of an older Button
 * hover — `transition-all`, a scale, a glow on the selected chip — and when
 * `Button` dropped them this copy did not follow, so a row of chips grew and
 * glowed next to Buttons that did not.
 *
 * The fix is that there is no copy: the pill is
 * `buttonStyles({ intent: isSelected ? "primary" : "outline", size: "sm",
 * isCircle: true })`. These assertions are the counterpart of the ones in
 * `button.test.tsx`, and they read the class list *off the rendered element*
 * rather than off the source — an intent chosen per render state only matches
 * `Button` if the recipe's output survives to the DOM, and a `selected:`
 * transcription would pass a source grep while rendering differently.
 */
import { expect, test } from "bun:test"
import { render, screen } from "@testing-library/react"
import { buttonStyles } from "../../src/components/button"
import { ShowMore } from "../../src/components/show-more"

/** The chip's resolved class list, post-merge, as the browser would get it. */
function chipClasses(props: { defaultSelected?: boolean; isDisabled?: boolean } = {}) {
  const { unmount } = render(<ShowMore {...props}>Show more</ShowMore>)
  const classes = screen.getByRole("button", { name: "Show more" }).className.split(/\s+/)
  unmount()
  return classes
}

test("the resting chip renders the Button recipe's outline intent, not a copy of it", () => {
  // Not a subset check: the whole class list has to be what `buttonStyles`
  // emits, because anything extra is the start of the next hand-rolled copy.
  expect(chipClasses().join(" ")).toBe(
    buttonStyles({ intent: "outline", size: "sm", isCircle: true }),
  )
})

test("the selected chip is the primary intent, token for token", () => {
  // The `selected:` block used to transcribe `primary` by hand. Naming the
  // intent means the edge and the hover fill track `Button` instead of being
  // re-derived here.
  expect(chipClasses({ defaultSelected: true }).join(" ")).toBe(
    buttonStyles({ intent: "primary", size: "sm", isCircle: true }),
  )
})

test("neither state casts a shadow", () => {
  // A chip on a divider is in the page flow, and nothing there casts one —
  // the same rule `button.test.tsx` pins on every intent.
  for (const selected of [false, true]) {
    const shadows = chipClasses({ defaultSelected: selected }).filter((c) => /(^|:)shadow-/.test(c))
    expect(shadows, `the ${selected ? "selected" : "resting"} chip casts a shadow`).toEqual([])
  }
})

test("nothing grows under the pointer, in any state", () => {
  // `hover:scale-[1.02]` plus `active:scale-100` plus `disabled:hover:scale-100`
  // — three classes whose only job was to cancel each other.
  for (const props of [{}, { defaultSelected: true }, { isDisabled: true }]) {
    const scales = chipClasses(props).filter((c) => /(^|:)scale-/.test(c))
    expect(scales, `${JSON.stringify(props)} still transforms on a state`).toEqual([])
  }
})

test("the transition names its properties instead of animating all of them", () => {
  const classes = chipClasses()
  expect(classes).not.toContain("transition-all")

  const transition = classes.find((c) => c.startsWith("transition-["))
  expect(transition, "the chip no longer takes Button's explicit transition list").toBeString()

  const animated = (transition as string).slice("transition-[".length, -1).split(",")
  expect(animated).toContain("background-color")
  expect(animated).toContain("border-color")
  expect(animated).toContain("color")
  // The chip is `disabled:opacity-45` like any Button; `all` used to ease it.
  expect(animated).toContain("opacity")
})

test("the pill is still a pill", () => {
  // The one thing the chip does not take from the Button default. `rounded-*`
  // is a single tailwind-merge group, so this is also the #49 failure mode:
  // if `isCircle` stopped winning, the chip would quietly square off.
  const classes = chipClasses()
  expect(classes).toContain("rounded-full")
  expect(classes).not.toContain("rounded-none")
})
