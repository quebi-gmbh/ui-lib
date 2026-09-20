import { ShowMore } from "@/components/show-more"
import type { OgScene } from "./types"

/** The hairline and its pill, over the content it is cutting short. */
export const showMoreOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <div className="w-96">
      <p className="text-sm text-quebi-fg-muted">
        Nine intents plus an optional state dot for live labels, and a size scale that runs from xs
        to xl.
      </p>
      <div className="mt-6">
        <ShowMore>Show more</ShowMore>
      </div>
    </div>
  ),
}
