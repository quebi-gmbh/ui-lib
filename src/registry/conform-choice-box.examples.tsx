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

const ADDONS = [
  { id: "backups", name: "Nightly backups", hint: "Thirty days of restore points." },
  { id: "sso", name: "SSO", hint: "SAML and SCIM for your directory." },
  { id: "audit", name: "Audit log", hint: "Every change, exportable." },
]

const planSchema = v.object({
  // A single-selection ChoiceBox always submits its name: the chosen key, or
  // `""` when nothing is chosen. Conform reads that empty string as absent, so
  // the message on `v.string()` is the one an empty submit shows — no `optional`
  // wrapper needed, and no valibot internal message leaking into the UI.
  plan: v.string("Pick a plan"),
})

const addonSchema = v.object({
  // A multiple-selection ChoiceBox submits the name once per selected key, and
  // nothing at all when the selection is empty. Conform parses an absent key
  // for an array field as `[]`, so `minLength` is what an empty submit reports.
  addons: v.pipe(v.array(v.string()), v.minLength(1, "Pick at least one add-on")),
})

const PlanForm = () => {
  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithValibot(formData, { schema: planSchema })
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

const AddonsForm = () => {
  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithValibot(formData, { schema: addonSchema })
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
        field={fields.addons}
        label="Add-ons"
        description="Submits the name once per selected card."
        selectionMode="multiple"
        gap={2}
        items={ADDONS}
        // Ctrl+A reports a sentinel rather than the keys; this is what turns it
        // back into a list.
        keys={ADDONS.map((addon) => addon.id)}
      >
        {(addon) => (
          <ChoiceBoxItem id={addon.id} textValue={addon.name}>
            <ChoiceBoxLabel>{addon.name}</ChoiceBoxLabel>
            <ChoiceBoxDescription>{addon.hint}</ChoiceBoxDescription>
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
  {
    title: "Multiple selection",
    description:
      "The same binding in multiple-selection mode: the parsed value is an array, and an empty submit reports the schema's own minLength message.",
    render: () => <AddonsForm />,
  },
]
