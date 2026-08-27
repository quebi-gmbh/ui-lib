/**
 * Test harness for the rule checks.
 *
 * Materialises the *published* artifacts — the same `biome.jsonc` and `.grit`
 * plugins that `scripts/generate-api.ts` writes into `public/api/rules/` — into a
 * temp project, then runs the real Biome CLI over fixtures. Nothing is
 * re-implemented for the tests, so a passing test describes what a consumer gets.
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { buildBiomeConfig, pluginRules, renderGritPlugin } from "../src/registry/rules/checks"
import { rulesRegistry } from "../src/registry/rules"

const ROOT = join("/tmp", `quebi-rules-tests-${process.pid}`)
const BIOME = join(import.meta.dir, "..", "node_modules", ".bin", "biome")
const PLUGIN_DIR = "ui-lib-rules"

function setUp() {
  rmSync(ROOT, { recursive: true, force: true })
  mkdirSync(join(ROOT, PLUGIN_DIR), { recursive: true })

  for (const rule of pluginRules(rulesRegistry)) {
    writeFileSync(join(ROOT, PLUGIN_DIR, `${rule.id}.grit`), renderGritPlugin(rule))
  }

  const config = buildBiomeConfig(rulesRegistry, `./${PLUGIN_DIR}`)
  writeFileSync(
    join(ROOT, "biome.json"),
    JSON.stringify(
      {
        ...config,
        linter: {
          enabled: true,
          // The published config is a fragment to merge into a project's own
          // setup, so it deliberately says nothing about Biome's recommended
          // rules. Here they are off, so a test sees only our rules.
          rules: { recommended: false, ...config.linter.rules },
        },
      },
      null,
      2,
    ),
  )
}
setUp()

/** Rule id for a diagnostic: plugins name themselves in the message, built-ins by category. */
function ruleIdFor(diagnostic: { category?: string; message?: unknown }): string {
  const category = diagnostic.category ?? ""
  if (category.startsWith("lint/")) {
    const name = category.slice("lint/".length)
    const rule = rulesRegistry.find(
      (r) => r.enforcement.biome?.via === "rule" && r.enforcement.biome.rule === name,
    )
    return rule?.id ?? category
  }
  const match = JSON.stringify(diagnostic.message ?? "").match(/\/rules\/([a-z0-9-]+)/)
  return match ? match[1] : `<unattributed: ${category}>`
}

/**
 * Lint a snippet as if it were a file at `filename`, and return the ids of the
 * rules that fired. The default path is ordinary app code, covered by every rule.
 */
export function rulesFiredOn(code: string, filename = "src/routes/example.tsx"): string[] {
  const path = join(ROOT, filename)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, code)

  const run = Bun.spawnSync([BIOME, "lint", filename, "--reporter=json"], {
    cwd: ROOT,
    stdout: "pipe",
    stderr: "pipe",
  })
  const stdout = run.stdout.toString()
  let parsed: { diagnostics?: { category?: string; message?: unknown }[] }
  try {
    parsed = JSON.parse(stdout)
  } catch {
    throw new Error(
      `Biome produced no JSON for ${filename}. stderr:\n${run.stderr.toString()}\nstdout:\n${stdout.slice(0, 400)}`,
    )
  }
  const ids = (parsed.diagnostics ?? []).map(ruleIdFor)
  // A plugin that fails to compile reports once, globally, with no rule
  // attached — silently turning every "does not fire" assertion green.
  const broken = ids.find((id) => id.startsWith("<unattributed"))
  if (broken) throw new Error(`Biome reported a diagnostic no rule owns (${broken}) on ${filename}`)
  return ids
}

/** Did this rule fire on this snippet? */
export function fires(ruleId: string, code: string, filename?: string): boolean {
  return rulesFiredOn(code, filename).includes(ruleId)
}

/** How many findings did this rule produce? Used to check for double-reporting. */
export function fireCount(ruleId: string, code: string, filename?: string): number {
  return rulesFiredOn(code, filename).filter((id) => id === ruleId).length
}

/** Wrap a JSX fragment in a component so the parser sees a real module. */
export function component(body: string): string {
  return `export function Example(props: any) {\n  return (\n${body}\n  )\n}\n`
}

/** Where the harness materialised the published artifacts, for config-level tests. */
export const projectRoot = ROOT
export const biomeBinary = BIOME
export const pluginDirectory = PLUGIN_DIR
