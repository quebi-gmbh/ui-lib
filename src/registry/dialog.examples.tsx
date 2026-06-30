import {
  DialogTrigger as AriaDialogTrigger,
  Modal,
  ModalOverlay,
} from "react-aria-components"
import { Button } from "@/components/button"
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogCloseIcon,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/dialog"
import type { ComponentExample } from "./types"

/**
 * Dialog is the surface only. To present it, wrap it in react-aria's
 * `DialogTrigger` + `Modal`/`ModalOverlay` (the modal/sheet/drawer components
 * build on exactly this). These helpers supply a quebi-styled overlay.
 */
const overlayClassName =
  "fixed inset-0 z-50 flex min-h-full items-center justify-center bg-black/60 p-4 backdrop-blur-sm entering:animate-in entering:fade-in exiting:animate-out exiting:fade-out"
const modalClassName =
  "w-full max-w-md outline-none entering:animate-in entering:zoom-in-95 exiting:animate-out exiting:zoom-out-95"

export const dialogExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "A trigger opens a modal dialog with header, body, and footer.",
    render: () => (
      <AriaDialogTrigger>
        <Button>Open dialog</Button>
        <ModalOverlay className={overlayClassName} isDismissable>
          <Modal className={modalClassName}>
            <Dialog>
              {({ close }) => (
                <>
                  <DialogCloseIcon isDismissable />
                  <DialogHeader>
                    <DialogTitle>Invite your team</DialogTitle>
                    <DialogDescription>
                      Send an invitation to collaborate on this workspace.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogBody>
                    <p className="text-sm text-quebi-fg-muted">
                      Members you invite get access to all projects in this workspace. You can
                      change their role at any time.
                    </p>
                  </DialogBody>
                  <DialogFooter>
                    <DialogClose intent="outline" onPress={close}>
                      Cancel
                    </DialogClose>
                    <Button intent="primary" onPress={close}>
                      Send invite
                    </Button>
                  </DialogFooter>
                </>
              )}
            </Dialog>
          </Modal>
        </ModalOverlay>
      </AriaDialogTrigger>
    ),
  },
  {
    title: "Header shorthand",
    description: "DialogHeader accepts `title` and `description` props directly.",
    render: () => (
      <AriaDialogTrigger>
        <Button intent="outline">Quick note</Button>
        <ModalOverlay className={overlayClassName} isDismissable>
          <Modal className={modalClassName}>
            <Dialog>
              <DialogHeader
                title="Heads up"
                description="This action is reversible from your account settings."
              />
              <DialogFooter>
                <DialogClose slot="close" intent="ghost">
                  Got it
                </DialogClose>
              </DialogFooter>
            </Dialog>
          </Modal>
        </ModalOverlay>
      </AriaDialogTrigger>
    ),
  },
  {
    title: "Destructive",
    description: "A confirmation dialog with a danger action.",
    render: () => (
      <AriaDialogTrigger>
        <Button intent="danger">Delete project</Button>
        <ModalOverlay className={overlayClassName} isDismissable>
          <Modal className={modalClassName}>
            <Dialog role="alertdialog">
              {({ close }) => (
                <>
                  <DialogHeader>
                    <DialogTitle>Delete this project?</DialogTitle>
                    <DialogDescription>
                      This permanently removes the project and all of its data. This action cannot
                      be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose intent="outline" onPress={close}>
                      Cancel
                    </DialogClose>
                    <Button intent="danger" onPress={close}>
                      Delete
                    </Button>
                  </DialogFooter>
                </>
              )}
            </Dialog>
          </Modal>
        </ModalOverlay>
      </AriaDialogTrigger>
    ),
  },
]
