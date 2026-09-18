import { Calendar, CreditCard, Plus, Settings, Users } from "lucide-react"
import {
  CommandMenu,
  CommandMenuDescription,
  CommandMenuFooter,
  CommandMenuItem,
  CommandMenuLabel,
  CommandMenuList,
  CommandMenuSearch,
  CommandMenuSection,
  CommandMenuShortcut,
} from "@/components/command-menu"
import { Kbd } from "@/components/keyboard"
import type { OgScene } from "./types"

/**
 * The palette open, with two sections in it. `isOpen` is the component's own
 * shape — a command menu is opened by a keystroke somewhere else in the app, so
 * it has never owned its own state.
 */
export const commandMenuOgScene: OgScene = {
  render: () => (
    <CommandMenu isOpen shortcut="k">
      <CommandMenuSearch placeholder="Type a command or search…" />
      <CommandMenuList>
        <CommandMenuSection label="Suggestions">
          <CommandMenuItem textValue="Calendar">
            <Calendar data-slot="icon" />
            <CommandMenuLabel>Calendar</CommandMenuLabel>
          </CommandMenuItem>
          <CommandMenuItem textValue="Search users">
            <Users data-slot="icon" />
            <CommandMenuLabel>Search users</CommandMenuLabel>
            <CommandMenuDescription>Team</CommandMenuDescription>
          </CommandMenuItem>
          <CommandMenuItem textValue="New project">
            <Plus data-slot="icon" />
            <CommandMenuLabel>New project</CommandMenuLabel>
            <CommandMenuShortcut>⌘N</CommandMenuShortcut>
          </CommandMenuItem>
        </CommandMenuSection>
        <CommandMenuSection label="Settings">
          <CommandMenuItem textValue="Billing">
            <CreditCard data-slot="icon" />
            <CommandMenuLabel>Billing</CommandMenuLabel>
          </CommandMenuItem>
          <CommandMenuItem textValue="Settings">
            <Settings data-slot="icon" />
            <CommandMenuLabel>Settings</CommandMenuLabel>
            <CommandMenuShortcut>⌘S</CommandMenuShortcut>
          </CommandMenuItem>
        </CommandMenuSection>
      </CommandMenuList>
      <CommandMenuFooter>
        Press <Kbd>↵</Kbd> to select, <Kbd>esc</Kbd> to close.
      </CommandMenuFooter>
    </CommandMenu>
  ),
}
