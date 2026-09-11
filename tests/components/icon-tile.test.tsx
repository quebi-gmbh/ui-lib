/**
 * IconTile's two borrowed scales, and the one thing it renders.
 *
 * The component is a span with a class list, so its behaviour is entirely in
 * what those classes are — and both halves of the class list are copies of
 * another component's: the tints are Badge's and the box sizes are Button's
 * square scale. A copy that nothing checks is a copy that drifts, which is the
 * failure this component was published to stop happening in consumer code; it
 * would be a poor trade to reintroduce it one layer down. So the copies are
 * pinned here rather than merely commented.
 */
import { describe, expect, test } from "bun:test"
import { render, screen } from "@testing-library/react"
import { badgeIntents } from "../../src/components/badge"
import { buttonStyles } from "../../src/components/button"
import { IconTile, iconTileIntents, iconTileStyles } from "../../src/components/icon-tile"

const tile = () => document.querySelector('[data-slot="icon-tile"]') as HTMLElement

describe("IconTile's tints", () => {
  test("are Badge's, value for value", () => {
    // Not "look similar" — equal. Either component may grow a new intent, but
    // a tint that means `warning` has to be the same tint in both places.
    expect(iconTileIntents).toEqual(badgeIntents)
  })
})

describe("IconTile's box", () => {
  // The claim in the doc comment: a tile and an icon button of the same name
  // are the same height, so the two sit in a row without either being nudged.
  test.each([
    ["xs", "sq-xs"],
    ["sm", "sq-sm"],
    ["md", "sq-md"],
    ["lg", "sq-lg"],
  ] as const)("size=%s is the same square as a button's size=%s", (tileSize, buttonSize) => {
    const box = /(?:^|\s)(size-[\d.]+)(?:\s|$)/
    const tileBox = iconTileStyles({ size: tileSize }).match(box)?.[1]
    const buttonBox = buttonStyles({ size: buttonSize }).match(box)?.[1]

    expect(tileBox).toBeDefined()
    expect(buttonBox).toBeDefined()
    expect(tileBox).toBe(buttonBox)
  })

  test("2xs is smaller than the smallest button — it is an indicator, not a hit target", () => {
    // The size the table's sort affordance uses. If it ever grew to sq-xs the
    // column header would shift, so the relationship is worth stating.
    expect(iconTileStyles({ size: "2xs" })).toContain("size-4.5")
  })
})

describe("IconTile", () => {
  test("renders its icon inside a span that carries the tile slot", () => {
    render(
      <IconTile intent="brand">
        <svg data-slot="icon" aria-hidden="true" />
      </IconTile>,
    )

    expect(tile().tagName).toBe("SPAN")
    expect(tile().querySelector('[data-slot="icon"]')).not.toBeNull()
  })

  test("is not in the accessibility tree unless the call site puts it there", () => {
    // Decorative by default: a tile with no role announces nothing, and a
    // labelled one is an image. Both are the call site's decision, because only
    // the call site knows whether text beside the tile already says this.
    const { rerender } = render(
      <IconTile>
        <svg data-slot="icon" aria-hidden="true" />
      </IconTile>,
    )
    expect(tile()).not.toHaveAttribute("role")
    expect(screen.queryByRole("img")).toBeNull()

    rerender(
      <IconTile role="img" aria-label="Sync healthy">
        <svg data-slot="icon" aria-hidden="true" />
      </IconTile>,
    )
    expect(screen.getByRole("img", { name: "Sync healthy" })).toBe(tile())
  })

  test("isCircle actually rounds the tile", () => {
    // The radius bug Button had: `rounded-quebi-sm` in `base` and
    // `rounded-full` in a variant are not one group to tailwind-merge, so the
    // prop reads as supported and does nothing. Mutually exclusive branches.
    render(
      <IconTile isCircle>
        <svg data-slot="icon" aria-hidden="true" />
      </IconTile>,
    )

    expect(tile()).toHaveClass("rounded-full")
    expect(tile()).not.toHaveClass("rounded-quebi-sm")
  })

  test("a className wins over the intent's own fill", () => {
    // How the table's sort affordance tints itself on column hover: the tile is
    // not interactive, so the hover state belongs to the caller.
    render(
      <IconTile className="bg-quebi-surface/[0.08]">
        <svg data-slot="icon" aria-hidden="true" />
      </IconTile>,
    )

    expect(tile()).toHaveClass("bg-quebi-surface/[0.08]")
    expect(tile()).not.toHaveClass("bg-quebi-surface/[0.06]")
  })
})
