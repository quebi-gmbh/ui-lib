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
          actions
        </Button>
        <MenuContent placement="bottom start">
          <MenuItem>duplicate</MenuItem>
          <MenuItem>archive</MenuItem>
          <MenuSeparator />
          <MenuItem intent="danger">delete</MenuItem>
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
          filter by status
        </Button>
        <MenuContent placement="bottom start" selectionMode="single">
          <MenuSection label="Plans">
            <MenuItem id="live">live</MenuItem>
            <MenuItem id="draft">draft</MenuItem>
            <MenuItem id="archived">archived</MenuItem>
          </MenuSection>
          <MenuSeparator />
          <MenuSection label="Devices">
            <MenuItem id="in-stock">in stock</MenuItem>
            <MenuItem id="low-stock">low stock</MenuItem>
            <MenuItem id="out-of-stock">out of stock</MenuItem>
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
          share
        </Button>
        <MenuContent placement="bottom start" className="min-w-52">
          <MenuItem>
            <Copy data-slot="icon" />
            <MenuLabel>copy link</MenuLabel>
            <MenuShortcut>⌘C</MenuShortcut>
          </MenuItem>
          <MenuItem>
            <Share2 data-slot="icon" />
            <MenuLabel>share</MenuLabel>
            <MenuShortcut>⌘S</MenuShortcut>
          </MenuItem>
          <MenuItem>
            <UserPlus data-slot="icon" />
            <MenuLabel>add people</MenuLabel>
          </MenuItem>
          <MenuSeparator />
          <MenuItem intent="danger">
            <Trash2 data-slot="icon" />
            <MenuLabel>delete</MenuLabel>
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
          account
        </Button>
        <MenuContent placement="bottom start" className="min-w-64">
          <MenuHeader separator>Signed in as Max</MenuHeader>
          <MenuItem>
            <Settings data-slot="icon" />
            <MenuLabel>settings</MenuLabel>
            <MenuDescription>Manage your profile and preferences</MenuDescription>
          </MenuItem>
          <MenuSeparator />
          <MenuItem intent="danger">
            <LogOut data-slot="icon" />
            <MenuLabel>sign out</MenuLabel>
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
        <MenuTrigger className="border border-quebi-rule px-3 py-1.5 font-medium text-quebi-fg text-sm transition-colors duration-150 hover:bg-quebi-raised">
          more
        </MenuTrigger>
        <MenuContent placement="bottom start" className="min-w-48">
          <MenuItem>edit</MenuItem>
          <MenuSubMenu>
            <MenuItem>move to…</MenuItem>
            <MenuContent>
              <MenuItem>inbox</MenuItem>
              <MenuItem>projects</MenuItem>
              <MenuItem>archive</MenuItem>
            </MenuContent>
          </MenuSubMenu>
          <MenuSeparator />
          <MenuItem intent="danger">delete</MenuItem>
        </MenuContent>
      </Menu>
    ),
  },
]
