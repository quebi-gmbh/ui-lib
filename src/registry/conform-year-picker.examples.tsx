import { useForm } from "@conform-to/react"
import { parseWithValibot } from "@conform-to/valibot"
import * as v from "valibot"
import { Button } from "@/components/button"
import { ConformYearPicker } from "@/components/conform-year-picker"
import type { ComponentExample } from "./types"

const schema = v.object({
  // The hidden input carries an ISO YYYY-MM-DD string on January 1.
  foundedIn: v.pipe(
    v.string("Pick a year"),
    v.nonEmpty("Pick a year"),
    v.check((iso) => Number(iso.slice(0, 4)) >= 1900, "We only go back to 1900"),
  ),
})

const CompanyForm = () => {
  const [form, fields] = useForm({
    defaultValue: { foundedIn: "2019-01-01" },
    onValidate({ formData }) {
      return parseWithValibot(formData, { schema })
    },
  })

  return (
    // biome-ignore lint/correctness/noRestrictedElements: documented exception — a form with no route action behind it. This demo validates and submits entirely in the browser (the gallery is a static site, so there is nothing to post to); in an app that has an action, this is <Form> from react-router. https://ui-lib.quebi.de/rules/no-raw-interactive-elements
    <form id={form.id} onSubmit={form.onSubmit} className="flex flex-col gap-4" noValidate>
      <ConformYearPicker
        field={fields.foundedIn}
        label="Founded in"
        description="Submitted as January 1 of the year, so it parses like any other date."
      />
      <Button type="submit" size="sm">
        Submit
      </Button>
    </form>
  )
}

export const conformYearPickerExamples: ComponentExample[] = [
  {
    title: "Bound to a Conform form",
    description: "Page back to a year before 1900 and submit to see the error wired from field metadata.",
    render: () => <CompanyForm />,
  },
]
