import { DropZone } from "@/components/drop-zone"
import type { OgScene } from "./types"

/** The dashed target, at rest. */
export const dropZoneOgScene: OgScene = {
  scale: 1.8,
  render: () => <DropZone className="w-80">Drop files here</DropZone>,
}
