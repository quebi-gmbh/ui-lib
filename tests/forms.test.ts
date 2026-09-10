/**
 * Forms rules. Same four kinds of case as the element-usage suite.
 *
 * The fixtures are written against Conform's documented API — getInputProps,
 * getFormProps, useInputControl, useForm({ lastResult }) — because the rules
 * claim to describe it. Where a fixture mirrors an example from conform.guide
 * it says so, so a future reader can check the claim rather than trust it.
 */
import { describe, expect, test } from "bun:test"
import { component, fireCount, fires } from "./harness"

const BIND = "bind-fields-through-conform"

describe(BIND, () => {
  test("true positive: a control handed the field's name", () => {
    const code = component(`    <Checkbox name={fields.terms.name}>I accept</Checkbox>`)
    expect(fires(BIND, code)).toBe(true)
  })

  test("true positive: a control handed the field's initial value", () => {
    const code = component(`    <Select defaultValue={fields.plan.initialValue}>{props.children}</Select>`)
    expect(fires(BIND, code)).toBe(true)
  })

  test("true positive: metadata picked off one property at a time", () => {
    const code = component(
      `    <NumberField name={fields.qty.name} defaultValue={fields.qty.initialValue}>{props.children}</NumberField>`,
    )
    expect(fires(BIND, code)).toBe(true)
  })

  test("true negative: the conform-* variant", () => {
    const code = component(`    <ConformCheckbox field={fields.terms} label="I accept" />`)
    expect(fires(BIND, code)).toBe(false)
  })

  test("known blind spot: a spread names nothing, so this check sees no metadata", () => {
    // The rule says to name the props rather than spread onto a component, but
    // its selector reads named attributes — a spread hands the whole object
    // over. For the two controls where that is silently wrong (Checkbox and
    // Switch) the tier-4 rule below is the check.
    const code = component(`    <TextField {...getInputProps(fields.email, { type: "email" })} />`)
    expect(fires(BIND, code)).toBe(false)
  })

  test("no false positive: a control with no Conform anywhere near it", () => {
    // A filter checkbox in component state — the rule's documented exception.
    const code = component(`    <Checkbox isSelected={props.on} onChange={props.setOn}>Only active</Checkbox>`)
    expect(fires(BIND, code)).toBe(false)
  })

  test("no false positive: a literal name is not field metadata", () => {
    const code = component(`    <Checkbox name="terms">I accept</Checkbox>`)
    expect(fires(BIND, code)).toBe(false)
  })

  test("no false positive: Conform's own native-input examples do not trip it", () => {
    // conform.guide binds raw inputs this way. Those are group 1's business
    // (<input> is banned outright); this rule fires only on ui-lib control names.
    const code = component(`    <p>{props.children}</p>`)
    expect(fires(BIND, code)).toBe(false)
  })

  test("known blind spot: metadata destructured into a local first", () => {
    const code = `const { name } = props.fields.terms\n${component(`    <Checkbox name={name}>I accept</Checkbox>`)}`
    expect(fires(BIND, code)).toBe(false)
  })

  test("known blind spot: a field bound entirely through useState", () => {
    // No metadata is referenced, so nothing marks this as a form field.
    const code = component(`    <Checkbox name="terms" isSelected={props.on} onChange={props.setOn} />`)
    expect(fires(BIND, code)).toBe(false)
  })
})

const FIELD_TEXT = "render-field-text-through-the-field"

describe(FIELD_TEXT, () => {
  test("true positive: an error message with no id for the control to point at", () => {
    const code = component(`    <p className="text-sm">{props.field.errors}</p>`)
    expect(fires(FIELD_TEXT, code)).toBe(true)
  })

  test("true positive: the same in a div or a span", () => {
    expect(fires(FIELD_TEXT, component(`    <div>{props.field.errors}</div>`))).toBe(true)
    expect(fires(FIELD_TEXT, component(`    <span>{props.field.errors?.join(", ")}</span>`))).toBe(true)
  })

  test("true negative: the message carries the error id", () => {
    // Exactly the shape conform.guide's tutorial lands on:
    //   <div id={fields.email.errorId}>{fields.email.errors}</div>
    const code = component(`    <div id={props.field.errorId}>{props.field.errors}</div>`)
    expect(fires(FIELD_TEXT, code)).toBe(false)
  })

  test("true negative: FieldError inside a react-aria field", () => {
    const code = component(
      `    <TextField isInvalid={props.invalid}><Label>Email</Label><Input /><FieldError>{props.field.errors}</FieldError></TextField>`,
    )
    expect(fires(FIELD_TEXT, code)).toBe(false)
  })

  test("no false positive: an identifier that merely ends in 'errors'", () => {
    const code = component(`    <p>{props.errors.length} problems found</p>`)
    expect(fires(FIELD_TEXT, code)).toBe(false)
  })

  test("no false positive: text that is not a field error", () => {
    const code = component(`    <p className="text-sm">{props.description}</p>`)
    expect(fires(FIELD_TEXT, code)).toBe(false)
  })

  test("reports the message element once, not every wrapper around it", () => {
    const code = component(
      `    <div className="flex flex-col gap-2"><Checkbox /><p>{props.field.errors}</p></div>`,
    )
    expect(fireCount(FIELD_TEXT, code)).toBe(1)
  })

  test("known blind spot: goes quiet if anything nested inside carries an id", () => {
    const code = component(`    <p><span id="x">{props.field.errors}</span></p>`)
    expect(fires(FIELD_TEXT, code)).toBe(false)
  })

  test("known blind spot: labels are not checked at all", () => {
    // "A placeholder standing in for a label" is in the rule, not in the check.
    const code = component(`    <ConformField field={props.fields.email} placeholder="Email address" />`)
    expect(fires(FIELD_TEXT, code)).toBe(false)
  })
})

const SERVER = "validate-on-the-server-with-the-same-schema"

describe(SERVER, () => {
  test("true positive: useForm with client validation only", () => {
    const code = `const [form, fields] = useForm({
  onValidate: ({ formData }) => parseWithValibot(formData, { schema }),
})
`
    expect(fires(SERVER, code)).toBe(true)
  })

  test("true positive: useForm with no options at all", () => {
    expect(fires(SERVER, `const [form] = useForm({})\n`)).toBe(true)
  })

  test("true negative: lastResult is threaded back from the action", () => {
    // conform.guide's Remix integration, verbatim in shape — including the
    // idle-navigation guard the tier-5 rule is about.
    const code = `const lastResult = useActionData()
const navigation = useNavigation()
const [form, fields] = useForm({
  lastResult: navigation.state === "idle" ? lastResult : null,
  onValidate: ({ formData }) => parseWithValibot(formData, { schema }),
})
`
    expect(fires(SERVER, code)).toBe(false)
  })

  test("true negative: server-only validation (no onValidate) still passes", () => {
    // Conform supports validating only on the server; lastResult is the invariant,
    // onValidate is the optional half.
    expect(fires(SERVER, `const [form] = useForm({ lastResult: props.actionData })\n`)).toBe(false)
  })

  test("no false positive: an unrelated hook call named differently", () => {
    expect(fires(SERVER, `const form = useFormState({ onValidate: fn })\n`)).toBe(false)
  })

  test("known blind spot: options passed as a variable are invisible", () => {
    const code = `const options = { onValidate: fn }\nconst [form] = useForm(options)\n`
    expect(fires(SERVER, code)).toBe(false)
  })

  test("known blind spot: it cannot tell whether the action really re-parses", () => {
    // lastResult present, action absent. The check reads the option, not the server.
    const code = `const [form] = useForm({ lastResult: undefined })\n`
    expect(fires(SERVER, code)).toBe(false)
  })
})

const TOGGLES = "seed-toggles-with-default-selected"

describe(TOGGLES, () => {
  test("true positive: a Checkbox bound by the spread alone", () => {
    const code = component(`    <Checkbox {...getInputProps(fields.terms, { type: "checkbox" })} />`)
    expect(fires(TOGGLES, code)).toBe(true)
  })

  test("true positive: the same on a Switch, whose isRequired does not even exist", () => {
    const code = component(
      `    <Switch {...getInputProps(fields.notify, { type: "checkbox" })}>Notify me</Switch>`,
    )
    expect(fires(TOGGLES, code)).toBe(true)
  })

  test("true negative: the conform-* variants", () => {
    expect(fires(TOGGLES, component(`    <ConformCheckbox field={fields.terms} />`))).toBe(false)
    expect(fires(TOGGLES, component(`    <ConformSwitch field={fields.notify} />`))).toBe(false)
  })

  test("true negative: a wrapper that names the seed after the spread", () => {
    // Not the shape app code should write — tier 1 sends it to the variant —
    // but the prop react-aria actually reads is there, so this check steps
    // aside rather than reporting a control that works.
    const code = component(
      `    <Switch {...getInputProps(fields.notify, { type: "checkbox" })} defaultSelected={fields.notify.defaultChecked} />`,
    )
    expect(fires(TOGGLES, code)).toBe(false)
  })

  test("no false positive: a TextField takes the spread as it is", () => {
    const code = component(`    <TextField {...getInputProps(fields.email, { type: "email" })} />`)
    expect(fires(TOGGLES, code)).toBe(false)
  })

  test("no false positive: some other spread onto a Checkbox", () => {
    expect(fires(TOGGLES, component(`    <Checkbox {...props.rest} />`))).toBe(false)
  })

  test("no false positive: getInputProps mentioned but not spread", () => {
    const code = component(
      `    <Checkbox onFocus={() => getInputProps(fields.terms, { type: "checkbox" })} />`,
    )
    expect(fires(TOGGLES, code)).toBe(false)
  })

  test("known blind spot: the props assigned to a local first", () => {
    // The check reads the spread where it is written; a local in between hides
    // it, the same way the other form plugins lose sight of an option object.
    const code = `const inputProps = getInputProps(props.field, { type: "checkbox" })\n${component(`    <Checkbox {...inputProps} />`)}`
    expect(fires(TOGGLES, code)).toBe(false)
  })

  test("the library source is exempt — that is the layer that names the props", () => {
    const code = component(`    <Checkbox {...getInputProps(props.field, { type: "checkbox" })} />`)
    expect(fires(TOGGLES, code, "src/components/conform-checkbox.tsx")).toBe(false)
  })
})

const GATE = "gate-last-result-on-idle-navigation"

describe(GATE, () => {
  test("true positive: the shorthand, which is the shape people write", () => {
    const code = `const [form, fields] = useForm({ lastResult, onValidate: fn })\n`
    expect(fires(GATE, code)).toBe(true)
  })

  test("true positive: written out, but ungated", () => {
    const code = `const [form] = useForm({ lastResult: actionData })\n`
    expect(fires(GATE, code)).toBe(true)
  })

  test("true negative: gated on the navigation state", () => {
    const code = `const [form] = useForm({
  lastResult: navigation.state === "idle" ? lastResult : null,
})
`
    expect(fires(GATE, code)).toBe(false)
  })

  test("true negative: gated on a fetcher's state", () => {
    const code = `const [form] = useForm({
  lastResult: fetcher.state === "idle" ? fetcher.data : null,
})
`
    expect(fires(GATE, code)).toBe(false)
  })

  test("no false positive: a form that passes no lastResult at all", () => {
    // That is tier 3's finding, not this one's — the two never both fire.
    const code = `const [form] = useForm({ onValidate: fn })\n`
    expect(fires(GATE, code)).toBe(false)
  })

  test("no false positive: lastResult read somewhere that is not useForm", () => {
    expect(fires(GATE, `const shown = lastResult?.status === "error"\n`)).toBe(false)
  })

  test("example files are exempt — a gallery form has no navigation", () => {
    const code = `const [form] = useForm({ lastResult: props.actionData })\n`
    expect(fires(GATE, code, "src/registry/conform-select.examples.tsx")).toBe(false)
  })

  test("known blind spot: options passed as a variable are invisible", () => {
    const code = `const options = { lastResult }\nconst [form] = useForm(options)\n`
    expect(fires(GATE, code)).toBe(false)
  })
})

const INTENT = "intent-buttons-must-not-be-type-button"

describe(INTENT, () => {
  test("true positive: an insert button typed as a plain button", () => {
    const code = component(
      `    <Button type="button" {...form.insert.getButtonProps({ name: fields.items.name })}>Add</Button>`,
    )
    expect(fires(INTENT, code)).toBe(true)
  })

  test("true positive: the same written as an expression", () => {
    const code = component(
      `    <Button type={"button"} {...form.remove.getButtonProps({ name: fields.items.name, index: 0 })}>Remove</Button>`,
    )
    expect(fires(INTENT, code)).toBe(true)
  })

  test("true negative: type=\"submit\"", () => {
    const code = component(
      `    <Button type="submit" {...form.insert.getButtonProps({ name: fields.items.name })}>Add</Button>`,
    )
    expect(fires(INTENT, code)).toBe(false)
  })

  test("true negative: the intent dispatched from a handler instead", () => {
    const code = component(
      `    <Button type="button" onPress={() => form.insert({ name: fields.items.name })}>Add</Button>`,
    )
    expect(fires(INTENT, code)).toBe(false)
  })

  test("no false positive: an ordinary button that submits nothing", () => {
    expect(fires(INTENT, component(`    <Button type="button">Cancel</Button>`))).toBe(false)
  })

  test("known blind spot: no type attribute at all — react-aria defaults to button", () => {
    // The worse case, and the one a syntactic check cannot see. The ripgrep
    // line in the record is the wider net.
    const code = component(
      `    <Button {...form.insert.getButtonProps({ name: fields.items.name })}>Add</Button>`,
    )
    expect(fires(INTENT, code)).toBe(false)
  })
})
