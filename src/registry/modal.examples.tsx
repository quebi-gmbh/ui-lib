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
        <ModalTrigger>Open modal</ModalTrigger>
        <ModalContent>
          {({ close }) => (
            <>
              <ModalHeader>
                <ModalTitle>Invite your team</ModalTitle>
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
                  Cancel
                </ModalClose>
                <Button intent="primary" onPress={close}>
                  Send invite
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
        <ModalTrigger intent="outline">Quick note</ModalTrigger>
        <ModalContent size="sm">
          {({ close }) => (
            <>
              <ModalHeader
                title="Heads up"
                description="This action is reversible from your account settings."
              />
              <ModalFooter>
                <ModalClose intent="ghost" onPress={close}>
                  Got it
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
        <ModalTrigger intent="danger">Delete project</ModalTrigger>
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
                  Cancel
                </ModalClose>
                <Button intent="danger" onPress={close}>
                  Delete
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
        <ModalTrigger intent="outline">Open large modal</ModalTrigger>
        <ModalContent size="2xl">
          {({ close }) => (
            <>
              <ModalHeader>
                <ModalTitle>Release notes</ModalTitle>
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
                  Done
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    ),
  },
]
