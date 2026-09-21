import { DaySchedule, type DaySpan } from "@/components/day-schedule"
import type { OgScene } from "./types"

/** A day with more going on than one screenful, so the map has something to map. */
const SPANS: DaySpan[] = [
  { id: "standup", label: "standup", start: 540, end: 555, tone: "cyan" },
  { id: "deep-work", label: "deep work", start: 570, end: 720, tone: "brand" },
  { id: "lunch", label: "lunch", start: 750, end: 810, tone: "cyan" },
  { id: "pairing", label: "pairing", start: 810, end: 960, tone: "brand" },
  { id: "deploy", label: "deploy window", start: 990, end: 1080, tone: "cyan" },
]

/**
 * The whole day on the right, one screenful of it on the left, and the
 * rectangle saying which.
 *
 * `startMinute` is what makes it a photograph of the component rather than of a
 * box: at the top of the day the rectangle sits flush against the strip's top
 * edge with every line below it, which reads as a schedule someone drew a
 * border on. Posed at one in the afternoon it is clearly a window, clearly
 * somewhere, and clearly moveable. Read-only because a drag handle photographs
 * as a dot, and without the edge times because a rotated 09:15 is four grey
 * pixels at thumbnail size and the subject of the picture is on the right.
 */
export const dayScheduleMinimapOgScene: OgScene = {
  scale: 1.35,
  render: () => (
    <div className="w-112">
      <DaySchedule
        spans={SPANS}
        zoom={3}
        minimap
        startMinute={750}
        height={260}
        timeLabels="none"
        isReadOnly
      />
    </div>
  ),
}
