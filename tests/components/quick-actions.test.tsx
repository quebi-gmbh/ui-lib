/**
 * Quick Actions' four promises: the trigger opens the panel, picking an item
 * runs it and closes the panel, focus goes back to whichever trigger opened
 * it, and Escape closes it.
 *
 * The panel is a Drawer and the list is a react-aria Menu, so none of this is
 * new code — which is exactly why it is worth pinning. The close-on-pick is a
 * `Menu` `onClose` wired to the overlay's state, and it has to hold for all
 * three ways of picking: the Menu-level `onAction`, an item's own `onAction`,
 * and the FAB as well as the header trigger.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MotionGlobalConfig } from "motion/react"
import type { Key } from "react-aria-components"
import {
  QuickActions,
  QuickActionsContent,
  QuickActionsFab,
  QuickActionsItem,
  QuickActionsSection,
  QuickActionsTrigger,
} from "../../src/components/quick-actions"
import { captureConsole } from "../console"

function Fixture({
  onAction,
  onArchive,
}: {
  onAction?: (key: Key) => void
  onArchive?: () => void
}) {
  return (
    <QuickActions>
      <QuickActionsTrigger>Open actions</QuickActionsTrigger>
      <QuickActionsFab />
      <QuickActionsContent side="bottom" onAction={onAction}>
        <QuickActionsSection label="Project">
          <QuickActionsItem id="new">New project</QuickActionsItem>
          <QuickActionsItem id="archive" onAction={onArchive}>
            Archive
          </QuickActionsItem>
        </QuickActionsSection>
      </QuickActionsContent>
    </QuickActions>
  )
}

// The panel is a Drawer, and a Drawer leaves through motion's AnimatePresence:
// it unmounts when the exit animation finishes, which in happy-dom it never
// does. Skipping animations makes the exit finish at once, which is what a
// browser under reduced motion sees anyway.
beforeAll(() => {
  MotionGlobalConfig.skipAnimations = true
})
afterAll(() => {
  MotionGlobalConfig.skipAnimations = false
})

const panel = () => screen.queryByRole("dialog")

describe("QuickActions", () => {
  test("the trigger opens a titled panel holding a menu", async () => {
    const user = userEvent.setup()
    const captured = captureConsole()
    try {
      render(<Fixture />)
      expect(panel()).not.toBeInTheDocument()

      await user.click(screen.getByRole("button", { name: "Open actions" }))

      expect(await screen.findByRole("dialog", { name: "Actions" })).toBeInTheDocument()
      expect(screen.getByRole("menu", { name: "Actions" })).toBeInTheDocument()
      expect(screen.getByRole("menuitem", { name: "New project" })).toBeInTheDocument()
      // Sections are headed: the group takes its name from the label.
      expect(screen.getByRole("group", { name: "Project" })).toBeInTheDocument()
    } finally {
      captured.restore()
    }
    expect(captured.messages).toEqual([])
  })

  test("picking an item fires onAction with its id and closes the panel", async () => {
    const user = userEvent.setup()
    const picked: Key[] = []
    render(<Fixture onAction={(key) => picked.push(key)} />)

    await user.click(screen.getByRole("button", { name: "Open actions" }))
    await user.click(await screen.findByRole("menuitem", { name: "New project" }))

    expect(picked).toEqual(["new"])
    await waitFor(() => expect(panel()).not.toBeInTheDocument())
  })

  test("an item's own onAction closes the panel too", async () => {
    const user = userEvent.setup()
    let archived = 0
    render(<Fixture onArchive={() => archived++} />)

    await user.click(screen.getByRole("button", { name: "Open actions" }))
    await user.click(await screen.findByRole("menuitem", { name: "Archive" }))

    expect(archived).toBe(1)
    await waitFor(() => expect(panel()).not.toBeInTheDocument())
  })

  test("focus returns to the header trigger after an item is picked", async () => {
    const user = userEvent.setup()
    render(<Fixture />)
    const trigger = screen.getByRole("button", { name: "Open actions" })

    await user.click(trigger)
    await user.click(await screen.findByRole("menuitem", { name: "New project" }))

    await waitFor(() => expect(panel()).not.toBeInTheDocument())
    expect(trigger).toHaveFocus()
  })

  test("focus returns to the FAB when the FAB opened it", async () => {
    const user = userEvent.setup()
    render(<Fixture />)
    const fab = screen.getByRole("button", { name: "Actions" })

    await user.click(fab)
    await screen.findByRole("dialog")
    await user.keyboard("{Escape}")

    await waitFor(() => expect(panel()).not.toBeInTheDocument())
    expect(fab).toHaveFocus()
  })

  test("Escape closes the panel", async () => {
    const user = userEvent.setup()
    render(<Fixture />)

    await user.click(screen.getByRole("button", { name: "Open actions" }))
    await screen.findByRole("dialog")
    await user.keyboard("{Escape}")

    await waitFor(() => expect(panel()).not.toBeInTheDocument())
  })

  test("the keyboard lands on the first action, so arrows work at once", async () => {
    const user = userEvent.setup()
    render(<Fixture />)

    await user.click(screen.getByRole("button", { name: "Open actions" }))
    const first = await screen.findByRole("menuitem", { name: "New project" })
    await waitFor(() => expect(first).toHaveFocus())

    await user.keyboard("{ArrowDown}")
    expect(screen.getByRole("menuitem", { name: "Archive" })).toHaveFocus()
  })
})
