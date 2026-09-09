import { useForm } from "@conform-to/react"
import { parseWithValibot } from "@conform-to/valibot"
import * as v from "valibot"
import { Button } from "@/components/button"
import { ConformSelect } from "@/components/conform-select"
import { SelectItem } from "@/components/select"
import type { ComponentExample } from "./types"

const schema = v.object({
  plan: v.picklist(["free", "pro", "enterprise"], "Please choose a plan"),
})

const PlanForm = () => {
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
      <ConformSelect field={fields.plan} label="Plan">
        <SelectItem id="free">Free</SelectItem>
        <SelectItem id="pro">Pro</SelectItem>
        <SelectItem id="enterprise">Enterprise</SelectItem>
      </ConformSelect>
      <Button type="submit" size="sm">
        Submit
      </Button>
    </form>
  )
}

export const conformSelectExamples: ComponentExample[] = [
  {
    title: "Bound to a Conform form",
    description: "Submit without choosing a plan to see the validation error wired from field metadata.",
    render: () => <PlanForm />,
  },
]
