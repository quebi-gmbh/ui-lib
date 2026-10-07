import { LinkToggleGroup } from "@/components/link-toggle-group"
import type { ComponentExample } from "./types"

export const linkToggleGroupExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "Each segment is a link; the current value takes the selected tint.",
    render: () => (
      <LinkToggleGroup
        ariaLabel="Calendar range"
        current="week"
        options={[
          { value: "day", label: "day", href: "#day" },
          { value: "week", label: "week", href: "#week" },
          { value: "month", label: "month", href: "#month" },
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
          { value: "list", label: "list", href: "#list" },
          { value: "board", label: "board", href: "#board" },
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
          { value: "all", label: "all", href: "#all" },
          { value: "open", label: "open", href: "#open" },
          { value: "closed", label: "closed", href: "#closed" },
        ]}
      />
    ),
  },
]
