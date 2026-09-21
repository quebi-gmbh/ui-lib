import { Button } from "@/components/button"
import {
  Popover,
  PopoverBody,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverFooter,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/popover"
import type { OgScene } from "./types"

/** Open on its trigger — a popover is an anchored surface, so both are in shot. */
export const popoverOgScene: OgScene = {
  scale: 1.3,
  align: "top",
  render: () => (
    <Popover defaultOpen>
      <PopoverTrigger>Workspace</PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Workspace</PopoverTitle>
          <PopoverDescription>Manage members and projects.</PopoverDescription>
        </PopoverHeader>
        <PopoverBody>
          <p className="text-sm text-quebi-fg-muted">
            Invite teammates to collaborate on everything in this workspace.
          </p>
        </PopoverBody>
        <PopoverFooter>
          <PopoverClose intent="outline">Close</PopoverClose>
          <Button intent="primary">Invite</Button>
        </PopoverFooter>
      </PopoverContent>
    </Popover>
  ),
}
