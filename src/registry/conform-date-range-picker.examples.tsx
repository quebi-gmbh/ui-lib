import { useForm } from "@conform-to/react"
import { parseWithValibot } from "@conform-to/valibot"
import * as v from "valibot"
import { Button } from "@/components/button"
import { ConformDateRangePicker } from "@/components/conform-date-range-picker"
import type { ComponentExample } from "./types"

const schema = v.object({
  // The hidden fieldset submits stay.start and stay.end, so the field is an object.
  stay: v.pipe(
    v.object({
      start: v.pipe(v.string("Pick a start date"), v.nonEmpty("Pick a start date")),
      end: v.pipe(v.string("Pick an end date"), v.nonEmpty("Pick an end date")),
    }),
    v.check(({ start, end }) => end > start, "The end date has to come after the start"),
  ),
})

const StayForm = () => {
  const [form, fields] = useForm({
    defaultValue: { stay: { start: "2026-03-02", end: "2026-03-02" } },
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
      <ConformDateRangePicker
        field={fields.stay}
        label="Stay"
        description="Submitted as stay.start and stay.end."
      />
      <Button type="submit" size="sm">
        Submit
      </Button>
    </form>
  )
}

export const conformDateRangePickerExamples: ComponentExample[] = [
  {
    title: "Bound to a Conform form",
    description: "Submit the same start and end date to see the error wired from field metadata.",
    render: () => <StayForm />,
  },
]
