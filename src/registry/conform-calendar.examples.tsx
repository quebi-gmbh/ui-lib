import { useForm } from "@conform-to/react"
import { parseWithValibot } from "@conform-to/valibot"
import * as v from "valibot"
import { Button } from "@/components/button"
import { ConformCalendar } from "@/components/conform-calendar"
import type { ComponentExample } from "./types"

const schema = v.object({
  // The hidden input carries an ISO YYYY-MM-DD string.
  visitOn: v.pipe(
    v.string("Pick a date"),
    v.nonEmpty("Pick a date"),
    v.check((iso) => new Date(iso).getUTCDay() !== 0, "We are closed on Sundays"),
  ),
})

const VisitForm = () => {
  const [form, fields] = useForm({
    defaultValue: { visitOn: "2026-03-02" },
    onValidate({ formData }) {
      return parseWithValibot(formData, { schema })
    },
  })

  return (
    // biome-ignore lint/correctness/noRestrictedElements: documented exception — a form with no route action behind it. This demo validates and submits entirely in the browser (the gallery is a static site, so there is nothing to post to); in an app that has an action, this is <Form> from react-router. https://ui-lib.quebi.de/rules/no-raw-interactive-elements
    <form id={form.id} onSubmit={form.onSubmit} className="flex flex-col gap-4" noValidate>
      <ConformCalendar
        field={fields.visitOn}
        label="Visit on"
        description="An always-visible calendar; reach for conform-date-picker otherwise."
      />
      <Button type="submit" size="sm">
        Submit
      </Button>
    </form>
  )
}

export const conformCalendarExamples: ComponentExample[] = [
  {
    title: "Bound to a Conform form",
    description: "Pick a Sunday and submit to see the error wired from field metadata.",
    render: () => <VisitForm />,
  },
]
