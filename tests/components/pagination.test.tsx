/**
 * The pager, in the mode a table uses it: no hrefs.
 *
 * `Pagination` was link-only, and "link-only" was never a styling decision — it
 * was `NavLink` reading a missing `href` as *disabled*, which is what made a
 * press-driven arrow render as a dead one. These cases pin the two modes apart:
 * a target with an `href` navigates, a target with an `onPress` calls back, and
 * a target with neither is the disabled edge the link examples rely on.
 *
 * `PaginationJump` is here for the thing that is a bug in the pager next door:
 * a jump field seeded once shows the page it mounted on. This one follows the
 * page it is told about.
 */
import { describe, expect, test } from "bun:test"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { Button } from "../../src/components/button"
import {
  Pagination,
  PaginationItem,
  PaginationJump,
  PaginationList,
  PaginationNext,
  PaginationPrevious,
} from "../../src/components/pagination"

describe("a pager whose pages are not addresses", () => {
  test("a press-only page reports itself and offers no href", async () => {
    const pressed: number[] = []
    render(
      <Pagination>
        <PaginationList>
          <PaginationItem onPress={() => pressed.push(1)}>1</PaginationItem>
          <PaginationItem isCurrent onPress={() => pressed.push(2)}>
            2
          </PaginationItem>
        </PaginationList>
      </Pagination>,
    )

    // A page with no address is a button, not a link with the href left off —
    // which is also what gets Space back, since react-aria's Link takes Enter
    // and nothing else.
    const one = screen.getByRole("button", { name: "1" })
    expect(one).not.toHaveAttribute("href")
    const user = userEvent.setup()
    await user.click(one)
    expect(pressed).toEqual([1])

    // The page you are on is not somewhere to go: the callback goes with the
    // href, so a press on the current page is not a navigation to it. It stays
    // focusable, because aria-current is the thing that answers "where am I".
    const two = screen.getByRole("button", { name: "2" })
    expect(two).toHaveAttribute("aria-current", "page")
    expect(two).not.toBeDisabled()
    await user.click(two)
    expect(pressed).toEqual([1])
  })

  test("a page with an href is still an anchor", () => {
    render(
      <Pagination>
        <PaginationList>
          <PaginationItem href="/results?page=2">2</PaginationItem>
        </PaginationList>
      </Pagination>,
    )
    // The half of the family that was always the point: a URL per page, an
    // anchor you can middle-click.
    expect(screen.getByRole("link", { name: "2" })).toHaveAttribute("href", "/results?page=2")
  })

  test("an arrow with a callback is live, and one with neither is the disabled edge", async () => {
    const pressed: string[] = []
    render(
      <Pagination>
        <PaginationList>
          <PaginationPrevious />
          <PaginationNext onPress={() => pressed.push("next")} />
        </PaginationList>
      </Pagination>,
    )

    // No href and no callback is the disabled edge the link examples rely on —
    // `<PaginationFirst />` with no props at all.
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled()

    const next = screen.getByRole("button", { name: "Next page" })
    expect(next).not.toBeDisabled()
    await userEvent.setup().click(next)
    expect(pressed).toEqual(["next"])
  })

  test("every target in a pager is the size the pager asked for", () => {
    render(
      <Pagination size="xs">
        <PaginationList>
          <PaginationPrevious href="#" />
          <PaginationItem href="#">1</PaginationItem>
        </PaginationList>
      </Pagination>,
    )
    // `xs` is 30px — Button's `xs` and `sq-xs`. The size reaches the parts
    // through context, so an example cannot half-apply it.
    expect(screen.getByRole("link", { name: "Previous page" }).className).toContain("size-7.5")
    expect(screen.getByRole("link", { name: "1" }).className).toContain("h-7.5")
  })
})

describe("the jump field", () => {
  test("it follows the page it is told about, instead of the one it mounted on", async () => {
    function Harness() {
      const [page, setPage] = useState(1)
      return (
        <>
          <Button onPress={() => setPage(page + 1)}>Elsewhere</Button>
          <PaginationJump page={page} pageCount={15} onJump={setPage} />
        </>
      )
    }
    render(<Harness />)

    const field = screen.getByRole("textbox", { name: "Go to page" })
    expect(field).toHaveValue("1")

    // A navigation that did not come from this field. An uncontrolled input
    // seeded by `defaultValue` would still read "1" here.
    await userEvent.setup().click(screen.getByRole("button", { name: "Elsewhere" }))
    expect(field).toHaveValue("2")
  })

  test("a page past the end is a message, not a query", async () => {
    const jumped: number[] = []
    render(<PaginationJump page={1} pageCount={15} onJump={(page) => jumped.push(page)} />)

    const user = userEvent.setup()
    const field = screen.getByRole("textbox", { name: "Go to page" })
    await user.clear(field)
    await user.type(field, "900")
    await user.click(screen.getByRole("button", { name: "Go" }))

    expect(jumped).toEqual([])
    expect(screen.getByText("Enter a page between 1 and 15")).toBeInTheDocument()

    // And a page that exists clears it and navigates.
    await user.clear(field)
    await user.type(field, "7")
    await user.click(screen.getByRole("button", { name: "Go" }))
    expect(jumped).toEqual([7])
    expect(screen.queryByText("Enter a page between 1 and 15")).toBeNull()
  })
})
