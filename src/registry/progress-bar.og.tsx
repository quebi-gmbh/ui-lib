import {
  ProgressBar,
  ProgressBarHeader,
  ProgressBarTrack,
  ProgressBarValue,
} from "@/components/progress-bar"
import type { OgScene } from "./types"

/** A determinate upload, caught at a value that reads as progress. */
export const progressBarOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <div className="w-80">
      <ProgressBar value={65} aria-label="Uploading">
        <ProgressBarHeader>
          <span>Uploading</span>
          <ProgressBarValue />
        </ProgressBarHeader>
        <ProgressBarTrack />
      </ProgressBar>
    </div>
  ),
}
