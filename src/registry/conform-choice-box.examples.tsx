import { useForm } from "@conform-to/react"
import { parseWithValibot } from "@conform-to/valibot"
import * as v from "valibot"
import { Button } from "@/components/button"
import { ChoiceBoxDescription, ChoiceBoxItem, ChoiceBoxLabel } from "@/components/choice-box"
import { ConformChoiceBox } from "@/components/conform-choice-box"
import type { ComponentExample } from "./types"

const PLANS = [
  { id: "starter", name: "Starter", hint: "One project, community support." },
  { id: "growth", name: "Growth", hint: "Ten projects, email support." },
  { id: "scale", name: "Scale", hint: "Unlimited projects, a phone number." },
]

const schema = v.object({
  // A single-select ChoiceBox submits one key, and an empty selection submits
  // nothing — hence the default before the check.
  plan: v.pipe(v.optional(v.string(), ""), v.nonEmpty("Pick a plan")),
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
      className="flex w-full max-w-md flex-col gap-4"
      noValidate
    >
      <ConformChoiceBox
        field={fields.plan}
        label="Plan"
        description="Cards, but a real form value."
        selectionMode="single"
        gap={2}
        items={PLANS}
      >
        {(plan) => (
          <ChoiceBoxItem id={plan.id} textValue={plan.name}>
            <ChoiceBoxLabel>{plan.name}</ChoiceBoxLabel>
            <ChoiceBoxDescription>{plan.hint}</ChoiceBoxDescription>
          </ChoiceBoxItem>
        )}
      </ConformChoiceBox>
      <Button type="submit" size="sm">
        Submit
      </Button>
    </form>
  )
}

export const conformChoiceBoxExamples: ComponentExample[] = [
  {
    title: "Bound to a Conform form",
    description: "Submit without choosing to see the validation error wired from field metadata.",
    render: () => <PlanForm />,
  },
]
