import type { ComponentMeta } from "./types"

export const indexListMeta: ComponentMeta = {
  slug: "index-list",
  name: "Index List",
  description:
    "A numbered list ruled by hairlines under a strong top rule — mono number, Outfit title, caption meta — for work, articles or anything people pick from. Rows with an href shift right and lift to the raised ground on hover.",
  category: "Display",
  tags: ["list", "index", "navigation", "portfolio", "links", "brand"],
  usage: {
    when: [
      "A list of work, articles or chapters, each one a link to its own page.",
      "A short numbered sequence that should read as an editorial index rather than a table.",
    ],
    whenNot: [
      "Rows the user selects or acts on in place — that is a `GridList`.",
      "Rows with more than a title and one piece of meta — that is a `Table`.",
      "Don't give some rows an `href` and leave others static in one list; the rows that move read as the only real ones.",
    ],
    instead: [
      {
        job: "A list the user interacts with",
        use: [
          { name: "GridList", slug: "grid-list", when: "Rows the user acts on." },
          { name: "Table", slug: "table", when: "Rows with several fields." },
        ],
      },
    ],
  },
}
