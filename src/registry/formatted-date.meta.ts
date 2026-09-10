import type { ComponentMeta } from "./types"

export const formattedDateMeta: ComponentMeta = {
  slug: "formatted-date",
  name: "Formatted Date",
  description:
    "Locale-aware date and time formatter that renders a semantic <time> element, with absolute and relative styles powered by the Intl APIs. Locale and time zone are pinned, and relative output takes an explicit `now`, so the same date renders the same string on the server and in the browser.",
  category: "Display",
  tags: ["date", "time", "intl", "formatter", "locale", "relative"],
}
