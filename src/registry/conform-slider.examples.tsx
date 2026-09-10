import { useForm } from "@conform-to/react"
import { parseWithValibot } from "@conform-to/valibot"
import * as v from "valibot"
import { Button } from "@/components/button"
import { ConformSlider } from "@/components/conform-slider"
import type { ComponentExample } from "./types"

const schema = v.object({
  volume: v.pipe(
    v.string(),
    v.transform(Number),
    v.number(),
    v.minValue(10, "Turn it up — at least 10"),
  ),
})

const VolumeForm = () => {
  const [form, fields] = useForm({
    defaultValue: { volume: "40" },
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
      <ConformSlider field={fields.volume} label="Volume" maxValue={100} />
      <Button type="submit" size="sm">
        Submit
      </Button>
    </form>
  )
}

const rangeSchema = v.object({
  // Two thumbs means the name is submitted twice, so the parsed value is a pair.
  price: v.pipe(
    v.array(v.pipe(v.string(), v.transform(Number), v.number())),
    v.check(([low, high]) => high - low >= 20, "Keep the range at least 20 wide"),
  ),
})

const PriceForm = () => {
  const [form, fields] = useForm({
    defaultValue: { price: [25, 75] },
    onValidate({ formData }) {
      return parseWithValibot(formData, { schema: rangeSchema })
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
      <ConformSlider
        field={fields.price}
        label="Price range"
        description="Both thumbs submit under the same name."
        isRange
        maxValue={100}
      />
      <Button type="submit" size="sm">
        Submit
      </Button>
    </form>
  )
}

export const conformSliderExamples: ComponentExample[] = [
  {
    title: "Bound to a Conform form",
    description: "Drag below 10 and submit to see the validation error wired from field metadata.",
    render: () => <VolumeForm />,
  },
  {
    title: "Range",
    description: "Two thumbs under one name, parsed as an array.",
    render: () => <PriceForm />,
  },
]
