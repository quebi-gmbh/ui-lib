/**
 * TableOfContents: the list is in the first render, nothing is current until
 * the scroll-spy runs after mount, and a click scrolls, writes the hash and
 * moves focus — without leaving a modified click to anything but the browser.
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { act, fireEvent, render, screen, within } from "@testing-library/react"
import { renderToString } from "react-dom/server"
import {
  collectTableOfContents,
  nestTableOfContents,
  TableOfContents,
} from "../../src/components/table-of-contents"

const ITEMS = [
  { id: "install", title: "Installation", level: 2 },
  { id: "cli", title: "Using the CLI", level: 3 },
  { id: "usage", title: "Usage", level: 2 },
]

function Page({ activeId }: { activeId?: string | null }) {
  return (
    <div>
      <TableOfContents items={ITEMS} {...(activeId !== undefined ? { activeId } : {})} />
      <h2 id="install">Installation</h2>
      <h3 id="cli">Using the CLI</h3>
      <h2 id="usage">Usage</h2>
    </div>
  )
}

describe("TableOfContents", () => {
  test("renders a named nav with the items nested by level", () => {
    render(<Page />)
    const nav = screen.getByRole("navigation", { name: "On this page" })
    const install = within(nav).getByRole("link", { name: "Installation" })
    expect(install).toHaveAttribute("href", "#install")
    // The h3 sits in a list inside the h2's list item.
    const cli = within(nav).getByRole("link", { name: "Using the CLI" })
    expect(install.closest("li")?.contains(cli)).toBe(true)
    expect(within(nav).getByRole("link", { name: "Usage" }).closest("li")?.contains(cli)).toBe(
      false,
    )
  })

  test("a visible label names the landmark", () => {
    render(<TableOfContents items={ITEMS} label="Contents" />)
    expect(screen.getByRole("navigation", { name: "Contents" })).toBeInTheDocument()
  })

  test("the server render has every link and nothing current", () => {
    const html = renderToString(<TableOfContents items={ITEMS} />)
    for (const item of ITEMS) expect(html).toContain(`href="#${item.id}"`)
    expect(html).not.toContain("aria-current")
  })

  test("a controlled activeId is marked as the current location", () => {
    render(<Page activeId="usage" />)
    expect(screen.getByRole("link", { name: "Usage" })).toHaveAttribute("aria-current", "location")
    expect(screen.getByRole("link", { name: "Installation" })).not.toHaveAttribute("aria-current")
  })

  test("a click writes the hash, focuses the heading and marks the row current", () => {
    render(<Page />)
    const link = screen.getByRole("link", { name: "Usage" })
    const notPrevented = fireEvent.click(link)
    expect(notPrevented).toBe(false)
    expect(window.location.hash).toBe("#usage")
    const heading = document.getElementById("usage")
    expect(document.activeElement).toBe(heading)
    expect(heading).toHaveAttribute("tabindex", "-1")
    expect(link).toHaveAttribute("aria-current", "location")
  })

  test("a modified click is left to the browser", () => {
    render(<Page />)
    const notPrevented = fireEvent.click(screen.getByRole("link", { name: "Usage" }), {
      metaKey: true,
    })
    expect(notPrevented).toBe(true)
  })
})

describe("scroll-spy", () => {
  const tops: Record<string, number> = {}
  let fire: (() => void) | null = null
  // Both stubs are removed rather than reassigned: `getBoundingClientRect` is
  // inherited from Element, and happy-dom may not define IntersectionObserver at
  // all, so writing the "original" back would leave an own property behind that
  // later suites (the charts measure their containers) would read.
  const hadObserver = Object.hasOwn(globalThis, "IntersectionObserver")
  const Original = globalThis.IntersectionObserver

  beforeEach(() => {
    globalThis.IntersectionObserver = class {
      constructor(callback: () => void) {
        fire = callback
      }
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return []
      }
    } as unknown as typeof IntersectionObserver
    HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
      const top = tops[this.id] ?? 0
      return { top, bottom: top + 20, left: 0, right: 0, width: 0, height: 20 } as DOMRect
    }
  })

  afterEach(() => {
    if (hadObserver) globalThis.IntersectionObserver = Original
    else Reflect.deleteProperty(globalThis, "IntersectionObserver")
    Reflect.deleteProperty(HTMLElement.prototype, "getBoundingClientRect")
    fire = null
  })

  test("marks the last heading above the reading line", () => {
    Object.assign(tops, { install: 400, cli: 800, usage: 1200 })
    render(<Page />)
    expect(screen.queryByRole("link", { current: "location" })).toBeNull()

    Object.assign(tops, { install: -300, cli: 50, usage: 500 })
    act(() => fire?.())
    expect(screen.getByRole("link", { name: "Using the CLI" })).toHaveAttribute(
      "aria-current",
      "location",
    )
  })
})

describe("helpers", () => {
  test("nestTableOfContents puts deeper levels under the item before them", () => {
    const tree = nestTableOfContents([
      { id: "a", title: "A", level: 2 },
      { id: "b", title: "B", level: 3 },
      { id: "c", title: "C", level: 3 },
      { id: "d", title: "D", level: 2 },
    ])
    expect(tree.map((i) => i.id)).toEqual(["a", "d"])
    expect(tree[0]?.children?.map((i) => i.id)).toEqual(["b", "c"])
  })

  test("collectTableOfContents reads the headings with ids", () => {
    const root = document.createElement("div")
    root.innerHTML = `<h2 id="one">One</h2><h3 id="two">Two</h3><h2>No id</h2>`
    expect(collectTableOfContents(root)).toEqual([
      { id: "one", title: "One", level: 2 },
      { id: "two", title: "Two", level: 3 },
    ])
  })
})
