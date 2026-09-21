import type { ComponentMeta } from "./types"

export const weekViewMeta: ComponentMeta = {
  slug: "week-view",
  name: "Week View",
  description:
    "Seven days on one time axis — or five for the work week — with overlapping meetings packed into columns per day, an all-day band with \"+N more\" overflow, and the now-marker on today. The week starts where the locale says it does. With isEventEditable and onEventChange an event can be dragged — or arrow-keyed — to another time or another day, snapped to the slot grid; the view reports the drop and your state decides.",
  category: "Date & time",
  tags: ["calendar", "week", "agenda", "events", "schedule", "outlook"],
}
