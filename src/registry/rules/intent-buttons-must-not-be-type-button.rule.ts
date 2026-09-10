import type { RuleMeta } from "./types"

/**
 * Forms, tier 6 — the intent buttons that drive Conform's array operations, and
 * the one attribute that decides whether they do anything at all.
 */
export const intentButtonsMustNotBeTypeButtonRule: RuleMeta = {
  id: "intent-buttons-must-not-be-type-button",
  title: "An intent button submits — never type=\"button\"",
  navTitle: "Intent buttons",
  summary:
    "getButtonProps supplies name, value, form and formNoValidate, but never type. A Conform intent button has to be type=\"submit\": with type=\"button\" no submit event fires and the insert, remove or reorder is dropped in silence.",
  severity: "error",
  category: "forms",
  tier: 6,
  failureMode:
    "An agent writes `type=\"button\"` on anything that is not the form's primary action, because that is the habit that stops stray buttons submitting a form. On a Conform intent button it is the one attribute that has to be the other value, and getButtonProps does not supply it — so the rule of thumb quietly disables the feature.",
  rationale: [
    "The intent travels on the submitter, and only a submitter has one. `form.insert.getButtonProps({ name: fields.items.name })` returns `{ name, value, form, formNoValidate }` — everything except the type, which comes from your JSX. Conform reads the intent back off `event.submitter`, and its own `isSubmitter` check is `element.type === 'submit'`. A `type=\"button\"` control never fires a submit event at all, so `form.onSubmit` does not run, the intent is never parsed, and the row is never added.",
    "There is no error to see. Nothing throws, nothing warns, nothing appears in the console: the button presses, the ripple runs, and the list does not change. (Force the same props onto a submission another way and Conform's getFormData throws `The submitter must be an input or button element with type submit` — which is the diagnostic this rule exists to give you before you get there.)",
    "react-aria's Button makes the trap easier to fall into, because its default type is `button`. A quebi `<Button {...form.insert.getButtonProps(...)}>` with no type attribute at all is broken in exactly the same way as one that says so — this check can only see the explicit case, which is why the rule is written as \"an intent button submits\" and not as \"do not write type=button\".",
    "Calling the operation as a function is the other correct shape and needs no attribute at all: `form.insert({ name: fields.items.name })` from an onPress handler builds its own submitter internally with `document.createElement('button')`, which defaults to type=submit. Reach for it when the control cannot be a submit button; do not reach for the props and then take the submit away.",
  ],
  appliesTo: ["app/**/*.{tsx,jsx}", "src/**/*.{tsx,jsx}"],
  replacements: [
    {
      element: "Button",
      use: [
        {
          name: "Button",
          from: "@/components/button",
          slug: "button",
          when: "keep the component, change the attribute: type=\"submit\" plus the getButtonProps spread",
        },
      ],
      note: "react-aria's Button defaults to type=\"button\", so an intent button has to say type=\"submit\" out loud even when no other button in the form does.",
    },
  ],
  examples: [
    {
      title: "An intent button that never submits",
      wrong: `<Button
  type="button"
  intent="outline"
  {...form.insert.getButtonProps({ name: fields.items.name })}
>
  Add item
</Button>`,
      right: `<Button
  type="submit"
  intent="outline"
  {...form.insert.getButtonProps({ name: fields.items.name })}
>
  Add item
</Button>`,
      note: "One word. The spread already carries formNoValidate, so submitting to add a row does not trip the form's own validation on the way.",
    },
    {
      title: "When the control really cannot submit",
      wrong: `<MenuItem
  type="button"
  {...form.remove.getButtonProps({ name: fields.items.name, index })}
>
  Remove
</MenuItem>`,
      right: `<MenuItem onAction={() => form.remove({ name: fields.items.name, index })}>
  Remove
</MenuItem>`,
      note: "Called as a function, Conform builds its own submitter — a real button with type=submit — appends it, clicks it, and removes it again. The intent arrives without the control having to be a submit button at all.",
    },
  ],
  exceptions: [
    {
      scope: "A control that must not submit, dispatching the intent from its handler instead",
      reason:
        "If a button genuinely cannot be type=\"submit\" — it sits inside another form's markup, or a parent owns submission — call form.insert(...) from the handler rather than spreading getButtonProps: Conform's dispatch builds its own submitter and the intent still arrives. Spreading the props and keeping type=\"button\" is the one combination that silently does nothing, so if a case really needs it, suppress it with the reason written out.",
    },
  ],
  enforcement: {
    kind: "lint",
    // The spread is matched by regex on the whole attribute: a `contains
    // `...getButtonProps($args)`` clause does not reach through a
    // JsxSpreadAttribute. `initializer` binds the whole `={...}` clause, so the
    // type attribute is read the same way.
    biome: {
      via: "plugin",
      pattern: `or {
  JsxOpeningElement(name = $el, attributes = $attrs),
  JsxSelfClosingElement(name = $el, attributes = $attrs)
} as $node where {
  $attrs <: contains JsxSpreadAttribute() as $spread,
  $spread <: r".*\\.(?:insert|remove|reorder|reset|update|validate)\\.getButtonProps\\(.*",
  $attrs <: contains JsxAttribute(name = \`type\`, initializer = $init),
  $init <: r".*button.*"`,
    },
    message:
      "A Conform intent button has to be type='submit': getButtonProps supplies name, value, form and formNoValidate but never the type, and a type='button' control fires no submit event, so the insert/remove/reorder is dropped silently. Change it to type='submit', or call form.insert(...) from onPress instead of spreading the props. See https://ui-lib.quebi.de/rules/intent-buttons-must-not-be-type-button",
    grep: "getButtonProps\\(",
    note: "It sees only the explicit attribute. The worse case — a react-aria Button with the spread and no type at all, which defaults to type=\"button\" and is just as broken — is invisible to a syntactic check, so the ripgrep line is the wider net: every getButtonProps call is worth a look at the type next to it. The spread is matched textually, so an intent taken off the form into a local variable first escapes it.",
  },
  tags: ["forms", "conform", "tier-6"],
}
