import { useForm } from "@conform-to/react"
import { parseWithValibot } from "@conform-to/valibot"
import * as v from "valibot"
import { Button } from "@/components/button"
import { ConformRangeCalendar } from "@/components/conform-range-calendar"
import type { ComponentExample } from "./types"

const schema = v.object({
  // The hidden fieldset submits trip.start and trip.end.
  trip: v.pipe(
    v.object({
      start: v.pipe(v.string("Pick a start date"), v.nonEmpty("Pick a start date")),
      end: v.pipe(v.string("Pick an end date"), v.nonEmpty("Pick an end date")),
    }),
    v.check(({ start, end }) => end > start, "The trip has to last at least a day"),
  ),
})

const TripForm = () => {
  const [form, fields] = useForm({
    defaultValue: { trip: { start: "2026-03-02", end: "2026-03-02" } },
    onValidate({ formData }) {
      return parseWithValibot(formData, { schema })
    },
  })

  return (
    // biome-ignore lint/correctness/noRestrictedElements: documented exception — a form with no route action behind it. This demo validates and submits entirely in the browser (the gallery is a static site, so there is nothing to post to); in an app that has an action, this is <Form> from react-router. https://ui-lib.quebi.de/rules/no-raw-interactive-elements
    <form id={form.id} onSubmit={form.onSubmit} className="flex flex-col gap-4" noValidate>
      <ConformRangeCalendar
        field={fields.trip}
        label="Trip dates"
        description="Submitted as trip.start and trip.end."
      />
      <Button type="submit" size="sm">
        Submit
      </Button>
    </form>
  )
}

export const conformRangeCalendarExamples: ComponentExample[] = [
  {
    title: "Bound to a Conform form",
    description: "Pick a single day and submit to see the error wired from field metadata.",
    render: () => <TripForm />,
  },
]
