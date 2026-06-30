import { useEffect, useState } from "react"
import { ProgressCircle } from "@/components/progress-circle"
import type { ComponentExample } from "./types"

export const progressCircleExamples: ComponentExample[] = [
  {
    title: "Values",
    description: "Determinate progress at several fill levels.",
    render: () => (
      <div className="flex items-center gap-6">
        <ProgressCircle aria-label="25 percent" value={25} className="size-8" />
        <ProgressCircle aria-label="50 percent" value={50} className="size-8" />
        <ProgressCircle aria-label="75 percent" value={75} className="size-8" />
        <ProgressCircle aria-label="Complete" value={100} className="size-8" />
      </div>
    ),
  },
  {
    title: "Indeterminate",
    description: "Continuous spin for unknown-duration work.",
    render: () => (
      <div className="flex items-center gap-6">
        <ProgressCircle aria-label="Loading" isIndeterminate className="size-4" />
        <ProgressCircle aria-label="Loading" isIndeterminate className="size-8 text-quebi-brand" />
      </div>
    ),
  },
  {
    title: "Inline",
    description: "Inherits the surrounding font size next to text.",
    render: () => (
      <span className="inline-flex items-center gap-2 text-sm text-white">
        <ProgressCircle aria-label="Saving" isIndeterminate className="size-[1em]" />
        Saving changes…
      </span>
    ),
  },
  {
    title: "Animated",
    description: "A value that climbs from 0 to 100 and loops.",
    render: () => {
      const AnimatedExample = () => {
        const [value, setValue] = useState(0)
        useEffect(() => {
          const id = setInterval(() => {
            setValue((v) => (v >= 100 ? 0 : v + 5))
          }, 300)
          return () => clearInterval(id)
        }, [])
        return <ProgressCircle aria-label="Progress" value={value} className="size-10" />
      }
      return <AnimatedExample />
    },
  },
]
