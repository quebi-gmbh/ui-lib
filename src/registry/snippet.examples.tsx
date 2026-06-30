import { Snippet } from "@/components/snippet"
import type { ComponentExample } from "./types"

export const snippetExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "A shell command with a $ prompt and a copy button.",
    render: () => <Snippet text="bun add @quebi/ui" />,
  },
  {
    title: "Without symbol",
    description: "Drop the prompt symbol for non-shell snippets.",
    render: () => <Snippet symbol="" text="npx shadcn@latest add snippet" />,
  },
  {
    title: "Custom symbol",
    description: "Any leading symbol works, e.g. a chevron.",
    render: () => <Snippet symbol="›" text="git commit -m 'feat: add snippet'" />,
  },
  {
    title: "Without copy button",
    description: "Display-only, no copy affordance.",
    render: () => <Snippet hideCopy text="export QUEBI_TOKEN=••••••••" />,
  },
  {
    title: "Long command",
    description: "Overflowing content scrolls horizontally inside the surface.",
    render: () => (
      <Snippet text="docker run -d --name quebi -p 8080:8080 -e NODE_ENV=production ghcr.io/quebi/app:latest" />
    ),
  },
]
