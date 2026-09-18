import { useForm } from "@conform-to/react"
import { parseWithValibot } from "@conform-to/valibot"
import * as v from "valibot"
import { Button } from "@/components/button"
import { ConformMonthPicker } from "@/components/conform-month-picker"
import type { ComponentExample } from "./types"

const schema = v.object({
  // The hidden input carries an ISO YYYY-MM-DD string on the first of the month.
  reportOn: v.pipe(
    v.string("Pick a month"),
    v.nonEmpty("Pick a month"),
    v.check((iso) => !iso.endsWith("-12-01"), "December closes for reporting"),
  ),
})

const ReportForm = () => {
  const [form, fields] = useForm({
    defaultValue: { reportOn: "2026-03-01" },
    onValidate({ formData }) {
      return parseWithValibot(formData, { schema })
    },
  })

  return (
    // biome-ignore lint/correctness/noRestrictedElements: documented exception — a form with no route action behind it. This demo validates and submits entirely in the browser (the gallery is a static site, so there is nothing to post to); in an app that has an action, this is <Form> from react-router. https://ui-lib.quebi.de/rules/no-raw-interactive-elements
    <form id={form.id} onSubmit={form.onSubmit} className="flex flex-col gap-4" noValidate>
      <ConformMonthPicker
        field={fields.reportOn}
        label="Reporting month"
        description="Submitted as the first of the month; slice(0, 7) if your API wants 2026-03."
      />
      <Button type="submit" size="sm">
        Submit
      </Button>
    </form>
  )
}

export const conformMonthPickerExamples: ComponentExample[] = [
  {
    title: "Bound to a Conform form",
    description: "Pick December and submit to see the error wired from field metadata.",
    render: () => <ReportForm />,
  },
]
