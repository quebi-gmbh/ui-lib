import { Eyebrow } from "@/components/eyebrow"
import { LowTitle } from "@/components/low-title"
import { Stage } from "@/components/stage"
import { TextLink } from "@/components/text"
import type { OgScene } from "./types"

/**
 * A stage cut down to the thumbnail: the light, the mark cropped by the frame,
 * a label and the low title. Sized in the spacing scale to the room the stage
 * leaves at this scale, so nothing but the watermark meets an edge — and the
 * watermark is cropped by the Stage's own overflow, as it is on the page.
 */
export const stageOgScene: OgScene = {
  scale: 1.66,
  render: () => (
    <Stage className="h-54 min-h-0 w-155 px-7 md:min-h-0 md:px-7">
      <Eyebrow>scene 01 — the studio</Eyebrow>
      <LowTitle title="full-stack software." action={<TextLink href="#">get started →</TextLink>}>
        Web applications end to end.
      </LowTitle>
    </Stage>
  ),
}
