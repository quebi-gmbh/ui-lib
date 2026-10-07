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
  <ContextMenuTrigger className="flex h-28 w-full items-center justify-center border border-quebi-hairline border-dashed text-quebi-fg-muted text-sm select-none">
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
          <ContextMenuItem>edit</ContextMenuItem>
          <ContextMenuItem>duplicate</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem intent="danger">delete</ContextMenuItem>
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
            <ContextMenuLabel>edit</ContextMenuLabel>
            <ContextMenuShortcut>⌘E</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>
            <Copy data-slot="icon" />
            <ContextMenuLabel>copy</ContextMenuLabel>
            <ContextMenuShortcut>⌘C</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>
            <Share2 data-slot="icon" />
            <ContextMenuLabel>share</ContextMenuLabel>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem intent="danger">
            <Trash2 data-slot="icon" />
            <ContextMenuLabel>delete</ContextMenuLabel>
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
              <ContextMenuLabel>download</ContextMenuLabel>
            </ContextMenuItem>
            <ContextMenuItem>
              <Copy data-slot="icon" />
              <ContextMenuLabel>copy</ContextMenuLabel>
            </ContextMenuItem>
          </ContextMenuSection>
          <ContextMenuSeparator />
          <ContextMenuSection label="Danger zone">
            <ContextMenuItem intent="danger">
              <Trash2 data-slot="icon" />
              <ContextMenuLabel>delete</ContextMenuLabel>
            </ContextMenuItem>
          </ContextMenuSection>
        </ContextMenuContent>
      </ContextMenu>
    ),
  },
]
