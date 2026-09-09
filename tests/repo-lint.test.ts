/**
 * ui-lib linting itself.
 *
 * `tests/element-usage.test.ts` and `tests/forms.test.ts` check that each rule
 * fires on the code it is about. This file checks the other half: that the repo
 * publishing those rules actually follows them, and that the config doing the
 * checking is still the one the rule records describe.
 *
 * Everything here drives the real Biome CLI over the real tree — no fixtures,
 * no re-implementation. A passing run means `bun run lint` is clean for the same
 * reasons CI says it is.
 */
import { describe, expect, test } from "bun:test"
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  buildBiomeConfig,
  pluginRules,
  renderGritPlugin,
} from "../src/registry/rules/checks"
import { rulesRegistry } from "../src/registry/rules"
import {
  CONFIG_FILE,
  PLUGIN_DIR,
  ROOT,
  buildRepoConfig,
  localIgnoresFor,
  localScopes,
} from "../scripts/generate-lint-config"
import { racPrimitives } from "./harness"

const BIOME = join(ROOT, "node_modules", ".bin", "biome")

interface Diagnostic {
  category?: string
  severity?: string
  location?: { path?: { file?: string } | string; span?: number[] }
  description?: string
  /** Biome's JSON reporter puts the rendered text here, as markup nodes. */
  message?: unknown
}

/** The diagnostic's human text, wherever the JSON reporter put it. */
function textOf(d: Diagnostic): string {
  return `${d.description ?? ""} ${JSON.stringify(d.message ?? "")}`
}

/** Run Biome and return its diagnostics, with the config and paths given. */
function lint(args: string[]): Diagnostic[] {
  const run = Bun.spawnSync([BIOME, "lint", "--reporter=json", "--max-diagnostics=none", ...args], {
    cwd: ROOT,
    stdout: "pipe",
    stderr: "pipe",
  })
  const stdout = run.stdout.toString()
  try {
    return (JSON.parse(stdout) as { diagnostics?: Diagnostic[] }).diagnostics ?? []
  } catch {
    throw new Error(
      `Biome produced no JSON for \`biome lint ${args.join(" ")}\`.\nstderr:\n${run.stderr.toString()}\nstdout:\n${stdout.slice(0, 600)}`,
    )
  }
}

function describeDiagnostic(d: Diagnostic): string {
  const path = typeof d.location?.path === "string" ? d.location.path : d.location?.path?.file
  return `${path ?? "?"} — ${d.category ?? "?"}: ${textOf(d).slice(0, 160)}`
}

/**
 * The JSON body of the generated JSONC. Every comment the generator writes sits
 * on a line of its own, which is what makes this a strip rather than a parse.
 */
function stripComments(jsonc: string): string {
  return jsonc
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n")
}

describe("the generated config is the one the rule records describe", () => {
  test("biome.jsonc matches what the rule records render", async () => {
    const committed = JSON.parse(stripComments(readFileSync(join(ROOT, CONFIG_FILE), "utf8")))
    // Round-tripped through JSON so `as const` narrowing on the generator side
    // does not make this a type comparison instead of a value one.
    expect(committed).toEqual(JSON.parse(JSON.stringify(await buildRepoConfig())))
  })

  test("every .grit plugin matches its record, and there are no orphans", () => {
    const expected = pluginRules(rulesRegistry)
    for (const rule of expected) {
      const path = join(ROOT, PLUGIN_DIR, `${rule.id}.grit`)
      expect(readFileSync(path, "utf8")).toBe(
        renderGritPlugin(rule, undefined, localIgnoresFor(rule.id)),
      )
    }
    // An orphan is the dangerous case: a rule deleted from the registry leaves a
    // plugin behind that biome.jsonc no longer loads, or worse, still does.
    expect(readdirSync(join(ROOT, PLUGIN_DIR)).filter((f) => f.endsWith(".grit")).sort()).toEqual(
      expected.map((r) => `${r.id}.grit`).sort(),
    )
  })

  test("editing a rule record changes the config", async () => {
    // The property the acceptance criteria ask for, asserted rather than
    // demonstrated by hand: the config is derived, so a different record is a
    // different config.
    const rule = rulesRegistry.find((r) => r.id === "no-raw-interactive-elements")
    if (!rule?.replacements) throw new Error("no-raw-interactive-elements has no replacements")
    const withoutButton = rulesRegistry.map((r) =>
      r === rule ? { ...r, replacements: r.replacements?.filter((p) => p.element !== "button") } : r,
    )
    const before = buildBiomeConfig(rulesRegistry, "./x", racPrimitives)
    const after = buildBiomeConfig(withoutButton, "./x", racPrimitives)
    expect(JSON.stringify(before)).toContain('"button"')
    expect(JSON.stringify(after)).not.toContain('"button"')
  })

  test("every local scope names real rules and says why", () => {
    for (const scope of localScopes) {
      expect(scope.includes.length).toBeGreaterThan(0)
      expect(scope.rules.length).toBeGreaterThan(0)
      // A scope with no argument behind it is a blanket disable wearing a table's
      // clothes, which is the thing this table exists to prevent.
      expect(scope.reason.trim().length).toBeGreaterThan(80)
      for (const id of scope.rules) {
        expect(rulesRegistry.map((r) => r.id)).toContain(id)
      }
    }
  })
})

describe("the repo obeys the rules it publishes", () => {
  test("`bun run lint` is clean", () => {
    const diagnostics = lint([])
    expect(diagnostics.map(describeDiagnostic)).toEqual([])
  })

  test("a raw <button> in src/routes is reported", () => {
    // The negative control. Without it, "clean" above is also what a broken
    // config, an unloadable plugin, or an empty file list looks like.
    // Written to a real path rather than piped through --stdin-file-path,
    // because the whole question is whether a file at this path is linted.
    const probe = "src/routes/__lint_probe__.tsx"
    let diagnostics: Diagnostic[]
    try {
      writeFileSync(join(ROOT, probe), 'export const Probe = () => <button type="button">Save</button>\n')
      diagnostics = lint([probe])
    } finally {
      rmSync(join(ROOT, probe), { force: true })
    }
    const messages = diagnostics.map(textOf)
    expect(diagnostics.map((d) => d.category)).toContain("lint/correctness/noRestrictedElements")
    // The message has to name the replacement — a rule that only says "no" makes
    // the reader go looking for the answer, which is the failure this whole set
    // was written to avoid.
    expect(messages.join("\n")).toContain("@/components/button")
  })

  test("the library source keeps its raw elements out", () => {
    // src/components/** is outside biome.jsonc's `files.includes` — those files
    // carry `biome-ignore lint/a11y/...` comments aimed at a consumer's fuller
    // Biome setup, and a rules-only config reports every one of them as an
    // unused suppression. The guarantee itself (PR #35: the library hand-rolls
    // none of the controls it forbids) is asserted here instead, with a config
    // built from the same records and scoped to that directory.
    const generated = buildBiomeConfig(rulesRegistry, "./unused", racPrimitives)
    const dir = mkdtempSync(join(tmpdir(), "quebi-library-lint-"))
    writeFileSync(
      join(dir, "biome.json"),
      JSON.stringify({
        // No `plugins`: every plugin rule already excepts src/components inside
        // its own pattern, so leaving them out changes nothing and saves having
        // to resolve their paths from a config outside the repo.
        files: { includes: ["src/components/**/*.tsx"] },
        linter: { enabled: true, rules: { preset: "none", ...generated.linter.rules } },
        overrides: generated.overrides,
      }),
    )
    const diagnostics = lint([`--config-path=${dir}`, "src/components"]).filter(
      // Same reason the directory is excluded from biome.jsonc in the first place.
      (d) => !String(d.category ?? "").startsWith("suppressions/"),
    )
    expect(diagnostics.map(describeDiagnostic)).toEqual([])
  })
})
