import { LowTitle } from "@/components/low-title"
import { TextLink } from "@/components/text"
import type { ComponentExample } from "./types"

export const lowTitleExamples: ComponentExample[] = [
  {
    title: "Medium",
    description: "The default: display-m under a hairline, one sentence and one action in the side column.",
    frame: "none",
    render: () => (
      <LowTitle title="full-stack software development." action={<TextLink href="#">get started →</TextLink>}>
        We build web applications end to end: database, backend and interface.
      </LowTitle>
    ),
  },
  {
    title: "Extra large",
    description: "Outfit Thin at display-xl for gallery pages; the sentence and the action move to a footer row.",
    frame: "none",
    render: () => (
      <LowTitle size="xl" title="full-stack software." action={<TextLink href="#">talk to us →</TextLink>}>
        Two developers, Munich.
      </LowTitle>
    ),
  },
  {
    title: "Title only",
    description: "Both the sentence and the action are optional; the hairline and the low setting stay.",
    frame: "none",
    render: () => <LowTitle title="contact." />,
  },
]
