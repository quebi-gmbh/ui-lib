import { Switch } from "@/components/switch"
import type { OgScene } from "./types"

/** On and off together: a switch alone could be either. */
export const switchOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <div className="flex flex-col gap-4">
      <Switch defaultSelected>Autosave drafts</Switch>
      <Switch>Send weekly digest</Switch>
    </div>
  ),
}
