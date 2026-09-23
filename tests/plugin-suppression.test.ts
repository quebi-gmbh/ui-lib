/**
 * How Biome suppresses a GritQL plugin diagnostic (task #224).
 *
 * For a long time this repo said it could not: CLAUDE.md, two `localScopes`
 * reasons and several test comments all stated that Biome has no suppression
 * comment for a plugin diagnostic. It does, and it can name the one rule:
 *
 *   // biome-ignore lint/plugin/<name>: <reason>
 *
 * where `<name>` is the `.grit` file's name, which for every rule here is the
 * rule id. The bare `lint/plugin` category is accepted too and quiets every
 * plugin rule on the node. And `plugin:` without the `lint/` — which the
 * "Claiming an exception" snippet on every plugin rule's page printed until
 * this task — is accepted without complaint and applies to nothing.
 *
 * Each of those is a behaviour of the Biome in node_modules, not of this repo,
 * so this file is what notices when an upgrade changes one. The published
 * advice in `buildRuleChecks` is checked against the same CLI, so it cannot
 * name a form that has stopped working.
 */
import { describe, expect, test } from "bun:test"
import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { buildRuleChecks } from "../src/registry/rules/checks"
import { rulesRegistry } from "../src/registry/rules"
import { biomeBinary, projectRoot } from "./harness"

interface Diagnostic {
  category?: string
  message?: unknown
}

/** Every diagnostic Biome reports on the file, unattributed ones included. */
function diagnosticsOn(code: string, filename = "src/routes/suppression.tsx"): Diagnostic[] {
  const path = join(projectRoot, filename)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, code)
  const run = Bun.spawnSync([biomeBinary, "lint", filename, "--reporter=json"], {
    cwd: projectRoot,
    stdout: "pipe",
    stderr: "pipe",
  })
  return (JSON.parse(run.stdout.toString()) as { diagnostics?: Diagnostic[] }).diagnostics ?? []
}

/** The plugin rules that fired, by id, and the categories of everything else. */
function summarise(diagnostics: Diagnostic[]): { plugins: string[]; other: string[] } {
  const plugins: string[] = []
  const other: string[] = []
  for (const d of diagnostics) {
    const id = JSON.stringify(d.message ?? "").match(/\/rules\/([a-z0-9-]+)/)?.[1]
    if (d.category === "plugin" && id) plugins.push(id)
    else other.push(d.category ?? "<none>")
  }
  return { plugins: plugins.sort(), other }
}

/**
 * One inner Card that three plugin rules report at once — nested, a hardcoded
 * colour, and a hand-built surface — so a suppression that names one of them
 * has two neighbours on the same node to leave alone.
 */
function nestedCard(comment: string): string {
  return [
    'import { Card } from "@/components/ui/card"',
    "export function Example() {",
    "  return (",
    "    <Card>",
    `      ${comment}`,
    '      <Card className="rounded-lg border bg-[#f00]">x</Card>',
    "    </Card>",
    "  )",
    "}",
    "",
  ].join("\n")
}

const ALL_THREE = [
  "no-appearance-classes-on-layout-elements",
  "no-hardcoded-design-values",
  "no-nested-card",
]

describe("biome-ignore on a plugin diagnostic", () => {
  test("without a comment, all three plugin rules report the inner card", () => {
    expect(summarise(diagnosticsOn(nestedCard("")))).toEqual({ plugins: ALL_THREE, other: [] })
  })

  test("`lint/plugin/<rule id>` quiets that rule and only that rule", () => {
    for (const id of ALL_THREE) {
      const result = summarise(diagnosticsOn(nestedCard(`{/* biome-ignore lint/plugin/${id}: r */}`)))
      expect(result).toEqual({ plugins: ALL_THREE.filter((other) => other !== id), other: [] })
    }
  })

  test("bare `lint/plugin` quiets every plugin rule on the node — the form not to write", () => {
    expect(summarise(diagnosticsOn(nestedCard("{/* biome-ignore lint/plugin: r */}")))).toEqual({
      plugins: [],
      other: [],
    })
  })

  test("a name that is not a plugin's file name suppresses nothing, and says so", () => {
    // The camelCase spelling a built-in rule would use, and a plain typo. Both
    // are reported as unused rather than matched loosely.
    for (const name of ["noNestedCard", "no-nested-cards"]) {
      const result = summarise(diagnosticsOn(nestedCard(`{/* biome-ignore lint/plugin/${name}: r */}`)))
      expect(result).toEqual({ plugins: ALL_THREE, other: ["suppressions/unused"] })
    }
  })

  test("`plugin:` without `lint/` is accepted and applies to nothing, silently", () => {
    // The form the published snippet used to print. No parse error, no
    // unused-suppression warning: a reader who copied it saw the diagnostic
    // stay and nothing to say why.
    expect(summarise(diagnosticsOn(nestedCard("{/* biome-ignore plugin: r */}")))).toEqual({
      plugins: ALL_THREE,
      other: [],
    })
  })

  test("the reason is required", () => {
    const result = summarise(diagnosticsOn(nestedCard("{/* biome-ignore lint/plugin/no-nested-card: */}")))
    expect(result.plugins).toEqual(ALL_THREE)
    expect(result.other).toEqual(["suppressions/parse"])
  })
})

describe("the published 'Claiming an exception' snippet", () => {
  const withJudgementCalls = rulesRegistry.filter(
    (rule) => rule.exceptions.some((e) => !e.paths?.length) && rule.enforcement.biome,
  )

  test("names the one rule, for every plugin rule that has a judgement-call exception", () => {
    const plugins = withJudgementCalls.filter((rule) => rule.enforcement.biome?.via === "plugin")
    expect(plugins.length).toBeGreaterThan(0)
    for (const rule of plugins) {
      const snippet = buildRuleChecks(rule).find((c) => c.title === "Claiming an exception that is not a path")
      expect(snippet?.code).toContain(`// biome-ignore lint/plugin/${rule.id}: `)
      expect(snippet?.code).not.toMatch(/biome-ignore (lint\/)?plugin:/)
    }
  })

  test("actually suppresses the rule it names, through the real CLI", () => {
    const rule = withJudgementCalls.find((r) => r.id === "no-nested-card")
    if (!rule) throw new Error("no-nested-card has no judgement-call exception — pick another rule")
    const line = buildRuleChecks(rule)
      .find((c) => c.title === "Claiming an exception that is not a path")
      ?.code.split("\n")
      .find((l) => l.startsWith("// biome-ignore"))
    if (!line) throw new Error("the snippet has no biome-ignore line")
    const body = line.slice("// ".length)
    const result = summarise(diagnosticsOn(nestedCard(`{/* ${body} */}`)))
    expect(result).toEqual({ plugins: ALL_THREE.filter((id) => id !== "no-nested-card"), other: [] })
  })
})
