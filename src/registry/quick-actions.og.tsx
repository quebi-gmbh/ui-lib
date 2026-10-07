import { Pencil, Share2, Trash2, UserPlus } from "lucide-react"
import {
  QuickActions,
  QuickActionsContent,
  QuickActionsItem,
  QuickActionsSeparator,
  QuickActionsTrigger,
} from "@/components/quick-actions"
import type { OgScene } from "./types"

/**
 * The panel up from the bottom with four actions, one of them destructive: the
 * list of what you can do is the component, and the trigger under the scrim is
 * only how you got there. `side` is pinned so the photograph does not depend on
 * the width of the browser that took it, and there are no shortcut hints — they
 * are hidden below `lg`, and the Keyboard's small type is what would decide the
 * scale.
 */
export const quickActionsOgScene: OgScene = {
  render: () => (
    <QuickActions defaultOpen>
      <QuickActionsTrigger>actions</QuickActionsTrigger>
      <QuickActionsContent side="bottom">
        <QuickActionsItem id="edit" icon={Pencil}>
          edit
        </QuickActionsItem>
        <QuickActionsItem id="share" icon={Share2}>
          share
        </QuickActionsItem>
        <QuickActionsItem id="invite" icon={UserPlus}>
          invite
        </QuickActionsItem>
        <QuickActionsSeparator />
        <QuickActionsItem id="delete" icon={Trash2} intent="danger">
          delete
        </QuickActionsItem>
      </QuickActionsContent>
    </QuickActions>
  ),
}
