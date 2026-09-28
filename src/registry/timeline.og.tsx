import { Check, Truck } from "lucide-react"
import { Timeline, TimelineItem, TimelineMarker, TimelineTitle } from "@/components/timeline"
import type { OgScene } from "./types"

/**
 * Four quarters of a roadmap across the stage: two done, one current, one
 * ahead behind a dashed connector — the axis, the markers and the dates at
 * their own precision are the whole idea, and they read at thumbnail size.
 * `now` is a fixed string, so the dashed span is the same every build.
 */
export const timelineOgScene: OgScene = {
  scale: 1.5,
  render: () => (
    <Timeline
      aria-label="Roadmap"
      orientation="horizontal"
      density="compact"
      now="2026-08-15"
      locale="en-GB"
      // A horizontal timeline is a scroll area and has no width of its own:
      // four compact 11rem columns, so nothing is left to scroll.
      className="w-176"
    >
      <TimelineItem date="2026-Q1" tone="success" marker={<TimelineMarker icon={<Check />} />}>
        <TimelineTitle>Rules</TimelineTitle>
      </TimelineItem>
      <TimelineItem date="2026-Q2" tone="success" marker={<TimelineMarker icon={<Check />} />}>
        <TimelineTitle>Calendars</TimelineTitle>
      </TimelineItem>
      <TimelineItem date="2026-Q3" tone="brand" marker={<TimelineMarker icon={<Truck />} />}>
        <TimelineTitle>Timeline</TimelineTitle>
      </TimelineItem>
      <TimelineItem date="2026-Q4" tone="muted" marker={<TimelineMarker variant="ring" />}>
        <TimelineTitle>Charts</TimelineTitle>
      </TimelineItem>
    </Timeline>
  ),
}
