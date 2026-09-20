import { ArrowRight } from "lucide-react"
import { Button } from "@/components/button"
import type { OgScene } from "./types"

/**
 * Three intents, in the order an app uses them: the teal hero, the quiet
 * companion, the outline that cancels. Six would be a swatch chart — at
 * thumbnail size the row has to read as "these are buttons", not as a legend.
 */
export const buttonOgScene: OgScene = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button intent="primary" size="lg">
        Get started
        <ArrowRight data-slot="icon" aria-hidden="true" />
      </Button>
      <Button intent="secondary" size="lg">
        Preview
      </Button>
      <Button intent="outline" size="lg">
        Cancel
      </Button>
    </div>
  ),
}
