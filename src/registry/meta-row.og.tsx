import { MetaRow } from "@/components/meta-row"
import type { OgScene } from "./types"

/** Three pairs on one line, magnified: the term-over-value rhythm is the whole component. */
export const metaRowOgScene: OgScene = {
  scale: 2.4,
  render: () => (
    <MetaRow
      items={[
        { term: "studio", value: "quebi GmbH" },
        { term: "people", value: "2" },
        { term: "practice", value: "full-stack" },
      ]}
    />
  ),
}
