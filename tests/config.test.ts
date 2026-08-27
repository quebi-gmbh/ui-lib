/**
 * The config around the selectors: do the documented exceptions actually reach
 * ESLint, do the records hold together, and does the published file say what the
 * blocks say?
 *
 * The first test is load-bearing for the whole suite. Most cases elsewhere assert
 * that a rule does *not* fire, and every one of those would pass against an empty
 * config — so before trusting a single negative, prove the harness reports at all.
 */
import { describe, expect, test } from "bun:test"
import { metaRegistry } from "../src/registry/meta"
import { rulesRegistry } from "../src/registry/rules"
import {
  buildEslintBlocks,
  buildEslintConfig,
  buildRuleChecks,
  lintRules,
  renderEslintConfig,
} from "../src/registry/rules/checks"
import { ruleGroups } from "../src/registry/rules/groups"
import { component, rulesFiredOn } from "./harness"

const VIOLATION = component(`    <button onClick={props.onClick}>Save</button>`)

describe("harness", () => {
  test("the config is loaded and reports — without this every negative test is vacuous", () => {
    expect(rulesFiredOn(VIOLATION)).toContain("no-raw-interactive-elements")
  })

  test("every lint rule is represented in the config", () => {
    const inConfig = new Set(buildEslintBlocks(rulesRegistry)[0].ruleIds)
    for (const rule of lintRules(rulesRegistry)) expect(inConfig).toContain(rule.id)
  })

  test("a finding can be traced back to its rule", () => {
    // The harness identifies rules by the URL in the message, so every message
    // has to carry one. This is also the contract for a human reading a CI log.
    for (const rule of lintRules(rulesRegistry)) {
      expect(rule.enforcement.message).toContain(`/rules/${rule.id}`)
    }
  })
})

describe("documented exceptions reach ESLint", () => {
  test("vendored library source is exempt from the element rules", () => {
    // The same violation, in a consumer's pasted copy of the components.
    expect(rulesFiredOn(VIOLATION, "components/ui/button.tsx")).not.toContain(
      "no-raw-interactive-elements",
    )
    expect(rulesFiredOn(VIOLATION, "src/components/button.tsx")).not.toContain(
      "no-raw-interactive-elements",
    )
  })

  test("app code is still checked — the exception is scoped, not global", () => {
    expect(rulesFiredOn(VIOLATION, "app/routes/signup.tsx")).toContain("no-raw-interactive-elements")
  })

  test("the energy-class-badge carve-out silences the hardcoded-value rule there", () => {
    const bands = `export const styles = { A: "bg-[#00843d] text-quebi-fg" }\n`
    expect(rulesFiredOn(bands, "src/routes/chart.tsx")).toContain("no-hardcoded-design-values")
    expect(rulesFiredOn(bands, "components/ui/energy-class-badge.tsx")).not.toContain(
      "no-hardcoded-design-values",
    )
  })

  test("a narrow carve-out does not re-enable what a broader one relaxed", () => {
    // energy-class-badge sits inside components/ui/**, which relaxes the element
    // rules. Emitting one block per exception let the narrower block turn them
    // back on; the blocks are cumulative to prevent exactly this.
    expect(rulesFiredOn(VIOLATION, "components/ui/energy-class-badge.tsx")).toEqual([])
  })

  test("example files are exempt from the server-validation rule only", () => {
    const clientOnlyForm = `const [form] = useForm({ onValidate: fn })\n`
    expect(rulesFiredOn(clientOnlyForm, "src/routes/signup.tsx")).toContain(
      "validate-on-the-server-with-the-same-schema",
    )
    expect(rulesFiredOn(clientOnlyForm, "src/registry/button.examples.tsx")).not.toContain(
      "validate-on-the-server-with-the-same-schema",
    )
    // ...but a gallery example still may not hand-roll a <button>.
    expect(rulesFiredOn(VIOLATION, "src/registry/button.examples.tsx")).toContain(
      "no-raw-interactive-elements",
    )
  })
})

describe("rule records", () => {
  test("ids are unique and kebab-case", () => {
    const ids = rulesRegistry.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  })

  test("every rule belongs to a known group", () => {
    const groups = new Set(ruleGroups.map((g) => g.id))
    for (const rule of rulesRegistry) expect(groups).toContain(rule.category)
  })

  test("every replacement points at a component that exists", () => {
    const slugs = new Set(metaRegistry.map((m) => m.slug))
    for (const rule of rulesRegistry) {
      for (const replacement of rule.replacements ?? []) {
        for (const target of replacement.use) {
          if (target.slug) expect(slugs).toContain(target.slug)
        }
      }
    }
  })

  test("every exception carries a justification", () => {
    for (const rule of rulesRegistry) {
      for (const exception of rule.exceptions) {
        expect(exception.reason.trim().length).toBeGreaterThan(0)
      }
    }
  })

  test("every rule shows a wrong/right pair", () => {
    for (const rule of rulesRegistry) expect(rule.examples.length).toBeGreaterThan(0)
  })

  test("a lint rule has both a selector and a message naming the replacement", () => {
    for (const rule of rulesRegistry) {
      if (rule.enforcement.kind !== "lint") continue
      expect(rule.enforcement.selector).toBeTruthy()
      expect(rule.enforcement.message).toBeTruthy()
    }
  })
})

describe("generated checks", () => {
  test("every lint rule ships a runnable ESLint snippet and a ripgrep command", () => {
    for (const rule of lintRules(rulesRegistry)) {
      const tools = buildRuleChecks(rule).map((c) => c.title)
      expect(tools).toContain("ESLint — no-restricted-syntax")
      expect(tools).toContain("ripgrep — no setup at all")
    }
  })

  test("react/forbid-elements is generated only where every replacement is an intrinsic", () => {
    const has = (id: string) =>
      buildRuleChecks(rulesRegistry.find((r) => r.id === id)!).some((c) =>
        c.title.includes("forbid-elements"),
      )
    // Element usage forbids nine intrinsics; the forms rule maps components to
    // conform-* variants, where "forbid <Checkbox>" would be nonsense.
    expect(has("no-raw-interactive-elements")).toBe(true)
    expect(has("bind-fields-through-conform")).toBe(false)
  })

  test("a rule with a judgement-call exception explains how to claim it inline", () => {
    const rule = rulesRegistry.find((r) => r.id === "no-hardcoded-design-values")!
    const titles = buildRuleChecks(rule).map((c) => c.title)
    expect(titles).toContain("Claiming an exception that is not a path")
  })
})

describe("published eslint.config.js", () => {
  const rendered = renderEslintConfig(rulesRegistry)

  test("names every rule it enforces", () => {
    for (const rule of lintRules(rulesRegistry)) expect(rendered).toContain(rule.id)
  })

  test("carries the same blocks the tests ran", () => {
    const blocks = buildEslintConfig(rulesRegistry)
    for (const block of blocks) {
      expect(rendered).toContain(JSON.stringify(block.files[0]))
    }
    // "export default [" plus one object per block.
    expect(rendered.split("    files:").length - 1).toBe(blocks.length)
  })

  test("tells the reader how to supply a JSX parser", () => {
    expect(rendered).toContain("@typescript-eslint/parser")
  })

  test("states the severity caveat when a warn-level rule is present", () => {
    const warned = lintRules(rulesRegistry).filter((r) => r.severity !== "error")
    if (warned.length > 0) {
      expect(rendered).toContain("carries a single")
      for (const rule of warned) expect(rendered).toContain(rule.id)
    }
  })
})
