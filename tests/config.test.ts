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
  buildRuleChecks,
  builtInRules,
  lintRules,
  pluginRules,
  pluginScopeIncludes,
  renderBiomeConfig,
  renderGritPlugin,
  restrictedElements,
} from "../src/registry/rules/checks"
import { ruleGroups } from "../src/registry/rules/groups"
import { biomeBinary, component, projectRoot, racPrimitives, ruleById, rulesFiredOn } from "./harness"

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

  test("vendored library source is exempt from the plugin rules", () => {
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

  test("an override adds a plugin where it names, and cannot take one away", () => {
    // Why a plugin's whole scope has to be one include list, and why a rule's
    // exceptions arrive there negated rather than as an entry of their own.
    //
    // Biome scopes a plugin by *loading* it for the paths an override matches.
    // There is no matching subtraction: an entry naming `plugins: []` does not
    // unload one, so "the rule applies here" and "except here" cannot be two
    // entries. Both halves are asserted, because the fix for the checkout-path
    // bug rests on the first and the shape of it rests on the second.
    const violation = `const [form] = useForm({ onValidate: fn })\n`
    const plugin = ruleById("validate-on-the-server-with-the-same-schema")
    expect(pluginRules(rulesRegistry)).toContain(plugin)

    const probe = (name: string, config: unknown): string[] => {
      const root = join(projectRoot, name)
      mkdirSync(join(root, "src", "vendor"), { recursive: true })
      mkdirSync(join(root, "src", "routes"), { recursive: true })
      writeFileSync(join(root, "p.grit"), renderGritPlugin(plugin))
      writeFileSync(join(root, "biome.json"), JSON.stringify(config))
      writeFileSync(join(root, "src", "vendor", "x.tsx"), violation)
      writeFileSync(join(root, "src", "routes", "x.tsx"), violation)
      const run = Bun.spawnSync([biomeBinary, "lint", "--reporter=json"], {
        cwd: root,
        stdout: "pipe",
        stderr: "pipe",
      })
      const diagnostics = JSON.parse(run.stdout.toString()).diagnostics ?? []
      return diagnostics
        .map((d: { location?: { path?: { file?: string } | string } }) =>
          typeof d.location?.path === "string" ? d.location.path : d.location?.path?.file,
        )
        .sort()
    }

    const linter = { enabled: true, rules: { preset: "none" } }

    // Loading it from an override scopes it, exceptions and all — this is what
    // the generated config does, and `!src/vendor/**` is an exception's shape.
    expect(
      probe("override-loads", {
        linter,
        overrides: [{ includes: ["src/**/*.tsx", "!src/vendor/**"], plugins: ["./p.grit"] }],
      }),
    ).toEqual(["src/routes/x.tsx"])

    // Loading it at the top level and trying to take it back does nothing: both
    // files still report. A rule switched off this way is not switched off.
    expect(
      probe("override-unloads", {
        plugins: ["./p.grit"],
        linter,
        overrides: [{ includes: ["src/vendor/**"], plugins: [] }],
      }),
    ).toEqual(["src/routes/x.tsx", "src/vendor/x.tsx"])
  })
})

describe("a plugin fires only where its record says it applies", () => {
  // A plugin that is simply loaded is asked about every file the project lints
  // and answers anyway: this repo widened `files.includes` to its own TypeScript
  // and got twelve diagnostics about `.ts` files no rule had ever claimed. The
  // entry that loads each plugin carries the record's `appliesTo`, so the answer
  // is not "the plugin declines", it is "the plugin is not there".

  /** No JSX, so a built-in rule cannot fire and only a plugin can answer. */
  const FORMATTING = `export const label = (n: number) => n.toLocaleString()\n`

  test("the include list is the record's own globs, for every plugin", () => {
    // Verbatim, not translated: the records' globs are already the dialect
    // Biome reads, and the translation that used to sit here — glob to a regex
    // over GritQL's absolute `$filename` — is what made a rule's scope depend
    // on which directory the repo happened to be cloned into.
    for (const rule of pluginRules(rulesRegistry)) {
      const includes = pluginScopeIncludes(rule)
      expect(includes.slice(0, rule.appliesTo.length)).toEqual(rule.appliesTo)
      for (const path of rule.exceptions.flatMap((e) => e.paths ?? [])) {
        expect(includes).toContain(`!${path}`)
      }
      // And nothing in the .grit file claims a scope of its own, which would be
      // a second answer to the question, given in a dialect that cannot answer it.
      expect(renderGritPlugin(rule)).not.toContain("$filename <:")
    }
  })

  test("a .ts file is claimed by no record, so no plugin reports on one", () => {
    // The positive control first: without it this is a test that a broken plugin
    // also passes.
    expect(rulesFiredOn(FORMATTING, "src/lib/format.tsx")).toContain(
      "format-values-through-the-library",
    )
    expect(rulesFiredOn(FORMATTING, "src/lib/format.ts")).toEqual([])
  })

  test("a path outside app/ and src/ is outside appliesTo too", () => {
    expect(rulesFiredOn(FORMATTING, "scripts/report.tsx")).toEqual([])
  })

  test("a directory whose name merely starts with one in scope is not in scope", () => {
    // `myapp/` is not `app/`. Biome's own glob matching says so; the regex this
    // used to compile had to be written carefully to agree, and got a different
    // question — where the project root is — wrong instead.
    expect(rulesFiredOn(FORMATTING, "myapp/routes/x.tsx")).toEqual([])
    expect(rulesFiredOn(FORMATTING, "app/routes/x.tsx")).toContain(
      "format-values-through-the-library",
    )
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

  test("one override entry loads each plugin rule, and nothing else loads one", () => {
    const loaders = config.overrides.filter((o) => o.plugins?.length)
    expect(loaders.length).toBe(pluginRules(rulesRegistry).length)
    for (const rule of pluginRules(rulesRegistry)) {
      const loading = loaders.filter((o) => o.plugins?.some((p) => p.endsWith(`${rule.id}.grit`)))
      // Exactly one: a second entry loading the same plugin would widen its
      // scope back out, and the widening would not be visible from either entry.
      expect(loading).toHaveLength(1)
      expect(loading[0].includes).toEqual(pluginScopeIncludes(rule))
      // An entry either loads a plugin or relaxes a built-in rule, never both,
      // so that each one reads as a single decision.
      expect(loading[0].linter).toBeUndefined()
    }
  })

  test("the built-in rule's messages are derived from the replacement table", () => {
    const elements = restrictedElements(ruleById("no-raw-interactive-elements"))
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
    const fromTier1 = restrictedElements(ruleById("no-raw-interactive-elements"))
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
          expect(config.overrides.some((o) => o.linter && o.includes.includes(path))).toBe(true)
        }
      } else {
        // On a plugin the same carve-out is a negated pattern on the entry that
        // loads it, because there is no override that unloads a plugin.
        const entry = config.overrides.find((o) =>
          o.plugins?.some((p) => p.endsWith(`${rule.id}.grit`)),
        )
        for (const path of paths) expect(entry?.includes).toContain(`!${path}`)
      }
    }
  })
})

describe("the snippet on a rule's page", () => {
  const config = buildBiomeConfig(rulesRegistry, undefined, racPrimitives)

  /** The JSON body of a `// biome.jsonc` check snippet. */
  const parse = (code: string) => JSON.parse(code.replace(/^\/\/.*\n/, ""))

  test("configures the rule exactly as the generated config does", () => {
    // The bug this pins: the page for keep-files-readable used to publish
    // `"options": { "elements": {} }` — the element ban's shape, hardcoded for
    // every built-in — so anyone copying that snippet silently lost the
    // 500-line threshold the aggregate config had.
    for (const rule of builtInRules(rulesRegistry)) {
      const biome = rule.enforcement.biome
      if (biome?.via !== "rule") continue
      const [group, name] = biome.rule.split("/")
      const check = buildRuleChecks(rule, undefined, racPrimitives).find(
        (c) => c.tool === "biome" && c.language === "json",
      )
      expect(check).toBeTruthy()
      expect(parse((check as { code: string }).code).linter.rules[group][name]).toEqual(
        config.linter.rules[group][name],
      )
    }
  })

  test("a rule whose options are its content keeps them", () => {
    const rule = ruleById("keep-files-readable")
    const check = buildRuleChecks(rule, undefined, racPrimitives).find(
      (c) => c.tool === "biome" && c.language === "json",
    )
    expect(check?.code).toContain('"maxLines": 500')
  })
})

describe("plugin messages", () => {
  test("a double quote in a message fails the build rather than mangling the plugin", () => {
    // GritQL re-interprets the rest of a string literal after an escaped quote:
    // the text arrives as mojibake and the rule URL with it, which is what the
    // harness attributes a finding by. Biome reports it as an ordinary
    // diagnostic, so nothing else would notice.
    const rule = pluginRules(rulesRegistry)[0]
    const withQuotes = {
      ...rule,
      enforcement: { ...rule.enforcement, message: 'Use type="submit" instead.' },
    }
    expect(() => renderGritPlugin(withQuotes)).toThrow(/double quote/)
  })

  test("every published message is free of them", () => {
    for (const rule of pluginRules(rulesRegistry)) {
      expect(rule.enforcement.message).not.toContain('"')
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
