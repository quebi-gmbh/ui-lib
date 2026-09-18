import { Loader } from "@/components/loader"
import type { OgScene } from "./types"

/**
 * Both glyphs, still. An infinite CSS animation is cancelled to its first frame
 * by the screenshot, which is what makes a spinner photographable at all.
 */
export const loaderOgScene: OgScene = {
  scale: 5,
  render: () => (
    <div className="flex items-center gap-8">
      <Loader variant="spin" />
      <Loader variant="ring" />
    </div>
  ),
}
