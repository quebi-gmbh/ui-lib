import type { ComponentMeta } from "./types"

export const activityPulseMeta: ComponentMeta = {
  slug: "activity-pulse",
  name: "Activity Pulse",
  description:
    "A rolling twenty-slot strip fed by work that actually happened, for the middle of the progress axis a spinner cannot cover: it looks different when the work stops. Pure component plus a useActivityPulse hook that turns any counter into the buffer, with bar, dot, wave and line shapes.",
  category: "Feedback",
  tags: ["activity", "liveness", "streaming", "indeterminate", "agent", "feedback"],
}
