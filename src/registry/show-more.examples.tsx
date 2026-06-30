import { useState } from "react"
import { ShowMore } from "@/components/show-more"
import type { ComponentExample } from "./types"

export const showMoreExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "A horizontal hairline with a centered toggle pill.",
    render: () => <ShowMore>Show more</ShowMore>,
  },
  {
    title: "Controlled selection",
    description: "Toggle the selected state to swap the label and reveal content.",
    render: function ControlledShowMore() {
      const [open, setOpen] = useState(false)
      return (
        <div className="w-full">
          <p className="text-quebi-fg-muted text-sm">First line is always visible.</p>
          {open && (
            <p className="text-quebi-fg-muted text-sm">
              Extra detail revealed once expanded.
            </p>
          )}
          <ShowMore isSelected={open} onChange={setOpen}>
            {open ? "Show less" : "Show more"}
          </ShowMore>
        </div>
      )
    },
  },
  {
    title: "As text",
    description: "Render a plain muted label instead of an interactive pill.",
    render: () => <ShowMore as="text" text="12 more replies" />,
  },
  {
    title: "Vertical",
    description: "A vertical rule with the toggle centered between two columns.",
    render: () => (
      <div className="flex h-32 items-stretch gap-2">
        <div className="flex flex-1 items-center justify-center text-quebi-fg-muted text-sm">
          Left
        </div>
        <ShowMore orientation="vertical">More</ShowMore>
        <div className="flex flex-1 items-center justify-center text-quebi-fg-muted text-sm">
          Right
        </div>
      </div>
    ),
  },
  {
    title: "Disabled",
    render: () => <ShowMore isDisabled>Show more</ShowMore>,
  },
]
