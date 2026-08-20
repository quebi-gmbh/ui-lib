import { useForm } from "@conform-to/react"
import { parseWithValibot } from "@conform-to/valibot"
import * as v from "valibot"
import { ConformDaySchedule } from "@/components/conform-day-schedule"
import type { DaySpan } from "@/components/day-schedule"
import { Button } from "@/components/button"
import type { ComponentExample } from "./types"

const spanSchema = v.object({
  id: v.string(),
  label: v.string(),
  start: v.number(),
  end: v.number(),
})

const schema = v.object({
  // The schedule submits a JSON string, so parse it before validating the spans
  // themselves. A malformed payload fails here rather than throwing.
  agenda: v.pipe(
    v.string(),
    v.transform((value) => {
      try {
        return JSON.parse(value) as unknown
      } catch {
        return null
      }
    }),
    v.check((value) => value !== null, "Could not read the schedule"),
    v.array(spanSchema),
    v.check(
      (spans) => spans.reduce((sum, s) => sum + (s.end - s.start), 0) <= 480,
      "Keep the day under 8 hours in total",
    ),
  ),
})

const AgendaForm = () => {
  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithValibot(formData, { schema })
    },
  })

  const defaultSpans: DaySpan[] = [
    { id: "focus", label: "focus", start: 540, end: 720 },
    { id: "standup", label: "standup", start: 600, end: 630 },
    { id: "workshop", label: "workshop", start: 780, end: 1020 },
  ]

  return (
    <form
      id={form.id}
      onSubmit={form.onSubmit}
      className="flex w-full max-w-md flex-col gap-4"
      noValidate
    >
      <ConformDaySchedule
        field={fields.agenda}
        label="Tomorrow's agenda"
        defaultSpans={defaultSpans}
        height={420}
      />
      <Button type="submit" size="sm" className="self-start">
        Save agenda
      </Button>
    </form>
  )
}

export const conformDayScheduleExamples: ComponentExample[] = [
  {
    title: "Bound to a Conform form",
    description:
      "The spans submit as JSON. Drag the workshop span longer to push the day past 8 hours and see the validation error.",
    render: () => <AgendaForm />,
  },
]
