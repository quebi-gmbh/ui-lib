import { Heading } from "@/components/heading"
import type { OgScene } from "./types"

/** Three levels, one sentence: the scale is the thing being shown. */
export const headingOgScene: OgScene = {
  scale: 1.5,
  render: () => (
    <div className="flex flex-col gap-2">
      <Heading level={1}>Match candidates in seconds</Heading>
      <Heading level={2}>Match candidates in seconds</Heading>
      <Heading level={3}>Match candidates in seconds</Heading>
    </div>
  ),
}
