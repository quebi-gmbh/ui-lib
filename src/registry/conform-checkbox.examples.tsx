import { useForm } from "@conform-to/react"
import { parseWithValibot } from "@conform-to/valibot"
import * as v from "valibot"
import { ConformCheckbox } from "@/components/conform-checkbox"
import { Button } from "@/components/button"
import type { ComponentExample } from "./types"

const schema = v.object({
  // A checkbox submits "on" when checked and nothing when unchecked. Coerce to
  // boolean, then require it to be true.
  terms: v.pipe(
    // An unchecked box submits nothing, so default the missing key to false —
    // otherwise valibot reports a generic "missing key" instead of the message below.
    v.optional(v.unknown(), () => false),
    v.transform((value) => value === "on" || value === true),
    v.check((checked) => checked, "You must accept the terms"),
  ),
})

const TermsForm = () => {
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
      <ConformCheckbox field={fields.terms} label="I accept the terms and conditions" />
      <Button type="submit" size="sm">
        Submit
      </Button>
    </form>
  )
}

export const conformCheckboxExamples: ComponentExample[] = [
  {
    title: "Bound to a Conform form",
    description: "Submit without checking to see the validation error wired from field metadata.",
    render: () => <TermsForm />,
  },
]
