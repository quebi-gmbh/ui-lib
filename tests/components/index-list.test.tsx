/** IndexList: numbering, and the branch between a link row and a static one. */
import { expect, test } from "bun:test"
import { render, screen, within } from "@testing-library/react"
import { IndexList } from "../../src/components/index-list"

test("numbers rows 01, 02, … unless a number is given", () => {
  render(<IndexList items={[{ title: "quebi cloud" }, { title: "klartex" }, { title: "equana", number: "2023" }]} />)
  const rows = screen.getAllByRole("listitem")
  expect(rows.map((row) => row.textContent)).toEqual(["01quebi cloud", "02klartex", "2023equana"])
})

test("a row with an href is a link with the title in its name; a row without one is not", () => {
  render(
    <IndexList
      items={[
        { title: "quebi cloud", meta: "workspace", href: "/work/cloud" },
        { title: "discovery", meta: "two weeks" },
      ]}
    />,
  )
  const [linked, plain] = screen.getAllByRole("listitem")
  const link = within(linked).getByRole("link")
  expect(link.getAttribute("href")).toBe("/work/cloud")
  expect(link.textContent).toContain("quebi cloud")
  expect(within(plain).queryByRole("link")).toBeNull()
})

test("is an ordered list", () => {
  render(<IndexList items={[{ title: "a" }]} />)
  expect(screen.getByRole("list").tagName).toBe("OL")
})
