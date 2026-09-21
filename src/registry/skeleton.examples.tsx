import { Card } from "@/components/card"
import { Skeleton } from "@/components/skeleton"
import type { ComponentExample } from "./types"

/**
 * "Repeated unit" and "Code block" are the two this site runs on:
 * `src/site/page-states.tsx` draws the component gallery and the source block
 * with exactly those shapes while their chunks are in flight. They are here
 * rather than only there because a fallback should be the shape of what
 * replaces it, and this file is what an agent copies out of
 * `/api/components/skeleton.json` — what is written here is what gets pasted.
 */

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
    title: "Repeated unit",
    description:
      "A list's fallback is its unit, repeated — heading, description, box — so the stack is roughly the height the content will be and nothing below it jumps when the content lands. One bar for a whole list tells the reader nothing about how much is coming.",
    render: () => (
      <div className="flex w-full max-w-lg flex-col gap-8">
        {[
          { title: "w-40", description: "w-3/4", body: "h-16" },
          { title: "w-56", description: "w-2/3", body: "h-24" },
        ].map((unit) => (
          <div key={unit.title}>
            <Skeleton className={`h-6 ${unit.title}`} />
            <Skeleton soft className={`mt-2 h-4 ${unit.description}`} />
            {/* The real card, with only its contents pulsing: the outline is
                already known, so it should not appear when the content does. */}
            <Card className="mt-4 items-center justify-center p-8">
              <Skeleton soft className={`w-full ${unit.body}`} />
            </Card>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Code block",
    description:
      "Lines of varying width and indentation, on the surface the code will land on. Widths come from a fixed list by index, never Math.random(): a prerendered page would otherwise bake one set of widths into its HTML and roll different ones at hydration.",
    render: () => {
      const widths = ["w-3/4", "w-1/2", "w-5/6", "w-2/3", "w-11/12", "w-1/3"]
      const indents = ["", "ml-4", "ml-4", "ml-8", "ml-4", ""]
      return (
        <Card className="w-full max-w-lg gap-2.5 bg-quebi-bg p-5">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton
              soft
              // biome-ignore lint/suspicious/noArrayIndexKey: placeholder lines have no identity beyond their position.
              key={i}
              className={`h-3.5 ${indents[i % indents.length]} ${widths[i % widths.length]}`}
            />
          ))}
        </Card>
      )
    },
  },
  {
    title: "Card",
    description: "A full card placeholder built from several skeletons.",
    render: () => (
      <div className="w-72 rounded-quebi-md border border-quebi-line/10 bg-quebi-bg p-4">
        <Skeleton className="mb-4 h-40 w-full rounded-quebi-sm" />
        <Skeleton className="mb-2 h-5 w-3/4" />
        <Skeleton soft className="mb-1.5 h-3 w-full" />
        <Skeleton soft className="h-3 w-5/6" />
      </div>
    ),
  },
]
