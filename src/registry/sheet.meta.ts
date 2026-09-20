import type { ComponentMeta } from "./types"

export const sheetMeta: ComponentMeta = {
  slug: "sheet",
  name: "Sheet",
  description:
    "An edge-anchored modal panel that slides in from any side of the viewport, built on react-aria's Modal over the Dialog surface — so it carries Dialog's header, body, footer and title, a close X by default, `role=\"alertdialog\"` for a panel that asks rather than shows, and an `overlay` prop for the scrim. Two shapes, as with Modal: a `Sheet` wrapping a trigger and a `SheetContent`, or a `SheetContent` on its own with `isOpen`/`onOpenChange` when a route rather than a trigger decides it is open. It enters and leaves in 200ms ease-in-out, and not at all under prefers-reduced-motion. Drawer is the same panel with a drag-to-dismiss gesture, and that gesture is the one question that chooses between the two: if the user should be able to throw the panel off the screen with a finger — a bottom sheet on a phone — that is a Drawer. Otherwise it is a Sheet, which is the plainer of the two and has the fuller dialog surface.",
  category: "Overlays",
  tags: ["overlay", "sheet", "panel", "side-panel", "modal", "dialog"],
}
