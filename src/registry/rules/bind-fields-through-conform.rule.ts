import type { RuleMeta } from "./types"

/**
 * Forms, tier 1 — the binding between a form value and the control that edits it.
 */
export const bindFieldsThroughConformRule: RuleMeta = {
  id: "bind-fields-through-conform",
  title: "Bind fields through Conform, never by hand",
  navTitle: "Field binding",
  summary:
    "Take the binding off the field metadata: the conform-* variant where one exists, getInputProps (or useInputControl) where it doesn't, and getFormProps on the form element. Per-field useState and a hand-passed name are the failure mode.",
  severity: "error",
  category: "forms",
  tier: 1,
  rationale: [
    "Field metadata carries more than a name. getInputProps derives the name, the id, the form id, required, the default value, aria-invalid, and the aria-describedby that points at the error message. Passing name=\"email\" by hand gets you one of those seven and drops the rest — and because the field still submits, nothing looks broken. What breaks is invisible: the control no longer announces its error, no longer repopulates after a failed submit, and no longer resets with the form.",
    "Per-field useState is the other half of the same mistake. The form already tracks every value, its dirty state, and its errors; a second copy in component state disagrees with the first the moment anything non-trivial happens — a server-side rejection that should refill the form, a reset, a default arriving from a loader. The bug always surfaces later than the code that caused it.",
    "Conform itself permits the manual form — its docs read fields.email.name and fields.email.initialValue off the metadata directly, and the tutorial only reaches for the helpers at the end, to \"minimize the boilerplate\" for native inputs. That is the honest status of this rule: manual access is legal Conform, and it is fine as long as you also wire aria-invalid and aria-describedby yourself. This rule exists because that last part is the part everyone skips, and because ui-lib ships components where the wiring is already done.",
    "Thirteen of the library's components ship a Conform-bound variant, chosen because their binding is subtle enough to be worth wrapping (a Select that has to submit through a hidden input, a DatePicker that has to serialise a calendar value). Everything else you bind yourself with getInputProps, or with useInputControl when the control has no native form value. That is not a worse path — it is the same metadata, read explicitly.",
  ],
  appliesTo: ["app/**/*.{tsx,jsx}", "src/**/*.{tsx,jsx}"],
  replacements: [
    {
      element: "Checkbox",
      use: [{ name: "ConformCheckbox", from: "@/components/conform-checkbox", slug: "conform-checkbox" }],
    },
    {
      element: "TextField / Input",
      use: [{ name: "ConformField", from: "@/components/conform-field", slug: "conform-field", when: "text, email, and password fields" }],
    },
    {
      element: "NumberField",
      use: [{ name: "ConformNumberField", from: "@/components/conform-number-field", slug: "conform-number-field" }],
    },
    {
      element: "Select",
      use: [
        { name: "ConformSelect", from: "@/components/conform-select", slug: "conform-select" },
        { name: "ConformMultipleSelect", from: "@/components/conform-multiple-select", slug: "conform-multiple-select", when: "multiple values" },
        { name: "ConformAsyncSelect", from: "@/components/conform-async-select", slug: "conform-async-select", when: "options load from the server" },
        { name: "ConformAsyncMultipleSelect", from: "@/components/conform-async-multiple-select", slug: "conform-async-multiple-select", when: "both" },
      ],
    },
    {
      element: "DateField / DatePicker",
      use: [
        { name: "ConformDateField", from: "@/components/conform-date-field", slug: "conform-date-field", when: "typed date entry" },
        { name: "ConformDatePicker", from: "@/components/conform-date-picker", slug: "conform-date-picker", when: "a calendar popover" },
      ],
    },
    {
      element: "ColorPicker / ColorSwatchPicker",
      use: [
        { name: "ConformColorPicker", from: "@/components/conform-color-picker", slug: "conform-color-picker" },
        { name: "ConformColorSwatchPicker", from: "@/components/conform-color-swatch-picker", slug: "conform-color-swatch-picker", when: "a fixed palette" },
      ],
    },
    {
      element: "DaySchedule",
      use: [{ name: "ConformDaySchedule", from: "@/components/conform-day-schedule", slug: "conform-day-schedule" }],
    },
    {
      element: "StoragePicker",
      use: [{ name: "ConformStoragePicker", from: "@/components/conform-storage-picker", slug: "conform-storage-picker" }],
    },
    {
      element: "form",
      use: [
        { name: "getFormProps", from: "@conform-to/react", when: "always — it supplies id, onSubmit, noValidate, and the aria-describedby for form-level errors" },
        { name: "Form", from: "react-router", when: "the form posts to a route action, which is where the schema is re-parsed" },
      ],
    },
    {
      element: "Everything else (Slider, TagField, InputOTP, ColorField, DropZone, …)",
      use: [
        { name: "getInputProps", from: "@conform-to/react", when: "the control renders a real input" },
        { name: "useInputControl", from: "@conform-to/react", when: "the control has no native form value — it returns value/change/focus/blur and is what Conform documents for custom inputs" },
      ],
      note: "Twenty-one of the library's form controls have no conform-* variant. Binding them explicitly is expected; reaching for useState instead is not.",
    },
  ],
  examples: [
    {
      title: "A checkbox wired by hand",
      wrong: `const [accepted, setAccepted] = useState(false)
const [error, setError] = useState<string>()

<Checkbox name="terms" isSelected={accepted} onChange={setAccepted} isInvalid={!!error}>
  I accept the terms
</Checkbox>
{error && <p className="text-sm text-red-500">{error}</p>}`,
      right: `import { ConformCheckbox } from "@/components/conform-checkbox"

<ConformCheckbox field={fields.terms} label="I accept the terms" />`,
      note: "The hand-wired version sets one of the seven things the metadata carries. It also has to invent its own error state, which is how the error message ends up unconnected to the control — see the tier 2 rule.",
    },
    {
      title: "The form element itself",
      wrong: `<form id={form.id} onSubmit={form.onSubmit} noValidate>
  {/* fields */}
</form>`,
      right: `import { getFormProps } from "@conform-to/react"
import { Form } from "react-router"

<Form method="post" {...getFormProps(form)}>
  {/* fields */}
</Form>`,
      note: "getFormProps adds the aria-describedby for form-level errors that the hand-written trio leaves off, and React Router's Form posts to the route action — which is where the schema gets parsed by something the user cannot edit.",
    },
    {
      title: "A control with no conform-* variant",
      wrong: `const [volume, setVolume] = useState(50)

<Slider value={volume} onChange={setVolume} />
<input type="hidden" name="volume" value={volume} />`,
      right: `import { useInputControl } from "@conform-to/react"

const volume = useInputControl(fields.volume)

<Slider value={Number(volume.value ?? 0)} onChange={(next) => volume.change(String(next))} />`,
      note: "The hidden-input trick is the tell. useInputControl is the supported way to bind a control that has no native form value, and it keeps the value inside the form's state where reset and lastResult can reach it.",
    },
  ],
  exceptions: [
    {
      scope: "Your copy of the ui-lib component source (components/ui/**)",
      paths: ["components/ui/**", "src/components/**"],
      reason:
        "The conform-* variants are where getInputProps is called and the metadata is spread onto a control. That is the wrapping this rule asks you to use, not a violation of it.",
    },
    {
      scope: "A control whose value never leaves the browser",
      reason:
        "A table filter, a search box that drives a client-side query, a disclosure toggle — these are component state and have no Conform field to bind to. useState is right there. The rule is about controls that are part of a form's submitted value.",
    },
  ],
  enforcement: {
    kind: "lint",
    // Fires on a ui-lib control that is being handed pieces of field metadata
    // directly (name={fields.x.name}, defaultValue={fields.x.initialValue}) —
    // the signature of a binding done by hand where a variant exists.
    selector:
      'JSXOpeningElement[name.name=/^(Checkbox|Select|MultipleSelect|AsyncSelect|AsyncMultipleSelect|NumberField|DateField|DatePicker|ColorPicker|ColorSwatchPicker|DaySchedule|StoragePicker|TextField)$/]:has(JSXExpressionContainer MemberExpression[property.name=/^(name|errors|initialValue|defaultValue|errorId|formId)$/])',
    message:
      "This control is being wired to a Conform field by hand. Use the conform-* variant instead and pass field={fields.x}: Checkbox -> ConformCheckbox, Select -> ConformSelect, NumberField -> ConformNumberField, DatePicker -> ConformDatePicker, TextField/Input -> ConformField (see the full table on the rule page). For controls with no variant, spread getInputProps(field) rather than picking metadata off one property at a time. See https://ui-lib.quebi.de/rules/bind-fields-through-conform",
    grep: "name=\\\\{[a-zA-Z]+\\\\.[a-zA-Z]+\\\\.name\\\\}|useState.*\\\\b(value|checked|selected)\\\\b",
    note: "This is a ui-lib convention, not a Conform requirement — Conform's own examples pick metadata off property by property, which is exactly the shape the check looks for. It fires only on ui-lib control names, so Conform's native-input examples do not trip it. It cannot see a field bound entirely through useState with a literal name; that shape needs review, and it is the common one in code written before the conform-* variants existed.",
  },
  tags: ["forms", "conform", "accessibility", "tier-1"],
}
