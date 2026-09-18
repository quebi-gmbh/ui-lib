import { Keyboard } from "@/components/keyboard"
import type { OgScene } from "./types"

/** Two hints, in a line of the prose they live in. */
export const keyboardOgScene: OgScene = {
  scale: 2,
  render: () => (
    <div className="flex items-center gap-6 text-sm text-quebi-fg-muted">
      <span className="flex items-center gap-2">
        Search <Keyboard>⌘K</Keyboard>
      </span>
      <span className="flex items-center gap-2">
        Save <Keyboard>⌘S</Keyboard>
      </span>
    </div>
  ),
}
