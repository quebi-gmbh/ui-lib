import { useForm } from "@conform-to/react"
import { parseWithZod } from "@conform-to/zod/v4"
import { z } from "zod"
import { Button } from "@/components/button"
import { ConformDatePicker } from "@/components/conform-date-picker"
import type { ComponentExample } from "./types"

const schema = z.object({
  // A date picker submits an ISO `YYYY-MM-DD` string. Require it and check that
  // it is not in the past.
  eventDate: z.coerce
    .date({ error: "Please pick an event date" })
    .refine((d) => d >= new Date(new Date().toDateString()), "Event date can't be in the past"),
})

const EventForm = () => {
  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithZod(formData, { schema })
    },
  })

  return (
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
