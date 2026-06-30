import { render, screen } from "@testing-library/react"
import { RouterProvider } from "react-aria-components"
import { expect, test } from "vitest"
import { Link } from "./link"

const mangleHref = (href: string) => `/wrapped${href}`
const noopNavigate = () => {}

test("external https href is not rewritten by a router-provided useHref", () => {
  render(
    <RouterProvider navigate={noopNavigate} useHref={mangleHref}>
      <Link href="https://docs.cellestial.de" target="_blank" rel="noopener noreferrer">
        Docs
      </Link>
    </RouterProvider>,
  )
  const anchor = screen.getByRole("link", { name: "Docs" })
  expect(anchor.getAttribute("href")).toBe("https://docs.cellestial.de")
  expect(anchor.getAttribute("target")).toBe("_blank")
  expect(anchor.getAttribute("rel")).toBe("noopener noreferrer")
})

test("mailto and tel hrefs also bypass the router", () => {
  render(
    <RouterProvider navigate={noopNavigate} useHref={mangleHref}>
      <Link href="mailto:hi@example.com">Mail</Link>
      <Link href="tel:+1234">Phone</Link>
    </RouterProvider>,
  )
  expect(screen.getByRole("link", { name: "Mail" }).getAttribute("href")).toBe(
    "mailto:hi@example.com",
  )
  expect(screen.getByRole("link", { name: "Phone" }).getAttribute("href")).toBe("tel:+1234")
})

test("relative href is routed through the router-provided useHref", () => {
  render(
    <RouterProvider navigate={noopNavigate} useHref={mangleHref}>
      <Link href="/billing">Billing</Link>
    </RouterProvider>,
  )
  const anchor = screen.getByRole("link", { name: "Billing" })
  expect(anchor.getAttribute("href")).toBe("/wrapped/billing")
})
