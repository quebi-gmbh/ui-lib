import { useForm } from "@conform-to/react"
import { parseWithValibot } from "@conform-to/valibot"
import * as v from "valibot"
import { Button } from "@/components/button"
import { ConformTagField } from "@/components/conform-tag-field"
import type { ComponentExample } from "./types"

const schema = v.object({
  // TagField submits one hidden input holding the comma-joined tags, so the
  // schema splits it back into a list.
  topics: v.pipe(
    v.string(),
    v.transform((raw) => raw.split(",").filter(Boolean)),
    v.minLength(2, "At least two topics"),
    v.maxLength(5, "Five topics at most"),
  ),
})

const TopicsForm = () => {
  const [form, fields] = useForm({
    defaultValue: { topics: ["react", "forms"] },
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
      <ConformTagField
        field={fields.topics}
        label="Topics"
        placeholder="Type and press Enter"
        description="Enter, comma, or semicolon commits a tag."
      />
      <Button type="submit" size="sm">
        Submit
      </Button>
    </form>
  )
}

export const conformTagFieldExamples: ComponentExample[] = [
  {
    title: "Bound to a Conform form",
    description: "Remove a tag and submit to see the validation error wired from field metadata.",
    render: () => <TopicsForm />,
  },
]
