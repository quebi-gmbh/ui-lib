import { TableOfContents } from "@/components/table-of-contents"
import type { OgScene } from "./types"

const ITEMS = [
  { id: "og-install", title: "installation", level: 2 },
  { id: "og-usage", title: "usage", level: 2 },
  { id: "og-items", title: "items as data", level: 3 },
  { id: "og-spy", title: "scroll-spy", level: 3 },
  { id: "og-a11y", title: "accessibility", level: 2 },
]

/** One section current and one nested under it — the ink rule on the rail and the indent are what say "where you are on this page". Scaled for the 11px mono label. */
export const tableOfContentsOgScene: OgScene = {
  scale: 1.7,
  render: () => (
    <TableOfContents label="on this page" items={ITEMS} activeId="og-items" className="w-72" />
  ),
}
