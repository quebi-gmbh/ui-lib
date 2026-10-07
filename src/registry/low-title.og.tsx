import { LowTitle } from "@/components/low-title"
import { TextLink } from "@/components/text"
import type { OgScene } from "./types"

/** The medium title with its side column: the hairline, the light display cut and the one action. */
export const lowTitleOgScene: OgScene = {
  scale: 1.7,
  render: () => (
    <LowTitle
      className="w-155"
      title="full-stack software development."
      action={<TextLink href="#">get started →</TextLink>}
    >
      Web applications end to end.
    </LowTitle>
  ),
}
