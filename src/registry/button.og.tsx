import { Button } from "@/components/button"
import type { OgScene } from "./types"

/**
 * Three intents, in the order an app uses them: the solid call to action, the
 * quiet companion, the outline that cancels. Five would be a swatch chart — at
 * thumbnail size the row has to read as "these are buttons", not as a legend.
 */
export const buttonOgScene: OgScene = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button intent="primary" size="lg">
        get started →
      </Button>
      <Button intent="secondary" size="lg">
        preview
      </Button>
      <Button intent="outline" size="lg">
        cancel
      </Button>
    </div>
  ),
}
