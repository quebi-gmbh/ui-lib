import { ProgressCircle } from "@/components/progress-circle"
import type { OgScene } from "./types"

/** Three fill levels, so the ring reads as a scale rather than as a spinner. */
export const progressCircleOgScene: OgScene = {
  scale: 2.5,
  render: () => (
    <div className="flex items-center gap-8">
      <ProgressCircle aria-label="25 percent" value={25} className="size-10" />
      <ProgressCircle aria-label="60 percent" value={60} className="size-10" />
      <ProgressCircle aria-label="Complete" value={100} className="size-10" />
    </div>
  ),
}
