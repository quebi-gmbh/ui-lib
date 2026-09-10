import { useForm } from "@conform-to/react"
import { parseWithValibot } from "@conform-to/valibot"
import * as v from "valibot"
import { Button } from "@/components/button"
import { ConformInputOTP } from "@/components/conform-input-otp"
import { InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/input-otp"
import type { ComponentExample } from "./types"

const schema = v.object({
  code: v.pipe(
    v.string("Enter the code"),
    v.length(6, "The code is six digits"),
    v.regex(/^\d+$/, "Digits only"),
  ),
})

const CodeForm = () => {
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
      <ConformInputOTP
        field={fields.code}
        label="Verification code"
        description="We sent it to your email."
        maxLength={6}
      >
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </ConformInputOTP>
      <Button type="submit" size="sm">
        Submit
      </Button>
    </form>
  )
}

export const conformInputOtpExamples: ComponentExample[] = [
  {
    title: "Bound to a Conform form",
    description: "Submit a partial code to see the validation error wired from field metadata.",
    render: () => <CodeForm />,
  },
]
