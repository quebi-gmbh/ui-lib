import { ColorArea } from "@/components/color-area"
import { ColorThumb } from "@/components/color-thumb"
import type { OgScene } from "./types"

/**
 * The default handle beside one of your own. A ColorThumb means nothing on its
 * own, and the reason to reach for it directly is that `ColorArea` renders
 * `{children ?? <ColorThumb />}` — so a thumb you pass replaces the default.
 */
export const colorThumbOgScene: OgScene = {
  scale: 1.5,
  render: () => (
    <div className="flex items-center gap-8">
      <ColorArea
        defaultValue="hsb(220, 100%, 100%)"
        xChannel="saturation"
        yChannel="brightness"
        aria-label="Saturation and brightness, default thumb"
        className="size-36"
      />
      <ColorArea
        defaultValue="hsb(174, 100%, 100%)"
        xChannel="saturation"
        yChannel="brightness"
        aria-label="Saturation and brightness, custom thumb"
        className="size-36"
      >
        <ColorThumb className="size-8 rounded-quebi-sm ring-2 ring-quebi-brand" />
      </ColorArea>
    </div>
  ),
}
