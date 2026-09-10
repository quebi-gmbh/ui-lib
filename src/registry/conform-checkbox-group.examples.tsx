import { useForm } from "@conform-to/react"
import { parseWithValibot } from "@conform-to/valibot"
import * as v from "valibot"
import { Button } from "@/components/button"
import { Checkbox } from "@/components/checkbox"
import { ConformCheckboxGroup } from "@/components/conform-checkbox-group"
import type { ComponentExample } from "./types"

const schema = v.object({
  // Every checked box submits under the same name, so the parsed value is an
  // array — and an empty group submits nothing, hence the default.
  channels: v.pipe(
    v.optional(v.array(v.picklist(["email", "sms", "push"])), () => []),
    v.minLength(1, "Pick at least one channel"),
  ),
})

const ChannelsForm = () => {
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
      <ConformCheckboxGroup
        field={fields.channels}
        label="Notify me by"
        description="At least one, as many as you like."
      >
        <Checkbox value="email">Email</Checkbox>
        <Checkbox value="sms">SMS</Checkbox>
        <Checkbox value="push">Push</Checkbox>
      </ConformCheckboxGroup>
      <Button type="submit" size="sm">
        Submit
      </Button>
    </form>
  )
}

export const conformCheckboxGroupExamples: ComponentExample[] = [
  {
    title: "Bound to a Conform form",
    description: "Submit with nothing checked to see the validation error wired from field metadata.",
    render: () => <ChannelsForm />,
  },
]
