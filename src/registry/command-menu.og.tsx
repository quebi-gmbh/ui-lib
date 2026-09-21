import { Calendar, Plus, Users } from "lucide-react"
import {
  CommandMenu,
  CommandMenuDescription,
  CommandMenuItem,
  CommandMenuLabel,
  CommandMenuList,
  CommandMenuSearch,
  CommandMenuSection,
  CommandMenuShortcut,
} from "@/components/command-menu"
import type { OgScene } from "./types"

/**
 * The palette open, with one section in it. `isOpen` is the component's own
 * shape — a command menu is opened by a keystroke somewhere else in the app, so
 * it has never owned its own state.
 *
 * One section, three commands and no footer, at a scale that carries the `⌘N`
 * chip: that shortcut is `text-[10.5px]`, the smallest thing in the palette, so
 * it is what decides how big the whole surface has to be, and at 1.75 the rest
 * of it has to fit between the frame's two bands. Seven rows under two section
 * labels do not; the second section said nothing the first one had not, and the
 * footer's `Press ↵ to select` is a caption on a picture nobody is pressing
 * anything in.
 */
export const commandMenuOgScene: OgScene = {
  scale: 1.75,
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
      </CommandMenuList>
    </CommandMenu>
  ),
}
