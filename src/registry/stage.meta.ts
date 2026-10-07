import type { ComponentMeta } from "./types"

export const stageMeta: ComponentMeta = {
  slug: "stage",
  name: "Stage",
  description:
    "The opening frame of a page: a tall band lit from the top right (cinematic) or plain paper (gallery), with the quebi mark as a giant decorative watermark and a LowTitle sitting on its floor.",
  category: "Brand",
  tags: ["brand", "hero", "layout", "landing", "section", "glyph"],
  usage: {
    when: [
      "The first section of a landing page — `cinematic`, with an h1 LowTitle.",
      "The top of a calm page (team, about, contact) — `gallery`, with an xl LowTitle.",
    ],
    whenNot: [
      "Children go in this order: a plain nav bar, an `Eyebrow`, a `LowTitle`. Nothing else goes above the low title; keep the middle empty.",
      "Not a card or a panel for ordinary content — it is one per page, at the top.",
      "Don't add a second gradient or an image behind it; the stage light is the only gradient in the system.",
    ],
    instead: [
      {
        job: "Separating a section further down the page",
        use: [
          { name: "Whitespace + Heading", slug: "heading" },
          { name: "Panel", slug: "panel", when: "A region that needs a tinted band behind it." },
        ],
      },
    ],
  },
}
