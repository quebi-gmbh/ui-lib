/**
 * What a slow navigation looks like (task #197).
 *
 * React Router gives every route its own chunk, so a click on a sidebar link
 * leaves the current page rendered and completely still until the new module
 * and its prerendered `.data` land. Before this, nothing anywhere in `src/`
 * touched `useNavigation` or a NavLink's `isPending`, so a slow navigation and
 * a dead link looked identical.
 *
 * The treatment is deliberately local — it goes on the link that was clicked,
 * not on a bar across the top of the window — so the two things asserted here
 * are that the pending link is the one that was clicked (and not any of the
 * others), and that the change is announced for a reader who cannot see it.
 *
 * A gated loader stands in for the slow connection: the router stays in
 * `loading` until the test opens the gate, which is the same state a 200kbit
 * link produces and does not depend on any timing.
 */
import { beforeEach, describe, expect, test } from "bun:test"
import { act } from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
// A rendering fixture, not app code: `tests/**/*.tsx` sits outside biome.jsonc's
// file list precisely so a harness can reach for the router's memory adapter.
import { createMemoryRouter, RouterProvider } from "react-router"
import { ComponentSidebar } from "../src/site/component-sidebar"
import { NavigationStatus } from "../src/site/navigation-status"

let openGate: () => void
let gate: Promise<void>

beforeEach(() => {
  gate = new Promise<void>((resolve) => {
    openGate = resolve
  })
})

/**
 * Let the navigation the test started finish, inside `act`.
 *
 * Every test has to end here: a router left mid-navigation settles after the
 * suite has unmounted it, and React reports that as an update outside `act` —
 * a warning in this file about a state change nobody is asserting on.
 */
async function arrive() {
  await act(async () => {
    openGate()
    await gate
  })
}

function Chrome() {
  return (
    <>
      <NavigationStatus />
      <ComponentSidebar />
    </>
  )
}

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      { path: "/components", Component: Chrome },
      {
        path: "/components/:slug",
        // The chunk that has not arrived yet.
        loader: async () => {
          await gate
          return null
        },
        Component: Chrome,
      },
    ],
    { initialEntries: [path] },
  )
  return render(<RouterProvider router={router} />)
}

const link = (name: string) => screen.getByRole("link", { name })

describe("while a navigation is in flight", () => {
  let user: ReturnType<typeof userEvent.setup>
  beforeEach(() => {
    user = userEvent.setup()
  })

  test("the clicked link is the one that says it is loading", async () => {
    renderAt("/components")

    // The nav collapses its groups; open the one holding the target.
    await user.click(screen.getByRole("button", { name: /^Display\b/ }))

    const target = link("Badge")
    const other = link("Avatar")
    expect(target.className).not.toContain("quebi-pulse")

    await user.click(target)

    expect(target.className).toContain("quebi-pulse")
    expect(other.className).not.toContain("quebi-pulse")

    await arrive()
    expect(link("Badge").className).not.toContain("quebi-pulse")
  })

  test("it is announced, politely, for a reader who cannot see the link", async () => {
    renderAt("/components")
    const status = screen.getByRole("status")
    expect(status.textContent).toBe("")

    await user.click(screen.getByRole("button", { name: /^Display\b/ }))
    await user.click(link("Badge"))

    expect(status).toHaveAttribute("aria-live", "polite")
    expect(status.textContent).toBe("Loading /components/badge")

    // The region stays mounted and empties, rather than unmounting: a live
    // region that appears at the same moment as its text is routinely missed.
    await arrive()
    expect(screen.getByRole("status").textContent).toBe("")
  })

  test("the pending treatment is not the current-page treatment", async () => {
    renderAt("/components")
    await user.click(screen.getByRole("button", { name: /^Display\b/ }))
    const target = link("Badge")

    await user.click(target)

    // A link that already looked current would make a navigation that never
    // arrives look like one that did.
    expect(target).not.toHaveAttribute("aria-current")

    await arrive()
    expect(link("Badge")).toHaveAttribute("aria-current", "page")
  })
})
