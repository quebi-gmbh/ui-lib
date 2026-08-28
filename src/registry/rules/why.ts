/**
 * Why these rules exist at all.
 *
 * Plain data, like everything else here, so the argument appears on /rules, in
 * `api/rules.json`, and in `llms.txt` from one source — including for the agents
 * the rules are largely written for.
 */

/** One thing coding agents reliably do, and the rules that catch it. */
export interface FailureMode {
  id: string
  title: string
  /** What the agent does, and why it does it — not a complaint, a description. */
  body: string
  /** Rule ids that catch this. */
  ruleIds: string[]
}

export const RULES_LEDE =
  "These rules are written for the code an agent writes. Not because agents are careless — because they optimise for the shortest path to something that looks right, and three specific detours are the predictable result."

export const failureModes: FailureMode[] = [
  {
    id: "reimplements-components",
    title: "It rebuilds what already exists",
    body: "Asked for a card, a button, a badge, an agent writes one. Producing four Tailwind classes is faster and more certain than discovering that the library ships the component — and the result renders correctly, so nothing in review objects. Repeated across a codebase, that is how a design system stops being a system: not through one bad decision, but through fifty reasonable ones in fifty files.",
    ruleIds: [
      "no-raw-interactive-elements",
      "no-appearance-classes-on-layout-elements",
      "no-hardcoded-design-values",
      "import-components-not-primitives",
    ],
  },
  {
    id: "hand-rolls-forms",
    title: "It hand-rolls forms it was told to bind",
    body: "Forms are where an agent's training data pulls hardest against the project's conventions. It writes useState, value, onChange and a literal name because that is the shape it has seen most often, rather than reading the binding off Conform's field metadata or posting to a React Router action. The form submits, so it looks finished — while the error wiring, the default values, and the server-side validation are simply absent.",
    ruleIds: [
      "bind-fields-through-conform",
      "render-field-text-through-the-field",
      "validate-on-the-server-with-the-same-schema",
    ],
  },
  {
    id: "writes-oversized-files",
    title: "It appends until the file is unreadable",
    body: "Adding to the file already open is the cheapest edit available, and an agent never has to scroll the result. Nothing pushes back at 400 lines, or 900, or 2,000 — and past that point no human reviews the file properly and every later agent edit starts from a worse position, because reading it costs more and landing an edit in the right place is less certain.",
    ruleIds: ["keep-files-readable"],
  },
]

/**
 * The argument for a linter over a prompt. This is the part worth internalising:
 * it is why these are rules and not a paragraph in CLAUDE.md.
 */
export const whyLintNotInstructions = {
  title: "Why a linter, and not just instructions",
  points: [
    {
      title: "Instructions are read once, at best",
      body: "A CLAUDE.md or a skill competes for attention with the actual task, and loses — it is skipped when context is tight, skimmed when it is long, and interpreted generously when it is vague. None of that is visible to you: the agent does not report which of your conventions it decided not to apply.",
    },
    {
      title: "A rule is checked every time, on every file",
      body: "A lint run does not get tired, does not run out of context, and does not weigh your convention against the feature it is trying to ship. It applies the same way on the first file and the four-hundredth.",
    },
    {
      title: "The error arrives where the mistake is",
      body: "This is the part that changes agent behaviour. A rule does not say \"follow the design system\" — it says, on the line in question, \"use <Button> from @/components/button\". That is a correction an agent can act on immediately and verify, which is why every message here names the replacement rather than the offence.",
    },
    {
      title: "It survives the people who wrote it",
      body: "Instructions decay as the codebase changes and nobody notices. These rules are generated from records the build validates, so a rule pointing at a component that no longer exists fails CI instead of quietly misleading whoever reads it next.",
    },
  ],
}
