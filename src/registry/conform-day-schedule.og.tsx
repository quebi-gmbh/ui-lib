import { ConformDaySchedule } from "@/components/conform-day-schedule"
import type { DaySpan } from "@/components/day-schedule"
import { OgForm } from "./og-scene"
import type { OgScene } from "./types"

/** One shift, because the label above it is half of what this scene is. */
const SPANS: DaySpan[] = [
  { id: "morning", label: "morning shift", start: 360, end: 720, tone: "brand" },
]

export const conformDayScheduleOgScene: OgScene = {
  scale: 1.9,
  render: () => (
    <OgForm<{ agenda: string }> className="w-72">
      {(fields) => (
        <ConformDaySchedule
          field={fields.agenda}
          label="Tomorrow's agenda"
          defaultSpans={SPANS}
          height={130}
          tickInterval={360}
          timeLabels="none"
        />
      )}
    </OgForm>
  ),
}
