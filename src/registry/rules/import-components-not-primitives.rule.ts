import type { RuleMeta } from "./types"

/**
 * Element usage, tier 4 — the layering, at the import.
 */
export const importComponentsNotPrimitivesRule: RuleMeta = {
  id: "import-components-not-primitives",
  title: "Import the library's components, not the primitives underneath them",
  navTitle: "Primitive imports",
  summary:
    "react-aria-components is ui-lib's dependency, not yours. In app code import <Button> from @/components/button, never from react-aria-components — the primitive is unstyled and knows nothing about the quebi variants.",
  severity: "error",
  category: "element-usage",
  tier: 4,
  failureMode:
    "An agent trained on react-aria's own documentation imports `Button` from `react-aria-components`, because that is what the examples it learned from do. The JSX then reads as if the library were being used while none of its design is present.",
  rationale: [
    "The element rules stop at the element name, and this walks straight past them. `import { Button } from \"react-aria-components\"` renders `<Button>`, which no element check objects to — and gets you a control with the accessibility but none of the design: no intents, no sizes, no focus ring in the quebi idiom, nothing that follows a token change. It is the same layering mistake as a hand-rolled `<button>`, one level up, and it is harder to spot in review because the JSX looks right.",
    "There are exactly three layers here and each imports from the one below it. App code imports quebi components. Quebi components import react-aria primitives — that is what they are for; quebi's Button does not wrap `<button>`, it wraps react-aria's Button. React-aria renders the intrinsic. A layer reaching two levels down is the definition of a leaky abstraction, and the import is the last place it can leak.",
    "The ban is derived, not curated: it is exactly the set of primitives the library's own source imports. Wrap a new one tomorrow and it becomes app-forbidden the same day. What stays importable is what the library does not wrap — `parseColor`, `useLocale`, `useFilter`, and every type, since types are erased and a value handed to you by a quebi component is often typed by react-aria.",
  ],
  appliesTo: ["app/**/*.{tsx,jsx}", "src/**/*.{tsx,jsx}"],
  replacements: [
    {
      element: "Button (react-aria-components)",
      use: [{ name: "Button", from: "@/components/button", slug: "button" }],
    },
    {
      element: "TextField / Input (react-aria-components)",
      use: [
        { name: "TextField", from: "@/components/text-field", slug: "text-field" },
        { name: "Input", from: "@/components/input", slug: "input" },
      ],
    },
    {
      element: "Link (react-aria-components)",
      use: [
        { name: "Link", from: "@/components/link", slug: "link" },
        { name: "LinkButton", from: "@/components/link-button", slug: "link-button" },
      ],
    },
    {
      element: "Modal / Dialog (react-aria-components)",
      use: [
        { name: "Modal", from: "@/components/modal", slug: "modal" },
        { name: "Dialog", from: "@/components/dialog", slug: "dialog" },
      ],
    },
    {
      element: "Anything else the library wraps",
      use: [{ name: "the quebi component of the same name", from: "@/components/<slug>" }],
      note: "The banned list is generated from the library's own react-aria imports, so it always matches what ui-lib actually wraps — around 114 primitives today.",
    },
  ],
  examples: [
    {
      title: "Reaching past the library for a primitive",
      wrong: `import { Button } from "react-aria-components"

<Button onPress={save}>Save</Button>`,
      right: `import { Button } from "@/components/button"

<Button intent="primary" onPress={save}>
  Save
</Button>`,
      note: "Both render an accessible button. Only one of them is a quebi button, and no element check can tell them apart — which is why this rule reads imports rather than JSX.",
    },
    {
      title: "What stays importable",
      wrong: `import { ColorSwatch, parseColor } from "react-aria-components"`,
      right: `import { parseColor } from "react-aria-components"
import type { DateValue } from "react-aria-components"
import { ColorSwatch } from "@/components/color-swatch"`,
      note: "Helpers the library does not wrap (parseColor, useLocale, useFilter) and every type import are fine — types are erased, and a value a quebi component hands you is often typed by react-aria. Only the wrapped primitives are banned.",
    },
  ],
  exceptions: [
    {
      scope: "The ui-lib component source itself, wherever you pasted it (components/ui/**)",
      paths: ["src/components/**", "components/ui/**"],
      reason:
        "This is the layer that imports the primitives — it is what makes the components components. The rule governs the code above it.",
    },
    {
      scope: "A primitive the library genuinely does not wrap",
      reason:
        "If react-aria ships something with no quebi equivalent, importing it directly is the only option, and the derived ban will not contain it. When you find yourself doing that repeatedly, the answer is a new component in the library rather than a suppression in every file.",
    },
  ],
  enforcement: {
    kind: "lint",
    // Biome's own rule, with the deny-list derived from the library's imports.
    // importNames rather than allowImportNames: an allow-list flags
    // `import type { DateValue }`, which is erased at build time and appears all
    // over legitimate app code.
    biome: { via: "rule", rule: "style/noRestrictedImports" },
    message:
      "react-aria-components is ui-lib's dependency, not yours: import the quebi component instead (Button -> @/components/button, TextField -> @/components/text-field, and so on). Helpers the library does not wrap, like parseColor, and type-only imports stay allowed. See https://ui-lib.quebi.de/rules/import-components-not-primitives",
    grep: 'from "react-aria-components"',
    note: "The check reads the import list, so it says nothing about what you do with the primitive — and it cannot see a re-export chain that reaches react-aria by another name. The ripgrep version finds every react-aria import including the legitimate ones, so read it as a list to review rather than a list of violations.",
  },
  tags: ["elements", "layering", "imports", "tier-4"],
}
