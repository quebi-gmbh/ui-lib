import type { RuleMeta } from "./types"

/**
 * Forms, tier 2 — where a field's label, description and error come from.
 */
export const renderFieldTextThroughTheFieldRule: RuleMeta = {
  id: "render-field-text-through-the-field",
  title: "Label, description and error come from the field — not from markup beside it",
  navTitle: "Labels and errors",
  summary:
    "Use the field's own slots: the label/description props on a conform-* variant, Label and Description inside a react-aria field, and for errors either FieldError (inside a field context) or an element carrying id={field.errorId}. A red paragraph next to a control is not attached to it.",
  severity: "error",
  category: "forms",
  tier: 2,
  failureMode:
    "An agent renders the error message as a red paragraph next to the control, because that is what it looks like on screen. The control is left pointing at an id that does not exist, so the one group of users who cannot see the red text is the group that hears nothing.",
  rationale: [
    "An error message is only an error message if the control points at it. getInputProps sets aria-describedby to field.errorId the moment a field is invalid, so if nothing on the page carries that id the attribute dangles: the message is on screen, the screen reader says nothing, and the markup reviews as correct. This is the single most common way an accessible component library ends up in an inaccessible form.",
    "Inside a react-aria field — TextField, NumberField, CheckboxGroup, DatePicker — FieldError does the whole job: it renders with slot=\"errorMessage\", the field owns the id, and it inherits the invalid state so it appears and disappears on its own. react-aria's own FieldError renders null outside such a field, because it needs a FieldErrorContext; ui-lib's wrapper falls back to rendering the message itself, so the same JSX works next to a bare Checkbox, Switch, or Slider. What does not carry over is the id: outside a field nothing generates one, so the message has to carry id={field.errorId} explicitly.",
    "The mirror image is not dangerous, but it is still wrong. Inside a react-aria field, leave the id off the message. The field generates its own ids for the description and error slots and has already pointed the control's aria-describedby at them, and react-aria reads back whatever id the element ends up carrying, so an explicit id={field.errorId} is announced correctly and buys nothing. What it costs is the reader: an id and an aria-describedby that duplicate wiring the field already did read as load-bearing, and the next person to touch the field cannot tell which half is holding it up. Whoever owns the ids does the wiring: the field inside one, you outside one — and \"inside one\" means inside its subtree, so a message rendered as a sibling of a Calendar is outside it and carries its own id.",
    "The same logic covers the label. A placeholder is not a label: it disappears the moment someone types, it is not reliably announced as the accessible name, and at the contrast most themes give it, it is hard to read before it vanishes. Pass the label prop and let the component wire htmlFor and id, which it can do correctly and you can only do repetitively.",
  ],
  appliesTo: ["app/**/*.{tsx,jsx}", "src/**/*.{tsx,jsx}"],
  replacements: [
    {
      element: "A hand-written error message",
      use: [
        { name: "FieldError", from: "@/components/field", slug: "field", when: "inside a react-aria field (TextField, NumberField, CheckboxGroup, DatePicker …)" },
        { name: "id={field.errorId}", from: "@conform-to/react", when: "outside one — the message must carry the id the control already points at" },
      ],
    },
    {
      element: "A hand-written label",
      use: [
        { name: "label prop", from: "@/components/conform-field", slug: "conform-field", when: "on any conform-* variant" },
        { name: "Label", from: "@/components/field", slug: "field", when: "composing a field yourself" },
      ],
    },
    {
      element: "A hand-written hint",
      use: [{ name: "Description", from: "@/components/field", slug: "field" }],
    },
  ],
  examples: [
    {
      title: "An error the control cannot point at",
      source: "src/components/conform-checkbox.tsx (the message had no id while the control already referenced one)",
      sourceFixed: true,
      wrong: `const inputProps = getInputProps(field, { type: "checkbox" })
// inputProps carries aria-describedby={field.errorId} whenever the field is invalid

<Checkbox {...inputProps} isInvalid={hasErrors}>{label}</Checkbox>
{hasErrors && <p className="text-sm text-red-500">{field.errors?.join(", ")}</p>}`,
      right: `<Checkbox
  name={field.name}
  isInvalid={hasErrors}
  aria-describedby={describedBy(hasErrors && field.errorId)}
>
  {label}
</Checkbox>
{hasErrors && <FieldError id={field.errorId}>{field.errors?.join(", ")}</FieldError>}`,
      note: "One attribute. Without it the checkbox announces \"invalid\" and nothing else — the reason is on screen for everyone except the people who most need it read out. The id is explicit because a bare Checkbox is not a react-aria field: nothing generates an id here, and react-aria's own FieldError would render null. ui-lib's FieldError falls back to rendering the message, so the shape is the same one used inside a TextField — but drop the id there, where the field owns it.",
    },
    {
      title: "Inside a react-aria field, FieldError is the fix",
      wrong: `<TextField isInvalid={errors.length > 0}>
  <Label>Email</Label>
  <Input />
  {errors.length > 0 && <p className="mt-1 text-[12px] text-red-500">{errors[0]}</p>}
</TextField>`,
      right: `<TextField isInvalid={errors.length > 0}>
  <Label>Email</Label>
  <Input />
  <FieldError>{errors.join(", ")}</FieldError>
</TextField>`,
      note: "Styled identically, connected differently. FieldError renders into the errorMessage slot the field's aria-describedby already points at, and it hides itself when the field goes valid — two things the paragraph has to be told to do.",
    },
    {
      title: "A placeholder standing in for a label",
      wrong: `<ConformField field={fields.email} placeholder="Email address" />`,
      right: `<ConformField field={fields.email} label="Email address" placeholder="you@example.com" />`,
      note: "The placeholder is the hint, not the name. Once someone starts typing, the labelless version has nothing on screen saying what the value is — which is also what a screen reader had all along.",
    },
  ],
  exceptions: [
    {
      scope: "Your copy of the ui-lib component source (components/ui/**)",
      paths: ["components/ui/**", "src/components/**"],
      reason:
        "The conform-* variants and the field primitives are where this markup is supposed to live — they are the layer that renders the label, the description, and the error, and wires the ids between them.",
    },
    {
      scope: "A form-level error summary that belongs to no single field",
      reason:
        "\"Your session expired, please sign in again\" is not a field error. Render it once at the top of the form in a live region, pointed at by the form's own aria-describedby (getFormProps supplies it), rather than trying to attach it to a control.",
    },
  ],
  enforcement: {
    kind: "lint",
    // A p/span/div rendering field errors with no id for the control's
    // aria-describedby to resolve to. Three parts, each earning its place
    // (tests/forms.test.ts covers all of them):
    //  - `until JsxElement()` stops the search at the next element, so the
    //    report lands on the message and not on every wrapper around it;
    //  - the id guard is what lets the correct version pass;
    //  - the .errors.length guard keeps it off "{errors.length} problems found",
    //    which is a count, not a message.
    biome: {
      via: "plugin",
      pattern: `JsxElement(opening_element = $open, children = $children) as $message where {
  $open <: JsxOpeningElement(name = $el, attributes = $attrs),
  $el <: r"^(?:p|span|div)$",
  $children <: contains \`$field.errors\` until JsxElement(),
  $children <: not contains \`$field.errors.length\`,
  $attrs <: not contains JsxAttribute(name = r"^id$")`,
    },
    message:
      "This renders field errors in an element the control cannot reference. Inside a react-aria field use <FieldError> from @/components/field; outside one, put id={field.errorId} on this element so the aria-describedby that getInputProps already emits resolves to it. See https://ui-lib.quebi.de/rules/render-field-text-through-the-field",
    grep: "<(p|span|div)[^>]*>\\s*\\{[a-zA-Z]+\\.errors",
    note: "The check finds error text in an element with no id; it cannot tell whether you are inside a react-aria field, which is what decides between FieldError and an explicit id. It does not look at labels at all — a placeholder standing in for a label stays a review question, worth looking for whenever you touch a form.",
  },
  tags: ["forms", "conform", "accessibility", "aria", "tier-2"],
}
