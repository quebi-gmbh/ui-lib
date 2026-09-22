import type { ComponentMeta } from "./types"

export const calendarToolbarMeta: ComponentMeta = {
  slug: "calendar-toolbar",
  name: "Calendar Toolbar",
  description:
    "The chrome above a calendar view: today, a chevron each way, the range you are looking at, and the switch between views. Four slots for the rest — a leading control, chrome, a primary action and an overflow menu. Owns no state — every press is reported.",
  category: "Date & time",
  tags: ["calendar", "toolbar", "navigation", "view switcher", "events"],
}
