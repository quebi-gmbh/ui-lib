import { Skeleton } from "@/components/skeleton"
import type { ComponentExample } from "./types"

export const skeletonExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "A single block placeholder. Set width and height with utility classes.",
    render: () => <Skeleton className="h-6 w-48" />,
  },
  {
    title: "Soft",
    description: "A fainter fill for nested or secondary placeholders.",
    render: () => (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton soft className="h-6 w-48" />
      </div>
    ),
  },
  {
    title: "Text lines",
    description: "Stack a few skeletons of varying width to suggest a paragraph.",
    render: () => (
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[92%]" />
        <Skeleton className="h-4 w-[80%]" />
        <Skeleton soft className="h-4 w-1/2" />
      </div>
    ),
  },
  {
    title: "Avatar with lines",
    description: "Mix a circle with text lines to mirror a list item or comment.",
    render: () => (
      <div className="flex items-center gap-4">
        <Skeleton className="size-12 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton soft className="h-3 w-24" />
        </div>
      </div>
    ),
  },
  {
    title: "Card",
    description: "A full card placeholder built from several skeletons.",
    render: () => (
      <div className="w-72 rounded-quebi-md border border-cyan-500/10 bg-quebi-bg p-4">
        <Skeleton className="mb-4 h-40 w-full rounded-quebi-sm" />
        <Skeleton className="mb-2 h-5 w-3/4" />
        <Skeleton soft className="mb-1.5 h-3 w-full" />
        <Skeleton soft className="h-3 w-5/6" />
      </div>
    ),
  },
]
