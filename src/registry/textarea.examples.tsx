import { useState } from "react"
import { Textarea } from "@/components/textarea"
import type { ComponentExample } from "./types"

const Col = ({ children }: { children: React.ReactNode }) => (
  <div className="flex w-full max-w-sm flex-col items-start gap-3">{children}</div>
)

export const textareaExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "A basic multi-line text input with a placeholder.",
    render: () => <Textarea aria-label="Message" placeholder="Write a message…" />,
  },
  {
    title: "States",
    description: "Default, invalid, and disabled.",
    render: () => (
      <Col>
        <Textarea aria-label="Default" placeholder="Default" />
        <Textarea aria-label="Invalid" placeholder="Invalid" defaultValue="Not quite right" aria-invalid />
        <Textarea aria-label="Disabled" placeholder="Disabled" disabled defaultValue="Can't edit this" />
      </Col>
    ),
  },
  {
    title: "Sizes",
    description:
      "xs, sm, and the default md — Input's three steps, so a textarea and the input beside it are set in the same type with the same inset. The min-height comes down with the size; the field still grows with its content.",
    render: () => (
      <Col>
        <Textarea size="xs" aria-label="Extra small" placeholder="xs" />
        <Textarea size="sm" aria-label="Small" placeholder="sm" />
        <Textarea aria-label="Medium" placeholder="md (default)" />
      </Col>
    ),
  },
  {
    title: "Controlled",
    description: "Tracks its value and shows a live character count.",
    render: () => {
      const ControlledExample = () => {
        const [value, setValue] = useState("")
        return (
          <Col>
            <Textarea
              aria-label="Bio"
              placeholder="Tell us about yourself…"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <span className="text-[12px] text-quebi-fg-muted">{value.length} characters</span>
          </Col>
        )
      }
      return <ControlledExample />
    },
  },
]
