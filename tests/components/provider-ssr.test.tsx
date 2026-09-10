/**
 * SidebarProvider and NavbarProvider on the server.
 *
 * Both providers detect the viewport with an inlined `useIsMobile` that seeds
 * `undefined` and only resolves inside an effect — so during a server render,
 * and on the first client render, `isMobile` is `undefined`. Both used to bail
 * out on that with `if (isMobile === undefined) return null`, which does not
 * merely hide the chrome: the providers wrap `children`, so the null return
 * dropped the entire subtree — a consumer's `<Outlet/>` included — out of the
 * prerendered HTML. This site prerenders every component route
 * (`react-router.config.ts`), so it dropped all eight gallery examples too.
 *
 * The context value already coerces (`isMobile: isMobile ?? false`), so the
 * desktop default was written and simply unreachable. Defaulting to desktop is
 * safe: the desktop sidebar branch is `hidden … md:block` (CSS-hidden below
 * `md` regardless of JS), and the mobile branch is a Sheet that starts closed,
 * so it renders nothing visible pre-hydration either way. Server and first
 * client render both take `?? false`, so they agree and there is no hydration
 * mismatch.
 *
 * These assertions pin that: the guards cannot come back without a red test.
 */
import { describe, expect, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"
import { navbarExamples } from "../../src/registry/navbar.examples"
import { sidebarExamples } from "../../src/registry/sidebar.examples"
import { NavbarProvider } from "../../src/components/navbar"
import { SidebarProvider } from "../../src/components/sidebar"

const MARKER = "prerendered-child-marker"

// Enough to distinguish "the shell rendered" from "one wrapper div rendered".
// The real examples were 6-12kB once the guards were gone; the empty-shell
// failure mode was 0-97 bytes.
const NON_TRIVIAL_BYTES = 1000

describe("SidebarProvider on the server", () => {
  test("renders its children into static markup", () => {
    const html = renderToStaticMarkup(
      <SidebarProvider>
        <main>{MARKER}</main>
      </SidebarProvider>,
    )

    expect(html).toContain(MARKER)
  })

  test("defaults to the desktop shell rather than rendering nothing", () => {
    const html = renderToStaticMarkup(
      <SidebarProvider>
        <main>{MARKER}</main>
      </SidebarProvider>,
    )

    // The provider's own wrapper, not just the child passed straight through.
    expect(html).toContain("--sidebar-width")
  })
})

describe("NavbarProvider on the server", () => {
  test("renders its children into static markup", () => {
    const html = renderToStaticMarkup(
      <NavbarProvider>
        <main>{MARKER}</main>
      </NavbarProvider>,
    )

    expect(html).toContain(MARKER)
  })

  test("renders its own wrapper rather than nothing", () => {
    const html = renderToStaticMarkup(
      <NavbarProvider>
        <main>{MARKER}</main>
      </NavbarProvider>,
    )

    expect(html).toContain("group/navbar")
  })
})

/**
 * The gallery examples are what `/components/sidebar` and `/components/navbar`
 * prerender, via `example.render()` in `src/routes/components.$slug.tsx`. With
 * the guards in place each of these produced an empty box.
 */
describe("the prerendered gallery examples", () => {
  test.each(sidebarExamples.map((example) => [example.title, example] as const))(
    "sidebar / %s renders real markup on the server",
    (_title, example) => {
      const html = renderToStaticMarkup(example.render())

      expect(html.length).toBeGreaterThan(NON_TRIVIAL_BYTES)
    },
  )

  test.each(navbarExamples.map((example) => [example.title, example] as const))(
    "navbar / %s renders real markup on the server",
    (_title, example) => {
      const html = renderToStaticMarkup(example.render())

      expect(html.length).toBeGreaterThan(NON_TRIVIAL_BYTES)
    },
  )
})
