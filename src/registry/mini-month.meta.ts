import type { ComponentMeta } from "./types"

export const miniMonthMeta: ComponentMeta = {
  slug: "mini-month",
  name: "Mini Month",
  description:
    "The month at a glance for a dashboard card or a sidebar: a compact day grid with one dot per calendar that has something on a day, a tinted band behind runs of days such as absences, today ringed and the picked day filled. It reads the same CalendarEvent and CalendarSource as Month View, reports the picked day through onDayChange so the page can show that day's agenda wherever it likes, draws one or several months side by side, and describes every marked day to a screen reader in words. Calendar is the grid you pick a date with, Month View the one you read the events on; this one tells you which days have something.",
  category: "Date & time",
  tags: ["calendar", "month", "mini", "compact", "dots", "dashboard", "availability", "absence"],
}
