import { useForm } from "@conform-to/react"
import { parseWithValibot } from "@conform-to/valibot"
import * as v from "valibot"
import { Button } from "@/components/button"
import { ConformColorField } from "@/components/conform-color-field"
import type { ComponentExample } from "./types"

const schema = v.object({
  accent: v.pipe(
    v.string("Pick a colour"),
    v.hexColor("That is not a hex colour"),
    v.check((hex) => hex.toUpperCase() !== "#FFFFFF", "White is already the background"),
  ),
})

const AccentForm = () => {
  const [form, fields] = useForm({
    defaultValue: { accent: "#0EA5E9" },
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
      <ConformColorField
        field={fields.accent}
        label="Accent colour"
        description="A hex value; the visible input is the form control."
      />
      <Button type="submit" size="sm">
        Submit
      </Button>
    </form>
  )
}

export const conformColorFieldExamples: ComponentExample[] = [
  {
    title: "Bound to a Conform form",
    description: "Type #FFFFFF and submit to see the validation error wired from field metadata.",
    render: () => <AccentForm />,
  },
]
