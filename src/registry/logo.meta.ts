import type { ComponentMeta } from "./types"

export const logoMeta: ComponentMeta = {
  slug: "logo",
  name: "Logo",
  description:
    "The quebi wordmark or the round q, in the right ink for the theme — ink on Daylight, light on Cinematic — switched by CSS so a prerendered page never flashes the wrong one. Pass srcInk/srcLight to point at your own hosted copies.",
  category: "Brand",
  tags: ["brand", "logo", "wordmark", "mark", "theme", "image"],
  usage: {
    when: [
      "The wordmark at the left of a nav bar (height 20, or 32 on a landing page) and in a footer.",
      "The mark (the round q) where the name is already said nearby, at 36px or more.",
    ],
    whenNot: [
      "Don't recolour, outline, stretch or add effects to it — it ships in exactly two inks.",
      "Don't retype the wordmark in Outfit; it is a drawing, not text.",
      "Don't crowd it: keep clear space of at least the height of the q around it.",
      "Don't use it as a page watermark. The giant mark behind a stage is the Stage's own glyph.",
    ],
    instead: [
      {
        job: "A decorative mark behind a headline",
        use: [{ name: "Stage", slug: "stage", when: "Its `glyph` draws the mark in the glyph ink, hidden from assistive tech." }],
      },
    ],
  },
}
