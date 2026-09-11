/**
 * What a toolbar is allowed to hold.
 *
 * `ToolbarItem` is a Toggle, so every item in a tray reported `aria-pressed`
 * whether or not it had a pressed state to report. A Save button is not a
 * two-state control, and this repo already makes that argument in prose in
 * `src/site/theme-toggle.tsx`; `ToolbarButton` is the same argument made in a
 * component. The two assertions worth keeping are the pair: the action does not
 * claim a state, and it is still the same height as the toggle beside it —
 * because the second is the reason people reached for ToolbarItem anyway.
 */
import { describe, expect, test } from "bun:test"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarItem,
  ToolbarSeparator,
} from "../../src/components/toolbar"

const MixedToolbar = ({ onSave = () => {} }: { onSave?: () => void }) => (
  <Toolbar aria-label="Document">
    <ToolbarGroup aria-label="Style">
      <ToolbarItem size="sq-sm" aria-label="Bold">
        B
      </ToolbarItem>
    </ToolbarGroup>
    <ToolbarSeparator />
    <ToolbarGroup aria-label="Actions">
      <ToolbarButton onPress={onSave}>Save</ToolbarButton>
    </ToolbarGroup>
  </Toolbar>
)

describe("ToolbarButton", () => {
  test("does not report a pressed state, and the toggle beside it still does", () => {
    render(<MixedToolbar />)

    expect(screen.getByRole("button", { name: "Save" })).not.toHaveAttribute("aria-pressed")
    expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute("aria-pressed", "false")
  })

  test("fires its action", async () => {
    const user = userEvent.setup()
    let saves = 0
    render(<MixedToolbar onSave={() => saves++} />)

    await user.click(screen.getByRole("button", { name: "Save" }))

    expect(saves).toBe(1)
  })

  test("carries ToolbarItem's defaults, so a mixed row is one height", () => {
    // `size="sm"` and `intent="outline"` — the same two defaults ToolbarItem
    // applies. Asserted through the rendered class list because that is where a
    // divergence would show up: a toolbar whose actions are one line taller
    // than its toggles is the bug this component exists to prevent.
    render(
      <Toolbar aria-label="Document">
        <ToolbarItem aria-label="Bold">B</ToolbarItem>
        <ToolbarButton>Save</ToolbarButton>
      </Toolbar>,
    )

    for (const name of ["Bold", "Save"]) {
      const control = screen.getByRole("button", { name })
      expect(control).toHaveClass("text-sm")
      expect(control).toHaveClass("px-3")
      expect(control).toHaveClass("py-2")
      expect(control).toHaveClass("rounded-quebi-sm")
    }
  })

  test("takes the toolbar's circle shape and a group's disabled state", () => {
    render(
      <Toolbar isCircle aria-label="Document">
        <ToolbarGroup isDisabled aria-label="Actions">
          <ToolbarButton>Save</ToolbarButton>
        </ToolbarGroup>
      </Toolbar>,
    )

    const save = screen.getByRole("button", { name: "Save" })
    expect(save).toHaveClass("rounded-full")
    expect(save).toBeDisabled()
  })
})
