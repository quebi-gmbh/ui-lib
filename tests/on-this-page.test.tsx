/**
 * The "on this page" rail on the rule and component pages (task #228).
 *
 * The rail's items are loader data rather than a read of the rendered headings,
 * so that the prerendered HTML carries the whole list (`src/site/on-this-page.tsx`
 * has the argument). That makes a heading and its item two pieces of code that
 * have to agree: a renamed section, an id built one way in the loader and
 * another in the markup, or a new heading nobody added to the list, and the
 * rail points at nothing or skips a section — silently, since a dead `#hash` is
 * a link that does not move. So this renders the real routes, lets every chunk
 * resolve, and checks both directions: every rail item finds a heading with
 * its title, and every anchored heading on the page has an item.
 *
 * Every rule page is rendered; for components, a handful chosen to cover each
 * branch of the list — usage guidance or none, alternatives or none.
 */
import { describe, expect, mock, test } from "bun:test"
import { act } from "react"
import { render } from "@testing-library/react"
// A rendering fixture, not app code: the route is mounted under the router's
// memory adapter rather than the framework's runtime.
import { createMemoryRouter, RouterProvider, useLoaderData } from "react-router"
import { getComponent, registry } from "../src/registry"
import { rulesRegistry } from "../src/registry/rules"

// `examples-lazy` is an `import.meta.glob`, which only Vite understands. The
// static registry holds the same arrays; the source block is left unavailable,
// which draws its own words and keeps its heading.
mock.module("@/registry/examples-lazy", () => ({
  loadExamples: async (slug: string) => getComponent(slug)?.examples ?? [],
}))
mock.module("@/registry/sources-lazy", () => ({ loadSource: async () => null }))

const componentRoute = await import("../src/routes/components.$slug")
const ruleRoute = await import("../src/routes/rules.$slug")

type RouteModule = {
  // biome-ignore lint/suspicious/noExplicitAny: each route's loader has its own generated arg type; the router passes the real args.
  loader: (args: any) => unknown
  // biome-ignore lint/suspicious/noExplicitAny: as above, for the generated component props.
  default: React.ComponentType<any>
}

async function renderPage(module: RouteModule, pattern: string, path: string) {
  const Page = module.default
  const router = createMemoryRouter(
    [
      {
        path: pattern,
        loader: module.loader,
        Component: () => <Page loaderData={useLoaderData()} />,
        // The real site prerenders the loader's answer; here it runs first.
        HydrateFallback: () => null,
      },
    ],
    { initialEntries: [path] },
  )
  const view = render(<RouterProvider router={router} />)
  // Let the loader settle and every lazy boundary resolve.
  for (let i = 0; i < 5; i++) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
  }
  return view
}

function checkRail(container: HTMLElement) {
  // The page's rail, not one drawn by an example in the gallery.
  const rail = container.querySelector('[data-slot="on-this-page"] nav[data-slot="table-of-contents"]')
  expect(rail).not.toBeNull()
  const links = Array.from(rail?.querySelectorAll("a[href^='#']") ?? [])
  expect(links.length).toBeGreaterThan(0)

  const railIds = links.map((link) => link.getAttribute("href")?.slice(1) ?? "")
  expect(new Set(railIds).size).toBe(railIds.length)

  for (const link of links) {
    const id = link.getAttribute("href")?.slice(1) ?? ""
    // Exactly one: an example's own heading sharing a page id would take the jump.
    expect(container.querySelectorAll(`[id="${id}"]`).length).toBe(1)
    const heading = container.ownerDocument.getElementById(id)
    expect({ id, found: heading?.tagName ?? null }).toEqual({
      id,
      found: expect.stringMatching(/^H[23]$/),
    })
    expect(heading?.textContent).toBe(link.textContent)
    expect(heading?.className).toContain("scroll-mt-(--quebi-rail-top)")
  }

  // The other direction: a page heading the rail does not list. The page's own
  // headings are the ones carrying the anchor offset; an example's are its own.
  const anchored = Array.from(container.querySelectorAll("h2, h3"))
    .filter((heading) => heading.className.includes("scroll-mt-(--quebi-rail-top)"))
    .map((heading) => heading.id)
  expect(anchored.filter((id) => !railIds.includes(id))).toEqual([])
}

describe("the rule pages' rail lists exactly their headings", () => {
  for (const rule of rulesRegistry) {
    test(rule.id, async () => {
      const { container } = await renderPage(ruleRoute, "/rules/:slug", `/rules/${rule.id}`)
      checkRail(container)
    })
  }
})

describe("the component pages' rail lists exactly their headings", () => {
  const withAlternatives = registry.find(
    (c) => c.usage && c.examples.some((e) => e.insteadOf !== undefined),
  )
  const withUsageOnly = registry.find(
    (c) => c.usage && !c.examples.some((e) => e.insteadOf !== undefined),
  )
  const withoutUsage = registry.find((c) => !c.usage)
  const slugs = [
    ...new Set(
      [withAlternatives, withUsageOnly, withoutUsage, getComponent("table-of-contents")]
        .filter((c) => c !== undefined)
        .map((c) => c.slug),
    ),
  ]

  test("the sample covers every branch", () => {
    expect(withAlternatives).toBeDefined()
    expect(withUsageOnly).toBeDefined()
    expect(withoutUsage).toBeDefined()
  })

  for (const slug of slugs) {
    test(slug, async () => {
      const { container } = await renderPage(componentRoute, "/components/:slug", `/components/${slug}`)
      // The gallery really arrived, so its headings were checked, not its skeleton.
      expect(container.querySelector("h2[id^='example-']")).not.toBeNull()
      checkRail(container)
    })
  }
})
