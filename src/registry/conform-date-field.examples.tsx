import { useForm } from "@conform-to/react"
import { parseWithValibot } from "@conform-to/valibot"
import * as v from "valibot"
import { Button } from "@/components/button"
import { ConformDateField } from "@/components/conform-date-field"
import type { ComponentExample } from "./types"

const schema = v.object({
  // A date field submits an ISO `YYYY-MM-DD` string; Conform coerces it to a Date.
  // Require it and check that it is not in the past.
  startDate: v.pipe(
    v.date("Please pick a start date"),
    v.check(
      (d) => d >= new Date(new Date().toDateString()),
      "Start date can't be in the past",
    ),
  ),
})

const BookingForm = () => {
  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithValibot(formData, { schema })
    },
  })

  return (
    <form
      id={form.id}
      onSubmit={form.onSubmit}
      className="flex w-full max-w-sm flex-col gap-4"
      noValidate
    >
      <ConformDateField field={fields.startDate} label="Start date" />
      <Button type="submit" size="sm">
        Book
      </Button>
    </form>
  )
}

export const conformDateFieldExamples: ComponentExample[] = [
  {
    title: "Bound to a Conform form",
    description: "Submit with a past or empty date to see the validation error wired from field metadata.",
    render: () => <BookingForm />,
  },
]
