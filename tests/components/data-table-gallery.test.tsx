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
import { render } from "@testing-library/react"
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
