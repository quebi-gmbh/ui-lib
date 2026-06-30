import { Calendar, CreditCard, Plus, Settings, User, Users } from "lucide-react"
import { useState } from "react"
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
import { Button } from "@/components/button"
import type { ComponentExample } from "./types"

const Palette = ({
  isOpen,
  onOpenChange,
  isPending,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  isPending?: boolean
}) => (
  <CommandMenu isOpen={isOpen} onOpenChange={onOpenChange} isPending={isPending} shortcut="k">
    <CommandMenuSearch placeholder="Type a command or search..." />
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
        <CommandMenuItem textValue="Profile">
          <User data-slot="icon" />
          <CommandMenuLabel>Profile</CommandMenuLabel>
          <CommandMenuShortcut>⌘P</CommandMenuShortcut>
        </CommandMenuItem>
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
      Press <kbd>↵</kbd> to select, <kbd>esc</kbd> to close.
    </CommandMenuFooter>
  </CommandMenu>
)

export const commandMenuExamples: ComponentExample[] = [
  {
    title: "Command palette",
    description:
      "Open with the button or press ⌘K. Sectioned results with icons, descriptions, and shortcut hints.",
    render: () => {
      const [isOpen, setIsOpen] = useState(false)
      return (
        <>
          <Button intent="outline" size="sm" onPress={() => setIsOpen(true)}>
            Open command menu (⌘K)
          </Button>
          <Palette isOpen={isOpen} onOpenChange={setIsOpen} />
        </>
      )
    },
  },
  {
    title: "Pending state",
    description: "Set `isPending` to swap the search icon for a spinner while results load.",
    render: () => {
      const [isOpen, setIsOpen] = useState(false)
      return (
        <>
          <Button intent="outline" size="sm" onPress={() => setIsOpen(true)}>
            Open (loading)
          </Button>
          <Palette isOpen={isOpen} onOpenChange={setIsOpen} isPending />
        </>
      )
    },
  },
]
