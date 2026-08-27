import type { RuleGroup } from "./types"

/**
 * Rule groups. Element usage is the first one; form rules and React Router
 * rules are separate groups and land separately.
 */
export const ruleGroups: RuleGroup[] = [
  {
    id: "element-usage",
    title: "Element usage",
    principle: "Layout is yours. Appearance is the library's.",
    description:
      "When a raw HTML element is allowed in an app that uses quebi ui-lib, and which component to import when it is not. Three tiers: interactive and semantic elements are always the library's; layout elements are yours as long as they only lay things out; design values are always tokens.",
  },
  {
    id: "forms",
    title: "Forms",
    principle: "Validation is yours. Wiring is the library's.",
    description:
      "How a form is bound, where its errors come from, and what has to be true on the server. The schema is your app's — it encodes rules nobody else can know. Everything between that schema and the DOM (name, id, defaultValue, aria-describedby, the error text itself) belongs to the components, and hand-wiring it is how a form quietly loses its accessibility while still looking correct.",
  },
]

export function getRuleGroup(id: string): RuleGroup | undefined {
  return ruleGroups.find((g) => g.id === id)
}
