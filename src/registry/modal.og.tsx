import { Button } from "@/components/button"
import {
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
  // the frame's default 1.5 puts its top edge off the image; 1.3 is the
  // smallest scale that keeps the description at the audit's 18px.
  scale: 1.3,
  render: () => (
    <ModalContent defaultOpen size="md" aria-label="Invite your team">
      <ModalHeader>
        <ModalTitle>invite your team</ModalTitle>
        <ModalDescription>Send an invitation to collaborate on this workspace.</ModalDescription>
      </ModalHeader>
      <ModalFooter>
        <Button intent="outline">cancel</Button>
        <Button intent="primary">send invite</Button>
      </ModalFooter>
    </ModalContent>
  ),
}
