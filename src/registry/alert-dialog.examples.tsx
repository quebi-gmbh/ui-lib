import { useState } from "react"
import { AlertDialog, ConfirmProvider, useConfirm } from "@/components/alert-dialog"
import { Button } from "@/components/button"
import type { ComponentExample } from "./types"

const Col = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col items-start gap-3">{children}</div>
)

const Answer = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-quebi-fg-muted">{children}</p>
)

function DestructiveDemo() {
  const confirm = useConfirm()
  const [status, setStatus] = useState("No project deleted yet.")

  // The shape the hook exists for: the question and the work it guards stay in
  // one handler, and the only difference from `window.confirm()` is the await.
  async function onDelete() {
    const confirmed = await confirm({
      title: "Delete this project?",
      description: "This permanently removes the project and all of its data.",
      confirmLabel: "Delete project",
      intent: "danger",
    })
    if (!confirmed) {
      setStatus("Cancelled — nothing was deleted.")
      return
    }
    setStatus("Deleted. (Not really: this is a gallery example.)")
  }

  return (
    <Col>
      <Button intent="danger" onPress={onDelete}>
        Delete project
      </Button>
      <Answer>{status}</Answer>
    </Col>
  )
}

function ShorthandDemo() {
  const confirm = useConfirm()
  const [status, setStatus] = useState("Waiting.")

  return (
    <Col>
      <Button
        intent="outline"
        onPress={async () => {
          setStatus((await confirm("Discard your changes?")) ? "Discarded." : "Kept.")
        }}
      >
        Discard changes
      </Button>
      <Answer>{status}</Answer>
    </Col>
  )
}

function QueueDemo() {
  const confirm = useConfirm()
  const [status, setStatus] = useState("Waiting.")

  async function onPublish() {
    if (!(await confirm({ title: "Publish to the live catalog?" }))) {
      setStatus("Stopped at the first question.")
      return
    }
    const notify = await confirm({
      title: "Email every subscriber?",
      confirmLabel: "Send",
      cancelLabel: "Skip",
      intent: "accent",
    })
    setStatus(notify ? "Published, and subscribers emailed." : "Published quietly.")
  }

  return (
    <Col>
      <Button intent="primary" onPress={onPublish}>
        Publish
      </Button>
      <Answer>{status}</Answer>
    </Col>
  )
}

function ControlledDemo() {
  const [isOpen, setIsOpen] = useState(false)
  const [status, setStatus] = useState("Waiting.")

  return (
    <Col>
      <Button intent="outline" onPress={() => setIsOpen(true)}>
        Revoke API key
      </Button>
      <AlertDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        onConfirm={() => setStatus("Revoked.")}
        onCancel={() => setStatus("Cancelled.")}
        title="Revoke this API key?"
        description="Anything still using it will start failing immediately."
        confirmLabel="Revoke"
        intent="danger"
      />
      <Answer>{status}</Answer>
    </Col>
  )
}

export const alertDialogExamples: ComponentExample[] = [
  {
    title: "Guarding a destructive action",
    description:
      "useConfirm() returns Promise<boolean>, so the handler keeps its shape: the question and the work it guards stay on the same two lines.",
    render: () => (
      <ConfirmProvider>
        <DestructiveDemo />
      </ConfirmProvider>
    ),
  },
  {
    title: "String shorthand",
    description:
      "When the question is the whole of it, pass a string — the migration from window.confirm() is then an import, a provider, and an await.",
    render: () => (
      <ConfirmProvider>
        <ShorthandDemo />
      </ConfirmProvider>
    ),
  },
  {
    title: "Two questions in a row",
    description:
      "A dialog is modal, so questions queue: the second opens when the first is answered, and each await resolves in turn.",
    render: () => (
      <ConfirmProvider>
        <QueueDemo />
      </ConfirmProvider>
    ),
  },
  {
    title: "Controlled, without the hook",
    description:
      "AlertDialog on its own is the declarative shape — isOpen plus onConfirm/onCancel. Escape and the Cancel button are the same answer.",
    render: () => <ControlledDemo />,
  },
]
