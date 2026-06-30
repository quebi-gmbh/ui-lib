import { useForm } from "@conform-to/react"
import { parseWithZod } from "@conform-to/zod/v4"
import { z } from "zod"
import { Button } from "@/components/button"
import { ConformSelect } from "@/components/conform-select"
import { SelectItem } from "@/components/select"
import type { ComponentExample } from "./types"

const schema = z.object({
  plan: z.enum(["free", "pro", "enterprise"], {
    message: "Please choose a plan",
  }),
})

const PlanForm = () => {
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
