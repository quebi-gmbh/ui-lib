import { ActivityPulse } from "@/components/activity-pulse"
import { Card } from "@/components/card"
import { ElapsedTime } from "@/components/elapsed-time"
import type { OgScene } from "./types"

/**
 * The surface the component exists for, photographed: a status bar where the
 * label says what, the clock says how long, and the strip says that anything is
 * still moving.
 *
 * The samples are a literal array rather than a feed, and the clock is pinned
 * with `now`, because the build's promise is that one commit produces the same
 * image twice — a timer or a die roll here would publish a different picture
 * every deploy. The shape chosen is the one that makes the point: a burst, a
 * silence, another burst.
 */
const SAMPLES = [0, 0, 40, 180, 520, 300, 90, 0, 0, 0, 0, 0, 0, 240, 610, 880, 420, 150, 60, 20]

const STARTED_AT = new Date("2026-03-13T09:41:00Z")
const FINISHED_AT = new Date("2026-03-13T09:45:12Z")

export const activityPulseOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <Card className="w-96 p-3">
      <div className="flex items-center gap-3">
        <span className="min-w-0 flex-1 truncate text-sm text-quebi-fg">Running Bash</span>
        <ActivityPulse samples={SAMPLES} className="text-quebi-brand-text" />
        <ElapsedTime
          start={STARTED_AT}
          now={FINISHED_AT}
          className="w-12 text-right text-sm text-quebi-fg-muted"
        />
      </div>
    </Card>
  ),
}
