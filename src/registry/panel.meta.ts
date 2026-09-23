import type { ComponentMeta } from "./types"

export const panelMeta: ComponentMeta = {
  slug: "panel",
  name: "Panel",
  description:
    "A tinted band that sets a region of the page apart — a fill and padding, with no border, radius or shadow. Muted for grouping, brand for the one band that asks for something; bleed runs it through a Container's gutter to the edges.",
  category: "Layout",
  tags: ["layout", "surface", "section", "band", "background"],
  usage: {
    when: [
      "A page section that needs more separation than whitespace and a heading give it — a settings group, a FAQ, a footer region.",
      "Alternating bands down a long page, so the reader can see where one section ends.",
      "The single call to action on a page, with `tone=\"brand\"`.",
    ],
    whenNot: [
      "Don't use a Panel for a self-contained unit beside others of a different kind. That is a `Card`.",
      "Don't put a Panel in a Card or a Card-shaped surface. Inside a card, a `Heading` and a `Separator` separate the parts.",
      "Don't give a Panel a border or a radius. The moment it needs an edge it is a `Card`.",
      "Don't reach for a Panel when whitespace would do. Every section in a tint is the same as none of them.",
    ],
    instead: [
      {
        job: "Separating sections",
        use: [
          { name: "Whitespace + Heading", slug: "heading" },
          { name: "Separator", slug: "separator" },
        ],
      },
      {
        job: "A self-contained unit",
        use: [{ name: "Card", slug: "card" }],
      },
      {
        job: "A callout",
        use: [{ name: "Note", slug: "note" }],
      },
    ],
  },
}
