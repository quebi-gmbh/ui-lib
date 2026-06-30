import { useState } from "react"
import { Button, FileTrigger } from "react-aria-components"
import { DropZone } from "@/components/drop-zone"
import type { ComponentExample } from "./types"

export const dropZoneExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "Drag a file or item over the area to see the drop-target highlight.",
    render: () => (
      <DropZone className="w-80">Drop files here</DropZone>
    ),
  },
  {
    title: "With file trigger",
    description: "Combine with a FileTrigger so users can also browse for a file.",
    render: () => {
      const WithTrigger = () => {
        const [fileName, setFileName] = useState<string | null>(null)
        return (
          <DropZone
            className="w-80 flex-col gap-3"
            onDrop={async (e) => {
              const item = e.items.find((i) => i.kind === "file")
              if (item && item.kind === "file") {
                setFileName(item.name)
              }
            }}
          >
            <span>{fileName ? `Selected: ${fileName}` : "Drag a file here, or"}</span>
            <FileTrigger onSelect={(files) => setFileName(files?.[0]?.name ?? null)}>
              <Button className="rounded-quebi-sm border border-cyan-500/20 px-3 py-1.5 text-sm text-quebi-brand transition-colors duration-150 hover:bg-quebi-brand/10 data-[focus-visible]:ring-2 data-[focus-visible]:ring-quebi-brand/50 data-[focus-visible]:ring-offset-2 data-[focus-visible]:ring-offset-quebi-bg">
                Browse
              </Button>
            </FileTrigger>
          </DropZone>
        )
      }
      return <WithTrigger />
    },
  },
]
