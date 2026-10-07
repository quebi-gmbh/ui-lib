import { IndexList } from "@/components/index-list"
import type { OgScene } from "./types"

/** Three rows under the strong rule: number, title and meta are the shape people recognise. */
export const indexListOgScene: OgScene = {
  scale: 1.6,
  render: () => (
    <IndexList
      className="w-150"
      items={[
        { title: "quebi cloud", meta: "workspace", href: "#" },
        { title: "klartex", meta: "latex editor", href: "#" },
        { title: "equana", meta: "transpiler", href: "#" },
      ]}
    />
  ),
}
