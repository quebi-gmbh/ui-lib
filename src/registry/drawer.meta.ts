import type { ComponentMeta } from "./types"

export const drawerMeta: ComponentMeta = {
  slug: "drawer",
  name: "Drawer",
  description:
    "An edge-anchored modal panel you can throw off the screen with a finger: it slides in from any side and drags back out again, built on react-aria's Modal with `motion` for the slide, the drag-to-dismiss gesture and the notch you grab it by, closing on a flick or a quarter-screen pull. It enters and leaves in 0.2s easeInOut, and the scrim's blur tweens with it rather than snapping. Sheet is the same panel without the gesture, and that gesture is the one question that chooses between the two: reach for Drawer where a thumb should be able to dismiss the panel — a bottom sheet on a phone — and for Sheet otherwise, which is the plainer of the two and has the fuller Dialog surface (a close X, `role=\"alertdialog\"`, and Dialog's own header, body and footer).",
  category: "Overlays",
  tags: ["overlay", "drawer", "panel", "modal", "motion", "gesture", "drag-to-dismiss", "mobile"],
}
