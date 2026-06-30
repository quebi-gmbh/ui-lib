import { useForm } from "@conform-to/react"
import { parseWithZod } from "@conform-to/zod/v4"
import { useListData } from "react-stately"
import { z } from "zod"
import { Button } from "@/components/button"
import { ConformColorSwatchPicker } from "@/components/conform-color-swatch-picker"
import type { ComponentExample } from "./types"

const schema = z.object({
  // The picker submits a comma-joined string of color keys. Split it back into
  // an array, then require at least one selection.
  colors: z
    .preprocess(
      (v) =>
        typeof v === "string"
          ? v
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
      z.array(z.string()),
    )
    .refine((arr) => arr.length > 0, "Pick at least one color"),
})

const ColorsForm = () => {
  const colorList = useListData<{ id: number; name: string }>({
    initialItems: [{ id: 1, name: "teal" }],
  })

  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithZod(formData, { schema })
    },
  })

  return (
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
      return parseWithZod(formData, { schema })
    },
  })

  return (
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
