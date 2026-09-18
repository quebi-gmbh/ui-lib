import { Button } from "@/components/button"
import {
  Dialog,
  DialogBody,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/dialog"
import type { OgScene } from "./types"

/**
 * The surface on its own, with no scrim over it. That is what this entry is:
 * Dialog is the flex column that Modal, Sheet, Drawer and Popover each present
 * inside their own overlay, and photographing it through one of them would be
 * photographing that one instead.
 */
export const dialogOgScene: OgScene = {
  scale: 1.3,
  render: () => (
    <Dialog className="w-112">
      <DialogHeader>
        <DialogTitle>Invite your team</DialogTitle>
        <DialogDescription>Send an invitation to collaborate on this workspace.</DialogDescription>
      </DialogHeader>
      <DialogBody>
        <p className="text-sm text-quebi-fg-muted">
          Members you invite get access to all projects in this workspace.
        </p>
      </DialogBody>
      <DialogFooter>
        <Button intent="outline">Cancel</Button>
        <Button intent="primary">Send invite</Button>
      </DialogFooter>
    </Dialog>
  ),
}
