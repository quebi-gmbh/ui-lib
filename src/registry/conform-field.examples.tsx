import { useForm } from "@conform-to/react"
import { parseWithZod } from "@conform-to/zod/v4"
import { z } from "zod"
import { Button } from "@/components/button"
import { ConformField } from "@/components/conform-field"
import type { ComponentExample } from "./types"

const schema = z.object({
  email: z.string({ error: "Email is required" }).email("Enter a valid email address"),
})

const SignupForm = () => {
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
      <ConformField
        field={fields.email}
        label="Email"
        type="email"
        placeholder="you@example.com"
        description="We'll never share your email."
      />
      <Button type="submit" size="sm">
        Submit
      </Button>
    </form>
  )
}

export const conformFieldExamples: ComponentExample[] = [
  {
    title: "Bound to a Conform form",
    description: "Submit with an invalid or empty email to see the error wired from field metadata.",
    render: () => <SignupForm />,
  },
]
