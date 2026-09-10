import { useForm } from "@conform-to/react"
import { parseWithValibot } from "@conform-to/valibot"
import * as v from "valibot"
import { Button } from "@/components/button"
import { ConformSwitch } from "@/components/conform-switch"
import type { ComponentExample } from "./types"

const schema = v.object({
  // A switch submits "on" when it is on and nothing when it is off. Coerce to
  // boolean, then require it to be true.
  notifications: v.pipe(
    // An off switch submits nothing, so default the missing key to false —
    // otherwise valibot reports a generic "missing key" instead of the message below.
    v.optional(v.unknown(), () => false),
    v.transform((value) => value === "on" || value === true),
    v.check((on) => on, "Notifications have to be on to continue"),
  ),
})

const NotificationsForm = () => {
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
      <ConformSwitch
        field={fields.notifications}
        label="Email notifications"
        description="We only mail about things you asked for."
      />
      <Button type="submit" size="sm">
        Submit
      </Button>
    </form>
  )
}

export const conformSwitchExamples: ComponentExample[] = [
  {
    title: "Bound to a Conform form",
    description: "Submit with the switch off to see the validation error wired from field metadata.",
    render: () => <NotificationsForm />,
  },
]
