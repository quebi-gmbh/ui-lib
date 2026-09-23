import type { ComponentMeta } from "./types"

export const statMeta: ComponentMeta = {
  slug: "stat",
  name: "Stat",
  description:
    "A metric or KPI without a card around it: label, value, and optionally a delta and a trend. StatGroup lays several in a row with hairlines between them and stacks them on small screens; StatDelta signs and formats the change, picks the arrow from its sign and colours it by whether that direction is good. Rendered as a description list, with numbers formatted through FormattedNumber.",
  category: "Display",
  tags: ["stat", "kpi", "metric", "dashboard", "delta", "trend", "number"],
  usage: {
    when: [
      "A handful of headline numbers at the top of a dashboard or a detail page.",
      "One figure that needs its label and how it changed since last period.",
    ],
    whenNot: [
      "Don't put a Card around each stat. The group's hairlines separate them; a box per number is ink spent on borders.",
      "More than about five numbers of the same kind is a table or a BarList, where they can be compared down a column.",
      "A value against a known maximum (quota, capacity) is a Meter or a ProgressBar.",
    ],
    instead: [
      {
        job: "Many comparable numbers",
        use: [
          { name: "Table", slug: "table" },
          { name: "BarList", slug: "bar-list", when: "Items ranked by one magnitude." },
        ],
      },
      {
        job: "A value against a limit",
        use: [
          { name: "Meter", slug: "meter" },
          { name: "ProgressBar", slug: "progress-bar", when: "A task that finishes." },
        ],
      },
      {
        job: "A series over time",
        use: [
          { name: "Sparkline", slug: "sparkline", when: "Inline, beside the number." },
          { name: "AreaChart", slug: "area-chart", when: "The series is the point." },
        ],
      },
    ],
  },
}
