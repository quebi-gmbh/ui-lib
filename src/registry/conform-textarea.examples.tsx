import { useForm } from "@conform-to/react"
import { parseWithValibot } from "@conform-to/valibot"
import * as v from "valibot"
import { Button } from "@/components/button"
import { ConformTextarea } from "@/components/conform-textarea"
import type { ComponentExample } from "./types"

const schema = v.object({
  bio: v.pipe(
    v.string("Tell us something"),
    v.minLength(20, "At least 20 characters, please"),
    v.maxLength(280, "280 characters at most"),
  ),
})

const BioForm = () => {
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
      <ConformTextarea
        field={fields.bio}
        label="Short bio"
        placeholder="What do you work on?"
        description="Shown on your public profile."
        rows={4}
      />
      <Button type="submit" size="sm">
        Submit
      </Button>
    </form>
  )
}

export const conformTextareaExamples: ComponentExample[] = [
  {
    title: "Bound to a Conform form",
    description: "Submit a short bio to see the length error wired from field metadata.",
    render: () => <BioForm />,
  },
]
