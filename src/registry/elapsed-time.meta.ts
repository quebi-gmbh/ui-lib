import type { ComponentMeta } from "./types"

export const elapsedTimeMeta: ComponentMeta = {
  slug: "elapsed-time",
  name: "Elapsed Time",
  description:
    "How long this has been going on: a semantic <time> element with a tick on top, formatted through Intl with a locale named in the code. Renders the zero duration until mount rather than reading the clock during render, so a prerendered page and its hydration agree.",
  category: "Display",
  tags: ["time", "duration", "timer", "elapsed", "formatting", "display"],
}
