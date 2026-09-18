import { Button } from "@/components/button"
import { Tooltip, TooltipContent } from "@/components/tooltip"
import type { OgScene } from "./types"

/** Held open, which is the only way to photograph a thing that needs a hover. */
export const tooltipOgScene: OgScene = {
  scale: 1.6,
  render: () => (
    <Tooltip isOpen>
      <Button intent="outline">Sync roster</Button>
      <TooltipContent>Quebi keeps your roster in sync.</TooltipContent>
    </Tooltip>
  ),
}
