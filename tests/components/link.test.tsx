/**
 * Link's router bypass.
 *
 * `Link` renders react-aria's Link — which routes its href through the
 * `useHref` a RouterProvider supplies — *except* for http(s)/mailto/tel hrefs,
 * which get a plain anchor instead. That branch exists because a router's
 * `useHref` prefixes hrefs with the basename: routed through it,
 * `mailto:hi@example.com` becomes `/app/mailto:hi@example.com` and the link
 * silently stops working. Nothing else in the repo asserts which branch a given
 * href takes, and the failure is invisible until a user clicks.
 *
 * The router here is stubbed rather than real: `useHref` mangles every href it
 * is handed, so "went through the router" and "did not" are distinguishable in
 * the rendered attribute.
 */
import { expect, test } from "bun:test"
import { render, screen } from "@testing-library/react"
import { RouterProvider } from "react-aria-components"
import { Link } from "../../src/components/link"

const mangleHref = (href: string) => `/wrapped${href}`
const noopNavigate = () => {}

function renderInRouter(ui: React.ReactNode) {
  return render(
    <RouterProvider navigate={noopNavigate} useHref={mangleHref}>
      {ui}
    </RouterProvider>,
  )
}

const hrefOf = (name: string) => screen.getByRole("link", { name }).getAttribute("href")

test("an external https href is not rewritten by a router-provided useHref", () => {
  renderInRouter(
    <Link href="https://docs.quebi.de" target="_blank" rel="noopener noreferrer">
      Docs
    </Link>,
  )

  const anchor = screen.getByRole("link", { name: "Docs" })
  expect(anchor.getAttribute("href")).toBe("https://docs.quebi.de")
  // The anchor still carries what the caller asked for — the bypass branch is a
  // different element, so target/rel have to survive the hand-off.
  expect(anchor).toHaveAttribute("target", "_blank")
  expect(anchor).toHaveAttribute("rel", "noopener noreferrer")
})

test("mailto and tel hrefs also bypass the router", () => {
  renderInRouter(
    <>
      <Link href="mailto:hi@example.com">Mail</Link>
      <Link href="tel:+1234">Phone</Link>
    </>,
  )

  expect(hrefOf("Mail")).toBe("mailto:hi@example.com")
  expect(hrefOf("Phone")).toBe("tel:+1234")
})

test("the scheme test is case-insensitive", () => {
  renderInRouter(<Link href="HTTPS://docs.quebi.de">Shouty</Link>)

  expect(hrefOf("Shouty")).toBe("HTTPS://docs.quebi.de")
})

test("a relative href is routed through the router-provided useHref", () => {
  renderInRouter(<Link href="/billing">Billing</Link>)

  expect(hrefOf("Billing")).toBe("/wrapped/billing")
})

test("a link with no href renders no anchor href at all", () => {
  renderInRouter(<Link onPress={() => {}}>Press me</Link>)

  expect(screen.getByText("Press me")).not.toHaveAttribute("href")
})

/**
 * `className` as a render-prop function.
 *
 * react-aria lets a caller pass `className` as a function of the render state,
 * and that is how a link styles itself per hover/press/focus. `Link` merges the
 * caller's value into its own BASE_CLASSES with `cn` — but `cn` is clsx
 * underneath, and clsx drops a function silently rather than calling it. So a
 * caller that passed a function got BASE_CLASSES and nothing else, with no
 * error and no warning anywhere: `SidebarItem` computes its entire row layout
 * that way and rendered as underlined prose with 104px icons because of it.
 *
 * The underline is the sharp end of it. BASE_CLASSES underlines every link on
 * purpose (see the component's own note on WCAG 1.4.1), and the places where a
 * link is not inside prose are documented as opting out with `no-underline` —
 * an opt-out that could not work at all through the function form.
 */
test("a render-prop className is applied, not dropped", () => {
  renderInRouter(
    <Link href="/dashboard" className={() => "grid grid-cols-2 no-underline"}>
      Dashboard
    </Link>,
  )

  const anchor = screen.getByRole("link", { name: "Dashboard" })
  expect(anchor.className).toContain("grid")
  expect(anchor.className).toContain("grid-cols-2")
})

test("a render-prop className wins the merge against BASE_CLASSES", () => {
  renderInRouter(
    <Link href="/dashboard" className={() => "no-underline"}>
      Dashboard
    </Link>,
  )

  // tailwind-merge puts `underline` and `no-underline` in one group and keeps
  // the later one — the caller's. This is the documented opt-out for a link
  // that is a nav row rather than prose.
  const classes = screen.getByRole("link", { name: "Dashboard" }).className.split(/\s+/)
  expect(classes).toContain("no-underline")
  expect(classes).not.toContain("underline")
})

test("the render state reaches a render-prop className", () => {
  renderInRouter(
    <Link href="/dashboard" className={({ isDisabled }) => (isDisabled ? "opacity-50" : "grid")}>
      Dashboard
    </Link>,
  )

  expect(screen.getByRole("link", { name: "Dashboard" }).className).toContain("grid")
})

test("a plain string className still merges with BASE_CLASSES", () => {
  renderInRouter(
    <Link href="/dashboard" className="no-underline">
      Dashboard
    </Link>,
  )

  const classes = screen.getByRole("link", { name: "Dashboard" }).className.split(/\s+/)
  expect(classes).toContain("no-underline")
  expect(classes).not.toContain("underline")
  expect(classes).toContain("font-medium")
})
