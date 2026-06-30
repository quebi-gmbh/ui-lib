import { getFormProps, useForm } from "@conform-to/react"
import { getValibotConstraint, parseWithValibot } from "@conform-to/valibot"
import { useListData } from "react-stately"
import * as v from "valibot"
import { ConformColorSwatchPicker } from "./conform-color-swatch-picker"

const schema = v.object({
  colorOptions: v.optional(
    v.pipe(
      v.string(),
      v.transform((v) =>
        v
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    ),
  ),
})

export function ConformColorSwatchPickerExample() {
  const colorList = useListData({
    initialItems: [
      { id: 1, name: "Space Black" },
      { id: 2, name: "Silver" },
    ],
  })

  const [form, field] = useForm({
    onValidate: ({ formData }) => parseWithValibot(formData, { schema }),
    constraint: getValibotConstraint(schema),
    onSubmit: (e) => {
      e.preventDefault()
    },
  })

  return (
    <form {...getFormProps(form)} className="space-y-4">
      <ConformColorSwatchPicker
        label="Device Colors"
        field={field.colorOptions}
        list={colorList}
        description="Select colors for your device variants"
      />
      <button
        type="submit"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:opacity-90"
      >
        Submit
      </button>
    </form>
  )
}
