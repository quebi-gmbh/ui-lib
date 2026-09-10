import type { RuleMeta } from "./types"

/**
 * Forms, tier 1 — the binding between a form value and the control that edits it.
 */
export const bindFieldsThroughConformRule: RuleMeta = {
  id: "bind-fields-through-conform",
  title: "Bind fields through Conform, never by hand",
  navTitle: "Field binding",
  summary:
    "Take the binding off the field metadata: the conform-* variant, which every submittable control now has, getInputProps (or useControl) for anything else, and getFormProps on the form element. Per-field useState and a hand-passed name are the failure mode.",
  severity: "error",
  category: "forms",
  tier: 1,
  failureMode:
    "An agent wires a form field the way it has seen a thousand times — `useState`, `value`, `onChange`, a literal `name` — instead of reading the binding off the field metadata. The form still submits, so nothing looks broken; what is missing is the error wiring, the default value, and the repopulation after a failed submit.",
  rationale: [
    "Field metadata carries more than a name. getInputProps derives the name, the id, the form id, required, the default value, aria-invalid, and the aria-describedby that points at the error message. Passing name=\"email\" by hand gets you one of those seven and drops the rest — and because the field still submits, nothing looks broken. What breaks is invisible: the control no longer announces its error, no longer repopulates after a failed submit, and no longer resets with the form.",
    "Per-field useState is the other half of the same mistake. The form already tracks every value, its dirty state, and its errors; a second copy in component state disagrees with the first the moment anything non-trivial happens — a server-side rejection that should refill the form, a reset, a default arriving from a loader. The bug always surfaces later than the code that caused it.",
    "Conform itself permits the manual form — its docs read fields.email.name and fields.email.initialValue off the metadata directly, and the tutorial only reaches for the helpers at the end, to \"minimize the boilerplate\" for native inputs. That is the honest status of this rule: manual access is legal Conform, and it is fine as long as you also wire aria-invalid and aria-describedby yourself. This rule exists because that last part is the part everyone skips, and because ui-lib ships components where the wiring is already done.",
    "Twenty-nine of the library's components ship a Conform-bound variant — every control that produces a submittable value. That is deliberate: this rule used to send you to \"bind it by hand\" for most of the library, which is the path the rule itself calls the failure mode. What is left without a variant is a sub-part of another control (a ColorArea channel, a ListBox, a TagGroup) rather than a field of its own; bind those yourself with getInputProps, or with useControl when the control has no native form value. That is not a worse path — it is the same metadata, read explicitly.",
    "Reading the metadata explicitly does not mean spreading getInputProps onto a react-aria control. The helper returns the DOM names — required, defaultChecked, min, max — and react-aria takes isRequired, defaultSelected, minValue, maxValue. A JSX spread skips excess-property checking, so the mismatched half is dropped by filterDOMProps with no type error, no React warning, and no attribute left in the DOM: a Switch renders off after a failed submit, a NumberField silently forgets the schema's bounds. Spread getInputProps onto a real <input>; onto a component, name the props.",
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
      element: "Switch",
      use: [{ name: "ConformSwitch", from: "@/components/conform-switch", slug: "conform-switch" }],
    },
    {
      element: "RadioGroup",
      use: [{ name: "ConformRadioGroup", from: "@/components/conform-radio-group", slug: "conform-radio-group" }],
    },
    {
      element: "Textarea",
      use: [{ name: "ConformTextarea", from: "@/components/conform-textarea", slug: "conform-textarea" }],
    },
    {
      element: "CheckboxGroup",
      use: [{ name: "ConformCheckboxGroup", from: "@/components/conform-checkbox-group", slug: "conform-checkbox-group", when: "a set of values under one name — ConformCheckbox binds a single boolean" }],
    },
    {
      element: "ComboBox",
      use: [{ name: "ConformComboBox", from: "@/components/conform-combo-box", slug: "conform-combo-box" }],
    },
    {
      element: "Slider",
      use: [{ name: "ConformSlider", from: "@/components/conform-slider", slug: "conform-slider", when: "single and range values alike — the name goes on the thumb" }],
    },
    {
      element: "SearchField",
      use: [{ name: "ConformSearchField", from: "@/components/conform-search-field", slug: "conform-search-field", when: "the query is part of a submitted form, not a client-side filter" }],
    },
    {
      element: "TimeField",
      use: [{ name: "ConformTimeField", from: "@/components/conform-time-field", slug: "conform-time-field", when: "always — react-aria renders no form control for a TimeField, so a bare name submits nothing" }],
    },
    {
      element: "DateRangePicker / RangeCalendar",
      use: [
        { name: "ConformDateRangePicker", from: "@/components/conform-date-range-picker", slug: "conform-date-range-picker", when: "a calendar popover" },
        { name: "ConformRangeCalendar", from: "@/components/conform-range-calendar", slug: "conform-range-calendar", when: "the calendar stays on screen" },
      ],
    },
    {
      element: "Calendar",
      use: [{ name: "ConformCalendar", from: "@/components/conform-calendar", slug: "conform-calendar", when: "an always-visible calendar — ConformDatePicker covers the popover case" }],
    },
    {
      element: "ColorField",
      use: [{ name: "ConformColorField", from: "@/components/conform-color-field", slug: "conform-color-field" }],
    },
    {
      element: "TagField",
      use: [{ name: "ConformTagField", from: "@/components/conform-tag-field", slug: "conform-tag-field" }],
    },
    {
      element: "InputOTP",
      use: [{ name: "ConformInputOTP", from: "@/components/conform-input-otp", slug: "conform-input-otp" }],
    },
    {
      element: "ChoiceBox",
      use: [{ name: "ConformChoiceBox", from: "@/components/conform-choice-box", slug: "conform-choice-box" }],
    },
    {
      element: "FileTrigger / DropZone",
      use: [{ name: "ConformFileTrigger", from: "@/components/conform-file-trigger", slug: "conform-file-trigger", when: "always — FileTrigger has no name and filterDOMProps drops one silently" }],
    },
    {
      element: "form",
      use: [
        { name: "getFormProps", from: "@conform-to/react", when: "always — it supplies id, onSubmit, noValidate, and the aria-describedby for form-level errors" },
        { name: "Form", from: "react-router", when: "the form posts to a route action, which is where the schema is re-parsed" },
      ],
    },
    {
      element: "Anything with no conform-* variant (a control you built, a sub-part like ColorArea or ListBox)",
      use: [
        { name: "getInputProps", from: "@conform-to/react", when: "you are rendering a real <input> — spread it there, not onto a react-aria component, whose prop names differ" },
        { name: "useControl", from: "@conform-to/react/future", when: "the control has no native form value — it returns value/checked/options/files/change/focus/blur and pairs with BaseControl, which renders the hidden input the control needs" },
      ],
      note: "Every library control that produces a submittable value now has a variant, so this is the path for your own components and for sub-parts of a control (a ColorArea binds two channels, a ListBox renders another control's options). Binding them explicitly is expected; reaching for useState instead is not.",
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
      title: "A slider wired by hand",
      wrong: `const [volume, setVolume] = useState(50)

<Slider value={volume} onChange={setVolume} />
<input type="hidden" name="volume" value={volume} />`,
      right: `import { ConformSlider } from "@/components/conform-slider"

<ConformSlider field={fields.volume} label="Volume" maxValue={100} />`,
      note: "The hidden-input trick is the tell: the value lives in component state, so it does not come back after a failed submit and does not reset with the form. The variant also knows the thing the hand-written version gets wrong — the name belongs on the SliderThumb, which is where react-aria renders the real range input; a name on the Slider goes nowhere.",
    },
    {
      title: "getInputProps spread onto a react-aria control",
      wrong: `<Switch {...getInputProps(fields.notify, { type: "checkbox" })}>
  Email notifications
</Switch>`,
      right: `import { ConformSwitch } from "@/components/conform-switch"

<ConformSwitch field={fields.notify} label="Email notifications" />`,
      note: "This one type-checks, renders, and is wrong. getInputProps returns defaultChecked and required — the DOM names — and react-aria's Switch takes neither, so filterDOMProps drops both: no TS error (JSX spread skips excess-property checking), no React warning, no stray attribute, and a switch that renders off after every failed submit. Spread getInputProps onto a real <input>. Onto a component, name the props — or use the variant that already has.",
    },
  ],
  exceptions: [
    {
      scope: "Your copy of the ui-lib component source (components/ui/**)",
      paths: ["components/ui/**", "src/components/**"],
      reason:
        "The conform-* variants are where the metadata is read off the field and put onto a control. That is the wrapping this rule asks you to use, not a violation of it.",
    },
    {
      scope: "A control whose value never leaves the browser",
      reason:
        "A table filter, a search box that drives a client-side query, a disclosure toggle — these are component state and have no Conform field to bind to. useState is right there. The rule is about controls that are part of a form's submitted value.",
    },
  ],
  enforcement: {
    kind: "lint",
    // Fires on a ui-lib control being handed pieces of field metadata directly
    // (name={fields.x.name}, defaultValue={fields.x.initialValue}) — the
    // signature of a binding done by hand where a variant exists. Both element
    // forms are matched, since a bound control is as often self-closing.
    biome: {
      via: "plugin",
      pattern: `or {
  JsxOpeningElement(name = $el, attributes = $attrs),
  JsxSelfClosingElement(name = $el, attributes = $attrs)
} as $control where {
  $el <: r"^(?:Calendar|Checkbox|CheckboxGroup|ChoiceBox|ColorField|ColorPicker|ColorSwatchPicker|ComboBox|DateField|DatePicker|DateRangePicker|DaySchedule|InputOTP|MultipleSelect|AsyncMultipleSelect|AsyncSelect|NumberField|RadioGroup|RangeCalendar|SearchField|Select|Slider|StoragePicker|Switch|TagField|Textarea|TextField|TimeField)$",
  $attrs <: contains or { \`$meta.name\`, \`$meta.errors\`, \`$meta.initialValue\`, \`$meta.errorId\`, \`$meta.formId\` }`,
    },
    message:
      "This control is being wired to a Conform field by hand. Use the conform-* variant and pass field={fields.x}: every control that submits a value has one — Checkbox -> ConformCheckbox, Switch -> ConformSwitch, Select -> ConformSelect, RadioGroup -> ConformRadioGroup, Textarea -> ConformTextarea, Slider -> ConformSlider, TimeField -> ConformTimeField, FileTrigger -> ConformFileTrigger, TextField/Input -> ConformField. For a control you built yourself, spread getInputProps(field) onto its real <input>, or use useControl from @conform-to/react/future when it has none — do not pick metadata off one property at a time. See https://ui-lib.quebi.de/rules/bind-fields-through-conform",
    grep: "name=\\{[a-zA-Z]+\\.[a-zA-Z]+\\.name\\}",
    note: "FileTrigger and DropZone are deliberately absent from the element list even though they have a variant: neither takes a `name`, so the hand-bound shape is a hidden input beside them, which this check cannot see — and the `$meta.name` half of the pattern matches any `x.name` member access, so listing DropZone fires on `item.name` inside an onDrop handler. This is a ui-lib convention, not a Conform requirement — Conform's own examples pick metadata off property by property, which is exactly the shape the check looks for. It fires only on ui-lib control names, so Conform's native-input examples do not trip it. It cannot see a field bound entirely through useState with a literal name; that shape needs review, and it is the common one in code written before the conform-* variants existed.",
  },
  tags: ["forms", "conform", "accessibility", "tier-1"],
}
