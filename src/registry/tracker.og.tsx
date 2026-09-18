import { Tracker, type TrackerBlockProps } from "@/components/tracker"
import type { OgScene } from "./types"

/**
 * Forty days of uptime with two bad ones in it. The colours are quebi status
 * tokens rather than the palette scales the gallery example reaches for: this
 * file is linted as app code, and a status colour has a token.
 */
const uptime: TrackerBlockProps[] = Array.from({ length: 40 }, (_, index) => {
  if (index === 11 || index === 28)
    return { color: "bg-quebi-warn", tooltip: "Degraded performance" }
  if (index === 19) return { color: "bg-quebi-danger", tooltip: "Major outage" }
  return { color: "bg-quebi-success", tooltip: "Operational" }
})

export const trackerOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <div className="w-96">
      <Tracker data={uptime} />
    </div>
  ),
}
