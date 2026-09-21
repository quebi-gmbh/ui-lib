import { Sparkline } from "@/components/sparkline"
import type { OgScene } from "./types"

/**
 * Three series, one per variant, big enough to read as shapes at thumbnail
 * size. Literal arrays: a sparkline is drawn during render with no animation
 * and no clock in it, which is what makes the same commit produce the same
 * picture twice.
 */
const RISING = [12, 18, 14, 22, 26, 21, 30, 34, 29, 41, 38, 47]
const PEAKED = [180, 172, 190, 205, 240, 320, 280, 210, 195, 186, 178, 181]
const STEADY = [23, 25, 24, 26, 25, 27, 26, 28, 27, 29, 28, 30]

export const sparklineOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <div className="flex items-center gap-8 text-quebi-brand-text">
      <Sparkline data={RISING} width={140} height={36} strokeWidth={2} marker />
      <Sparkline data={PEAKED} variant="area" width={140} height={36} strokeWidth={2} min={0} />
      <Sparkline data={STEADY} variant="bars" width={140} height={36} min={0} />
    </div>
  ),
}
