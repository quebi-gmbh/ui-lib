import { useForm } from "@conform-to/react"
import { parseWithValibot } from "@conform-to/valibot"
import * as v from "valibot"
import { Button } from "@/components/button"
import { ConformField } from "@/components/conform-field"
import type { ComponentExample } from "./types"

const schema = v.object({
  email: v.pipe(v.string("Email is required"), v.email("Enter a valid email address")),
})

const SignupForm = () => {
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
