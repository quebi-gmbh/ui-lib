/**
 * ShowMore's chips hover like the Buttons they sit beside (task #185).
 *
 * `show-more.tsx` carried its own transcription of the pre-#178 Button hover —
 * `transition-all duration-200 ease-out hover:scale-[1.02] active:scale-100`,
 * and `selected:hover:shadow-quebi-glow-strong` on the selected chip. Task #178
 * (PR #129) took all three off `Button`: the overlay rung became one neutral
 * `hover:shadow-md` declared in `base` so every intent lifts identically, the
 * scale went (a control that grows under the pointer nudges its neighbours'
 * optical alignment), and `transition-all` narrowed to the properties that
 * actually move. The copy here did not follow, so a row of chips grew and
 * glowed next to Buttons that lifted — on the same gallery page, which is what
 * made it visible.
 *
 * The fix is that there is no copy: the pill is
 * `buttonStyles({ intent: isSelected ? "primary" : "outline", size: "sm",
 * isCircle: true })`. These assertions are the counterpart of the five in
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
  // intent means the mark-token edge (task #145) and the hover fill track
  // `Button` instead of being re-derived here.
  expect(chipClasses({ defaultSelected: true }).join(" ")).toBe(
    buttonStyles({ intent: "primary", size: "sm", isCircle: true }),
  )
})

test("neither state lifts on the overlay token", () => {
  // `shadow-quebi-glow-strong` is what a *floating surface* takes — the command
  // palette, the active Stepper bullet. A chip on a divider is neither, and
  // this file was the last consumer of it outside those two.
  for (const selected of [false, true]) {
    expect(
      chipClasses({ defaultSelected: selected }),
      `the ${selected ? "selected" : "resting"} chip is back on the overlay rung`,
    ).not.toContain("hover:shadow-quebi-glow-strong")
  }
})

test("both states lift by the one neutral rung Button gives every intent", () => {
  const rungs = new Set(
    [false, true].map((selected) =>
      chipClasses({ defaultSelected: selected })
        .filter((c) => c.startsWith("hover:shadow-"))
        .join(" "),
    ),
  )
  expect(rungs.size, `the chip's hover lift changes with selection: ${JSON.stringify([...rungs])}`).toBe(1)
  expect([...rungs][0]).toBe("hover:shadow-md")
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
  expect(animated).toContain("box-shadow")
  expect(animated).toContain("background-color")
  expect(animated).toContain("border-color")
  expect(animated).toContain("color")
  // The chip is `disabled:opacity-50` like any Button; `all` used to ease it.
  expect(animated).toContain("opacity")
})

test("the pill is still a pill", () => {
  // The one thing the chip does not take from the Button default. `rounded-*`
  // is a single tailwind-merge group, so this is also the #49 failure mode:
  // if `isCircle` stopped winning, the chip would quietly square off.
  const classes = chipClasses()
  expect(classes).toContain("rounded-full")
  expect(classes).not.toContain("rounded-quebi-sm")
})
