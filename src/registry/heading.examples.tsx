import { Heading } from "@/components/heading"
import type { ComponentExample } from "./types"

const Stack = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col gap-3">{children}</div>
)

export const headingExamples: ComponentExample[] = [
  {
    title: "Levels",
    description: "Four semantic levels (h1–h4) on the display scale: display-l, display-s, title, and a light 18px.",
    render: () => (
      <Stack>
        <Heading level={1}>match candidates in seconds.</Heading>
        <Heading level={2}>match candidates in seconds.</Heading>
        <Heading level={3}>match candidates in seconds.</Heading>
        <Heading level={4}>match candidates in seconds.</Heading>
      </Stack>
    ),
  },
  {
    title: "Default",
    description: "Without a level, renders an h1.",
    render: () => <Heading>welcome back.</Heading>,
  },
  {
    title: "Custom className",
    description: "Override the size or weight via className.",
    render: () => (
      <Heading level={2} className="font-thin">
        a thinner section head.
      </Heading>
    ),
  },
]
