import type { ComponentMeta } from "./types"

export const dayViewMeta: ComponentMeta = {
  slug: "day-view",
  name: "Day View",
  description:
    "One day on a time axis, Outlook-style: hours down the side, an all-day band across the top, overlapping meetings packed side by side, and a marker on the current time. Events carry a ZonedDateTime, so the zone the grid is drawn in is never guessed.",
  category: "Date & time",
  tags: ["calendar", "day", "agenda", "events", "schedule", "outlook"],
}
