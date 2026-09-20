import type { ComponentMeta } from "./types"

export const dayScheduleMeta: ComponentMeta = {
  slug: "day-schedule",
  name: "Day Schedule",
  description:
    "A vertical 24-hour axis with named time spans in parallel lanes. Drag a span to move it or either end to resize, snapping to a configurable step with a minimum duration, fully keyboard operable. The start and end times beside each span can be read-only text or typeable TimeFields, rotated into the lane or upright beside it via timeLabelOrientation.",
  category: "Date & time",
  tags: ["schedule", "time", "range", "planner", "drag", "calendar", "day"],
}
