import { DaySchedule, type DaySpan } from "@/components/day-schedule"
import type { OgScene } from "./types"

/** Two shifts on one day, in minutes from midnight. */
const SPANS: DaySpan[] = [
  { id: "morning", label: "morning shift", start: 360, end: 720, tone: "brand" },
  { id: "evening", label: "evening shift", start: 840, end: 1200, tone: "cyan" },
]

export const dayScheduleOgScene: OgScene = {
  scale: 1.1,
  render: () => (
    <div className="w-96">
      <DaySchedule defaultSpans={SPANS} height={300} />
    </div>
  ),
}
