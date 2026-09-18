import { Bold, Italic } from "lucide-react"
import { Toggle } from "@/components/toggle"
import type { OgScene } from "./types"

/**
 * One on, one off. A toggle only means anything next to its other state, so the
 * pair is the smallest scene that says what the component is.
 */
export const toggleOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <div className="flex items-center gap-3">
      <Toggle intent="outline" defaultSelected>
        <Bold data-slot="icon" aria-hidden="true" />
        Bold
      </Toggle>
      <Toggle intent="outline">
        <Italic data-slot="icon" aria-hidden="true" />
        Italic
      </Toggle>
    </div>
  ),
}
