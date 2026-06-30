import { Copy, Download, Pencil, Share2, Trash2 } from "lucide-react"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuHeader,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSection,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/context-menu"
import type { ComponentExample } from "./types"

const ContextMenuTriggerArea = ({ children }: { children: React.ReactNode }) => (
  <ContextMenuTrigger className="flex h-28 w-full items-center justify-center rounded-quebi-md border border-cyan-500/20 border-dashed text-quebi-fg-muted text-sm select-none">
    {children}
  </ContextMenuTrigger>
)

export const contextMenuExamples: ComponentExample[] = [
  {
    title: "Right-click target",
    description: "Right-click the surface to open the menu anchored at the pointer.",
    render: () => (
      <ContextMenu>
        <ContextMenuTriggerArea>Right-click here</ContextMenuTriggerArea>
        <ContextMenuContent>
          <ContextMenuItem>Edit</ContextMenuItem>
          <ContextMenuItem>Duplicate</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem intent="danger">Delete</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    ),
  },
  {
    title: "Icons and shortcuts",
    description: "Items can carry leading icons and trailing keyboard shortcut hints.",
    render: () => (
      <ContextMenu>
        <ContextMenuTriggerArea>Right-click for actions</ContextMenuTriggerArea>
        <ContextMenuContent className="min-w-52">
          <ContextMenuItem>
            <Pencil data-slot="icon" />
            <ContextMenuLabel>Edit</ContextMenuLabel>
            <ContextMenuShortcut>⌘E</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>
            <Copy data-slot="icon" />
            <ContextMenuLabel>Copy</ContextMenuLabel>
            <ContextMenuShortcut>⌘C</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>
            <Share2 data-slot="icon" />
            <ContextMenuLabel>Share</ContextMenuLabel>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem intent="danger">
            <Trash2 data-slot="icon" />
            <ContextMenuLabel>Delete</ContextMenuLabel>
            <ContextMenuShortcut>⌫</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    ),
  },
  {
    title: "Header and sections",
    description: "Group related items under labelled sections with a leading header.",
    render: () => (
      <ContextMenu>
        <ContextMenuTriggerArea>Right-click the file</ContextMenuTriggerArea>
        <ContextMenuContent className="min-w-56">
          <ContextMenuHeader separator>report.pdf</ContextMenuHeader>
          <ContextMenuSection label="File">
            <ContextMenuItem>
              <Download data-slot="icon" />
              <ContextMenuLabel>Download</ContextMenuLabel>
            </ContextMenuItem>
            <ContextMenuItem>
              <Copy data-slot="icon" />
              <ContextMenuLabel>Copy</ContextMenuLabel>
            </ContextMenuItem>
          </ContextMenuSection>
          <ContextMenuSeparator />
          <ContextMenuSection label="Danger zone">
            <ContextMenuItem intent="danger">
              <Trash2 data-slot="icon" />
              <ContextMenuLabel>Delete</ContextMenuLabel>
            </ContextMenuItem>
          </ContextMenuSection>
        </ContextMenuContent>
      </ContextMenu>
    ),
  },
]
