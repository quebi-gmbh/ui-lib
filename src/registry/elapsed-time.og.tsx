import { ElapsedTime } from "@/components/elapsed-time"
import type { OgScene } from "./types"

/**
 * Three durations either side of the boundaries that change the shape of the
 * output, in both formats. Every one is pinned with `now`, which is both what
 * makes the photograph reproducible and the way the component is meant to be
 * used for a run that has already finished.
 */
const STARTED_AT = new Date("2026-03-13T09:41:00Z")
const at = (seconds: number) => new Date(STARTED_AT.getTime() + seconds * 1000)

export const elapsedTimeOgScene: OgScene = {
  scale: 2,
  render: () => (
    <div className="flex flex-col gap-2">
      {[9, 252, 3723].map((seconds) => (
        <div key={seconds} className="flex items-baseline gap-8">
          <ElapsedTime
            start={STARTED_AT}
            now={at(seconds)}
            className="w-20 text-lg text-quebi-fg"
          />
          <ElapsedTime
            start={STARTED_AT}
            now={at(seconds)}
            format="units"
            className="w-32 text-sm text-quebi-fg-muted"
          />
        </div>
      ))}
    </div>
  ),
}
