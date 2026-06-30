import { useForm } from "@conform-to/react"
import { parseWithZod } from "@conform-to/zod/v4"
import { z } from "zod"
import { Button } from "@/components/button"
import { ConformNumberField } from "@/components/conform-number-field"
import type { ComponentExample } from "./types"

const schema = z.object({
  // A number field submits a string; coerce it, then require it in range.
  quantity: z.number({ message: "Quantity is required" }).min(1, "Order at least 1").max(99, "Max 99"),
})

const QuantityForm = () => {
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
      <ConformNumberField
        field={fields.quantity}
        label="Quantity"
        description="How many units to order (1–99)."
      />
      <Button type="submit" size="sm">
        Submit
      </Button>
    </form>
  )
}

export const conformNumberFieldExamples: ComponentExample[] = [
  {
    title: "Bound to a Conform form",
    description: "Submit out of range to see the validation error wired from field metadata.",
    render: () => <QuantityForm />,
  },
]
