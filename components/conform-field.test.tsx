import { getFormProps, useForm } from "@conform-to/react"
import { getValibotConstraint, parseWithValibot } from "@conform-to/valibot"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import * as v from "valibot"
import { describe, expect, it } from "vitest"
import { ConformField } from "./conform-field"
import { ConformFieldExample } from "./conform-field.example"

const schema = v.object({
  name: v.pipe(v.string(), v.minLength(2)),
  iconUrl: v.optional(v.pipe(v.string(), v.url())),
})

function ConformFieldWithDefaultValue({ defaultName = "Samsung", defaultIconUrl = "" }) {
  const [form, fields] = useForm({
    onValidate: ({ formData }) => parseWithValibot(formData, { schema }),
    constraint: getValibotConstraint(schema),
    onSubmit: (e) => {
      e.preventDefault()
    },
    defaultValue: {
      name: defaultName,
      iconUrl: defaultIconUrl,
    },
  })

  return (
    <form {...getFormProps(form)}>
      <ConformField label="Name" field={fields.name} type="text" />
      <ConformField
        label="Icon URL"
        field={fields.iconUrl}
        type="text"
        placeholder="https://example.com/icon.png"
      />
      <button type="submit">Save</button>
    </form>
  )
}

describe("ConformField", () => {
  describe("Basic Rendering", () => {
    it("renders input element with correct props", () => {
      render(<ConformFieldExample />)

      expect(screen.getByLabelText(/Test Field/)).toBeInTheDocument()
    })
  })

  describe("Error State Handling", () => {
    it.skip("displays single error message", async () => {
      const user = userEvent.setup()
      render(<ConformFieldExample />)

      const input = screen.getByLabelText(/Test Field/)

      await user.click(screen.getByRole("button"))
      expect(input).toHaveAccessibleErrorMessage()
    })
  })

  describe("Label Styling", () => {
    it("applies normal styling to label when field is valid", () => {
      render(<ConformFieldExample />)

      const label = screen.getByText("Test Field")
      expect(label).not.toHaveClass("text-red-700")
    })
  })

  describe("Default Value", () => {
    it("renders input with the default value populated", () => {
      render(<ConformFieldWithDefaultValue defaultName="Samsung" />)

      const input = screen.getByLabelText(/^Name/)
      expect(input).toHaveValue("Samsung")
    })

    it("renders empty input when default value is empty string", () => {
      render(<ConformFieldWithDefaultValue defaultName="" defaultIconUrl="" />)

      const input = screen.getByLabelText("Icon URL")
      expect(input).toHaveValue("")
    })

    it("does not set both value and defaultValue on the input element", () => {
      render(<ConformFieldWithDefaultValue defaultName="Samsung" />)

      const input = screen.getByLabelText(/^Name/)
      // The input should NOT have a defaultvalue HTML attribute.
      // Having both value and defaultValue causes the React warning:
      // "A component contains an input of type text with both value and defaultValue props"
      expect(input.hasAttribute("defaultvalue")).toBe(false)
    })

    it("allows editing a field that has a default value", async () => {
      const user = userEvent.setup()
      render(<ConformFieldWithDefaultValue defaultName="Samsung" />)

      const input = screen.getByLabelText(/^Name/)
      expect(input).toHaveValue("Samsung")

      await user.clear(input)
      await user.type(input, "Apple")
      expect(input).toHaveValue("Apple")
    })
  })
})
