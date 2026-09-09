import { useForm } from "@conform-to/react"
import { parseWithValibot } from "@conform-to/valibot"
import * as v from "valibot"
import { Button } from "@/components/button"
import { ConformDatePicker } from "@/components/conform-date-picker"
import type { ComponentExample } from "./types"

const schema = v.object({
  // A date picker submits an ISO `YYYY-MM-DD` string; Conform coerces it to a Date.
  // Require it and check that it is not in the past.
  eventDate: v.pipe(
    v.date("Please pick an event date"),
    v.check(
      (d) => d >= new Date(new Date().toDateString()),
      "Event date can't be in the past",
    ),
  ),
})

const EventForm = () => {
  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithValibot(formData, { schema })
    },
  })

  return (
    // biome-ignore lint/correctness/noRestrictedElements: documented exception — a form with no route action behind it. This demo validates and submits entirely in the browser (the gallery is a static site, so there is nothing to post to); in an app that has an action, this is <Form> from react-router. https://ui-lib.quebi.de/rules/no-raw-interactive-elements
    <form
      id={form.id}
      onSubmit={form.onSubmit}
      className="flex w-full max-w-sm flex-col gap-4"
      noValidate
    >
      <ConformDatePicker field={fields.eventDate} label="Event date" />
      <Button type="submit" size="sm">
        Schedule
      </Button>
    </form>
  )
}

export const conformDatePickerExamples: ComponentExample[] = [
  {
    title: "Bound to a Conform form",
    description:
      "Submit with a past or empty date to see the validation error wired from field metadata.",
    render: () => <EventForm />,
  },
]
