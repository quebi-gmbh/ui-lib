import type { ComponentMeta } from "./types"

export const filterRailMeta: ComponentMeta = {
  slug: "filter-rail",
  name: "Filter Rail",
  description:
    "A persistent faceted sidebar for browse surfaces — a gallery, a catalogue, a search result — where the question is not \"narrow this\" but \"what is in here, and what would each choice leave me\". Every facet is on screen at once and every option carries its live count, so nothing has to be opened to be read: an enum is a counted checkbox column with the numbers right-aligned in a tabular-nums column, a bounded number is a two-thumb slider, a date is a From/To pair. It applies on change, with a Clear per group and one for the rail, and an option another filter has zeroed stays listed and disabled at 0 rather than vanishing. Ships FilterRailSummary (the active filters as chips beside the results) and FilterRailLayout, whose container queries are what keep a sidebar-width rail from turning a 700px page into four unreadable cards. Controlled, over the same FilterField / FilterValues model as FilterBar.",
  category: "Display",
  tags: ["filter", "facet", "sidebar", "browse", "catalogue", "search", "count", "interactive"],
}
