import { DateTime, FormattedDate, RelativeTime } from "@/components/formatted-date"
import type { OgScene } from "./types"

/**
 * A pinned instant, and a `now` pinned beside it. Both are literals: the site is
 * prerendered and this image is a build artifact, so a date that came from the
 * clock would make every deploy a different picture and every unfurl a lie.
 */
const WHEN = new Date("2024-03-15T14:30:00.000Z")
const NOW = new Date("2024-03-15T16:30:00.000Z")

export const formattedDateOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <div className="flex w-96 flex-col gap-3 text-quebi-fg">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-quebi-fg-muted">long</span>
        <FormattedDate date={WHEN} format="long" locale="de" />
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-quebi-fg-muted">date &amp; time</span>
        <DateTime date={WHEN} locale="de" />
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-quebi-fg-muted">relative</span>
        <RelativeTime date={WHEN} now={NOW} locale="de" />
      </div>
    </div>
  ),
}
