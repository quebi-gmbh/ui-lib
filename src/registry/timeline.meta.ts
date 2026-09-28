import type { ComponentMeta } from "./types"

/**
 * "Date & time" rather than "Display": what sets a Timeline apart from a list
 * is that every item is a date at its own precision, and the neighbours a
 * reader has to choose it over — Calendar Timeline, Year View — live there.
 */
export const timelineMeta: ComponentMeta = {
  slug: "timeline",
  name: "Timeline",
  description:
    "What happened when, as an ordered list: a changelog, a company's history, a CV, an order's tracking events, a roadmap, an audit log. Vertical or horizontal (scrolling, snapping by proximity), with content on one side, alternating, or opposite its date — two-sided layouts collapse to one side under a container query. Markers are dots, rings, icons, avatars, numbers or any node, in neutral, brand, success, warning, danger and muted tones, and the current item pulses (not under reduced motion). Every date carries its own precision — \"2019\", \"2021-Q3\", \"2022-03\", \"2023-W12\", \"2024-06-04\", \"2024-06-04T14:30\" — so a mixed-precision history is just items with different strings, rendered in <time dateTime> at that precision; ranges read \"Mar – Jun 2024\" and open ones \"2023 – present\". A `now` prop (never the clock during render) places a Now marker, dashes the connector from the first span that reaches the future, and anchors relative labels. Sorting (newest first without re-sorting), sticky year/month/day group headers, \"Show N more\", linked and expandable items, compact density, an empty state, and proportional spacing: a real time axis with ticks, range bars in lanes, and long gaps compressed behind a break.",
  category: "Date & time",
  tags: ["timeline", "history", "changelog", "activity", "audit log", "roadmap", "tracking", "events", "dates"],
  usage: {
    when: [
      "A history read in order: releases, milestones, a career, a company's story by year.",
      "Events on one thing as they happened: an order's tracking, an incident, a record's audit log.",
      "A plan by quarter or month where the future is drawn differently from the past.",
      "Periods that overlap, placed on a real time axis (`spacing=\"proportional\"`).",
    ],
    whenNot: [
      "Resources booked against hours or days — who is where, when. That is a `CalendarTimeline`.",
      "A user's progress through the steps of a flow they are in. That is a `Stepper`.",
      "Branches and merges. That is a `CommitGraph`.",
      "Many rows with the same columns to sort and filter. That is a table, with a date column.",
    ],
    instead: [
      {
        job: "Time on an axis",
        use: [
          { name: "Calendar Timeline", slug: "calendar-timeline", when: "Rows of resources against hours or days." },
          { name: "Year View", slug: "year-view", when: "How busy each day of a year was." },
        ],
      },
      {
        job: "Steps in order",
        use: [{ name: "Stepper", slug: "stepper", when: "Where the user is in a process." }],
      },
    ],
  },
}
