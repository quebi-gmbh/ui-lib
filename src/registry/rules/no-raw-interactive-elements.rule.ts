import type { RuleMeta } from "./types"

/**
 * Tier 1 — interactive and semantic intrinsics. Banned unconditionally.
 */
export const noRawInteractiveElementsRule: RuleMeta = {
  id: "no-raw-interactive-elements",
  title: "Never render interactive or semantic HTML elements directly",
  navTitle: "Interactive elements",
  summary:
    "button, input, select, textarea, a, form, label, dialog and table are the library's. Import the component instead — this holds whether or not you style the element.",
  severity: "error",
  category: "element-usage",
  tier: 1,
  failureMode:
    "An agent reaches for a styled `<button>` because it is the shortest path to something that looks right on screen. What it produces looks correct in review and has lost focus management, press handling, and every ARIA connection the library's component would have brought.",
  rationale: [
    "These elements are not markup, they are behaviour. A ui-lib component wraps each one in a react-aria-components primitive that supplies focus management, press handling (pointer, keyboard, touch, and the 300ms-free press semantics), disabled and pending states, and the ARIA wiring that connects a control to its label, description, and error text. Rendering the intrinsic yourself throws all of that away and nothing in review reliably catches the absence of behaviour.",
    "Styling is the wrong axis to judge this on. An *unstyled* <button> is worse than a styled one, not better: it still misses focus-visible rings, still fails to pick up the react-aria context its ancestors provide (a Dialog's close-on-press, a Toolbar's roving tabindex, a Form's submission state), and it silently reads as a plain button to assistive technology. The safe-looking case is the trap.",
    "There is exactly one layer allowed to render these intrinsics, and it is the library. That is what makes a theme change, an accessibility fix, or a react-aria upgrade a one-file change instead of a codebase-wide hunt.",
  ],
  appliesTo: ["app/**/*.{tsx,jsx}", "src/**/*.{tsx,jsx}"],
  replacements: [
    {
      element: "button",
      use: [
        { name: "Button", from: "@/components/button", slug: "button", when: "performs an action in place" },
        { name: "LinkButton", from: "@/components/link-button", slug: "link-button", when: "navigates — a control that changes the URL must be an anchor" },
        { name: "Toggle", from: "@/components/toggle", slug: "toggle", when: "has an on/off pressed state" },
      ],
      note: "Button takes onPress, not onClick — that is the point, not an inconvenience: onPress covers pointer, keyboard, and touch uniformly.",
    },
    {
      element: "a",
      use: [
        { name: "Link", from: "@/components/link", slug: "link", when: "an inline text link (it renders a plain anchor for http(s)/mailto/tel hrefs, so external links keep working outside a router)" },
        { name: "LinkButton", from: "@/components/link-button", slug: "link-button", when: "a link that should look like a button" },
      ],
    },
    {
      element: "input",
      use: [
        { name: "TextField", from: "@/components/text-field", slug: "text-field", when: "a labelled field with description and error text" },
        { name: "Input", from: "@/components/input", slug: "input", when: "the bare control, inside a Field you compose yourself" },
        { name: "SearchField", from: "@/components/search-field", slug: "search-field", when: "type=search" },
        { name: "NumberField", from: "@/components/number-field", slug: "number-field", when: "type=number — adds steppers and locale-aware parsing" },
        { name: "Checkbox", from: "@/components/checkbox", slug: "checkbox", when: "type=checkbox" },
        { name: "RadioGroup", from: "@/components/radio", slug: "radio", when: "type=radio" },
        { name: "Switch", from: "@/components/switch", slug: "switch", when: "a boolean rendered as a switch" },
      ],
    },
    {
      element: "select",
      use: [
        { name: "Select", from: "@/components/select", slug: "select", when: "a single choice from a known list" },
        { name: "ComboBox", from: "@/components/combo-box", slug: "combo-box", when: "the list is long enough to need typeahead" },
        { name: "MultipleSelect", from: "@/components/multiple-select", slug: "multiple-select", when: "multiple" },
      ],
    },
    {
      element: "textarea",
      use: [{ name: "Textarea", from: "@/components/textarea", slug: "textarea" }],
    },
    {
      element: "form",
      use: [
        { name: "Form", from: "react-router", when: "submitting to a route action" },
        { name: "ConformField", from: "@/components/conform-field", slug: "conform-field", when: "binding fields to a Conform form" },
      ],
      note: "ui-lib deliberately ships no Form component: submission belongs to the router. Use React Router's Form and the conform-* variants for the fields inside it.",
    },
    {
      element: "label",
      use: [
        { name: "Label", from: "@/components/field", slug: "field", when: "composing a field by hand" },
      ],
      note: "Most form components render their own label from a `label` prop or their children, and wire htmlFor/id themselves. Reach for the Label slot only when you are assembling a Field yourself.",
    },
    {
      element: "dialog",
      use: [
        { name: "Modal", from: "@/components/modal", slug: "modal", when: "a centered overlay" },
        { name: "Drawer", from: "@/components/drawer", slug: "drawer", when: "an edge-anchored panel" },
        { name: "Sheet", from: "@/components/sheet", slug: "sheet", when: "a side sheet" },
        { name: "Dialog", from: "@/components/dialog", slug: "dialog", when: "the dialog content itself (title, body, footer)" },
      ],
      note: "The native <dialog> element has no focus-trap parity across browsers and no scroll locking. The library's overlays get both from react-aria.",
    },
    {
      element: "table",
      use: [
        { name: "Table", from: "@/components/table", slug: "table", when: "a static table (with TableHeader, TableBody, TableColumn, TableRow, TableCell)" },
        { name: "AsyncTable", from: "@/components/async-table", slug: "async-table", when: "sorting and filtering are server-driven" },
      ],
    },
  ],
  examples: [
    {
      title: "A raw anchor where a LinkButton belongs",
      source: "src/routes/_index.tsx (hero GitHub link)",
      wrong: `<a
  href="https://github.com/quebi-gmbh"
  target="_blank"
  rel="noreferrer"
  className="inline-flex items-center gap-2 rounded-quebi-sm border border-quebi-line/20 px-6 py-3 text-quebi-fg transition-colors duration-200 hover:border-quebi-brand hover:text-quebi-brand"
>
  GitHub
</a>`,
      right: `import { LinkButton } from "@/components/link-button"

<LinkButton href="https://github.com/quebi-gmbh" target="_blank" rel="noreferrer" intent="outline">
  GitHub
</LinkButton>`,
      note: "The hand-written classes are an approximation of buttonStyles({ intent: 'outline' }) that will not follow the next token change. The component also brings the focus ring the anchor is missing.",
    },
    {
      title: "A styled raw button where a Button belongs",
      source: "src/routes/components.tsx (mobile sidebar toggle)",
      wrong: `<button
  type="button"
  onClick={() => setMobileOpen((o) => !o)}
  className="mb-4 inline-flex items-center gap-2 rounded-quebi-sm border border-quebi-line/20 px-3 py-2 text-sm text-quebi-fg-muted transition-colors duration-200 hover:border-quebi-brand hover:text-quebi-brand lg:hidden"
  aria-expanded={mobileOpen}
>
  <Menu className="h-4 w-4" />
  Components
</button>`,
      right: `import { Button } from "@/components/button"

<Button
  intent="outline"
  size="sm"
  onPress={() => setMobileOpen((o) => !o)}
  aria-expanded={mobileOpen}
  className="mb-4 lg:hidden"
>
  <Menu data-slot="icon" />
  Components
</Button>`,
      note: "Layout classes (mb-4, lg:hidden) stay on the component — that part is yours. Everything describing how the control looks moves to intent/size. onClick becomes onPress.",
    },
    {
      title: "An unstyled button is not the safe case",
      wrong: `<button onClick={onClose}>Close</button>`,
      right: `import { Button } from "@/components/button"

<Button intent="ghost" onPress={onClose}>
  Close
</Button>`,
      note: "No className, so nothing looks wrong in review — and it still has no focus ring, no press semantics, and no connection to the Dialog context that would close the overlay.",
    },
  ],
  exceptions: [
    {
      scope: "<input> inside the ui-lib component source (components/ui/**)",
      paths: ["src/components/**", "components/ui/**"],
      elements: ["input"],
      reason:
        "Only <input>, and only there. A component that owns a controlled value has to submit it through a hidden input, and react-aria has no primitive for that — a hidden input is not an interactive control, so none of this rule's reasoning applies to it. Everything else on the list stays banned inside the library too: quebi's Button does not wrap <button>, it wraps react-aria's Button, so there is no layer here that needs the raw element.",
    },
    {
      scope: "A <form> that submits on the client only, with no route action behind it",
      reason:
        "React Router's Form posts to a route action; where there is none — a filter panel, a wizard step, a Conform form handled entirely in the browser — a raw <form> bound with getFormProps(form) is the right element, and the closest thing to a replacement would be worse. This covers the form element only: everything inside it stays on this list.",
    },
  ],
  enforcement: {
    kind: "lint",
    // Biome has a built-in rule for exactly this, and its `elements` option is
    // an element -> message map: the same shape as `replacements` above, so the
    // config is generated from that table rather than restating it.
    biome: { via: "rule", rule: "correctness/noRestrictedElements" },
    message:
      "Raw interactive/semantic elements are the library's. Import the ui-lib component instead. See https://ui-lib.quebi.de/rules/no-raw-interactive-elements",
    grep: "<(a|button|dialog|form|input|label|select|table|textarea)($|[\\s/>])",
    note: "Biome reports one message per element, naming that element's own replacement — so <a> tells you about Link and LinkButton rather than listing all nine. The rule also fires inside your copy of the ui-lib components, which is why the documented exception scopes it away; point it at wherever you pasted the source (components/ui by shadcn convention).",
  },
  tags: ["elements", "accessibility", "react-aria", "tier-1"],
}
