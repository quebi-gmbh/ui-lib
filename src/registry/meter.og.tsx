import { Meter, MeterHeader, MeterTrack, MeterValue } from "@/components/meter"
import type { OgScene } from "./types"

/** One meter, past the point where the track changes colour. */
export const meterOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <div className="w-80">
      <Meter value={78} aria-label="Storage used">
        <MeterHeader>
          <span>Storage used</span>
          <MeterValue />
        </MeterHeader>
        <MeterTrack />
      </Meter>
    </div>
  ),
}
