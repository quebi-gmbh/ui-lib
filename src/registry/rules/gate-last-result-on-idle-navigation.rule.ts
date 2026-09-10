import type { RuleMeta } from "./types"

/**
 * Forms, tier 5 — handing the action's result back to Conform, but only once
 * the router has caught up with it.
 */
export const gateLastResultOnIdleNavigationRule: RuleMeta = {
  id: "gate-last-result-on-idle-navigation",
  title: "Gate lastResult on an idle navigation",
  navTitle: "Gating lastResult",
  summary:
    "Pass lastResult only while the navigation is idle — `navigation.state === \"idle\" ? lastResult : null`. Conform re-reports the result on every render, so an ungated one is applied before React Router has finished revalidating the loader data behind it.",
  severity: "error",
  category: "forms",
  tier: 5,
  failureMode:
    "An agent wires the action result back with `useForm({ lastResult })`, because that is the shape every tutorial shows and it visibly works. What it skips is the one-line guard the framework integration documents, and the bug it leaves behind only appears on a form whose defaults come from a loader.",
  rationale: [
    "Conform re-applies lastResult on every render, not once per submission. `useForm` runs its update in a layout effect with no dependency array, so the effect fires on every render and reports the result again whenever its identity has changed. That is not a leak — it is what makes a second server rejection render — but it means the timing of *when* the result is applied is the caller's problem.",
    "React Router revalidates loader data after an action, and the two do not finish together. If the form's defaultValue comes from a loader and the action resets the form, Conform applies the reset against the loader data it can see now, which is still the old data — so the form snaps back to the previous default value and then sits there looking authoritative. Gating on `navigation.state === \"idle\"` holds the result until the revalidation has landed. This is what conform.guide's Remix integration does, and the reason it gives.",
    "The guard is cheap and the failure is not. A form that resets to a stale default after a successful save is a data-loss bug wearing the costume of a UI glitch: the user sees their old values back on screen, retypes them, and submits again. `fetcher.state` is the same guard for a form submitted through a fetcher.",
    "What this rule is *not* about is stale errors surviving a redirect. `useForm` guards its own report with `options.lastResult &&`, so a null or undefined result is never re-reported and a Post/Redirect/Get is safe without any of this.",
  ],
  appliesTo: ["app/**/*.{tsx,jsx}", "src/**/*.{tsx,jsx}"],
  examples: [
    {
      title: "The result handed straight to useForm",
      wrong: `const lastResult = useActionData<typeof action>()
const [form, fields] = useForm({
  lastResult,
  onValidate: ({ formData }) => parseWithValibot(formData, { schema: signupSchema }),
})`,
      right: `const lastResult = useActionData<typeof action>()
const navigation = useNavigation()
const [form, fields] = useForm({
  lastResult: navigation.state === "idle" ? lastResult : null,
  onValidate: ({ formData }) => parseWithValibot(formData, { schema: signupSchema }),
})`,
      note: "Verbatim from conform.guide's Remix integration, down to the null rather than undefined. While the navigation is anything but idle, Conform is handed nothing and leaves the form alone.",
    },
    {
      title: "The same form submitted through a fetcher",
      wrong: `const fetcher = useFetcher<typeof action>()
const [form, fields] = useForm({ lastResult: fetcher.data })`,
      right: `const fetcher = useFetcher<typeof action>()
const [form, fields] = useForm({
  lastResult: fetcher.state === "idle" ? fetcher.data : null,
})`,
      note: "A fetcher has its own state, and its own revalidation to wait for. The guard is the same shape; only the thing being asked changes.",
    },
  ],
  exceptions: [
    {
      scope: "Gallery, story and example files",
      paths: ["**/*.stories.{tsx,jsx}", "**/*.examples.{tsx,jsx}"],
      reason:
        "A rendered example has no route action and no navigation to be idle, so there is nothing to gate. The conform-* examples in this repo are demonstrations of a binding, not a template for a routed form.",
    },
    {
      scope: "A form whose defaults do not come from a loader",
      reason:
        "The race is between the action result and the revalidated loader data. With no loader behind the form there is no second source to disagree with, and the guard is defensive rather than load-bearing — write it anyway if the form might grow one, but this is the honest scope of the failure.",
    },
  ],
  enforcement: {
    kind: "lint",
    // Both spellings of the option have to be matched: `{ lastResult }` is the
    // common one and is a shorthand member, not a property with a value, so a
    // pattern that only reads values misses exactly the shape people write.
    biome: {
      via: "plugin",
      pattern: `\`useForm($options)\` as $call where {
  $options <: JsObjectExpression(),
  $options <: contains bubble or {
    JsPropertyObjectMember(name = $name, value = $value) where {
      $name <: \`lastResult\`,
      $value <: not contains \`navigation.state\`,
      $value <: not contains \`fetcher.state\`
    },
    JsShorthandPropertyObjectMember(name = $name) where { $name <: \`lastResult\` }
  }`,
    },
    message:
      "lastResult is applied on every render, so an ungated one lands before React Router has revalidated the loader data behind the form — a form with loader defaults snaps back to its previous value after a reset. Pass lastResult: navigation.state === 'idle' ? lastResult : null (or fetcher.state for a fetcher). See https://ui-lib.quebi.de/rules/gate-last-result-on-idle-navigation",
    grep: "lastResult",
    note: "The check reads the guard textually: any lastResult expression mentioning navigation.state or fetcher.state satisfies it, including one that mentions it and gets the comparison backwards. It reads options written inline only — useForm(options) with the object in a variable is invisible, the same blind spot the tier-3 rule documents — and it says nothing about forms that pass no lastResult at all, which is tier 3's business.",
  },
  tags: ["forms", "conform", "react-router", "tier-5"],
}
