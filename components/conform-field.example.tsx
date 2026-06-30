import { getFormProps, useForm } from "@conform-to/react"
import { getValibotConstraint, parseWithValibot } from "@conform-to/valibot"
import * as v from "valibot"
import { ConformField } from "./conform-field"

const schema = v.object({
  name: v.pipe(v.string(), v.minLength(2)),
})

export function ConformFieldExample() {
  const [form, field] = useForm({
    onValidate: ({ formData }) => parseWithValibot(formData, { schema }),
    constraint: getValibotConstraint(schema),
    onSubmit: (e) => {
      e.preventDefault()
    },
  })

  return (
    <form {...getFormProps(form)}>
      <ConformField label="Test Field" field={field.name} type="text" />
      <button type="submit">Submit</button>
    </form>
  )
}
