import type { ComponentMeta } from "./types"

export const scrollAreaMeta: ComponentMeta = {
  slug: "scroll-area",
  name: "Scroll Area",
  description:
    "Scrollable viewport with the quebi native scrollbar — a 6px tinted pill hugging the edge, no stepper arrows and no padding around it — styled with the quebi design system. The bar is clipped to the surface's own rounded rect, so its ends curve away with the corner instead of running out through the arc. Supports vertical, horizontal, or both axes, three scrollbar variants (`flush`, `floating`, `none`), optional edge fading, and a reserved scrollbar gutter. `className` lands on the scroll container itself, so padding on a ScrollArea insets the content while the scrollbar still hugs the container's edge.",
  category: "Layout",
  tags: ["layout", "scroll", "overflow", "container", "viewport"],
}
