/**
 * The component nav's collapsed-by-default behaviour.
 *
 * Collapsing thirteen groups is easy; the three ways it can hide something the
 * reader needed are the reason this file exists. A search that returns only
 * category headings looks broken, a component page whose own entry is invisible
 * in its own nav is worse than a long list, and both fixes have to survive the
 * prerender — the HTML the build writes is the closed state, so anything that
 * opens a group has to happen during render rather than in an effect.
 */
import { beforeEach, describe, expect, test } from "bun:test"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
// A rendering fixture, not app code: `tests/**/*.tsx` sits outside biome.jsonc's
// file list precisely so a harness can reach for the router's memory adapter.
import { createMemoryRouter, RouterProvider } from "react-router"
import { ComponentSidebar } from "../src/site/component-sidebar"

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      { path: "/components", element: <ComponentSidebar /> },
      { path: "/components/:slug", element: <ComponentSidebar /> },
    ],
    { initialEntries: [path] },
  )
  return render(<RouterProvider router={router} />)
}

/** The category triggers, by their accessible name — "Layout 4" and friends. */
const categoryTrigger = (category: string) =>
  screen.getByRole("button", { name: new RegExp(`^${category}\\b`) })

/** The category names in render order — the search field's own buttons are not categories. */
const categoryNames = () =>
  Array.from(document.querySelectorAll("[data-slot=disclosure] [slot=trigger]")).map((b) =>
    b.textContent?.replace(/\d+$/, "").trim(),
  )

const isExpanded = (category: string) =>
  categoryTrigger(category).getAttribute("aria-expanded") === "true"

/**
 * The written pages that live in the catalog section without being in the
 * registry. They are `/components/<something>` links like every component's,
 * and they are not what any assertion about the grouped nav is about.
 */
const WRITTEN_PAGES = new Set(["/components/focus"])

/**
 * Component links only — neither the "All components" home link nor a written
 * page above the groups is one of them.
 */
const componentLinks = () =>
  screen
    .getAllByRole("link")
    .filter((a) => {
      const href = a.getAttribute("href") ?? ""
      return href.startsWith("/components/") && !WRITTEN_PAGES.has(href)
    })
    .map((a) => a.textContent)

let user: ReturnType<typeof userEvent.setup>
beforeEach(() => {
  user = userEvent.setup()
})

describe("on the catalog index", () => {
  test("every category is collapsed, so no component link is rendered", () => {
    renderAt("/components")

    expect(categoryTrigger("Layout")).toBeInTheDocument()
    expect(categoryTrigger("Conform")).toBeInTheDocument()
    expect(isExpanded("Layout")).toBe(false)
    expect(isExpanded("Conform")).toBe(false)
    expect(componentLinks()).toEqual([])
  })

  test("the written pages sit above the groups, outside them", () => {
    renderAt("/components")

    const focus = screen.getByRole("link", { name: "Focus indicators" })
    expect(focus).toHaveAttribute("href", "/components/focus")
    // It cannot arrive through a category: the grouped nav is built from
    // metaRegistry, and a written page has no entry there to be grouped by.
    expect(focus.closest("[data-slot=disclosure]")).toBeNull()
  })

  test("the categories are in canonical order, not alphabetical", () => {
    renderAt("/components")

    const headings = categoryNames()
    expect(headings.slice(0, 3)).toEqual(["Layout", "Navigation", "Actions"])
    expect(headings.at(-1)).toBe("Conform")
    expect(headings).not.toEqual([...headings].sort())
  })

  test("a trigger opens its own group and leaves the others shut", async () => {
    renderAt("/components")

    await user.click(categoryTrigger("Layout"))

    expect(isExpanded("Layout")).toBe(true)
    expect(isExpanded("Navigation")).toBe(false)
    expect(componentLinks()).toEqual(["Card", "Container", "Scroll Area", "Separator"])
  })
})

describe("on a component page", () => {
  test("the group holding the current component starts open", () => {
    renderAt("/components/date-picker")

    expect(isExpanded("Date & time")).toBe(true)
    expect(isExpanded("Layout")).toBe(false)
    expect(componentLinks()).toContain("Date Picker")
  })

  test("a Conform variant opens Conform, not the category it wraps", () => {
    renderAt("/components/conform-date-picker")

    expect(isExpanded("Conform")).toBe(true)
    expect(isExpanded("Date & time")).toBe(false)
  })

  test("navigating opens the group the destination is in", async () => {
    renderAt("/components/card")
    expect(isExpanded("Layout")).toBe(true)

    await user.click(categoryTrigger("Charts"))
    await user.click(screen.getByRole("link", { name: "Treemap" }))

    expect(isExpanded("Charts")).toBe(true)
    // Layout stays open: a navigation adds the destination's group, it does not
    // shut whatever the reader had open to get there.
    expect(isExpanded("Layout")).toBe(true)
  })
})

describe("searching", () => {
  test("opens every group with a hit, so results are visible without a click", async () => {
    renderAt("/components")

    await user.type(screen.getByRole("searchbox"), "treemap")

    expect(isExpanded("Charts")).toBe(true)
    expect(componentLinks()).toContain("Treemap")
  })

  test("a group the search emptied is gone rather than shown shut", async () => {
    renderAt("/components")

    await user.type(screen.getByRole("searchbox"), "treemap")

    expect(screen.queryByRole("button", { name: /^Layout\b/ })).toBeNull()
  })

  test("a query with no hits says so", async () => {
    renderAt("/components")

    await user.type(screen.getByRole("searchbox"), "xyzzy")

    expect(screen.getByText(/No components match/)).toBeInTheDocument()
    expect(screen.queryAllByRole("button", { name: /^Charts\b/ })).toEqual([])
  })

  test("clearing the query returns to the current page's group, not to what it opened", async () => {
    renderAt("/components/card")

    const search = screen.getByRole("searchbox")
    await user.type(search, "treemap")
    expect(isExpanded("Charts")).toBe(true)

    await user.clear(search)

    expect(isExpanded("Layout")).toBe(true)
    expect(isExpanded("Charts")).toBe(false)
  })

  test("a group can still be collapsed while a search is running", async () => {
    renderAt("/components")

    await user.type(screen.getByRole("searchbox"), "treemap")
    await user.click(categoryTrigger("Charts"))

    expect(isExpanded("Charts")).toBe(false)
  })
})
