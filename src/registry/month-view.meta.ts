import type { ComponentMeta } from "./types"

export const monthViewMeta: ComponentMeta = {
  slug: "month-view",
  name: "Month View",
  description:
    "The month as whole weeks, with events as chips that run across the days they cover and fold into a \"+N more\" that opens the whole day in a popover. With isEventEditable and onEventChange a chip can be dragged — or arrow-keyed — onto another day, which moves the event by whole days and leaves the time of day alone; the view reports the drop and your state decides. Calendar is the month grid you pick a date with; this is the one you read what is on it.",
  category: "Date & time",
  tags: ["calendar", "month", "agenda", "events", "grid", "outlook"],
}
