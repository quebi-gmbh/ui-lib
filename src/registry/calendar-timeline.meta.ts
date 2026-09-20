import type { ComponentMeta } from "./types"

export const calendarTimelineMeta: ComponentMeta = {
  slug: "calendar-timeline",
  name: "Calendar Timeline",
  description:
    "Several calendars at once: one row per calendar, resource or room, with time running horizontally over one day or thirty. Overlapping events stack into lanes within a row, so a double-booked room grows rather than hides the clash, and the header drops from hour ticks to a day axis as the span widens.",
  category: "Date & time",
  tags: ["calendar", "timeline", "resource", "schedule", "events", "multi-calendar", "multi-day", "gantt"],
}
