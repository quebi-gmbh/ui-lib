import { useForm } from "@conform-to/react"
import { parseWithValibot } from "@conform-to/valibot"
import * as v from "valibot"
import { Button } from "@/components/button"
import { ConformMultipleSelect } from "@/components/conform-multiple-select"
import { MultipleSelectContent, MultipleSelectItem } from "@/components/multiple-select"
import type { ComponentExample } from "./types"

const schema = v.object({
  // A multi-value select submits one entry per selection under the same name;
  // Conform surfaces that as a string array.
  frameworks: v.pipe(v.array(v.string()), v.minLength(1, "Pick at least one framework")),
})

const frameworks = [
  { id: "react", name: "React" },
  { id: "vue", name: "Vue" },
  { id: "svelte", name: "Svelte" },
  { id: "solid", name: "Solid" },
  { id: "angular", name: "Angular" },
  { id: "qwik", name: "Qwik" },
  { id: "astro", name: "Astro" },
]

const FrameworksForm = () => {
  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithValibot(formData, { schema })
    },
  })

  return (
    <form
      id={form.id}
      onSubmit={form.onSubmit}
      className="flex w-full max-w-sm flex-col gap-4"
      noValidate
    >
      <ConformMultipleSelect
        field={fields.frameworks}
        label="Frameworks"
        placeholder="Select frameworks"
      >
        <MultipleSelectContent items={frameworks}>
          {(item) => <MultipleSelectItem id={item.id}>{item.name}</MultipleSelectItem>}
        </MultipleSelectContent>
      </ConformMultipleSelect>
      <Button type="submit" size="sm">
        Submit
      </Button>
    </form>
  )
}

export const conformMultipleSelectExamples: ComponentExample[] = [
  {
    title: "Bound to a Conform form",
    description:
      "Submit without selecting anything to see the validation error wired from field metadata.",
    render: () => <FrameworksForm />,
  },
]
