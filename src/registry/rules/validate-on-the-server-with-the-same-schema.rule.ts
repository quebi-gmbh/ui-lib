import type { RuleMeta } from "./types"

/**
 * Forms, tier 3 — the round trip. The rule the other two exist to protect.
 */
export const validateOnTheServerWithTheSameSchemaRule: RuleMeta = {
  id: "validate-on-the-server-with-the-same-schema",
  title: "Validate on the server with the same schema",
  navTitle: "Server validation",
  summary:
    "Client validation is UX. Export one schema, parse it again in the route action, return submission.reply(), and feed that back through useForm({ lastResult }) — a form whose only validation is onValidate is an unvalidated form.",
  severity: "error",
  category: "forms",
  tier: 3,
  failureMode:
    "An agent asked for a validated form writes `onValidate` and stops, because the form is now visibly validating. The action it also wrote parses nothing, so the validation is decoration — anything not sent from that form goes straight through.",
  rationale: [
    "onValidate runs in a browser the user controls. Nothing that reaches your database went through your form — it went through the network, and a request made with curl skips every check the client performed. Client-side validation exists so people find out about a mistake without waiting for a round trip; it is not a gate, and treating it as one is how a required field turns out not to be required.",
    "One schema module imported by both sides is what keeps the two ends in agreement. The alternative — a schema in the component and a handful of if-statements in the action — drifts on the first change, and the drift presents as the worst kind of bug: a form that passes in the browser and fails on the server, or worse, passes on both while enforcing different things.",
    "lastResult is the return path, and it is why the server does not need a second error-display code path. submission.reply() carries the server's errors back into the same field metadata the inputs already read, so a rejection from the action renders in exactly the place a client-side error would, in the same styling, with the same aria wiring.",
  ],
  appliesTo: ["app/**/*.{tsx,jsx}", "src/**/*.{tsx,jsx}"],
  examples: [
    {
      title: "A form that validates only in the browser",
      wrong: `const [form, fields] = useForm({
  onValidate: ({ formData }) => parseWithValibot(formData, { schema }),
})

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  // The schema never runs here. A POST from anywhere but this form is unchecked.
  await createUser({ email: String(formData.get("email")) })
  return redirect("/welcome")
}`,
      right: `// app/schemas/signup.ts — one module, imported by both sides
export const signupSchema = v.object({
  email: v.pipe(v.string(), v.email("Enter a valid email address")),
})

// app/routes/signup.tsx
export async function action({ request }: Route.ActionArgs) {
  const submission = parseWithValibot(await request.formData(), { schema: signupSchema })
  if (submission.status !== "success") return submission.reply()

  await createUser(submission.value)
  return redirect("/welcome")
}`,
      note: "submission.value is typed and parsed, so the String(formData.get(...)) casts disappear along with the vulnerability.",
    },
    {
      title: "Getting the server's answer back into the fields",
      wrong: `const [form, fields] = useForm({
  onValidate: ({ formData }) => parseWithValibot(formData, { schema: signupSchema }),
})
// The action rejects the email as already taken. Nothing on screen changes.`,
      right: `export default function Signup({ actionData }: Route.ComponentProps) {
  const [form, fields] = useForm({
    lastResult: actionData,
    onValidate: ({ formData }) => parseWithValibot(formData, { schema: signupSchema }),
  })
  // "That email is already registered" now renders under the email field,
  // through the same metadata the client-side errors use.
}`,
      note: "This is the half people skip, and it is the half that makes server validation usable rather than just safe. Without lastResult a server rejection is a silent no-op to the person filling in the form.",
    },
    {
      title: "The typed call is the same call",
      wrong: `// useForm<Schema>({ … }) is the spelling Conform's docs lead with, because it is
// what makes fields.email typed. It is still a form with nowhere to put a server error.
const [form, fields] = useForm<SignupSchema>({
  onValidate: ({ formData }) => parseWithValibot(formData, { schema: signupSchema }),
})`,
      right: `const [form, fields] = useForm<SignupSchema>({
  lastResult: navigation.state === "idle" ? actionData : null,
  onValidate: ({ formData }) => parseWithValibot(formData, { schema: signupSchema }),
})`,
      note: "The type argument says what the fields are, not where they are checked. The check reads both spellings — until task #163 it read only the untyped one, which meant it was quiet on most real forms.",
    },
  ],
  exceptions: [
    {
      scope: "Your copy of the ui-lib component source (components/ui/**)",
      paths: ["src/components/**", "components/ui/**"],
      reason:
        "A ui-lib form is a control surface, not a submission. table-controls.tsx builds six of them — the search box, the column picker, a column's filter panel, the page-size picker, the row editor and the cell editor — and every one ends in onSubmit: event.preventDefault(). They use Conform for field metadata and validation, not for a round trip; the query they produce goes back to the caller through onQueryChange, and it is the caller's route that has an action to validate against. There is no lastResult for them to carry and nowhere for one to come from — which is the \"no server side at all\" exception below, arriving at an address. It is on the record rather than in this repo's local scopes because the file is vendored verbatim: a consumer who installs table-controls owns the same six calls under their own components/ui/, and a rule that reports them there is reporting the library's shape, not their code. (Nobody noticed until task #163: all six are written useForm<T>({ … }) and the check matched only the untyped call.)",
    },
    {
      scope: "Gallery, story and example files",
      paths: ["**/*.stories.{tsx,jsx}", "**/*.examples.{tsx,jsx}"],
      reason:
        "A rendered example has no route action to post to, so it validates client-side by definition. Worth knowing when reading the ui-lib gallery: those forms are demonstrations of a binding, not a template for a real one — every one of them would fail this rule.",
    },
    {
      scope: "A form with no server side at all",
      reason:
        "A filter panel, a calculator, a wizard step held in component state — nothing is submitted, so there is nothing to re-validate. If it later grows an action, this rule arrives with it.",
    },
  ],
  enforcement: {
    kind: "lint",
    // A useForm() call whose options carry no lastResult: the form has no way to
    // render what the server said, which in practice means nobody asked it.
    //
    // Matched as a JsCallExpression rather than through a `useForm($options)` call
    // snippet, because a snippet is the whole call shape and `useForm<Schema>({ … })`
    // is a different one — the type argument sits between the callee and the
    // arguments, so the snippet matched only the untyped spelling and said nothing
    // about the typed call Conform's docs lead with (task #163). Naming the two
    // fields the rule actually reads leaves `type_arguments` unconstrained, so both
    // spellings match and `$call` is still the whole call, type argument included.
    biome: {
      via: "plugin",
      pattern: `JsCallExpression(
  callee = \`useForm\`,
  arguments = JsCallArguments(args = [$options])
) as $call where {
  $options <: JsObjectExpression(),
  $options <: not contains \`lastResult\``,
    },
    message:
      "useForm without lastResult: this form cannot display anything the server says, which in practice means the server is not validating. Parse the same schema in your route action, return submission.reply(), and pass it here as lastResult. See https://ui-lib.quebi.de/rules/validate-on-the-server-with-the-same-schema",
    grep: "useForm\\s*[<(]",
    note: "The check looks for the missing option, which is a proxy: it cannot confirm your action actually re-parses the schema, and it will fire on a form that is genuinely client-only (scope that away with the exceptions rather than switching it off). It only reads options written inline — useForm(options) with the object in a variable is skipped on purpose, because the alternative is reporting every such call whether or not it passes lastResult. A type argument is not a blind spot: useForm({ … }) and useForm<Schema>({ … }) are read the same way. Reading it the other way round is the useful part: a form that passes has somewhere to put the server's answer.",
  },
  tags: ["forms", "conform", "validation", "security", "tier-3"],
}
