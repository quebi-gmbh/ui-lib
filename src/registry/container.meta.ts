import type { ComponentMeta } from "./types"

export const containerMeta: ComponentMeta = {
  slug: "container",
  name: "Container",
  description:
    "Centered, max-width layout wrapper with responsive horizontal padding. Exposes its breakpoint and gutter as CSS variables for inline overrides.",
  category: "Layout",
  tags: ["layout", "wrapper", "responsive", "content-width"],
  noOgScene:
    "Container draws nothing. It is a centered max-width wrapper — no border, no background, no text — so a photograph of one is a photograph of whatever was put inside it, and the share image would be advertising that component instead. The gallery example has to hand-draw a dashed box to show where the edges are; doing the same here would be inventing a surface the component does not have.",
}
