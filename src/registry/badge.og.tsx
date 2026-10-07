import { Badge, BadgeDot } from "@/components/badge"
import type { OgScene } from "./types"

/** Four intents and the live dot — the tag, and the three states that are the only colour it takes. */
export const badgeOgScene: OgScene = {
  scale: 2,
  render: () => (
    <div className="flex items-center gap-3">
      <Badge intent="success">
        <BadgeDot />
        live
      </Badge>
      <Badge intent="brand">featured</Badge>
      <Badge intent="warning">review</Badge>
      <Badge intent="danger">overdue</Badge>
    </div>
  ),
}
