import {
  FormattedCurrency,
  FormattedNumber,
  FormattedPercentage,
} from "@/components/formatted-number"
import type { OgScene } from "./types"

/** One value, three renderings, every one of them with its locale written down. */
export const formattedNumberOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <div className="flex w-96 flex-col gap-3 text-quebi-fg tabular-nums">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-quebi-fg-muted">de-DE</span>
        <FormattedNumber value={1234567.89} locale="de-DE" />
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-quebi-fg-muted">EUR</span>
        <FormattedCurrency value={1499.5} locale="de-DE" />
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-quebi-fg-muted">percent</span>
        <FormattedPercentage value={0.1234} locale="de-DE" />
      </div>
    </div>
  ),
}
