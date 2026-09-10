import type { RuleGroup } from "./types"

/**
 * Rule groups. Element usage is the first one; form rules are the second. The
 * third is not a subject area but a reflex — the two rules about reaching for
 * something the runtime already gives you — and it is deliberately small: a
 * group earns its place by having a principle worth stating, not by size.
 */
export const ruleGroups: RuleGroup[] = [
  {
    id: "element-usage",
    title: "Element usage",
    principle: "Layout is yours. Appearance is the library's.",
    description:
      "When a raw HTML element is allowed in an app that uses quebi ui-lib, and which component to import when it is not. Six tiers, outward from the element: interactive and semantic elements are always the library's; layout elements are yours as long as they only lay things out; design values are always tokens; the primitives underneath belong to the library layer; a file past 500 lines is doing more than one job; and the numbers and dates rendered inside all of it are formatted through the library, with a locale that is written down.",
  },
  {
    id: "forms",
    title: "Forms",
    principle: "Validation is yours. Wiring is the library's.",
    description:
      "How a form is bound, where its errors come from, what has to be true on the server, and the three details that make the difference between a form that submits and a form that works. The schema is your app's — it encodes rules nobody else can know. Everything between that schema and the DOM (name, id, defaultValue, aria-describedby, the error text itself) belongs to the components, and hand-wiring it is how a form quietly loses its accessibility while still looking correct.",
  },
  {
    id: "platform-defaults",
    title: "Platform defaults",
    principle: "The platform will do it for you. That is not the same as your app doing it.",
    description:
      "Two rules about the shortcut the runtime hands you for free. alert() and confirm() draw a dialog with no import, no provider and no state — and no theme, no focus management and nothing to render in a test, because that dialog belongs to the browser rather than to the app. Sorting the array you are already holding reorders the table with no round trip — and no agreement with the server that produced the rows, which is the one thing a server-driven table is for. Both warn rather than fail: the fix is a change of shape, not a change of import, and that is a judgement the linter cannot make for you.",
  },
]

export function getRuleGroup(id: string): RuleGroup | undefined {
  return ruleGroups.find((g) => g.id === id)
}
