import type { ChartConfig } from "@/components/chart"
import { Treemap, type TreemapDatum } from "@/components/treemap"
import type { OgScene } from "./types"

const flat: TreemapDatum[] = [
  { name: "Components", size: 4820 },
  { name: "Routes", size: 2410 },
  { name: "Registry", size: 1870 },
  { name: "Rules", size: 1340 },
  { name: "Scripts", size: 760 },
  { name: "Tests", size: 640 },
]

const config: ChartConfig = {}

/** Area is the value. The component switches its own animation off already. */
export const treemapOgScene: OgScene = {
  scale: 1.5,
  render: () => (
    <div className="w-144">
      <Treemap config={config} data={flat} dataKey="size" containerHeight={240} />
    </div>
  ),
}
