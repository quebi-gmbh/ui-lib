import { Copy, LogOut, Settings, Share2, Trash2, UserPlus } from "lucide-react"
import { Button } from "@/components/button"
import {
  Menu,
  MenuContent,
  MenuDescription,
  MenuHeader,
  MenuItem,
  MenuLabel,
  MenuSection,
  MenuSeparator,
  MenuShortcut,
  MenuSubMenu,
  MenuTrigger,
} from "@/components/menu"
import type { ComponentExample } from "./types"

export const menuExamples: ComponentExample[] = [
  {
    title: "Row actions",
    description: "A trigger opens a menu of actions, with a danger intent for destructive ones.",
    render: () => (
      <Menu>
        <Button intent="outline" size="sm">
          Actions
        </Button>
        <MenuContent placement="bottom start">
          <MenuItem>Duplicate</MenuItem>
          <MenuItem>Archive</MenuItem>
          <MenuSeparator />
          <MenuItem intent="danger">Delete</MenuItem>
        </MenuContent>
      </Menu>
    ),
  },
  {
    title: "Sections",
    description: "Group related items under labelled sections divided by separators.",
    render: () => (
      <Menu>
        <Button intent="outline" size="sm">
          Filter by status
        </Button>
        <MenuContent placement="bottom start" selectionMode="single">
          <MenuSection label="Plans">
            <MenuItem id="live">Live</MenuItem>
            <MenuItem id="draft">Draft</MenuItem>
            <MenuItem id="archived">Archived</MenuItem>
          </MenuSection>
          <MenuSeparator />
          <MenuSection label="Devices">
            <MenuItem id="in-stock">In stock</MenuItem>
            <MenuItem id="low-stock">Low stock</MenuItem>
            <MenuItem id="out-of-stock">Out of stock</MenuItem>
          </MenuSection>
        </MenuContent>
      </Menu>
    ),
  },
  {
    title: "Icons and shortcuts",
    description: "Items can carry leading icons and trailing keyboard shortcut hints.",
    render: () => (
      <Menu>
        <Button intent="outline" size="sm">
          Share
        </Button>
        <MenuContent placement="bottom start" className="min-w-52">
          <MenuItem>
            <Copy data-slot="icon" />
            <MenuLabel>Copy link</MenuLabel>
            <MenuShortcut>⌘C</MenuShortcut>
          </MenuItem>
          <MenuItem>
            <Share2 data-slot="icon" />
            <MenuLabel>Share</MenuLabel>
            <MenuShortcut>⌘S</MenuShortcut>
          </MenuItem>
          <MenuItem>
            <UserPlus data-slot="icon" />
            <MenuLabel>Add people</MenuLabel>
          </MenuItem>
          <MenuSeparator />
          <MenuItem intent="danger">
            <Trash2 data-slot="icon" />
            <MenuLabel>Delete</MenuLabel>
            <MenuShortcut>⌫</MenuShortcut>
          </MenuItem>
        </MenuContent>
      </Menu>
    ),
  },
  {
    title: "Descriptions and header",
    description: "Items support two-line descriptions, and the menu can carry a header.",
    render: () => (
      <Menu>
        <Button intent="outline" size="sm">
          Account
        </Button>
        <MenuContent placement="bottom start" className="min-w-64">
          <MenuHeader separator>Signed in as Max</MenuHeader>
          <MenuItem>
            <Settings data-slot="icon" />
            <MenuLabel>Settings</MenuLabel>
            <MenuDescription>Manage your profile and preferences</MenuDescription>
          </MenuItem>
          <MenuSeparator />
          <MenuItem intent="danger">
            <LogOut data-slot="icon" />
            <MenuLabel>Sign out</MenuLabel>
          </MenuItem>
        </MenuContent>
      </Menu>
    ),
  },
  {
    title: "Plain text trigger and submenu",
    description:
      "Use `MenuTrigger` for an unstyled inline trigger, and `MenuSubMenu` to nest a submenu.",
    render: () => (
      <Menu>
        <MenuTrigger className="rounded-quebi-sm border border-cyan-500/20 px-3 py-1.5 text-sm text-white">
          More
        </MenuTrigger>
        <MenuContent placement="bottom start" className="min-w-48">
          <MenuItem>Edit</MenuItem>
          <MenuSubMenu>
            <MenuItem>Move to…</MenuItem>
            <MenuContent>
              <MenuItem>Inbox</MenuItem>
              <MenuItem>Projects</MenuItem>
              <MenuItem>Archive</MenuItem>
            </MenuContent>
          </MenuSubMenu>
          <MenuSeparator />
          <MenuItem intent="danger">Delete</MenuItem>
        </MenuContent>
      </Menu>
    ),
  },
]
