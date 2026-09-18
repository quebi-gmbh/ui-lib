/**
 * The command palette's footer, and the one component it is allowed to style.
 *
 * The footer used to carry its own key-chip styling as `*:[kbd]:…` arbitrary
 * variants — a second, worse `Kbd`: 16px tall, no horizontal padding, so
 * anything longer than one glyph ("esc") sat flush against its own ring (task
 * #138). It also sat on `px-2` while every row above it lands its text 18px
 * from the panel edge, and carried a `col-span-full` that does nothing to a
 * flex child.
 *
 * The chip half is the part that cannot be half-fixed: `*:[kbd]:` matches a
 * `<Kbd>` direct child too, so re-adding those variants *alongside* the
 * component would give a consumer both class sets at once, fighting over the
 * same properties. Hence a test that says the footer styles no `kbd` at all.
 */
import { describe, expect, test } from "bun:test"
import { render, screen } from "@testing-library/react"
import { CommandMenuFooter } from "../../src/components/command-menu"
import { Kbd } from "../../src/components/keyboard"

const footer = () => screen.getByTestId("footer")
const classesOf = (element: HTMLElement) => new Set(element.className.split(/\s+/))

describe("CommandMenuFooter's box", () => {
  test("insets its text to the palette's 18px text column", () => {
    render(<CommandMenuFooter data-testid="footer">Press to select.</CommandMenuFooter>)
    // 18px = `px-4.5`, which is where the search placeholder (SearchField
    // `px-2.5` + Input `sm:px-2`), the section headers (List `p-2` + Header
    // `px-2.5`) and the item labels (List `p-2` + item `sm:px-2.5`) all land.
    // `px-2` — the old value — hung the footer copy 10px to their left.
    const classes = classesOf(footer())
    expect(classes).toContain("px-4.5")
    expect(classes).not.toContain("px-2")
  })

  test("does not claim a grid column it has no grid for", () => {
    render(<CommandMenuFooter data-testid="footer">Press to select.</CommandMenuFooter>)
    // The footer is a flex child of the palette's Dialog; the only grid is its
    // sibling list. `col-span-full` was inert and misleading to read.
    const classes = classesOf(footer())
    expect(classes).not.toContain("col-span-full")
    // `flex-none`, by contrast, is load-bearing: the list scrolls, the footer
    // does not shrink.
    expect(classes).toContain("flex-none")
  })
})

describe("CommandMenuFooter's key chips", () => {
  test("are not styled by the footer", () => {
    render(<CommandMenuFooter data-testid="footer">Press to select.</CommandMenuFooter>)
    expect(footer().className).not.toContain("[kbd]")
  })

  test("are Kbd, which keeps its own horizontal padding", () => {
    render(
      <CommandMenuFooter data-testid="footer">
        Press <Kbd>↵</Kbd> to select, <Kbd>esc</Kbd> to close.
      </CommandMenuFooter>,
    )
    // The reported defect: "esc" had no side padding. It comes from Kbd, so a
    // multi-character key is padded for the same reason a single glyph is.
    const chips = Array.from(footer().querySelectorAll<HTMLElement>('[data-slot="kbd"]'))
    expect(chips).toHaveLength(2)
    for (const chip of chips) {
      expect(classesOf(chip)).toContain("px-1.5")
    }
  })
})
