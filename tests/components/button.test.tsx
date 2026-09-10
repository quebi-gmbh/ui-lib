/**
 * Button's press behaviour and its radius.
 *
 * Mostly a smoke test — Button is a thin wrapper over React Aria's — with one
 * assertion that is a regression guard: `isCircle` used to be a no-op, because
 * `rounded-quebi-sm` in the base and `rounded-full` in the variant are not one
 * group to tailwind-merge, so the base radius survived the merge and won on
 * sheet order. The fix was to make the two radii mutually exclusive branches of
 * the same variant (task #49); this pins it.
 */
import { describe, expect, test } from "bun:test"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Button } from "../../src/components/button"

describe("Button", () => {
  test("renders its label as a real button", () => {
    render(<Button>Save</Button>)

    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument()
  })

  test("calls onPress when pressed", async () => {
    const user = userEvent.setup()
    let presses = 0
    render(<Button onPress={() => presses++}>Save</Button>)

    await user.click(screen.getByRole("button", { name: "Save" }))

    expect(presses).toBe(1)
  })

  test("a disabled button is disabled to the DOM, not only to React Aria", async () => {
    const user = userEvent.setup()
    let presses = 0
    render(
      <Button isDisabled onPress={() => presses++}>
        Save
      </Button>,
    )

    const button = screen.getByRole("button", { name: "Save" })
    expect(button).toBeDisabled()
    await user.click(button)
    expect(presses).toBe(0)
  })

  test("isCircle actually rounds the button", () => {
    render(<Button isCircle>+</Button>)

    const button = screen.getByRole("button", { name: "+" })
    expect(button).toHaveClass("rounded-full")
    expect(button).not.toHaveClass("rounded-quebi-sm")
  })

  test("defaults to the quebi radius", () => {
    render(<Button>Save</Button>)

    expect(screen.getByRole("button", { name: "Save" })).toHaveClass("rounded-quebi-sm")
  })
})
