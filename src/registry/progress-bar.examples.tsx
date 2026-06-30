import { useEffect, useState } from "react"
import {
  ProgressBar,
  ProgressBarHeader,
  ProgressBarTrack,
  ProgressBarValue,
} from "@/components/progress-bar"
import type { ComponentExample } from "./types"

export const progressBarExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "A determinate bar with a header label and value.",
    render: () => (
      <ProgressBar value={65} aria-label="Uploading">
        <ProgressBarHeader>
          <span>Uploading</span>
          <ProgressBarValue />
        </ProgressBarHeader>
        <ProgressBarTrack />
      </ProgressBar>
    ),
  },
  {
    title: "Track only",
    description: "Just the bar, no header.",
    render: () => (
      <ProgressBar value={40} aria-label="Progress">
        <ProgressBarTrack />
      </ProgressBar>
    ),
  },
  {
    title: "Indeterminate",
    description: "An unknown-duration loading state.",
    render: () => (
      <ProgressBar isIndeterminate aria-label="Loading">
        <ProgressBarHeader>
          <span>Loading</span>
        </ProgressBarHeader>
        <ProgressBarTrack />
      </ProgressBar>
    ),
  },
  {
    title: "Animated",
    description: "Value driven over time to show the fill transition.",
    render: () => {
      const AnimatedExample = () => {
        const [value, setValue] = useState(0)
        useEffect(() => {
          const id = setInterval(() => {
            setValue((v) => (v >= 100 ? 0 : v + 10))
          }, 700)
          return () => clearInterval(id)
        }, [])
        return (
          <ProgressBar value={value} aria-label="Syncing">
            <ProgressBarHeader>
              <span>Syncing</span>
              <ProgressBarValue />
            </ProgressBarHeader>
            <ProgressBarTrack />
          </ProgressBar>
        )
      }
      return <AnimatedExample />
    },
  },
]
