/**
 * The promise-based confirmation.
 *
 * The whole value of `useConfirm()` is the resolution: `confirm()` answered the
 * line below it and a Modal does not, so the guarantee worth testing is not
 * that a dialog appears but that the `await` finishes, with the right boolean,
 * on every way out of the dialog — confirm, cancel, Escape, and the provider
 * unmounting under a question nobody ever answered. Each of those is a hang if
 * it regresses, and a hang is the one failure a render assertion cannot see.
 *
 * `tests/**\/*.tsx` sits outside biome.jsonc's file list, so the fixtures here
 * may use raw elements the rules ban; they do not need to, and do not.
 */
import { describe, expect, test } from "bun:test"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { captureConsole } from "../console"
import {
  AlertDialog,
  ConfirmProvider,
  useConfirm,
} from "../../src/components/alert-dialog"
import { Button } from "../../src/components/button"

/** Asks one question and renders the answer, so the promise is observable. */
function Asker({
  question = "Delete this project?",
  label = "Delete",
}: {
  question?: string
  label?: string
}) {
  const confirm = useConfirm()
  return (
    <Button
      onPress={async () => {
        const answer = await confirm(question)
        document.title = answer ? "yes" : "no"
      }}
    >
      {label}
    </Button>
  )
}

const answered = () => waitFor(() => expect(document.title).not.toBe(""))

describe("useConfirm", () => {
  test("resolves true when the confirming button is pressed", async () => {
    document.title = ""
    const user = userEvent.setup()
    render(
      <ConfirmProvider>
        <Asker />
      </ConfirmProvider>,
    )

    await user.click(screen.getByRole("button", { name: "Delete" }))
    const dialog = await screen.findByRole("alertdialog", { name: "Delete this project?" })

    await user.click(screen.getByRole("button", { name: "Confirm" }))
    await answered()
    expect(document.title).toBe("yes")
    await waitFor(() => expect(dialog).not.toBeInTheDocument())
  })

  test("resolves false when the cancelling button is pressed", async () => {
    document.title = ""
    const user = userEvent.setup()
    render(
      <ConfirmProvider>
        <Asker />
      </ConfirmProvider>,
    )

    await user.click(screen.getByRole("button", { name: "Delete" }))
    await screen.findByRole("alertdialog")
    await user.click(screen.getByRole("button", { name: "Cancel" }))

    await answered()
    expect(document.title).toBe("no")
  })

  test("Escape is an answer, not a hang", async () => {
    // There is no third answer to the question, so a dismissal has to resolve.
    // Left unresolved this is an `await` that never returns and a handler that
    // silently stops — the failure this whole shape exists to avoid.
    document.title = ""
    const user = userEvent.setup()
    render(
      <ConfirmProvider>
        <Asker />
      </ConfirmProvider>,
    )

    await user.click(screen.getByRole("button", { name: "Delete" }))
    await screen.findByRole("alertdialog")
    await user.keyboard("{Escape}")

    await answered()
    expect(document.title).toBe("no")
  })

  test("questions queue: the second opens once the first is answered", async () => {
    const user = userEvent.setup()
    const answers: boolean[] = []

    function TwoQuestions() {
      const confirm = useConfirm()
      return (
        <Button
          onPress={async () => {
            answers.push(await confirm("Publish?"))
            answers.push(await confirm("Notify subscribers?"))
          }}
        >
          Publish
        </Button>
      )
    }

    render(
      <ConfirmProvider>
        <TwoQuestions />
      </ConfirmProvider>,
    )

    await user.click(screen.getByRole("button", { name: "Publish" }))
    await screen.findByRole("alertdialog", { name: "Publish?" })
    // A dialog is modal: the second question must not be on screen yet.
    expect(screen.queryByRole("alertdialog", { name: "Notify subscribers?" })).toBeNull()

    await user.click(screen.getByRole("button", { name: "Confirm" }))
    await screen.findByRole("alertdialog", { name: "Notify subscribers?" })
    await user.click(screen.getByRole("button", { name: "Cancel" }))

    await waitFor(() => expect(answers).toEqual([true, false]))
  })

  test("unmounting the provider settles the questions still in the air", async () => {
    const user = userEvent.setup()
    let resolved: boolean | undefined
    function Asks() {
      const confirm = useConfirm()
      return (
        <Button
          onPress={async () => {
            resolved = await confirm("Delete this project?")
          }}
        >
          Delete
        </Button>
      )
    }

    const { unmount } = render(
      <ConfirmProvider>
        <Asks />
      </ConfirmProvider>,
    )
    await user.click(screen.getByRole("button", { name: "Delete" }))
    await screen.findByRole("alertdialog")

    unmount()

    await waitFor(() => expect(resolved).toBe(false))
  })

  test("without a provider it says so, rather than doing nothing", () => {
    const captured = captureConsole()
    try {
      expect(() => render(<Asker />)).toThrow(/ConfirmProvider/)
    } finally {
      captured.restore()
    }
  })
})

describe("AlertDialog", () => {
  test("labels the dialog from its title and offers exactly two answers", async () => {
    const captured = captureConsole()
    try {
      render(
        <AlertDialog
          isOpen
          title="Revoke this API key?"
          description="Anything still using it will start failing immediately."
          confirmLabel="Revoke"
          intent="danger"
        />,
      )

      const dialog = await screen.findByRole("alertdialog", { name: "Revoke this API key?" })
      expect(dialog).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Revoke" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument()
      // No close icon: an alert dialog is answered, not dismissed by decoration.
      expect(screen.queryByRole("button", { name: "Close" })).toBeNull()
    } finally {
      captured.restore()
    }
    expect(captured.messages).toEqual([])
  })

  test("reports the answer through onConfirm / onCancel, and closes through onOpenChange", async () => {
    const user = userEvent.setup()
    const calls: string[] = []
    render(
      <AlertDialog
        isOpen
        title="Revoke this API key?"
        onConfirm={() => calls.push("confirm")}
        onCancel={() => calls.push("cancel")}
        onOpenChange={(open) => calls.push(`open:${open}`)}
      />,
    )
    await screen.findByRole("alertdialog")

    await user.click(screen.getByRole("button", { name: "Confirm" }))

    // The answer comes first, so a handler reading it does not have to race the
    // close; and controlled means the dialog asks to close rather than closing.
    expect(calls).toEqual(["confirm", "open:false"])
  })
})
