import { useState } from "react"
import { FileTrigger } from "@/components/file-trigger"
import type { ComponentExample } from "./types"

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-wrap items-center gap-3">{children}</div>
)

export const fileTriggerExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "Opens the native file picker. Defaults to the outline intent.",
    render: () => <FileTrigger />,
  },
  {
    title: "Intents",
    description: "Mirrors the quebi Button intents.",
    render: () => (
      <Row>
        <FileTrigger intent="primary" />
        <FileTrigger intent="secondary" />
        <FileTrigger intent="outline" />
        <FileTrigger intent="ghost" />
      </Row>
    ),
  },
  {
    title: "Multiple files",
    description: "Allow selecting more than one file at once.",
    render: () => <FileTrigger allowsMultiple />,
  },
  {
    title: "Directory & camera",
    description: "Swaps the glyph based on what the picker accepts.",
    render: () => (
      <Row>
        <FileTrigger acceptDirectory />
        <FileTrigger defaultCamera="environment" />
      </Row>
    ),
  },
  {
    title: "Custom label",
    description: "Pass children to override the default label.",
    render: () => <FileTrigger intent="primary">Upload avatar</FileTrigger>,
  },
  {
    title: "Pending",
    description: "Shows the quebi Loader while a file is processing.",
    render: () => (
      <FileTrigger isPending intent="primary">
        Uploading
      </FileTrigger>
    ),
  },
  {
    title: "Disabled",
    render: () => <FileTrigger isDisabled />,
  },
  {
    title: "Controlled selection",
    description: "Read the selected files via onSelect.",
    render: () => {
      const [name, setName] = useState<string | null>(null)
      return (
        <div className="flex flex-col items-start gap-2">
          <FileTrigger
            intent="primary"
            onSelect={(files) => {
              const list = files ? Array.from(files) : []
              setName(list[0]?.name ?? null)
            }}
          >
            Choose a file
          </FileTrigger>
          <span className="text-sm text-quebi-fg-muted">
            {name ? `Selected: ${name}` : "No file selected"}
          </span>
        </div>
      )
    },
  },
]
