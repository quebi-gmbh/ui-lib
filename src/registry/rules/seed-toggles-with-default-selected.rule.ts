import type { RuleMeta } from "./types"

/**
 * Forms, tier 4 — the one prop name that getInputProps and react-aria disagree
 * about. Everything else survives the spread; these two do not.
 */
export const seedTogglesWithDefaultSelectedRule: RuleMeta = {
  id: "seed-toggles-with-default-selected",
  title: "Seed a Checkbox or Switch with defaultSelected, not the spread alone",
  navTitle: "Toggle defaults",
  summary:
    "getInputProps emits defaultChecked and required; react-aria's Checkbox and Switch read defaultSelected and isRequired and drop the other two without a word. Use ConformCheckbox, or add both props after the spread.",
  severity: "error",
  category: "forms",
  tier: 4,
  failureMode:
    "An agent spreads `getInputProps(field, { type: \"checkbox\" })` onto a `<Checkbox>` because that is how every other control in the form is bound, and it works for every other control in the form. Here it compiles, renders, warns about nothing — and the box comes back unticked after a failed submit, because the two props that carry the state were silently discarded.",
  rationale: [
    "This is a naming collision, not a Conform bug and not a react-aria bug. `getInputProps(field, { type: \"checkbox\" })` returns the DOM attribute names — `defaultChecked` and `required` — because it is written for a real `<input>`. react-aria's Checkbox and Switch take `defaultSelected` and `isRequired`, and `filterDOMProps` strips anything it does not recognise before the props reach the DOM. Neither name survives, and nothing anywhere reports it.",
    "Every layer that could have caught it is looking the other way. A JSX spread skips excess-property checking, so TypeScript accepts it (written out by hand the same props give TS2322). React never sees the extra attributes, so there is no unknown-prop warning. The attributes never reach the DOM, so there is nothing to notice in the inspector. The only symptom is behavioural, it appears one round trip later, and it looks like Conform failed to repopulate rather than like the control threw the value away.",
    "The rule is deliberately two component names wide. The rest of the library was checked rather than assumed: TextField, SearchField, ColorField and RadioGroup take the spread happily (react-aria is uncontrolled through `defaultValue`), Select and ComboBox type `defaultValue` and accept it, and NumberField, Slider, CheckboxGroup, DateField and DatePicker already reject the spread with TS2322 — the type system carries the rule for them. Checkbox and Switch are the only two where the props are wrong *and* nothing says so.",
    "Beware the remedy that mirrors the toggle into a hidden `<input type=\"hidden\" name=\"terms\">` next to it. Two controls with the same name post twice, and Conform's parser reads `{\"terms\":[\"on\",\"on\"]}` — a value your schema will reject in a way that points nowhere near the cause. No library component does this; it is only reachable by hand-rolling the fix, and the hidden input is banned in app code anyway. Pass the two props instead.",
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
          when: "always — it is this rule, already written down",
        },
      ],
    },
    {
      element: "Switch",
      use: [
        {
          name: "Switch",
          from: "@/components/switch",
          slug: "switch",
          when:
            "there is no conform-* variant yet, so keep the spread and add defaultSelected={field.defaultChecked} and isRequired={field.required ?? false} after it",
        },
      ],
      note: "The two props have to come *after* the spread, or the spread overwrites them with the names react-aria ignores.",
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
      note: "The wrong version is not obviously wrong, which is the whole problem: it is the same shape that binds a TextField correctly. name, form and aria-describedby do arrive — react-aria merges rather than clobbers — so the field submits and announces its error. Only the initial state is missing.",
    },
    {
      title: "A Switch, which has no conform-* variant",
      wrong: `<Switch {...getInputProps(fields.notify, { type: "checkbox" })}>
  Email me about releases
</Switch>`,
      right: `<Switch
  {...getInputProps(fields.notify, { type: "checkbox" })}
  defaultSelected={field.defaultChecked}
  isRequired={field.required ?? false}
>
  Email me about releases
</Switch>`,
      note: "Those two lines are copied from ConformCheckbox, which does exactly this. Binding a Switch by hand is fine; binding it without them is the bug.",
    },
  ],
  exceptions: [
    {
      scope: "Your copy of the ui-lib component source (components/ui/**)",
      paths: ["src/components/**", "components/ui/**"],
      reason:
        "This is the layer that spreads getInputProps onto a control and adds the two props afterwards — ConformCheckbox is the fix, not an instance of the problem.",
    },
  ],
  enforcement: {
    kind: "lint",
    // The spread has to be matched as a node: `contains `getInputProps($f, $o)``
    // does not reach through a JsxSpreadAttribute. Both element forms are
    // matched because a bound toggle is as often self-closing as not.
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
      "react-aria's Checkbox and Switch read defaultSelected and isRequired; getInputProps emits defaultChecked and required, and both are dropped silently — the control renders unchecked after a failed submit. Use <ConformCheckbox field={fields.x} /> from @/components/conform-checkbox, or add defaultSelected={field.defaultChecked} and isRequired={field.required ?? false} after the spread. See https://ui-lib.quebi.de/rules/seed-toggles-with-default-selected",
    grep: "<(Checkbox|Switch)[^>]*\\{\\.\\.\\.getInputProps\\(",
    note: "The check reads the spread where it is written. A getInputProps() result assigned to a local first — `const inputProps = getInputProps(field, ...)`, which is the shape ConformCheckbox itself uses — is invisible to it, the same blind spot the other form plugins document. A `defaultSelected` prop anywhere on the same element satisfies it, so a toggle that seeds the default and forgets `isRequired` passes: the check is looking for the missing seed, which is the half with a visible symptom.",
  },
  tags: ["forms", "conform", "react-aria", "tier-4"],
}
