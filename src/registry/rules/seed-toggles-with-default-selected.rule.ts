import type { RuleMeta } from "./types"

/**
 * Forms, tier 4 — the check behind tier 1's "onto a component, name the props".
 * Two controls drop the spread in complete silence; this is the one that fires.
 */
export const seedTogglesWithDefaultSelectedRule: RuleMeta = {
  id: "seed-toggles-with-default-selected",
  title: "Never spread getInputProps onto a Checkbox or Switch",
  navTitle: "Toggle defaults",
  summary:
    "getInputProps emits the DOM names, defaultChecked and required; react-aria's Checkbox and Switch read defaultSelected (and isRequired, on Checkbox) and drop the others without a word. Use ConformCheckbox or ConformSwitch.",
  severity: "error",
  category: "forms",
  tier: 4,
  failureMode:
    "An agent spreads `getInputProps(field, { type: \"checkbox\" })` onto a `<Checkbox>` because that is how a real `<input>` is bound and the spread is the shortest thing that type-checks. It compiles, renders, warns about nothing — and the box comes back unticked after a failed submit, because the prop that carried the state was discarded on the way in.",
  rationale: [
    "This is a naming collision, not a Conform bug and not a react-aria bug. `getInputProps(field, { type: \"checkbox\" })` returns the DOM attribute names — `defaultChecked` and `required` — because it is written for a real `<input>`. react-aria's Checkbox takes `defaultSelected` and `isRequired`; its Switch takes `defaultSelected` and has no `isRequired` at all, on the grounds that a switch is never unfilled. `filterDOMProps` strips whatever it does not recognise before the props reach the DOM, so the mismatched names simply cease to exist.",
    "Every layer that could have caught it is looking the other way. A JSX spread skips excess-property checking, so TypeScript accepts it (written out by hand the same props give TS2322). React never sees the extra attributes, so there is no unknown-prop warning. The attributes never reach the DOM, so there is nothing to notice in the inspector. The only symptom is behavioural, it appears one round trip later, and it looks like Conform failed to repopulate rather than like the control threw the value away.",
    "Tier 1 states the principle — spread `getInputProps` onto a real `<input>`; onto a component, name the props — but its check cannot see this shape. That check looks for metadata picked off one property at a time (`name={fields.x.name}`), and a spread hands the whole object over without naming anything. This rule is the check for the case where the principle is violated invisibly.",
    "The rule is deliberately two component names wide. The rest of the library was checked rather than assumed: TextField, SearchField, ColorField and RadioGroup take the spread happily (react-aria is uncontrolled through `defaultValue`), Select and ComboBox type `defaultValue` and accept it, and NumberField, Slider, CheckboxGroup, DateField and DatePicker already reject the spread with TS2322 — the type system carries the rule for them. Checkbox and Switch are the only two where the props are wrong *and* nothing says so.",
    "Beware the remedy that mirrors the toggle into a hidden `<input type=\"hidden\" name=\"terms\">` next to it. Two controls with the same name post twice, and Conform's parser reads `{\"terms\":[\"on\",\"on\"]}` — a value your schema will reject in a way that points nowhere near the cause. No library component does this; it is only reachable by hand-rolling the fix, and the hidden input is banned in app code anyway. Use the variant instead.",
  ],
  appliesTo: ["app/**/*.{tsx,jsx}", "src/**/*.{tsx,jsx}"],
  replacements: [
    {
      element: "Checkbox",
      use: [
        {
          name: "ConformCheckbox",
          from: "@/components/conform-checkbox",
          slug: "conform-checkbox",
          when: "a single boolean",
        },
        {
          name: "ConformCheckboxGroup",
          from: "@/components/conform-checkbox-group",
          slug: "conform-checkbox-group",
          when: "several values under one name",
        },
      ],
    },
    {
      element: "Switch",
      use: [
        {
          name: "ConformSwitch",
          from: "@/components/conform-switch",
          slug: "conform-switch",
        },
      ],
      note: "ConformSwitch reads `defaultSelected` off `field.defaultChecked` and leaves required to the schema, because react-aria's Switch has no isRequired to pass it to.",
    },
  ],
  examples: [
    {
      title: "A checkbox bound by spreading getInputProps",
      wrong: `<Checkbox {...getInputProps(fields.terms, { type: "checkbox" })}>
  I accept the terms
</Checkbox>`,
      right: `import { ConformCheckbox } from "@/components/conform-checkbox"

<ConformCheckbox field={fields.terms} label="I accept the terms" />`,
      note: "The wrong version is not obviously wrong, which is the whole problem: it is the same shape that binds a real <input> correctly. name, form and aria-describedby do arrive — react-aria merges rather than clobbers — so the field submits and announces its error. Only the initial state is missing.",
    },
    {
      title: "Writing a toggle wrapper of your own",
      wrong: `export function MyToggle({ field }: { field: FieldMetadata<boolean> }) {
  return <Switch {...getInputProps(field, { type: "checkbox" })}>Notify me</Switch>
}`,
      right: `export function MyToggle({ field }: { field: FieldMetadata<boolean> }) {
  return (
    <Switch name={field.name} form={field.formId} value="on" defaultSelected={field.defaultChecked}>
      Notify me
    </Switch>
  )
}`,
      note: "This is what ConformSwitch does, and the reason the rule excepts the library layer: inside a wrapper you own, naming the props is the fix. In app code that wrapper already exists — reach for it rather than writing this one again.",
    },
  ],
  exceptions: [
    {
      scope: "Your copy of the ui-lib component source (components/ui/**)",
      paths: ["src/components/**", "components/ui/**"],
      reason:
        "That is the layer that reads the metadata off the field and names it onto a control. ConformCheckbox and ConformSwitch are the fix this rule points at, not instances of the problem.",
    },
  ],
  enforcement: {
    kind: "lint",
    // The spread has to be matched as a node: `contains `getInputProps($f, $o)``
    // does not reach through a JsxSpreadAttribute. A `defaultSelected` on the
    // same element means the seed was named after all, which is what a wrapper
    // of your own does, so the check steps aside for it.
    biome: {
      via: "plugin",
      pattern: `or {
  JsxOpeningElement(name = $el, attributes = $attrs),
  JsxSelfClosingElement(name = $el, attributes = $attrs)
} as $control where {
  $el <: r"^(?:Checkbox|Switch)$",
  $attrs <: contains JsxSpreadAttribute(argument = \`getInputProps($field, $options)\`),
  $attrs <: not contains JsxAttribute(name = \`defaultSelected\`)`,
    },
    message:
      "react-aria's Checkbox and Switch do not read the defaultChecked and required that getInputProps emits — filterDOMProps drops both silently, so the control renders unchecked after a failed submit. Use <ConformCheckbox field={fields.x} /> or <ConformSwitch field={fields.x} />; inside a wrapper of your own, name the props instead of spreading (defaultSelected={field.defaultChecked}). See https://ui-lib.quebi.de/rules/seed-toggles-with-default-selected",
    grep: "<(Checkbox|Switch)[^>]*\\{\\.\\.\\.getInputProps\\(",
    note: "The check reads the spread where it is written, so a getInputProps() result assigned to a local first is invisible to it — the same blind spot the other form plugins document. A `defaultSelected` prop anywhere on the same element satisfies it: the check is looking for the missing seed, which is the half with a visible symptom, and it is what tells a wrapper that names its props apart from a spread that names nothing.",
  },
  tags: ["forms", "conform", "react-aria", "tier-4"],
}
