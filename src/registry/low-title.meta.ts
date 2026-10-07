import type { ComponentMeta } from "./types"

export const lowTitleMeta: ComponentMeta = {
  slug: "low-title",
  name: "Low Title",
  description:
    "The headline set low in the frame, the signature of the system: an Outfit display title under a hairline, with one sentence and one action beside it (m) or in a footer row beneath it (xl). Sinks to the floor of a Stage with mt-auto.",
  category: "Brand",
  tags: ["brand", "headline", "hero", "typography", "title"],
  usage: {
    when: [
      "The headline of a `Stage` — `as=\"h1\"` on the first stage of a page, `h2` after that.",
      "`size=\"xl\"` for a gallery page's title, where the headline is most of the frame.",
    ],
    whenNot: [
      "The title is lowercase, short, one idea, and ends with a full stop. A second sentence goes in `children`, not the title.",
      "One action only, normally a `TextLink` — not a row of buttons.",
      "Not a section heading inside the page body; that is a `display-s` heading with an `Eyebrow` count.",
    ],
    instead: [
      {
        job: "A heading further down the page",
        use: [{ name: "Heading", slug: "heading" }, { name: "Eyebrow", slug: "eyebrow", when: "A count or kicker beside it." }],
      },
    ],
  },
}
