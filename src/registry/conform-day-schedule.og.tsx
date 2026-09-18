import { ConformDaySchedule } from "@/components/conform-day-schedule"
import type { DaySpan } from "@/components/day-schedule"
import { OgForm } from "./og-scene"
import type { OgScene } from "./types"

const SPANS: DaySpan[] = [
  { id: "morning", label: "morning shift", start: 360, end: 720, tone: "brand" },
  { id: "evening", label: "evening shift", start: 840, end: 1200, tone: "cyan" },
]

export const conformDayScheduleOgScene: OgScene = {
  scale: 1.3,
  render: () => (
    <OgForm<{ agenda: string }> className="w-96">
      {(fields) => (
        <ConformDaySchedule
          field={fields.agenda}
          label="Tomorrow's agenda"
          defaultSpans={SPANS}
          height={280}
        />
      )}
    </OgForm>
  ),
}
