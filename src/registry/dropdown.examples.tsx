import { Settings, Trash2, User } from "lucide-react"
import { ListBox } from "@/components/list-box"
import {
  DropdownDescription,
  DropdownItem,
  DropdownKeyboard,
  DropdownLabel,
  DropdownSection,
  DropdownSeparator,
} from "@/components/dropdown"
import type { ComponentExample } from "./types"

/**
 * The dropdown primitives are rendered inside any react-aria collection
 * (Menu/Select/Combo Box/List Box). We host them in a ListBox here to preview
 * the quebi menu surface live — radius, hairline and `bg-quebi-elevated` all
 * come from ListBox itself, so only the grid, width and padding are set here.
 *
 * `shadow-none` is the one deliberate subtraction (task #140): these previews
 * are pinned open inside a card rather than floating over the page, so the
 * elevation shadow a real menu casts has nothing to sit above and reads as a
 * smudge around five stacked panels.
 */
const Surface = ({
  children,
  ...props
}: { children: React.ReactNode } & React.ComponentProps<typeof ListBox>) => (
  <ListBox
    className="grid w-64 grid-cols-[auto_1fr_1.5rem_0.5rem_auto] gap-y-0.5 p-1.5 shadow-none outline-none"
    {...props}
  >
    {children}
  </ListBox>
)

export const dropdownExamples: ComponentExample[] = [
  {
    title: "Items",
    description: "Plain items with hover and keyboard focus on the dark surface.",
    render: () => (
      <Surface aria-label="Actions" selectionMode="none">
        <DropdownItem>Profile</DropdownItem>
        <DropdownItem>Billing</DropdownItem>
        <DropdownItem>Team</DropdownItem>
        <DropdownItem>Subscription</DropdownItem>
      </Surface>
    ),
  },
  {
    title: "Selection",
    description: "Selected rows fill with brand teal and a check indicator.",
    render: () => (
      <Surface
        aria-label="View"
        selectionMode="single"
        defaultSelectedKeys={["board"]}
      >
        <DropdownItem id="list">List</DropdownItem>
        <DropdownItem id="board">Board</DropdownItem>
        <DropdownItem id="calendar">Calendar</DropdownItem>
      </Surface>
    ),
  },
  {
    title: "Icons & keyboard hints",
    description: "Items can carry a leading icon and a trailing shortcut.",
    render: () => (
      <Surface aria-label="Account" selectionMode="none">
        <DropdownItem textValue="Profile">
          <User data-slot="icon" />
          <DropdownLabel>Profile</DropdownLabel>
          <DropdownKeyboard>⌘P</DropdownKeyboard>
        </DropdownItem>
        <DropdownItem textValue="Settings">
          <Settings data-slot="icon" />
          <DropdownLabel>Settings</DropdownLabel>
          <DropdownKeyboard>⌘,</DropdownKeyboard>
        </DropdownItem>
      </Surface>
    ),
  },
  {
    title: "Descriptions",
    description: "A secondary line gives each item more context.",
    render: () => (
      <Surface aria-label="Plans" selectionMode="single" defaultSelectedKeys={["pro"]}>
        <DropdownItem id="free" textValue="Free">
          <DropdownLabel>Free</DropdownLabel>
          <DropdownDescription>For getting started.</DropdownDescription>
        </DropdownItem>
        <DropdownItem id="pro" textValue="Pro">
          <DropdownLabel>Pro</DropdownLabel>
          <DropdownDescription>For growing teams.</DropdownDescription>
        </DropdownItem>
      </Surface>
    ),
  },
  {
    title: "Sections, separator & intent",
    description: "Group with a titled section, divide with a separator, and flag destructive actions.",
    render: () => (
      <Surface aria-label="Workspace" selectionMode="none">
        <DropdownSection title="Workspace">
          <DropdownItem textValue="Members">
            <User data-slot="icon" />
            <DropdownLabel>Members</DropdownLabel>
          </DropdownItem>
          <DropdownItem textValue="Settings">
            <Settings data-slot="icon" />
            <DropdownLabel>Settings</DropdownLabel>
          </DropdownItem>
        </DropdownSection>
        <DropdownSeparator />
        <DropdownItem intent="danger" textValue="Delete workspace">
          <Trash2 data-slot="icon" />
          <DropdownLabel>Delete workspace</DropdownLabel>
        </DropdownItem>
      </Surface>
    ),
  },
]
