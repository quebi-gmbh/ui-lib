/**
 * Modal's two shapes.
 *
 * `Modal` is react-aria's `DialogTrigger`: its children are the trigger and the
 * overlay, and it owns the open state. That is one of two ways to present the
 * surface, and the other one — state decides, there is no trigger element — is
 * `ModalContent` on its own with `isOpen`/`onOpenChange`. Getting them mixed up
 * costs nothing at type-check time and nothing at render time: a single-child
 * `Modal` puts the overlay in the trigger slot, where it still opens and closes
 * correctly and only warns (task #13). So these tests assert on the console as
 * well as on behaviour — the wiring is otherwise invisible.
 */
import { describe, expect, test } from "bun:test"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { captureConsole } from "../console"
import { Modal, ModalContent, ModalTitle, ModalTrigger } from "../../src/components/modal"

describe("Modal — trigger shape", () => {
  test("opens from its trigger and closes back onto it, without warnings", async () => {
    const user = userEvent.setup()
    const captured = captureConsole()
    try {
      render(
        <Modal>
          <ModalTrigger>Open</ModalTrigger>
          <ModalContent>
            <ModalTitle>Invite your team</ModalTitle>
          </ModalContent>
        </Modal>,
      )

      const trigger = screen.getByRole("button", { name: "Open" })
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()

      await user.click(trigger)
      expect(await screen.findByRole("dialog")).toBeInTheDocument()

      await user.keyboard("{Escape}")
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
      expect(trigger).toHaveFocus()
    } finally {
      captured.restore()
    }
    expect(captured.messages).toEqual([])
  })
})

describe("Modal — controlled shape", () => {
  test("ModalContent alone opens from state, with no Modal wrapper and no warnings", async () => {
    const captured = captureConsole()
    try {
      const { rerender } = render(
        <ModalContent isOpen={false} aria-label="Lightbox">
          <p>Zoomed</p>
        </ModalContent>,
      )
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()

      rerender(
        <ModalContent isOpen aria-label="Lightbox">
          <p>Zoomed</p>
        </ModalContent>,
      )
      expect(await screen.findByRole("dialog")).toBeInTheDocument()
      expect(screen.getByText("Zoomed")).toBeInTheDocument()
    } finally {
      captured.restore()
    }
    expect(captured.messages).toEqual([])
  })

  test("reports dismissal through onOpenChange", async () => {
    const user = userEvent.setup()
    const calls: boolean[] = []
    render(
      <ModalContent isOpen onOpenChange={(open) => calls.push(open)} aria-label="Lightbox">
        <p>Zoomed</p>
      </ModalContent>,
    )
    await screen.findByRole("dialog")

    await user.keyboard("{Escape}")

    // Controlled: the modal does not close itself, it asks to be closed.
    expect(calls).toEqual([false])
  })

  test("labels the dialog itself, not the scrim around it", async () => {
    render(
      <ModalContent isOpen aria-label="Lightbox">
        <p>Zoomed</p>
      </ModalContent>,
    )

    // getByRole finds it by that name only if aria-label reached the dialog
    // element; spread onto the overlay div it would be a label on nothing.
    expect(await screen.findByRole("dialog", { name: "Lightbox" })).toBeInTheDocument()
    expect(document.querySelector('[data-slot="modal-overlay"]')).not.toHaveAttribute("aria-label")
  })
})
