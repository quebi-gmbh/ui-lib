import type { ComponentMeta } from "./types"

export const yearViewMeta: ComponentMeta = {
  slug: "year-view",
  name: "Year View",
  description:
    "A whole year as twelve month cards, in three variants: heatmap, where a day's fill steps with how much is on it against the year's busiest day (never less than four to a step, so a quiet year is not painted full) under a Fewer/More legend; count, a neutral cell with the exact number; and list, larger cells naming the day's first events in their calendar's colour and folding the rest into the same \"+N more\" panel Month View opens. It reads the same CalendarEvent and CalendarSource as every other view, or a plain { \"YYYY-MM-DD\": n } record when the year is an aggregate. Days with something on them and month headings link wherever dayHref / monthHref say, or call onDayAction / onMonthAction; empty days are inert. The year steps from a CalendarToolbar whose heading opens a Year Picker, and weekday initials, the first day of the week and every number follow the locale.",
  category: "Date & time",
  tags: ["calendar", "year", "heatmap", "overview", "events", "counts", "activity"],
}
