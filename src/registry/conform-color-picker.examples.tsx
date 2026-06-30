import { useForm } from "@conform-to/react"
import { parseWithZod } from "@conform-to/zod/v4"
import { z } from "zod"
import { Button } from "@/components/button"
import { ConformColorPicker } from "@/components/conform-color-picker"
import type { ComponentExample } from "./types"

const schema = z.object({
  // A hex color string, validated as a 6-digit hex value.
  brandColor: z
    .string({ error: "Pick a color" })
    .regex(/^#[0-9A-Fa-f]{6}$/, "Pick a valid hex color"),
})

const ColorForm = () => {
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
      <ConformColorPicker
        field={fields.brandColor}
        label="Brand color"
        placeholder="#0EA5E9"
        description="Choose your brand's primary color."
      />
      <Button type="submit" size="sm">
        Submit
      </Button>
    </form>
  )
}

const schemaWithDefault = z.object({
  accent: z
    .string({ error: "Pick a color" })
    .regex(/^#[0-9A-Fa-f]{6}$/, "Pick a valid hex color"),
})

const PrefilledColorForm = () => {
  const [form, fields] = useForm({
    defaultValue: { accent: "#22D3EE" },
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: schemaWithDefault })
    },
  })

  return (
    <form
      id={form.id}
      onSubmit={form.onSubmit}
      className="flex w-full max-w-sm flex-col gap-4"
      noValidate
    >
      <ConformColorPicker field={fields.accent} label="Accent color" />
      <Button type="submit" size="sm">
        Submit
      </Button>
    </form>
  )
}

export const conformColorPickerExamples: ComponentExample[] = [
  {
    title: "Bound to a Conform form",
    description: "Submit without picking a color to see the validation error wired from field metadata.",
    render: () => <ColorForm />,
  },
  {
    title: "With a default value",
    description: "The field's default hex value pre-fills the swatch and trigger.",
    render: () => <PrefilledColorForm />,
  },
]
