import { useState } from "react"
import type { Selection } from "react-aria-components"
import { TagField } from "@/components/tag-field"
import type { ComponentExample } from "./types"

export const tagFieldExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "Type a value and press Enter, comma, or semicolon to add a tag.",
    render: () => (
      <TagField
        label="Tags"
        placeholder="Add a tag…"
        className="w-80"
        aria-label="Tags"
      />
    ),
  },
  {
    title: "With default value",
    description: "Pre-filled chips that can be removed via the × button.",
    render: () => (
      <TagField
        label="Topics"
        defaultValue={["design", "engineering", "research"]}
        placeholder="Add a topic…"
        className="w-80"
        aria-label="Topics"
      />
    ),
  },
  {
    title: "With description",
    description: "A muted hint sits under the field.",
    render: () => (
      <TagField
        label="Skills"
        description="Separate entries with a comma or semicolon."
        defaultValue={["typescript", "react"]}
        placeholder="Add a skill…"
        className="w-80"
        aria-label="Skills"
      />
    ),
  },
  {
    title: "Required",
    description: "Blurring with no tags surfaces a validation error.",
    render: () => (
      <TagField
        label="Recipients"
        isRequired
        requiredMessage="Add at least one recipient"
        placeholder="Add a recipient…"
        className="w-80"
        aria-label="Recipients"
      />
    ),
  },
  {
    title: "Read-only",
    description: "Tags are visible but cannot be added or removed.",
    render: () => (
      <TagField
        label="Labels"
        isReadOnly
        defaultValue={["bug", "wontfix"]}
        className="w-80"
        aria-label="Labels"
      />
    ),
  },
  {
    title: "Disabled",
    description: "Non-interactive, dimmed state.",
    render: () => (
      <TagField
        label="Categories"
        isDisabled
        defaultValue={["news", "sports"]}
        className="w-80"
        aria-label="Categories"
      />
    ),
  },
  {
    title: "Controlled",
    render: () => {
      const ControlledExample = () => {
        const [value, setValue] = useState<Selection>(new Set(["alpha", "beta"]))
        const count = value === "all" ? 0 : value.size
        return (
          <div className="flex w-80 flex-col gap-2">
            <TagField
              label="Channels"
              value={value}
              onChange={setValue}
              placeholder="Add a channel…"
              aria-label="Channels"
            />
            <p className="text-[12px] text-quebi-fg-muted">{count} selected</p>
          </div>
        )
      }
      return <ControlledExample />
    },
  },
]
