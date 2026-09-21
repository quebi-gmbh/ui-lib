import { Button } from "@/components/button"
import {
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/modal"
import type { OgScene } from "./types"

/**
 * Open, and no trigger: `ModalContent` takes `defaultOpen` on its own, which is
 * the shape an app uses when state rather than a button opens the overlay. The
 * scrim over the card is the component — a modal that did not dim what is
 * behind it would not be one.
 */
export const modalOgScene: OgScene = {
  // The panel is centred on the canvas and magnified about its own middle, so
  // the frame's default 1.5 puts its top edge a few pixels off the image.
  scale: 1.4,
  render: () => (
    <ModalContent defaultOpen size="md" aria-label="Invite your team">
      <ModalHeader>
        <ModalTitle>Invite your team</ModalTitle>
        <ModalDescription>Send an invitation to collaborate on this workspace.</ModalDescription>
      </ModalHeader>
      <ModalBody>
        <p className="text-sm text-quebi-fg-muted">
          Members you invite get access to all projects in this workspace.
        </p>
      </ModalBody>
      <ModalFooter>
        <Button intent="outline">Cancel</Button>
        <Button intent="primary">Send invite</Button>
      </ModalFooter>
    </ModalContent>
  ),
}
