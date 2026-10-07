import { Eyebrow } from "@/components/eyebrow"
import type { OgScene } from "./types"

/** Three labels stacked: the type itself — mono, tracked caps — is the component. */
export const eyebrowOgScene: OgScene = {
  scale: 2.4,
  render: () => (
    <div className="grid gap-3">
      <Eyebrow>scene 01 — the studio</Eyebrow>
      <Eyebrow>04 entries</Eyebrow>
      <Eyebrow>00:01:24</Eyebrow>
    </div>
  ),
}
