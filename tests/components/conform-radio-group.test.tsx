/**
 * ConformRadioGroup's binding to Conform, and the one thing about it that stays
 * invisible until a user submits an empty form.
 *
 * A radio group is the one native control whose *empty* state submits nothing
 * at all: react-aria renders one `<input type="radio">` per option and nothing
 * else, and an unchecked radio is not a successful control, so with no choice
 * made the name never reaches FormData. For a string field that turns the
 * author's "Pick a plan" into valibot's internal `Invalid key: Expected "plan"
 * but received undefined`, and no schema the consumer can write fixes it —
 * `@conform-to/valibot` coerces both `""` and absent to `undefined` inside the
 * pipe, so the two differ only by which one arrives.
 *
 * The fix is an empty-string sentinel — the same job react-aria's own
 * `HiddenSelect` gives its leading `<option value="">`, which is why
 * ConformSelect and ConformChoiceBox never had this bug. The sentinel is
 * rendered only while nothing is selected, and that "only" is the whole risk:
 * a sentinel left in place beside a checked radio puts two entries under one
 * name and Conform parses a repeated key as an array, so the string field would
 * arrive as `["", "pro"]`. Every assertion below is about one of those two
 * halves — the key is there when empty, and there exactly once when not.
 *
 * The first block pins the wire-shape → message mapping against
 * `parseWithValibot` directly, because that is the actual reason for the
 * sentinel, and it uses the picklist from `conform-radio-group.examples.tsx`:
 * the example is copied verbatim by agents, so its message is the one that has
 * to show.
 *
 * The DOM comes from `tests/dom.ts`, preloaded for every test file.
 */
import { describe, expect, test } from "bun:test"
import { useForm } from "@conform-to/react"
import { parseWithValibot } from "@conform-to/valibot"
import { act, render, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import * as v from "valibot"
import { ConformRadioGroup } from "../../src/components/conform-radio-group"
import { Radio } from "../../src/components/radio"

/** The example's own schema, unchanged. */
const planSchema = v.object({
  plan: v.picklist(["free", "pro", "team"], "Pick a plan"),
})

const errorsFor = (entries: [string, string][]) => {
  const formData = new FormData()
  for (const [name, value] of entries) formData.append(name, value)
  const result = parseWithValibot(formData, { schema: planSchema })
  return "error" in result ? result.error : null
}

describe("what an empty submit has to look like on the wire", () => {
  test("with the key absent it reports valibot's internal message", () => {
    // The bug: this is what an unchecked radio group produces on its own.
    expect(errorsFor([])?.plan?.[0]).toMatch(/Invalid key/)
  })

  test("with the key present but empty it reports the author's message", () => {
    expect(errorsFor([["plan", ""]])?.plan).toEqual(["Pick a plan"])
  })

  test("with the key twice a real choice is rejected as if it were empty", () => {
    // Why the sentinel has to go away once a radio is checked, and why it is
    // the nastier of the two failures: Conform parses a repeated key as an
    // array, the picklist never sees the string "pro", and the user is told to
    // pick a plan they have already picked — with no way to satisfy the form.
    expect(
      errorsFor([
        ["plan", ""],
        ["plan", "pro"],
      ])?.plan,
    ).toEqual(["Pick a plan"])
  })

  test("an optional field cannot tell the sentinel from an absent key", () => {
    // The one thing adding a key to every submit could plausibly break. It does
    // not: `@conform-to/valibot` coerces `""` to undefined before the schema
    // sees it, so optional still passes and a default still applies.
    const optional = v.object({ plan: v.optional(v.picklist(["free", "pro", "team"])) })
    const withDefault = v.object({
      plan: v.optional(v.picklist(["free", "pro", "team"]), "free"),
    })
    const parse = (schema: v.GenericSchema, entries: [string, string][]) => {
      const formData = new FormData()
      for (const [name, value] of entries) formData.append(name, value)
      const result = parseWithValibot(formData, { schema })
      // The payload differs by construction — it is the raw submission, and
      // repopulating the form from it is the point of sending the key at all.
      // What has to match is the parsed value the action receives.
      return { status: result.status, plan: (result as { value?: { plan?: string } }).value?.plan }
    }

    expect(parse(optional, [["plan", ""]])).toEqual({ status: "success", plan: undefined })
    expect(parse(optional, [])).toEqual({ status: "success", plan: undefined })
    expect(parse(withDefault, [["plan", ""]])).toEqual({ status: "success", plan: "free" })
    expect(parse(withDefault, [])).toEqual({ status: "success", plan: "free" })
  })
})

// A raw <form> is what a Conform form binds to; the library's own rule points
// callers at react-router's <Form>, which would need a router around every test
// here to prove nothing about the binding. tests/ is outside biome.jsonc's file
// list, so this is not a suppressed diagnostic.
function PlanForm({ defaultPlan }: { defaultPlan?: string }) {
  const [form, fields] = useForm({
    id: "plan-form",
    defaultValue: defaultPlan ? { plan: defaultPlan } : undefined,
    onValidate: ({ formData }) => parseWithValibot(formData, { schema: planSchema }),
    onSubmit: (event) => event.preventDefault(),
  })
  return (
    <form id={form.id} onSubmit={form.onSubmit} noValidate>
      <ConformRadioGroup field={fields.plan} label="Plan" description="Change it any time.">
        <Radio value="free">Free</Radio>
        <Radio value="pro">Pro</Radio>
        <Radio value="team">Team</Radio>
      </ConformRadioGroup>
      <button type="submit">Save</button>
    </form>
  )
}

/**
 * Render the fixture and hand back queries scoped to *its* container.
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
  return {
    form,
    /** Every entry posted under the name — length is half the point here. */
    submitted: () => new FormData(form).getAll("plan"),
    radios: () => Array.from(form.querySelectorAll<HTMLInputElement>("input[type='radio']")),
    sentinel: () => form.querySelector<HTMLInputElement>("input[type='hidden'][name='plan']"),
    radio: (name: string) => scope.getByRole("radio", { name }),
    save: () => scope.getByRole("button", { name: "Save" }),
    findText: (text: string) => scope.findByText(text),
    queryText: (text: string | RegExp) => scope.queryByText(text),
  }
}

describe("ConformRadioGroup", () => {
  test("puts the field's name on every radio", () => {
    const { radios } = renderForm(<PlanForm />)

    // The name belongs to the group, not to each Radio: react-aria pushes it
    // down, and that is what makes exactly one value submit once one is chosen.
    expect(radios().map((radio) => radio.name)).toEqual(["plan", "plan", "plan"])
    expect(radios().map((radio) => radio.value)).toEqual(["free", "pro", "team"])
  })

  test("submits the name once, empty, while nothing is chosen", () => {
    const { submitted, sentinel } = renderForm(<PlanForm />)

    expect(sentinel()).not.toBeNull()
    expect(submitted()).toEqual([""])
  })

  test("an empty submit shows the schema's own message", async () => {
    const user = userEvent.setup()
    const { save, findText, queryText } = renderForm(<PlanForm />)

    await user.click(save())

    expect(await findText("Pick a plan")).toBeInTheDocument()
    expect(queryText(/Invalid key/)).toBeNull()
  })

  test("choosing an option submits that value and nothing else", async () => {
    const user = userEvent.setup()
    const { radio, submitted, sentinel } = renderForm(<PlanForm />)

    await user.click(radio("Pro"))

    // One entry, not two: the sentinel is gone rather than merely overridden.
    expect(submitted()).toEqual(["pro"])
    expect(sentinel()).toBeNull()
  })

  test("starts at the field's initial value, with no sentinel beside it", () => {
    const { radio, submitted, sentinel } = renderForm(<PlanForm defaultPlan="team" />)

    expect(radio("Team")).toBeChecked()
    expect(submitted()).toEqual(["team"])
    expect(sentinel()).toBeNull()
  })

  test("a form reset brings the sentinel back with the cleared radios", async () => {
    const user = userEvent.setup()
    const { form, radio, submitted } = renderForm(<PlanForm />)

    await user.click(radio("Pro"))
    await act(async () => {
      form.reset()
    })

    // react-aria's useFormReset routes the reset through the group's onChange,
    // which is what keeps the mirrored selection state — and so the sentinel —
    // in step with the radios rather than one submit behind them.
    expect(radio("Pro")).not.toBeChecked()
    expect(submitted()).toEqual([""])
  })
})
