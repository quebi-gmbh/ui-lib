import { AlignLeft, Bold, Italic, Underline } from "lucide-react"
import { Toolbar, ToolbarGroup, ToolbarItem, ToolbarSeparator } from "@/components/toolbar"
import type { OgScene } from "./types"

/** Two groups and the separator that is the point of having groups. */
export const toolbarOgScene: OgScene = {
  scale: 2,
  render: () => (
    <Toolbar aria-label="Text formatting">
      <ToolbarGroup aria-label="Style">
        <ToolbarItem size="sq-sm" aria-label="Bold">
          <Bold data-slot="icon" aria-hidden="true" />
        </ToolbarItem>
        <ToolbarItem size="sq-sm" aria-label="Italic">
          <Italic data-slot="icon" aria-hidden="true" />
        </ToolbarItem>
        <ToolbarItem size="sq-sm" aria-label="Underline">
          <Underline data-slot="icon" aria-hidden="true" />
        </ToolbarItem>
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup aria-label="Alignment">
        <ToolbarItem size="sq-sm" aria-label="Align left">
          <AlignLeft data-slot="icon" aria-hidden="true" />
        </ToolbarItem>
      </ToolbarGroup>
    </Toolbar>
  ),
}
