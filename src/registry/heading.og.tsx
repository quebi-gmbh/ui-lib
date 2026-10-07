import { Heading } from "@/components/heading"
import type { OgScene } from "./types"

/** Three levels, one sentence: the scale is the thing being shown. */
export const headingOgScene: OgScene = {
  scale: 1.2,
  render: () => (
    <div className="flex flex-col gap-3">
      <Heading level={1}>match in seconds.</Heading>
      <Heading level={2}>match in seconds.</Heading>
      <Heading level={3}>match in seconds.</Heading>
    </div>
  ),
}
