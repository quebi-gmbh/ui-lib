import { useForm } from "@conform-to/react"
import { parseWithZod } from "@conform-to/zod/v4"
import { z } from "zod"
import { ConformCheckbox } from "@/components/conform-checkbox"
import { Button } from "@/components/button"
import type { ComponentExample } from "./types"

const schema = z.object({
  // A checkbox submits "on" when checked and nothing when unchecked. Coerce to
  // boolean, then require it to be true.
  terms: z
    .preprocess((v) => v === "on" || v === true, z.boolean())
    .refine((v) => v, "You must accept the terms"),
})

const TermsForm = () => {
  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithZod(formData, { schema })
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
