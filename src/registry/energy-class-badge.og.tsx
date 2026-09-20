import { EnergyClassBadge } from "@/components/energy-class-badge"
import type { OgScene } from "./types"

/** The whole regulated scale, because the scale is what the component is. */
export const energyClassBadgeOgScene: OgScene = {
  scale: 2,
  render: () => (
    <div className="flex items-center gap-2">
      {["A", "B", "C", "D", "E", "F", "G"].map((energyClass) => (
        <EnergyClassBadge key={energyClass} energyClass={energyClass} />
      ))}
    </div>
  ),
}
