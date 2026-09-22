/**
 * The group keeps the active child above its neighbours so the ring around it
 * is not painted under the segment next door. That rule was written as
 * `*:focus-visible:`, which assumes the child *is* the focusable thing.
 *
 * A field is not: drop a `NumberField` into a group — which `PaginationJump`
 * does, to put `Go` on the field's edge — and the element that takes focus is
 * the input two levels down, so the child never matched `:focus-visible` and
 * never rose. `:focus-within` matches a child that is focused and a child that
 * merely holds the focus, which is the set this rule always meant.
 */
import { describe, expect, test } from "bun:test"
import { render, screen } from "@testing-library/react"
import { Button } from "../../src/components/button"
import { ButtonGroup } from "../../src/components/button-group"

describe("ButtonGroup raises whichever child has the focus", () => {
  test("it matches a child that holds the focus, not only one that takes it", () => {
    render(
      <ButtonGroup>
        <Button>Copy</Button>
        <Button>Share</Button>
      </ButtonGroup>,
    )

    const group = screen.getByRole("group")
    expect(group.className).toContain("*:focus-within:relative")
    expect(group.className).toContain("*:focus-within:z-10")
    expect(group.className).not.toContain("*:focus-visible:")
  })
})
