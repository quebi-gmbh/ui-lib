import { Card } from "@/components/card"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/context-menu"
import { useContextMenuOnMount } from "./og-scene"
import type { OgScene } from "./types"

/** The menu where the pointer put it, which is the component's whole premise. */
const OpenOnTarget = () => {
  const ref = useContextMenuOnMount<HTMLDivElement>()

  return (
    <div ref={ref}>
      <ContextMenu>
        <ContextMenuTrigger>
          <Card className="px-10 py-8 text-sm text-quebi-fg-muted">Right-click here</Card>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Edit</ContextMenuItem>
          <ContextMenuItem>Duplicate</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem intent="danger">Delete</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  )
}

export const contextMenuOgScene: OgScene = {
  scale: 1.2,
  align: "top",
  render: () => <OpenOnTarget />,
}
