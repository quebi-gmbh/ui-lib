import { LinkToggleGroup } from "@/components/link-toggle-group"
import type { ComponentExample } from "./types"

export const linkToggleGroupExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "Each segment is a link; the current value is highlighted in brand teal.",
    render: () => (
      <LinkToggleGroup
        ariaLabel="Calendar range"
        current="week"
        options={[
          { value: "day", label: "Day", href: "#day" },
          { value: "week", label: "Week", href: "#week" },
          { value: "month", label: "Month", href: "#month" },
        ]}
      />
    ),
  },
  {
    title: "Two options",
    description: "Works for a simple binary view switch.",
    render: () => (
      <LinkToggleGroup
        ariaLabel="Layout"
        current="board"
        options={[
          { value: "list", label: "List", href: "#list" },
          { value: "board", label: "Board", href: "#board" },
        ]}
      />
    ),
  },
  {
    title: "First selected",
    description: "The active segment can be anywhere in the group.",
    render: () => (
      <LinkToggleGroup
        ariaLabel="Time frame"
        current="all"
        options={[
          { value: "all", label: "All", href: "#all" },
          { value: "open", label: "Open", href: "#open" },
          { value: "closed", label: "Closed", href: "#closed" },
        ]}
      />
    ),
  },
]
