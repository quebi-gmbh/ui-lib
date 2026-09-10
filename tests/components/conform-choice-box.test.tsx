/**
 * ConformChoiceBox's binding to Conform, and the one thing about it that stays
 * invisible until a user submits an empty form.
 *
 * A ChoiceBox is a react-aria GridList: no name, no native form control. Its
 * value reaches FormData through a hidden `<select>` registered with
 * `useControl`, and *which* select that is decides what an empty selection
 * submits. A `<select multiple>` with nothing selected has no selected option
 * and so submits nothing at all: the key is absent from FormData. For a string
 * field that turns the author's "Pick a plan" into valibot's internal
 * `Invalid key: Expected "plan" but received undefined`, and no schema the
 * consumer can write fixes it — `@conform-to/valibot` coerces both `""` and
 * absent to `undefined` inside the pipe.
 *
 * So single selection registers a plain `<select>`, whose empty state is an
 * `<option value="">` (the trick react-aria's own `HiddenSelect` uses), while
 * multiple selection keeps the multi-select, where an absent key already parses
 * as `[]` and the author's `minLength` message is what shows.
 *
 * The first block pins the wire-shape → message mapping against
 * `parseWithValibot` directly, because that is the actual reason for the split
 * and it is the half a DOM cannot show: happy-dom's FormData disagrees with
 * browsers about an empty `<select multiple>` (it emits `""`; a browser emits
 * nothing), so the rendered-control assertions below check the control's shape
 * rather than trusting FormData for that case.
 *
 * The DOM comes from `tests/dom.ts`, preloaded for every test file.
 */
import { describe, expect, test } from "bun:test"
import { useForm } from "@conform-to/react"
import { parseWithValibot } from "@conform-to/valibot"
import { render, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import * as v from "valibot"
import { Button } from "../../src/components/button"
import { ChoiceBoxItem, ChoiceBoxLabel } from "../../src/components/choice-box"
import { ConformChoiceBox } from "../../src/components/conform-choice-box"

const PLANS = [
  { id: "starter", name: "Starter" },
  { id: "growth", name: "Growth" },
]

const planSchema = v.object({ plan: v.string("Pick a plan") })
const addonSchema = v.object({
  addons: v.pipe(v.array(v.string()), v.minLength(1, "Pick at least one add-on")),
})

const errorsFor = (schema: v.GenericSchema, entries: [string, string][]) => {
  const formData = new FormData()
  for (const [name, value] of entries) formData.append(name, value)
  const result = parseWithValibot(formData, { schema })
  return "error" in result ? result.error : null
}

describe("what an empty submit has to look like on the wire", () => {
  test("a string field with the key absent reports valibot's internal message", () => {
    // The bug: this is what a <select multiple> with nothing selected produces.
    expect(errorsFor(planSchema, [])?.plan?.[0]).toMatch(/Invalid key/)
  })

  test("a string field whose key is present but empty reports the author's message", () => {
    expect(errorsFor(planSchema, [["plan", ""]])?.plan).toEqual(["Pick a plan"])
  })

  test("an array field with the key absent already reports the author's message", () => {
    // Conform parses a missing key for an array field as [], so the multi-select
    // needs no empty-string sentinel — and must not submit one: an extra "" in
    // the list would fail v.array(v.string()) on the element, not on minLength.
    expect(errorsFor(addonSchema, [])?.addons).toEqual(["Pick at least one add-on"])
    const withSentinel = errorsFor(addonSchema, [
      ["addons", "backups"],
      ["addons", ""],
    ])
    expect(Object.keys(withSentinel ?? {})).toEqual(["addons[1]"])
  })
})

// A raw <form> is what a Conform form binds to; the library's own rule points
// callers at react-router's <Form>, which would need a router around every test
// here to prove nothing about the binding. That is the rule's own published
// exception, and in this repo it is a `localScopes` entry naming <form> alone —
// so every other element on the tier-1 list is still checked in this file.
function PlanForm({ defaultPlan }: { defaultPlan?: string }) {
  const [form, fields] = useForm({
    id: "plan-form",
    defaultValue: defaultPlan ? { plan: defaultPlan } : undefined,
    onValidate: ({ formData }) => parseWithValibot(formData, { schema: planSchema }),
    onSubmit: (event) => event.preventDefault(),
  })
  return (
    <form id={form.id} onSubmit={form.onSubmit} noValidate>
      <ConformChoiceBox field={fields.plan} label="Plan" selectionMode="single" items={PLANS}>
        {(plan) => (
          <ChoiceBoxItem id={plan.id} textValue={plan.name}>
            <ChoiceBoxLabel>{plan.name}</ChoiceBoxLabel>
          </ChoiceBoxItem>
        )}
      </ConformChoiceBox>
      <Button type="submit">Save</Button>
    </form>
  )
}

function AddonsForm() {
  const [form, fields] = useForm({
    id: "addons-form",
    onValidate: ({ formData }) => parseWithValibot(formData, { schema: addonSchema }),
    onSubmit: (event) => event.preventDefault(),
  })
  return (
    <form id={form.id} onSubmit={form.onSubmit} noValidate>
      <ConformChoiceBox
        field={fields.addons}
        label="Add-ons"
        selectionMode="multiple"
        items={PLANS}
        keys={PLANS.map((plan) => plan.id)}
      >
        {(plan) => (
          <ChoiceBoxItem id={plan.id} textValue={plan.name}>
            <ChoiceBoxLabel>{plan.name}</ChoiceBoxLabel>
          </ChoiceBoxItem>
        )}
      </ConformChoiceBox>
      <Button type="submit">Save</Button>
    </form>
  )
}

/**
 * Render one of the fixtures and hand back queries scoped to *its* container.
 *
 * Scoped rather than global (`screen`, `document.querySelector`) because other
 * test files in this suite mount through `createRoot` by hand and leave their
 * containers in `document.body`; a bare `document.querySelector("form")` finds
 * the oldest of those and the assertions here silently move to another test's
 * DOM.
 */
function renderForm(element: React.ReactElement) {
  const { container } = render(element)
  const scope = within(container)
  const form = container.querySelector("form") as HTMLFormElement
  const hiddenSelect = (name: string) =>
    form.querySelector(`select[name="${name}"]`) as HTMLSelectElement
  return {
    hiddenSelect,
    /** What the form would post — trustworthy here only for a single select. */
    submitted: (name: string) => new FormData(form).getAll(name),
    /**
     * The selected keys, read off the element rather than out of FormData:
     * happy-dom's FormData appends `select.value` once per `<select>`,
     * `multiple` or not, so a multi-select with two selections reads back as
     * one value and an empty one as `""` rather than as nothing at all.
     */
    selectedValues: (name: string) =>
      Array.from(hiddenSelect(name).selectedOptions, (option) => option.value),
    card: (name: string) => scope.getByRole("row", { name }),
    save: () => scope.getByRole("button", { name: "Save" }),
    findText: (text: string) => scope.findByText(text),
  }
}

describe("ConformChoiceBox, single selection", () => {
  test("registers a single select whose empty state still submits the name", () => {
    const { hiddenSelect, submitted } = renderForm(<PlanForm />)

    // Not `multiple`: that is the whole fix. A multi-select with nothing
    // selected has no selected option and drops the key from FormData.
    expect(hiddenSelect("plan").multiple).toBe(false)
    expect(hiddenSelect("plan").value).toBe("")
    expect(submitted("plan")).toEqual([""])
  })

  test("an empty submit shows the schema's own message", async () => {
    const user = userEvent.setup()
    const { save, findText } = renderForm(<PlanForm />)

    await user.click(save())

    expect(await findText("Pick a plan")).toBeInTheDocument()
  })

  test("choosing a card submits its key", async () => {
    const user = userEvent.setup()
    const { card, submitted } = renderForm(<PlanForm />)

    await user.click(card("Growth"))

    expect(submitted("plan")).toEqual(["growth"])
    expect(card("Growth")).toHaveAttribute("aria-selected", "true")
  })

  test("starts at the field's initial value", () => {
    const { card, submitted } = renderForm(<PlanForm defaultPlan="starter" />)

    expect(submitted("plan")).toEqual(["starter"])
    expect(card("Starter")).toHaveAttribute("aria-selected", "true")
  })
})

describe("ConformChoiceBox, multiple selection", () => {
  test("registers a multi-select, which submits nothing when empty", () => {
    const { hiddenSelect } = renderForm(<AddonsForm />)

    // No empty-string option here: an absent key is the right wire shape for an
    // array field, and a sentinel would fail the element schema instead.
    expect(hiddenSelect("addons").multiple).toBe(true)
    expect(hiddenSelect("addons").selectedOptions.length).toBe(0)
  })

  test("an empty submit shows the schema's own message", async () => {
    const user = userEvent.setup()
    const { save, findText } = renderForm(<AddonsForm />)

    await user.click(save())

    expect(await findText("Pick at least one add-on")).toBeInTheDocument()
  })

  test("submits the name once per selected card", async () => {
    const user = userEvent.setup()
    const { card, selectedValues } = renderForm(<AddonsForm />)

    await user.click(card("Starter"))
    await user.click(card("Growth"))

    expect(selectedValues("addons")).toEqual(["starter", "growth"])
  })
})
