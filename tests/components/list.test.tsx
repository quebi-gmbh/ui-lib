/**
 * List's guarantees: it is announced as a list of its rows, a row with a
 * ListLink is one link and one tab stop that does not swallow the row's own
 * action, a section is named by its heading, and an empty list is not a list.
 */
import { describe, expect, test } from "bun:test"
import { render, screen, within } from "@testing-library/react"
import { Button } from "../../src/components/button"
import { Item, ItemActions, ItemContent, ItemTitle } from "../../src/components/item"
import { List, ListEmpty, ListLink, ListSection } from "../../src/components/list"

describe("List", () => {
  test("is a list, and each Item is one item of it", () => {
    render(
      <List aria-label="Members" density="compact">
        <Item>
          <ItemContent>
            <ItemTitle>Aurelia Vance</ItemTitle>
          </ItemContent>
        </Item>
        <Item>
          <ItemContent>
            <ItemTitle>Jonas Keller</ItemTitle>
          </ItemContent>
        </Item>
      </List>,
    )
    const list = screen.getByRole("list", { name: "Members" })
    expect(list).toHaveAttribute("role", "list")
    expect(within(list).getAllByRole("listitem")).toHaveLength(2)
  })

  test("a row that navigates is one link, and its action is still a separate button", () => {
    render(
      <List aria-label="Projects">
        <Item>
          <ItemContent>
            <ItemTitle>
              <ListLink href="#atlas">Atlas</ListLink>
            </ItemTitle>
          </ItemContent>
          <ItemActions>
            <Button size="xs">Archive</Button>
          </ItemActions>
        </Item>
      </List>,
    )
    const row = screen.getByRole("listitem")
    expect(row).not.toHaveAttribute("tabindex")
    expect(within(row).getByRole("link", { name: "Atlas" })).toHaveAttribute("href", "#atlas")
    expect(within(row).getAllByRole("link")).toHaveLength(1)
    expect(within(row).getByRole("button", { name: "Archive" })).toBeInTheDocument()
  })

  test("a section is a region named by its heading", () => {
    render(
      <ListSection title="Today">
        <List>
          <Item>
            <ItemContent>
              <ItemTitle>Deploy finished</ItemTitle>
            </ItemContent>
          </Item>
        </List>
      </ListSection>,
    )
    expect(screen.getByRole("heading", { name: "Today", level: 3 })).toBeInTheDocument()
    expect(screen.getByRole("region", { name: "Today" })).toBeInTheDocument()
  })

  test("the empty state is not a list with one item in it", () => {
    render(
      <ListEmpty title="No pending invitations">
        <Button size="sm">Invite</Button>
      </ListEmpty>,
    )
    expect(screen.getByText("No pending invitations")).toBeInTheDocument()
    expect(screen.queryByRole("list")).toBeNull()
    expect(screen.queryByRole("listitem")).toBeNull()
  })
})
