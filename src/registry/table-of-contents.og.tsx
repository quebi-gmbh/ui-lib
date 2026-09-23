import { TableOfContents } from "@/components/table-of-contents"
import type { OgScene } from "./types"

const ITEMS = [
  { id: "og-install", title: "Installation", level: 2 },
  { id: "og-usage", title: "Usage", level: 2 },
  { id: "og-items", title: "Items as data", level: 3 },
  { id: "og-spy", title: "Scroll-spy", level: 3 },
  { id: "og-a11y", title: "Accessibility", level: 2 },
]

/** One section current and one nested under it — the teal row and the indent rule are what say "where you are on this page". */
export const tableOfContentsOgScene: OgScene = {
  scale: 1.5,
  render: () => (
    <TableOfContents label="On this page" items={ITEMS} activeId="og-items" className="w-72" />
  ),
}
