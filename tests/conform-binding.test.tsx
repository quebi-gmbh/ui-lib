/**
 * The two things every conform-* variant rests on, asserted against a real DOM.
 *
 * Both are silent when broken — no type error, no React warning, no missing
 * attribute — which is exactly why they are tested rather than reviewed:
 *
 *   1. The bridge between Conform's v1 `useForm` and the `useControl` /
 *      `BaseControl` pair from `@conform-to/react/future`, which is what the
 *      hidden-input variants (TimeField, DateRangePicker, FileTrigger,
 *      ChoiceBox, Calendar, DaySchedule, ColorPicker) are built on.
 *   2. That the metadata is read attribute by attribute rather than spread from
 *      `getInputProps`, because react-aria's prop names differ from the DOM's
 *      and `filterDOMProps` drops the mismatched half without complaint.
 *
 * The third block pins react-aria's id ownership, which decides where each
 * variant puts `id={field.errorId}` — and where it must not.
 */
import { GlobalRegistrator } from "@happy-dom/global-registrator"

GlobalRegistrator.register()

import { describe, expect, test } from "bun:test"
import { type FieldMetadata, getInputProps, useForm } from "@conform-to/react"
import { BaseControl, useControl } from "@conform-to/react/future"
import { parseWithValibot } from "@conform-to/valibot"
import { act } from "react"
import { createRoot } from "react-dom/client"
import { FieldError, Input, Label, TextField } from "react-aria-components"
import * as v from "valibot"
import { ConformField } from "../src/components/conform-field"
import { ConformSwitch } from "../src/components/conform-switch"
import { Switch } from "../src/components/switch"

// react-dom looks for this to decide whether act() is supported.
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

async function mount(element: React.ReactElement) {
  const container = document.createElement("div")
  document.body.appendChild(container)
  await act(async () => {
    createRoot(container).render(element)
  })
  return container
}

const formOf = (container: HTMLElement) => container.querySelector("form") as HTMLFormElement
const click = async (container: HTMLElement, testId: string) => {
  await act(async () => {
    container.querySelector<HTMLElement>(`[data-testid="${testId}"]`)?.click()
  })
}

describe("the v1 useForm <-> future useControl bridge", () => {
  function Custom({ field }: { field: FieldMetadata<string> }) {
    const control = useControl({ defaultValue: field.initialValue as string | undefined })
    return (
      <>
        <BaseControl
          name={field.name}
          form={field.formId}
          ref={control.register}
          defaultValue={control.defaultValue ?? ""}
        />
        <button type="button" data-testid="set" onClick={() => control.change("banana")}>
          set
        </button>
        <span data-testid="value">{control.value ?? ""}</span>
      </>
    )
  }

  function App() {
    const [form, fields] = useForm({ defaultValue: { fruit: "apple" } })
    return (
      <form id={form.id} onSubmit={form.onSubmit} noValidate>
        <Custom field={fields.fruit} />
      </form>
    )
  }

  test("the control starts at the field's initial value, in the DOM and in FormData", async () => {
    const container = await mount(<App />)
    expect(new FormData(formOf(container)).get("fruit")).toBe("apple")
    expect(container.querySelector('[data-testid="value"]')?.textContent).toBe("apple")
  })

  test("control.change() reaches FormData", async () => {
    const container = await mount(<App />)
    await click(container, "set")
    expect(new FormData(formOf(container)).get("fruit")).toBe("banana")
    expect(container.querySelector('[data-testid="value"]')?.textContent).toBe("banana")
  })

  test("a form reset snaps the control back to the default", async () => {
    // This is the half that would break first if the two halves stopped
    // meeting in the DOM: v1's reset writes the element and bumps
    // data-conform, and the future observer is watching that attribute.
    const container = await mount(<App />)
    await click(container, "set")
    const form = formOf(container)
    await act(async () => {
      form.reset()
    })
    expect(new FormData(form).get("fruit")).toBe("apple")
    expect(container.querySelector('[data-testid="value"]')?.textContent).toBe("apple")
  })
})

describe("getInputProps is not spreadable onto a react-aria control", () => {
  function Spread({ field }: { field: FieldMetadata<boolean> }) {
    // The shape this rule set used to recommend for "a control that renders a
    // real input". It type-checks, because JSX spread skips excess-property
    // checking, and it is wrong.
    return <Switch {...getInputProps(field, { type: "checkbox" })}>Notify me</Switch>
  }

  const withDefault = { notify: true }

  test("the spread silently loses the field's default — the switch renders off", async () => {
    function App() {
      const [form, fields] = useForm({ defaultValue: withDefault })
      return (
        <form id={form.id} onSubmit={form.onSubmit} noValidate>
          <Spread field={fields.notify} />
        </form>
      )
    }
    const container = await mount(<App />)
    const input = container.querySelector("input") as HTMLInputElement
    expect(input.checked).toBe(false)
    // Nothing in the DOM records the loss: no `required`, no `defaultChecked`.
    expect(input.hasAttribute("required")).toBe(false)
  })

  test("ConformSwitch names the props instead, and the default survives", async () => {
    function App() {
      const [form, fields] = useForm({ defaultValue: withDefault })
      return (
        <form id={form.id} onSubmit={form.onSubmit} noValidate>
          <ConformSwitch field={fields.notify} label="Notify me" />
        </form>
      )
    }
    const container = await mount(<App />)
    const input = container.querySelector("input") as HTMLInputElement
    expect(input.checked).toBe(true)
    expect(new FormData(formOf(container)).get("notify")).toBe("on")
  })
})

describe("react-aria owns the ids inside its own fields", () => {
  test("an explicit id on a FieldError is not the id the control points at", async () => {
    // Why no conform-* variant sets id={field.errorId} inside a react-aria
    // field: the field generates ids for its description and error slots and
    // wires aria-describedby to those. Overriding the element's id leaves the
    // attribute pointing at nothing, and nothing anywhere says so.
    const container = await mount(
      <TextField isInvalid>
        <Label>Email</Label>
        <Input />
        <FieldError id="mine">boom</FieldError>
      </TextField>,
    )
    const input = container.querySelector("input") as HTMLInputElement
    expect(container.querySelector("[slot=errorMessage]")?.id).toBe("mine")
    expect(input.getAttribute("aria-describedby")).not.toContain("mine")
  })

  test("ConformField's error message is the one its input points at", async () => {
    function App() {
      const [form, fields] = useForm({
        onValidate({ formData }) {
          return parseWithValibot(formData, {
            schema: v.object({ email: v.pipe(v.string("Required"), v.nonEmpty("Required")) }),
          })
        },
      })
      return (
        <form id={form.id} onSubmit={form.onSubmit} noValidate>
          <ConformField field={fields.email} label="Email" />
          <button type="submit" data-testid="submit">
            go
          </button>
        </form>
      )
    }
    const container = await mount(<App />)
    await click(container, "submit")
    const input = container.querySelector("input") as HTMLInputElement
    const message = container.querySelector("[slot=errorMessage]") as HTMLElement
    expect(message.textContent).toBe("Required")
    expect(input.getAttribute("aria-describedby")?.split(" ")).toContain(message.id)
  })
})
