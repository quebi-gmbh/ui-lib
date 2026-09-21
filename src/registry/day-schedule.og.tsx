import { DaySchedule, type DaySpan } from "@/components/day-schedule"
import type { OgScene } from "./types"

/** Two shifts on one day, in minutes from midnight. */
const SPANS: DaySpan[] = [
  { id: "morning", label: "morning shift", start: 360, end: 720, tone: "brand" },
  { id: "evening", label: "evening shift", start: 840, end: 1200, tone: "cyan" },
]

/**
 * A quarter of the stage's width, magnified twice over.
 *
 * The axis labels are the smallest type in the library — `text-[9.5px]`, set
 * sideways — so this is the one scene whose scale is chosen by a font size
 * rather than by how much room the component wants: at 2× they are 19px, and
 * the track has to be narrow and short enough that 2× still fits the stage. Six
 * hours between labels rather than the default two, because four times on an
 * axis is a scale and thirteen is a ruler — and `timeLabels="none"`, because
 * each span also carries its own start and end sideways down its edge, which at
 * this size is two more columns of digits crossing the two words that say what
 * the spans are.
 */
export const dayScheduleOgScene: OgScene = {
  scale: 2,
  render: () => (
    <div className="w-72">
      <DaySchedule
        defaultSpans={SPANS}
        height={180}
        tickInterval={360}
        timeLabels="none"
      />
    </div>
  ),
}
