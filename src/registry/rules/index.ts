import { bindFieldsThroughConformRule } from "./bind-fields-through-conform.rule"
import { getRuleGroup, ruleGroups } from "./groups"
import { importComponentsNotPrimitivesRule } from "./import-components-not-primitives.rule"
import { keepFilesReadableRule } from "./keep-files-readable.rule"
import { noAppearanceClassesOnLayoutElementsRule } from "./no-appearance-classes-on-layout-elements.rule"
import { noHardcodedDesignValuesRule } from "./no-hardcoded-design-values.rule"
import { noRawInteractiveElementsRule } from "./no-raw-interactive-elements.rule"
import { renderFieldTextThroughTheFieldRule } from "./render-field-text-through-the-field.rule"
import { validateOnTheServerWithTheSameSchemaRule } from "./validate-on-the-server-with-the-same-schema.rule"
import type { RuleGroup, RuleMeta, RuleSeverity } from "./types"

export * from "./types"
export * from "./why"
export { getRuleGroup, ruleGroups }

/**
 * Every rule, in reading order. Tier order inside a group is intentional:
 * the tiers build on each other.
 */
export const rulesRegistry: RuleMeta[] = [
  noRawInteractiveElementsRule,
  noAppearanceClassesOnLayoutElementsRule,
  noHardcodedDesignValuesRule,
  importComponentsNotPrimitivesRule,
  keepFilesReadableRule,
  bindFieldsThroughConformRule,
  renderFieldTextThroughTheFieldRule,
  validateOnTheServerWithTheSameSchemaRule,
]

export function getRule(id: string | undefined): RuleMeta | undefined {
  if (!id) return undefined
  return rulesRegistry.find((r) => r.id === id)
}

export interface RuleGroupWithRules {
  group: RuleGroup
  rules: RuleMeta[]
}

/** Rules bucketed under their group, groups in registry order, rules in registry order. */
export function groupRules(rules: RuleMeta[] = rulesRegistry): RuleGroupWithRules[] {
  return ruleGroups
    .map((group) => ({ group, rules: rules.filter((r) => r.category === group.id) }))
    .filter((g) => g.rules.length > 0)
}

/** The Badge intent that matches a severity, so listings and detail pages agree. */
export function severityIntent(severity: RuleSeverity): "danger" | "warning" {
  return severity === "error" ? "danger" : "warning"
}
