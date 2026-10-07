import type { ComponentMeta } from "./types"

export const metaRowMeta: ComponentMeta = {
  slug: "meta-row",
  name: "Meta Row",
  description:
    "Three or four small term/value pairs in one wrapping row, as in a gallery page's header. A <dl>: terms in fg-subtle, values in fg, caption size, all lowercase.",
  category: "Display",
  tags: ["display", "metadata", "key-value", "dl", "brand"],
  usage: {
    when: ["A handful of facts under a page or project title: studio, people, practice, year."],
    whenNot: [
      "More than four pairs, or values that need to line up in columns — that is a `DescriptionList`.",
      "Figures that are the point of the view — those are `Stat`s.",
    ],
    instead: [
      {
        job: "Key/value data",
        use: [
          { name: "DescriptionList", slug: "description-list", when: "A longer block, aligned in columns." },
          { name: "Stat", slug: "stat", when: "Numbers the reader came for." },
        ],
      },
    ],
  },
}
