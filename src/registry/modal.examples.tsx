import { useState } from "react"
import { Button } from "@/components/button"
import {
  Modal,
  ModalBody,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
} from "@/components/modal"
import type { ComponentExample } from "./types"

export const modalExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "A trigger opens a modal with header, body, and footer.",
    render: () => (
      <Modal>
        <ModalTrigger>open modal</ModalTrigger>
        <ModalContent>
          {({ close }) => (
            <>
              <ModalHeader>
                <ModalTitle>invite your team</ModalTitle>
                <ModalDescription>
                  Send an invitation to collaborate on this workspace.
                </ModalDescription>
              </ModalHeader>
              <ModalBody>
                <p className="text-sm text-quebi-fg-muted">
                  Members you invite get access to all projects in this workspace. You can change
                  their role at any time.
                </p>
              </ModalBody>
              <ModalFooter>
                <ModalClose intent="outline" onPress={close}>
                  cancel
                </ModalClose>
                <Button intent="primary" onPress={close}>
                  send invite
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    ),
  },
  {
    title: "Header shorthand",
    description: "ModalHeader accepts `title` and `description` props directly.",
    render: () => (
      <Modal>
        <ModalTrigger intent="outline">quick note</ModalTrigger>
        <ModalContent size="sm">
          {({ close }) => (
            <>
              <ModalHeader
                title="heads up"
                description="This action is reversible from your account settings."
              />
              <ModalFooter>
                <ModalClose intent="ghost" onPress={close}>
                  got it
                </ModalClose>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    ),
  },
  {
    title: "Destructive",
    description: "An alert dialog (role=\"alertdialog\") with a danger action, not dismissable by click-outside.",
    render: () => (
      <Modal>
        <ModalTrigger intent="danger">delete project</ModalTrigger>
        <ModalContent role="alertdialog" size="sm">
          {({ close }) => (
            <>
              <ModalHeader>
                <ModalTitle>Delete this project?</ModalTitle>
                <ModalDescription>
                  This permanently removes the project and all of its data. This action cannot be
                  undone.
                </ModalDescription>
              </ModalHeader>
              <ModalFooter>
                <ModalClose intent="outline" onPress={close}>
                  cancel
                </ModalClose>
                <Button intent="danger" onPress={close}>
                  delete
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    ),
  },
  {
    title: "Large size",
    description: "Size variants run from 2xs to 5xl (plus fullscreen).",
    render: () => (
      <Modal>
        <ModalTrigger intent="outline">open large modal</ModalTrigger>
        <ModalContent size="2xl">
          {({ close }) => (
            <>
              <ModalHeader>
                <ModalTitle>release notes</ModalTitle>
                <ModalDescription>Everything new in this version.</ModalDescription>
              </ModalHeader>
              <ModalBody>
                <p className="text-sm text-quebi-fg-muted">
                  Wider surfaces are handy for content-heavy modals like changelogs, tables, or
                  forms with multiple columns.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button intent="primary" onPress={close}>
                  done
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    ),
  },
  {
    title: "Opened by state",
    description:
      "No trigger element: render `ModalContent` on its own with `isOpen`/`onOpenChange`. This is the shape for a lightbox, a confirm raised from a menu item, or an overlay a route decides to show. Do not wrap it in `Modal` for this — `Modal` is a trigger pairing, and a lone child lands in its trigger slot.",
    render: () => {
      const [isOpen, setIsOpen] = useState(false)
      return (
        <>
          <Button intent="outline" onPress={() => setIsOpen(true)}>
            Delete project
          </Button>
          <ModalContent isOpen={isOpen} onOpenChange={setIsOpen} role="alertdialog" size="sm">
            <ModalHeader>
              <ModalTitle>delete project</ModalTitle>
              <ModalDescription>This cannot be undone.</ModalDescription>
            </ModalHeader>
            <ModalFooter>
              <Button intent="outline" onPress={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button intent="danger" onPress={() => setIsOpen(false)}>
                Delete
              </Button>
            </ModalFooter>
          </ModalContent>
        </>
      )
    },
  },
]
