import { Heading } from "@/components/heading"
import type { ComponentExample } from "./types"

const Stack = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col gap-3">{children}</div>
)

export const headingExamples: ComponentExample[] = [
  {
    title: "Levels",
    description: "Four semantic levels (h1–h4), each with its own size step.",
    render: () => (
      <Stack>
        <Heading level={1}>Match candidates in seconds</Heading>
        <Heading level={2}>Match candidates in seconds</Heading>
        <Heading level={3}>Match candidates in seconds</Heading>
        <Heading level={4}>Match candidates in seconds</Heading>
      </Stack>
    ),
  },
  {
    title: "Default",
    description: "Without a level, renders an h1.",
    render: () => <Heading>Welcome back</Heading>,
  },
  {
    title: "Custom className",
    description: "Override the color or weight via className.",
    render: () => (
      <Heading level={2} className="text-quebi-brand">
        Highlighted heading
      </Heading>
    ),
  },
]
