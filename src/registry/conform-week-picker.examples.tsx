import { useForm } from "@conform-to/react"
import { parseWithValibot } from "@conform-to/valibot"
import * as v from "valibot"
import { Button } from "@/components/button"
import { ConformWeekPicker } from "@/components/conform-week-picker"
import type { ComponentExample } from "./types"

const schema = v.object({
  // The hidden fieldset submits deliveryWeek.start and deliveryWeek.end.
  deliveryWeek: v.pipe(
    v.object({
      start: v.pipe(v.string("Pick a week"), v.nonEmpty("Pick a week")),
      end: v.pipe(v.string("Pick a week"), v.nonEmpty("Pick a week")),
    }),
    v.check(
      ({ start, end }) => start.slice(0, 7) === end.slice(0, 7),
      "A delivery week has to sit inside one month",
    ),
  ),
})

const DeliveryForm = () => {
  const [form, fields] = useForm({
    defaultValue: { deliveryWeek: { start: "2026-03-02", end: "2026-03-08" } },
    onValidate({ formData }) {
      return parseWithValibot(formData, { schema })
    },
  })

  return (
    // biome-ignore lint/correctness/noRestrictedElements: documented exception — a form with no route action behind it. This demo validates and submits entirely in the browser (the gallery is a static site, so there is nothing to post to); in an app that has an action, this is <Form> from react-router. https://ui-lib.quebi.de/rules/no-raw-interactive-elements
    <form id={form.id} onSubmit={form.onSubmit} className="flex flex-col gap-4" noValidate>
      <ConformWeekPicker
        field={fields.deliveryWeek}
        label="Delivery week"
        description="Submitted as deliveryWeek.start and deliveryWeek.end — two ISO dates, not a week token."
      />
      <Button type="submit" size="sm">
        Submit
      </Button>
    </form>
  )
}

export const conformWeekPickerExamples: ComponentExample[] = [
  {
    title: "Bound to a Conform form",
    description: "Pick a week that straddles two months and submit to see the error wired from field metadata.",
    render: () => <DeliveryForm />,
  },
]
