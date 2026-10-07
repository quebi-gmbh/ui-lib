import type { ComponentMeta } from "./types"

export const eyebrowMeta: ComponentMeta = {
  slug: "eyebrow",
  name: "Eyebrow",
  description:
    "The Label role outside a form: mono, uppercase, tracked, fg-subtle — kickers above a headline, scene labels, timecodes and counts. Written lowercase in the source; CSS sets the caps.",
  category: "Display",
  tags: ["typography", "label", "kicker", "eyebrow", "caption", "brand"],
  usage: {
    when: [
      "A kicker above a headline or a low title: \"scene 01 — the studio\".",
      "A count beside a section heading: \"04 entries\".",
      "A timecode or a short index: \"00:01:24\", \"a\", \"b\".",
    ],
    whenNot: [
      "Never more than one line, and never a sentence — running text is Inter at body size.",
      "Not a form field's label. That is `Label` from Field, which is bound to its control.",
      "Don't write it in capitals in the source; the utility sets the caps, and copy-paste and screen readers get what you wrote.",
    ],
    instead: [
      {
        job: "Labelling a form control",
        use: [{ name: "Field", slug: "field", when: "Its `Label` wears the same type and is a real `<label>`." }],
      },
    ],
  },
}
