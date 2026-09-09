import { useForm } from "@conform-to/react"
import { parseWithValibot } from "@conform-to/valibot"
import { useListData } from "react-stately"
import * as v from "valibot"
import { Button } from "@/components/button"
import { ConformColorSwatchPicker } from "@/components/conform-color-swatch-picker"
import type { ComponentExample } from "./types"

const schema = v.object({
  // The picker submits a comma-joined string of color keys. Split it back into
  // an array, then require at least one selection.
  colors: v.pipe(
    v.unknown(),
    v.transform((value) =>
      typeof value === "string"
        ? value
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    ),
    v.minLength(1, "Pick at least one color"),
  ),
})

const ColorsForm = () => {
  const colorList = useListData<{ id: number; name: string }>({
    initialItems: [{ id: 1, name: "teal" }],
  })

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
      <ConformColorSwatchPicker
        field={fields.colors}
        list={colorList}
        label="Device colors"
        description="Select one or more colors. The selection is submitted as a list of keys."
      />
      <Button type="submit" size="sm">
        Submit
      </Button>
    </form>
  )
}

const EmptyForm = () => {
  const colorList = useListData<{ id: number; name: string }>({ initialItems: [] })

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
      <ConformColorSwatchPicker field={fields.colors} list={colorList} label="Device colors" />
      <Button type="submit" size="sm">
        Submit
      </Button>
    </form>
  )
}

export const conformColorSwatchPickerExamples: ComponentExample[] = [
  {
    title: "Bound to a Conform form",
    description: "Toggle swatches to build the selection; the value is mirrored into the form.",
    render: () => <ColorsForm />,
  },
  {
    title: "Validation",
    description: "Submit with nothing selected to see the error wired from field metadata.",
    render: () => <EmptyForm />,
  },
]
