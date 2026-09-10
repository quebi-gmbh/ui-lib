import { useForm } from "@conform-to/react"
import { parseWithValibot } from "@conform-to/valibot"
import * as v from "valibot"
import { Button } from "@/components/button"
import { ConformTimeField } from "@/components/conform-time-field"
import type { ComponentExample } from "./types"

const schema = v.object({
  // The hidden input carries Time#toString() — "09:30:00".
  opensAt: v.pipe(
    v.string("Pick a time"),
    v.nonEmpty("Pick a time"),
    v.check((value) => value >= "08:00:00", "We do not open before 08:00"),
  ),
})

const OpeningForm = () => {
  const [form, fields] = useForm({
    defaultValue: { opensAt: "09:00:00" },
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
      <ConformTimeField
        field={fields.opensAt}
        label="Opens at"
        description="Submitted through a hidden input — a named TimeField submits nothing on its own."
      />
      <Button type="submit" size="sm">
        Submit
      </Button>
    </form>
  )
}

export const conformTimeFieldExamples: ComponentExample[] = [
  {
    title: "Bound to a Conform form",
    description: "Set the time before 08:00 and submit to see the error wired from field metadata.",
    render: () => <OpeningForm />,
  },
]
