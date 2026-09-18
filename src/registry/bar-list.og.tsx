import { BarList } from "@/components/bar-list"
import type { OgScene } from "./types"

const pages = [
  { name: "/home", value: 8420 },
  { name: "/pricing", value: 5310 },
  { name: "/docs", value: 4180 },
  { name: "/changelog", value: 980 },
]

/** Four rows, scaled to the largest — a chart that is really a list. */
export const barListOgScene: OgScene = {
  scale: 1.6,
  render: () => (
    <div className="w-96">
      <BarList data={pages} />
    </div>
  ),
}
