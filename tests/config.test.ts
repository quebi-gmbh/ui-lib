/**
 * The config around the checks: do the documented exceptions actually reach
 * Biome, do the records hold together, and does the published artifact say what
 * the records say?
 *
 * The first tests are load-bearing for the whole suite. Most cases elsewhere
 * assert that a rule does *not* fire, and every one of those would pass against a
 * config that failed to load — so before trusting a single negative, prove the
 * harness reports at all and that every plugin compiles.
 */
import { describe, expect, test } from "bun:test"
import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { metaRegistry } from "../src/registry/meta"
import { failureModes, rulesRegistry } from "../src/registry/rules"
import {
  buildBiomeConfig,
  builtInRules,
  globToFilenameRegex,
  lintRules,
  pluginRules,
  renderBiomeConfig,
  renderGritPlugin,
  restrictedElements,
} from "../src/registry/rules/checks"
import { ruleGroups } from "../src/registry/rules/groups"
import { biomeBinary, component, projectRoot, racPrimitives, rulesFiredOn } from "./harness"

const VIOLATION = component(`    <button onClick={props.onClick}>Save</button>`)

describe("harness", () => {
  test("the config is loaded and reports — without this every negative test is vacuous", () => {
    expect(rulesFiredOn(VIOLATION)).toContain("no-raw-interactive-elements")
  })

  test("every GritQL plugin compiles", () => {
    // A plugin that fails to compile reports once, globally, with no rule
    // attached, and would quietly turn every "does not fire" case green. The
    // harness throws on an unattributed diagnostic; this asserts a clean file.
    for (const rule of pluginRules(rulesRegistry)) {
      expect(rulesFiredOn("export const x = 1\n", `src/compile-${rule.id}.tsx`)).toEqual([])
    }
  })

  test("a diagnostic can be traced back to its rule", () => {
    // Plugins name themselves in the message; built-ins are matched by category.
    for (const rule of pluginRules(rulesRegistry)) {
      expect(rule.enforcement.message).toContain(`/rules/${rule.id}`)
    }
    for (const rule of builtInRules(rulesRegistry)) {
      const biome = rule.enforcement.biome
      expect(biome?.via === "rule" && biome.rule).toBeTruthy()
    }
  })
})

describe("documented exceptions reach Biome", () => {
  test("the element ban still applies inside vendored library source", () => {
    // The carve-out there is for <input>, not for the whole rule: quebi's Button
    // wraps react-aria's Button, not <button>, so no layer needs the raw element.
    expect(rulesFiredOn(VIOLATION, "components/ui/button.tsx")).toContain(
      "no-raw-interactive-elements",
    )
    expect(rulesFiredOn(VIOLATION, "src/components/button.tsx")).toContain(
      "no-raw-interactive-elements",
    )
  })

  test("...but <input> is excused there, because hidden inputs have no primitive", () => {
    const hidden = component(`    <input type="hidden" name="storage" value={props.value} />`)
    expect(rulesFiredOn(hidden, "components/ui/storage-picker.tsx")).not.toContain(
      "no-raw-interactive-elements",
    )
    // In app code it stays banned.
    expect(rulesFiredOn(hidden, "src/routes/page.tsx")).toContain("no-raw-interactive-elements")
  })

  test("app code is still checked — the exception is scoped, not global", () => {
    expect(rulesFiredOn(VIOLATION, "app/routes/signup.tsx")).toContain("no-raw-interactive-elements")
  })

  test("vendored library source is exempt from the plugin rules (via $filename)", () => {
    const surface = component(
      `    <div className="rounded-quebi-md border border-quebi-line/10 p-6">{props.children}</div>`,
    )
    expect(rulesFiredOn(surface, "src/routes/page.tsx")).toContain(
      "no-appearance-classes-on-layout-elements",
    )
    expect(rulesFiredOn(surface, "components/ui/card.tsx")).not.toContain(
      "no-appearance-classes-on-layout-elements",
    )
  })

  test("the energy-class-badge carve-out silences the hardcoded-value rule there", () => {
    const bands = `export const styles = { A: "bg-[#00843d] text-quebi-fg" }\n`
    expect(rulesFiredOn(bands, "src/routes/chart.tsx")).toContain("no-hardcoded-design-values")
    expect(rulesFiredOn(bands, "components/ui/energy-class-badge.tsx")).not.toContain(
      "no-hardcoded-design-values",
    )
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

  test("plugin exceptions have to be compiled in, because overrides cannot scope plugins", () => {
    // This is the reason plugin exceptions are $filename guards rather than
    // config. If Biome ever learns to scope plugins, this test fails and the
    // guards can be replaced with overrides.
    const root = join(projectRoot, "override-probe")
    mkdirSync(join(root, "vendor"), { recursive: true })
    const plugin = pluginRules(rulesRegistry).find(
      (r) => r.id === "validate-on-the-server-with-the-same-schema",
    )!
    writeFileSync(join(root, "p.grit"), renderGritPlugin(plugin))
    writeFileSync(
      join(root, "biome.json"),
      JSON.stringify({
        plugins: ["./p.grit"],
        linter: { enabled: true, rules: { recommended: false } },
        overrides: [{ includes: ["vendor/**"], plugins: [] }],
      }),
    )
    writeFileSync(join(root, "vendor", "x.tsx"), `const [form] = useForm({ onValidate: fn })\n`)

    const run = Bun.spawnSync([biomeBinary, "lint", "vendor/x.tsx", "--reporter=json"], {
      cwd: root,
      stdout: "pipe",
      stderr: "pipe",
    })
    const diagnostics = JSON.parse(run.stdout.toString()).diagnostics ?? []
    expect(diagnostics.length).toBeGreaterThan(0)
  })
})

describe("rule records", () => {
  test("ids are unique and kebab-case", () => {
    const ids = rulesRegistry.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  })

  test("no rule id collides with a static page under /rules", () => {
    // React Router ranks a static route above a dynamic one, so a rule with an
    // id matching one of these would resolve to that page — a 200 with the
    // wrong content. The generator refuses to build; this states the list.
    const reserved = new Set(["enforcement"])
    for (const rule of rulesRegistry) expect(reserved.has(rule.id)).toBe(false)
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

  test("every rule has a sidebar label short enough to fit", () => {
    for (const rule of rulesRegistry) {
      expect(rule.navTitle).toBeTruthy()
      expect((rule.navTitle as string).length).toBeLessThanOrEqual(24)
    }
  })

  test("every rule names the behaviour it catches, and something claims it", () => {
    // A rule nobody can argue with is a rule nobody will keep: each one has to
    // say what agents actually do, and be claimed by one of the failure modes.
    const claimed = new Set(failureModes.flatMap((m) => m.ruleIds))
    for (const rule of rulesRegistry) {
      expect(rule.failureMode.trim().length).toBeGreaterThan(0)
      expect(claimed.has(rule.id)).toBe(true)
    }
    for (const mode of failureModes) {
      for (const id of mode.ruleIds) {
        expect(rulesRegistry.some((r) => r.id === id)).toBe(true)
      }
    }
  })

  test("every rule shows a wrong/right pair", () => {
    for (const rule of rulesRegistry) expect(rule.examples.length).toBeGreaterThan(0)
  })

  test("a lint rule says how Biome carries it, and its message names the replacement", () => {
    for (const rule of rulesRegistry) {
      if (rule.enforcement.kind !== "lint") continue
      expect(rule.enforcement.biome).toBeTruthy()
      expect(rule.enforcement.message).toBeTruthy()
    }
  })
})

describe("generated config", () => {
  const config = buildBiomeConfig(rulesRegistry, undefined, racPrimitives)

  test("one plugin entry per plugin rule, and nothing else", () => {
    expect(config.plugins.length).toBe(pluginRules(rulesRegistry).length)
    for (const rule of pluginRules(rulesRegistry)) {
      expect(config.plugins.some((p) => p.endsWith(`${rule.id}.grit`))).toBe(true)
    }
  })

  test("the built-in rule's messages are derived from the replacement table", () => {
    const elements = restrictedElements(
      rulesRegistry.find((r) => r.id === "no-raw-interactive-elements")!,
    )
    expect(Object.keys(elements)).toContain("button")
    expect(elements.button).toContain("<Button>")
    // Only the rule that is *carried by* noRestrictedElements contributes to the
    // ban. The forms rules also have replacement tables — mapping components to
    // conform-* variants, plus a row for the <form> element — and none of that
    // may leak into an element ban: "forbid <Checkbox>" would be nonsense, and
    // <form> is already banned by the element rule with its own message.
    const banned = (
      config.linter.rules.correctness.noRestrictedElements as {
        options: { elements: Record<string, string> }
      }
    ).options.elements
    const fromTier1 = restrictedElements(
      rulesRegistry.find((r) => r.id === "no-raw-interactive-elements")!,
    )
    expect(Object.keys(banned).sort()).toEqual(Object.keys(fromTier1).sort())
    for (const element of Object.keys(banned)) expect(element).toMatch(/^[a-z][a-z0-9-]*$/)
  })

  test("each rule keeps its own declared severity", () => {
    // The whole reason this is Biome rather than one shared rule key: a rule
    // declared `warn` is reported at `warn`.
    for (const rule of builtInRules(rulesRegistry)) {
      const biome = rule.enforcement.biome
      if (biome?.via !== "rule") continue
      const [group, name] = biome.rule.split("/")
      const entry = config.linter.rules[group][name] as { level: string }
      expect(entry.level).toBe(rule.severity === "error" ? "error" : "warn")
    }
    for (const rule of pluginRules(rulesRegistry)) {
      expect(renderGritPlugin(rule)).toContain(
        `severity = "${rule.severity === "error" ? "error" : "warn"}"`,
      )
    }
  })

  test("every documented path exception appears in the artifact that enforces it", () => {
    for (const rule of lintRules(rulesRegistry)) {
      const paths = rule.exceptions.flatMap((e) => e.paths ?? [])
      if (!paths.length) continue
      if (rule.enforcement.biome?.via === "rule") {
        for (const path of paths) {
          expect(config.overrides.some((o) => o.includes.includes(path))).toBe(true)
        }
      } else {
        const plugin = renderGritPlugin(rule)
        for (const path of paths) expect(plugin).toContain(globToFilenameRegex(path))
      }
    }
  })
})

describe("published biome.jsonc", () => {
  const rendered = renderBiomeConfig(rulesRegistry, undefined, racPrimitives)

  test("names every rule it enforces", () => {
    for (const rule of pluginRules(rulesRegistry)) expect(rendered).toContain(`${rule.id}.grit`)
    for (const rule of builtInRules(rulesRegistry)) {
      const biome = rule.enforcement.biome
      if (biome?.via === "rule") expect(rendered).toContain(biome.rule.split("/")[1])
    }
  })

  test("every path exception carries its reason, next to the path", () => {
    for (const rule of builtInRules(rulesRegistry)) {
      for (const exception of rule.exceptions) {
        if (!exception.paths?.length) continue
        expect(rendered).toContain(`${rule.id} —`)
      }
    }
  })

  test("says how to fetch the plugins it lists", () => {
    expect(rendered).toContain("api/rules/plugins/")
  })
})
