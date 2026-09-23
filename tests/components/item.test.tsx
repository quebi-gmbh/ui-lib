/**
 * Item's accessibility guarantee: a group is announced as a list of its rows.
 *
 * `ItemGroup` is a `<ul>` with `list-style: none`, which WebKit takes as a
 * reason to drop the list role — VoiceOver then reads the rows as loose text
 * with no count. The explicit `role="list"` is the fix, and it looks redundant
 * enough that someone will delete it; this is what fails when they do.
 */
import { describe, expect, test } from "bun:test"
import { render, screen, within } from "@testing-library/react"
import { Button } from "../../src/components/button"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMeta,
  ItemTitle,
} from "../../src/components/item"

describe("Item", () => {
  test("a group is a list, and each row is one item of it", () => {
    render(
      <ItemGroup aria-label="Members">
        <Item>
          <ItemContent>
            <ItemTitle>Aurelia Vance</ItemTitle>
          </ItemContent>
          <ItemMeta>Owner</ItemMeta>
        </Item>
        <Item>
          <ItemContent>
            <ItemTitle>Jonas Keller</ItemTitle>
          </ItemContent>
          <ItemMeta>Editor</ItemMeta>
        </Item>
      </ItemGroup>,
    )
    const list = screen.getByRole("list", { name: "Members" })
    expect(list).toHaveAttribute("role", "list")
    expect(within(list).getAllByRole("listitem")).toHaveLength(2)
  })

  test("the row is static: the action is the only thing that takes focus", () => {
    render(
      <ItemGroup>
        <Item>
          <ItemContent>
            <ItemTitle>Aurelia Vance</ItemTitle>
          </ItemContent>
          <ItemActions>
            <Button size="xs">Manage</Button>
          </ItemActions>
        </Item>
      </ItemGroup>,
    )
    const row = screen.getByRole("listitem")
    expect(row).not.toHaveAttribute("tabindex")
    expect(within(row).getAllByRole("button")).toHaveLength(1)
  })
})
