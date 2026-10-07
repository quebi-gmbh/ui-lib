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
        <Bold data-slot="icon" strokeWidth={1.5} aria-hidden="true" />
        bold
      </Toggle>
      <Toggle intent="outline">
        <Italic data-slot="icon" strokeWidth={1.5} aria-hidden="true" />
        italic
      </Toggle>
    </div>
  ),
}
