import { AlertTriangle, CreditCard, Rocket, Sparkles } from "lucide-react"
import { IconTile } from "@/components/icon-tile"
import type { OgScene } from "./types"

/** The ink tile, a state tint and the slate action fill. */
export const iconTileOgScene: OgScene = {
  scale: 2.4,
  render: () => (
    <div className="flex items-center gap-4">
      <IconTile intent="brand">
        <Rocket data-slot="icon" />
      </IconTile>
      <IconTile intent="accent">
        <CreditCard data-slot="icon" />
      </IconTile>
      <IconTile intent="warning">
        <AlertTriangle data-slot="icon" />
      </IconTile>
      <IconTile intent="ai">
        <Sparkles data-slot="icon" />
      </IconTile>
    </div>
  ),
}
