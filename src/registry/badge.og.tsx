import { Badge, BadgeDot } from "@/components/badge"
import type { OgScene } from "./types"

/** Four intents and the live dot — enough for the shape and the colour range. */
export const badgeOgScene: OgScene = {
  scale: 2,
  render: () => (
    <div className="flex items-center gap-3">
      <Badge intent="success">
        <BadgeDot />
        Live
      </Badge>
      <Badge intent="brand">Featured</Badge>
      <Badge intent="warning">Review</Badge>
      <Badge intent="danger">Overdue</Badge>
    </div>
  ),
}
