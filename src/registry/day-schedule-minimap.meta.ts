import type { ComponentMeta } from "./types"

export const dayScheduleMinimapMeta: ComponentMeta = {
  slug: "day-schedule-minimap",
  name: "Day Schedule Minimap",
  description:
    "A 36px strip beside a zoomed Day Schedule that replaces its scrollbar: the whole 24-hour day at once, one fixed-thickness line per span, and a rectangle marking the slice on screen. Click or drag it to scroll there. When more lines than fit, the lane grid pans with the hours on screen so each line rides through the strip rather than every line going thinner.",
  category: "Date & time",
  tags: ["schedule", "minimap", "overview", "scrollbar", "navigation", "day", "timeline"],
}
