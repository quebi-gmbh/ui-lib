import { Sparkline } from "@/components/sparkline"
import { Stat, StatDelta, StatGroup } from "@/components/stat"
import type { OgScene } from "./types"

const SIGNUPS = [12, 18, 14, 22, 26, 30, 34, 41]
const ERRORS = [41, 38, 30, 29, 22, 19, 17]

/**
 * Two stats in a group: the value, a rise, and a fall on a number that
 * is meant to fall — both green — and the hairline between them. Enough to read "KPI row
 * without cards" at thumbnail size. The site's I18nProvider pins the locale, so
 * the build and the screenshot agree on the digits.
 */
export const statOgScene: OgScene = {
  scale: 2,
  render: () => (
    <StatGroup className="sm:gap-10 sm:[&>*+*]:pl-10">
      <Stat
        size="lg"
        label="Signups"
        value={1284}
        delta={<StatDelta value={0.12} />}
        trend={<Sparkline data={SIGNUPS} width={80} height={20} className="text-quebi-brand-text" />}
      />
      <Stat
        size="lg"
        label="Checkout errors"
        value={17}
        delta={<StatDelta value={-0.4} invert />}
        trend={<Sparkline data={ERRORS} width={80} height={20} className="text-quebi-brand-text" />}
      />
    </StatGroup>
  ),
}
