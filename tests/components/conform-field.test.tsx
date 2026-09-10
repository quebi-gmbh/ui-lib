/**
 * ConformField's binding to Conform.
 *
 * The component's whole job is the hand-off between Conform's field metadata
 * and React Aria's TextField, and the hand-off has one sharp edge: Conform's
 * `getInputProps` returns `defaultValue`, React Aria's TextField turns that
 * into controlled state, and passing both to the same input makes React warn
 * ("a component contains an input with both value and defaultValue") and — the
 * part that actually hurts — freezes the field, so a form prefilled from the
 * server cannot be edited. That regression shipped once. It is asserted here.
 *
 * The fixture is a real Conform form (valibot schema, `getFormProps`), not a
 * stub, because the bug lived in what Conform hands over rather than in the
 * component's own props.
 */
import { describe, expect, test } from "bun:test"
import { getFormProps, useForm } from "@conform-to/react"
import { getValibotConstraint, parseWithValibot } from "@conform-to/valibot"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import * as v from "valibot"
import { ConformField } from "../../src/components/conform-field"

const schema = v.object({
  name: v.pipe(v.string("Name is required"), v.minLength(2, "Name is too short")),
  iconUrl: v.optional(v.pipe(v.string(), v.url("Enter a valid URL"))),
})

function TestForm({ defaultName = "", defaultIconUrl = "" }) {
  const [form, fields] = useForm({
    id: "test-form",
    constraint: getValibotConstraint(schema),
    onValidate: ({ formData }) => parseWithValibot(formData, { schema }),
    onSubmit: (event) => event.preventDefault(),
    defaultValue: { name: defaultName, iconUrl: defaultIconUrl },
  })

  return (
    // A raw <form> is what `getFormProps` is for; the library's own rule points
    // callers at react-router's <Form>, which would need a router around every
    // test in this file to prove nothing about ConformField. tests/ is outside
    // biome.jsonc's file list, so this is not a suppressed diagnostic.
    <form {...getFormProps(form)}>
      <ConformField label="Name" field={fields.name} type="text" description="Shown to buyers" />
      <ConformField label="Icon URL" field={fields.iconUrl} type="text" />
      <button type="submit">Save</button>
    </form>
  )
}

const nameInput = () => screen.getByLabelText(/^Name/)

describe("ConformField", () => {
  test("labels the input, so it is reachable by its label text", () => {
    render(<TestForm />)

    expect(nameInput()).toBeInTheDocument()
    expect(nameInput().tagName).toBe("INPUT")
  })

  test("takes its name from the field metadata", () => {
    render(<TestForm />)

    expect(nameInput()).toHaveAttribute("name", "name")
  })

  test("marks a required field as required", () => {
    render(<TestForm />)

    expect(nameInput()).toBeRequired()
    // The asterisk is rendered, not implied by styling.
    expect(screen.getByText("*")).toBeInTheDocument()
  })

  test("renders the description as help text tied to the input", () => {
    render(<TestForm />)

    expect(nameInput()).toHaveAccessibleDescription(/Shown to buyers/)
  })

  test("populates the input from the field's default value", () => {
    render(<TestForm defaultName="Samsung" />)

    expect(nameInput()).toHaveValue("Samsung")
  })

  test("leaves the input empty when the default value is an empty string", () => {
    render(<TestForm />)

    expect(screen.getByLabelText("Icon URL")).toHaveValue("")
  })

  test("never sets both value and defaultValue on the input element", () => {
    render(<TestForm defaultName="Samsung" />)

    // React lowercases an unknown prop into an attribute of the same name, so a
    // leaked `defaultValue` shows up here — and with it the "both value and
    // defaultValue" warning the component exists to avoid.
    expect(nameInput().hasAttribute("defaultvalue")).toBe(false)
  })

  test("a field with a default value stays editable", async () => {
    const user = userEvent.setup()
    render(<TestForm defaultName="Samsung" />)

    await user.clear(nameInput())
    await user.type(nameInput(), "Apple")

    expect(nameInput()).toHaveValue("Apple")
  })

  test("surfaces the field's validation error after a failed submit", async () => {
    const user = userEvent.setup()
    render(<TestForm defaultName="A" />)

    await user.click(screen.getByRole("button", { name: "Save" }))

    expect(await screen.findByText("Name is too short")).toBeInTheDocument()
    expect(nameInput()).toBeInvalid()
  })

  test("does not mark a valid field invalid", () => {
    render(<TestForm defaultName="Samsung" />)

    expect(nameInput()).toBeValid()
    expect(screen.queryByText("Name is too short")).not.toBeInTheDocument()
  })
})
