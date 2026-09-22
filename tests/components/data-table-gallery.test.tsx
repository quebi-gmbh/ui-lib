/**
 * Every example in the table family, rendered in a browser-shaped environment.
 *
 * The build prerenders these pages, which already proves they render on the
 * server. What it cannot prove is the client half: effects, localStorage, the
 * virtualizer's measurement, the toast provider. An example is copied by hand
 * out of the gallery, so one that throws after hydration is a broken thing we
 * handed someone.
 */
import { describe, expect, test } from "bun:test"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
// A rendering fixture, not app code: `tests/**/*.tsx` sits outside biome.jsonc's
// file list precisely so a harness can reach for the router's memory adapter.
import { createMemoryRouter, RouterProvider } from "react-router"
import { dataTableExamples } from "../../src/registry/data-table.examples"
import { serverTableExamples } from "../../src/registry/server-table.examples"
import { tableControlsExamples } from "../../src/registry/table-controls.examples"
import { tableShellExamples } from "../../src/registry/table-shell.examples"
import type { ComponentExample } from "../../src/registry/types"

/** The examples call `useSearchParams`, so they need a router around them. */
function renderExample(example: ComponentExample) {
  const router = createMemoryRouter(
    [{ path: "/", element: <>{example.render()}</> }],
    { initialEntries: ["/"] },
  )
  return render(<RouterProvider router={router} />)
}

describe("the gallery renders", () => {
  test.each(dataTableExamples.map((example) => [example.title, example] as const))(
    "data-table: %s",
    (_title, example) => {
      const { container } = renderExample(example)
      expect(container.textContent?.length ?? 0).toBeGreaterThan(0)
    },
  )

  test.each(serverTableExamples.map((example) => [example.title, example] as const))(
    "server-table: %s",
    (_title, example) => {
      const { container } = renderExample(example)
      expect(container.textContent?.length ?? 0).toBeGreaterThan(0)
    },
  )

  test.each(tableShellExamples.map((example) => [example.title, example] as const))(
    "table-shell: %s",
    (_title, example) => {
      const { container } = renderExample(example)
      expect(container.textContent?.length ?? 0).toBeGreaterThan(0)
    },
  )

  test.each(tableControlsExamples.map((example) => [example.title, example] as const))(
    "table-controls: %s",
    (_title, example) => {
      const { container } = renderExample(example)
      expect(container.textContent?.length ?? 0).toBeGreaterThan(0)
    },
  )

  test("every example title is unique — the gallery keys on it", () => {
    for (const examples of [
      dataTableExamples,
      serverTableExamples,
      tableShellExamples,
      tableControlsExamples,
    ]) {
      const titles = examples.map((example) => example.title)
      expect(new Set(titles).size).toBe(titles.length)
    }
  })
})


/**
 * The one example in the family that draws its own rows.
 *
 * TableControls is the chrome without the table, and for every other example
 * that is the point. The selection one cannot be: "0 selected" over an empty
 * space is a count of nothing, and a reader asked exactly that of the published
 * page. So it renders the page it is paging through as a column of checkboxes,
 * and these tests hold that shape — the rows exist, the counts describe them,
 * and the model underneath is still the one that survives pagination.
 */
describe("the selection example has rows to select", () => {
  const example = tableControlsExamples.find((entry) =>
    entry.title.startsWith("Pager, selection"),
  ) as ComponentExample

  /** A row's checkbox, found by the label text beside it. */
  const box = (label: string) =>
    screen
      .queryAllByRole("checkbox")
      .map((checkbox) => checkbox.closest("label") as HTMLElement)
      .find((element) => element.textContent?.startsWith(label)) as HTMLElement

  const rowLabels = () =>
    screen
      .queryAllByRole("checkbox")
      .map((checkbox) => checkbox.closest("label")?.textContent ?? "")
      .filter((text) => text.startsWith("ORD-"))

  /** react-aria splits the count across elements, so read the whole subtree. */
  const text = () => document.body.textContent?.replace(/\s+/g, " ") ?? ""

  test("draws one checkbox per row of the current page", () => {
    renderExample(example)
    expect(rowLabels()).toHaveLength(10)
    expect(rowLabels()[0]).toStartWith("ORD-4000")
    expect(text()).toContain("0 of 10 on this page")
  })

  test("checking a row is counted on the page and in the bulk bar", async () => {
    const user = userEvent.setup()
    renderExample(example)

    await user.click(box("ORD-4003"))
    expect(text()).toContain("1 of 10 on this page")
    expect(text()).toContain("1 row selected")
  })

  test("a selection made on one page survives the next", async () => {
    const user = userEvent.setup()
    renderExample(example)

    await user.click(box("Select this page"))
    expect(text()).toContain("10 rows selected")

    await user.click(screen.getByRole("button", { name: /next/i }))
    expect(rowLabels()[0]).toStartWith("ORD-4010")
    expect(text()).toContain("0 of 10 on this page")
    expect(text()).toContain("10 rows selected")
  })

  test("all-matching excludes a row rather than expanding into keys", async () => {
    const user = userEvent.setup()
    renderExample(example)

    await user.click(box("Select this page"))
    await user.click(screen.getByRole("button", { name: /Select all 300 matching/i }))
    expect(text()).toContain("300 rows selected")
    expect(text()).toContain("10 of 10 on this page")

    await user.click(box("ORD-4002"))
    expect(text()).toContain("299 rows selected")
    expect(text()).toContain("9 of 10 on this page")
  })
})
