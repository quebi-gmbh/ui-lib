import { useState } from "react"
import { FileTrigger } from "@/components/file-trigger"
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
            {/* FileTrigger renders its own Button (intent="outline"), so pass the
                label as children — a <Button> child would nest a button inside a
                button and inherit the primary intent's hover glow. */}
            <FileTrigger size="sm" onSelect={(files) => setFileName(files?.[0]?.name ?? null)}>
              Browse
            </FileTrigger>
          </DropZone>
        )
      }
      return <WithTrigger />
    },
  },
]
