import { ScrollArea } from "@/components/scroll-area"
import type { ComponentExample } from "./types"

const TAGS = [
  "design-systems",
  "react-aria",
  "tailwind",
  "accessibility",
  "typescript",
  "components",
  "tokens",
  "theming",
  "forms",
  "overlays",
  "navigation",
  "feedback",
]

export const scrollAreaExamples: ComponentExample[] = [
  {
    title: "Vertical",
    description: "A fixed-height container that scrolls vertically with a slim cyan scrollbar.",
    render: () => (
      <div className="h-56 w-full max-w-sm rounded-quebi-md border border-cyan-500/10">
        <ScrollArea orientation="vertical" className="p-4">
          <div className="flex flex-col gap-3">
            {Array.from({ length: 20 }, (_, i) => (
              <p key={i} className="text-sm text-white">
                Row {i + 1} — quebi keeps long lists tidy inside a bounded viewport.
              </p>
            ))}
          </div>
        </ScrollArea>
      </div>
    ),
  },
  {
    title: "Horizontal",
    description: "Set orientation to horizontal to scroll a row of items sideways.",
    render: () => (
      <div className="w-full max-w-md rounded-quebi-md border border-cyan-500/10">
        <ScrollArea orientation="horizontal" className="p-4">
          <div className="flex w-max gap-3">
            {TAGS.map((tag) => (
              <span
                key={tag}
                className="whitespace-nowrap rounded-quebi-sm border border-cyan-500/20 px-3 py-1.5 text-sm text-quebi-fg-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        </ScrollArea>
      </div>
    ),
  },
  {
    title: "Edge fade",
    description: "Enable scrollFade to softly mask content at the scrolled edges.",
    render: () => (
      <div className="h-56 w-full max-w-sm rounded-quebi-md border border-cyan-500/10">
        <ScrollArea orientation="vertical" scrollFade className="p-4">
          <div className="flex flex-col gap-3">
            {Array.from({ length: 20 }, (_, i) => (
              <p key={i} className="text-sm text-white">
                Item {i + 1} — the fade hints there is more above and below.
              </p>
            ))}
          </div>
        </ScrollArea>
      </div>
    ),
  },
  {
    title: "Scrollbar gutter",
    description: "scrollbarGutter reserves space so content doesn't shift when the bar appears.",
    render: () => (
      <div className="h-56 w-full max-w-sm rounded-quebi-md border border-cyan-500/10">
        <ScrollArea orientation="vertical" scrollbarGutter className="p-4">
          <div className="flex flex-col gap-3">
            {Array.from({ length: 16 }, (_, i) => (
              <p key={i} className="text-sm text-white">
                Line {i + 1} — the gutter keeps the right edge aligned.
              </p>
            ))}
          </div>
        </ScrollArea>
      </div>
    ),
  },
]
