import type { ComponentMeta } from "./types"

export const sidebarMeta: ComponentMeta = {
  slug: "sidebar",
  name: "Sidebar",
  description:
    "Full-featured, collapsible navigation surface built on react-aria-components and styled with the quebi design system. Supports docked/hidden collapse, float and inset intents, sections, disclosure groups, badges, tooltips, a mobile sheet, and a keyboard shortcut to toggle. The surface is positioned fixed to the viewport, next to an in-flow spacer that reserves its width — which is what a full-page app shell wants. To embed one in a sub-region of a page instead, give the wrapping element contain: layout (Tailwind's contain-layout) so it becomes the containing block for the fixed surface; otherwise the items paint at the left edge of the window rather than inside the region.",
  category: "Navigation",
  tags: ["navigation", "sidebar", "nav", "menu", "layout", "collapsible", "interactive"],
}
