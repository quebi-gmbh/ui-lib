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
import { readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import {
  buildBiomeConfig,
  pluginRules,
  renderGritPlugin,
} from "../src/registry/rules/checks"
import { metaRegistry } from "../src/registry/meta"
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
      // Byte-identical to the published plugin, which is new: the repo's local
      // carve-outs used to be compiled into its copy as extra $filename guards,
      // and are `!` entries on the override that loads it now. The file says
      // what the rule is; every path decision is in biome.jsonc.
      expect(readFileSync(path, "utf8")).toBe(renderGritPlugin(rule))
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

  test("a local scope on a plugin rule reaches the override that loads it", async () => {
    // These used to be extra $filename guards inside the repo's own copy of the
    // plugin, which is why `renderGritPlugin` took them as an argument. They are
    // `!` entries on that plugin's override now, and the path between the table
    // and the config is short enough to be worth pinning: a local scope that
    // silently failed to reach Biome would show up as a red `bun run lint` with
    // no explanation in the tree.
    const config = await buildRepoConfig()
    for (const rule of pluginRules(rulesRegistry)) {
      const override = config.overrides.find((o) =>
        o.plugins?.includes(`./${PLUGIN_DIR}/${rule.id}.grit`),
      )
      expect(override).toBeTruthy()
      for (const { glob } of localIgnoresFor(rule.id)) {
        expect(override?.includes).toContain(`!${glob}`)
      }
    }
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
  test("src/components holds nothing but published components", () => {
    // The carve-out that excepts src/components/** from six of the eight rule
    // records is an argument about a layer — the library owns appearance and
    // imports the primitives — and it is only true of files that layer actually
    // contains. (It used to exclude the directory from biome.jsonc outright,
    // which made the point sharper still; the directory is linted now, but the
    // rule exceptions it carries are the same argument.)
    // Seven docs-site files once lived here and were excused by the address
    // rather than by the argument, including a raw <input type="search"> that a
    // human, not the linter, had to find. `slug` is what makes a file part of
    // the library, so that is the membership test: anything without one is app
    // code and belongs in src/site/, where the full rule set can see it.
    const published = new Set(metaRegistry.map((m) => `${m.slug}.tsx`))
    const unpublished = readdirSync(join(ROOT, "src", "components"))
      .filter((file) => file.endsWith(".tsx"))
      .filter((file) => !published.has(file))
    expect(unpublished).toEqual([])
  })

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

  test("a raw <button> in src/components is reported, and a raw <input> is not", () => {
    // The guarantee PR #35 gave the library source — it hand-rolls none of the
    // controls it forbids — used to be checked here against a config built by
    // hand, because src/components/** sat outside biome.jsonc's `files.includes`.
    // It no longer does, so the "`bun run lint` is clean" case above covers it.
    // What is left for this test is the negative control that case needs: proof
    // that the directory is really being linted, and that the one element the
    // records except there (<input>, the control every text field wraps) is
    // still excepted.
    const probe = "src/components/__lint_probe__.tsx"
    let diagnostics: Diagnostic[]
    try {
      writeFileSync(
        join(ROOT, probe),
        'export const Probe = () => (\n  <>\n    <button type="button">Save</button>\n    <input type="text" />\n  </>\n)\n',
      )
      diagnostics = lint([probe])
    } finally {
      rmSync(join(ROOT, probe), { force: true })
    }
    const restricted = diagnostics.filter(
      (d) => d.category === "lint/correctness/noRestrictedElements",
    )
    expect(restricted.map(textOf).join("\n")).toContain("@/components/button")
    // One diagnostic, not two: <input> is the exception the records grant this
    // directory, and an assertion that only counted <button> would pass just as
    // well if the exception had quietly been dropped.
    expect(restricted.map(describeDiagnostic)).toHaveLength(1)
  })

  test("a raw <button> in a test fixture is reported, and a raw <form> is not", () => {
    // The same negative control for `tests/**\/*.tsx`, which is in the file list
    // as of task #20. The local scope there names one element — <form>, because
    // a Conform fixture binds to a real one and react-router's <Form> would need
    // a router mounted around every test — and the value of naming it is only
    // real if the rest of the tier-1 list is still checked. A blanket "the rule
    // is off in tests/" would satisfy "`bun run lint` is clean" just as well,
    // and this is the assertion that tells the two apart.
    const probe = "tests/__lint_probe__.test.tsx"
    let diagnostics: Diagnostic[]
    try {
      writeFileSync(
        join(ROOT, probe),
        'export const Probe = () => (\n  <form>\n    <button type="submit">Save</button>\n  </form>\n)\n',
      )
      diagnostics = lint([probe])
    } finally {
      rmSync(join(ROOT, probe), { force: true })
    }
    const restricted = diagnostics.filter(
      (d) => d.category === "lint/correctness/noRestrictedElements",
    )
    expect(restricted.map(textOf).join("\n")).toContain("@/components/button")
    expect(restricted.map(describeDiagnostic)).toHaveLength(1)
  })

  test("the plugin rules read test fixtures, and the tests/ local scopes are what quiets them", () => {
    // Task #225. Each plugin is loaded by an override whose `includes` is its
    // record's `appliesTo` — app code — so until `localPluginIncludes` no
    // GritQL rule read tests/ at all: a nested Card or a hardcoded colour in a
    // fixture was silent, and the tests/ entries in `localScopes` naming a
    // plugin rule were excusing it from a run it was never part of. One probe,
    // three addresses, so each entry is shown to be what changes the answer:
    // src/routes (every rule), tests/ (no server-validation), and
    // tests/components/ (no class-string rules either).
    const source = [
      'import { useForm } from "@conform-to/react"',
      'import { Card } from "@/components/card"',
      "export const Probe = () => {",
      "  useForm({ defaultValue: {} })",
      "  return (",
      "    <Card>",
      "      <Card>",
      '        <div className="bg-[#f00]" />',
      "      </Card>",
      "    </Card>",
      "  )",
      "}",
      "",
    ].join("\n")
    const rules = [
      "no-nested-card",
      "no-hardcoded-design-values",
      "validate-on-the-server-with-the-same-schema",
    ]
    const reportedAt = (probe: string): string[] => {
      let diagnostics: Diagnostic[]
      try {
        writeFileSync(join(ROOT, probe), source)
        diagnostics = lint([probe])
      } finally {
        rmSync(join(ROOT, probe), { force: true })
      }
      return rules.filter((id) => diagnostics.some((d) => textOf(d).includes(`/rules/${id}`)))
    }
    expect(reportedAt("src/routes/__lint_probe_plugins__.tsx")).toEqual(rules)
    expect(reportedAt("tests/__lint_probe_plugins__.test.tsx")).toEqual([
      "no-nested-card",
      "no-hardcoded-design-values",
    ])
    expect(reportedAt("tests/components/__lint_probe_plugins__.test.tsx")).toEqual([
      "no-nested-card",
    ])
  })

  test("a plain object with a `name` is not reported as a hand-wired Conform field", () => {
    // Task #194, reproduced the way it was found: a scratch file in src/routes/
    // run through the real config. `bind-fields-through-conform` looked for
    // `$meta.name` with `$meta` unbound, so any `.name` property access on a
    // control was a finding — `<Select defaultSelectedKey={person.name}>` was an
    // error, at a severity that stops the commit, and the only way out was a
    // `biome-ignore` on every one of them. Both controls are in one file so the
    // check is not "the rule went quiet": one of them is still a real binding,
    // and the assertion below says which one was reported.
    const probe = "src/routes/__lint_probe__.tsx"
    const source = [
      "export const Probe = ({",
      "  person,",
      "  fields,",
      "}: {",
      "  person: { name: string }",
      "  fields: { plan: { name: string } }",
      "}) => (",
      "  <>",
      '    <Select aria-label="Role" defaultSelectedKey={person.name} />',
      '    <Select aria-label="Plan" name={fields.plan.name} />',
      "  </>",
      ")",
      "",
    ].join("\n")
    let diagnostics: Diagnostic[]
    try {
      writeFileSync(join(ROOT, probe), source)
      diagnostics = lint([probe])
    } finally {
      rmSync(join(ROOT, probe), { force: true })
    }
    const bound = diagnostics.filter((d) => textOf(d).includes("bind-fields-through-conform"))
    const spans = bound.map((d) => source.slice(d.location?.span?.[0] ?? 0, d.location?.span?.[1]))
    expect(spans).toHaveLength(1)
    expect(spans[0]).toContain("fields.plan.name")
  })

  test("a plain object with `.errors` is not reported as an unreferenced field error", () => {
    // Task #196, the same hole one rule over and reproduced the same way.
    // `render-field-text-through-the-field` looked for `$field.errors` with
    // `$field` unbound, so `<p>{response.errors}</p>` was an error telling the
    // reader to put `id={field.errorId}` on a GraphQL response — nothing that
    // sentence names exists there, and the only way out was a suppression per site.
    // Both paragraphs are in one file so the assertion is not "the rule went
    // quiet": the second is a real unreferenced field error, and the span below
    // says it is the one reported.
    const probe = "src/routes/__lint_probe_errors__.tsx"
    const source = [
      "export const Probe = ({",
      "  response,",
      "  fields,",
      "}: {",
      "  response: { errors: string[] }",
      "  fields: { email: { errors?: string[] } }",
      "}) => (",
      "  <>",
      "    <p>{response.errors}</p>",
      "    <p>{fields.email.errors}</p>",
      "  </>",
      ")",
      "",
    ].join("\n")
    let diagnostics: Diagnostic[]
    try {
      writeFileSync(join(ROOT, probe), source)
      diagnostics = lint([probe])
    } finally {
      rmSync(join(ROOT, probe), { force: true })
    }
    const reported = diagnostics.filter((d) =>
      textOf(d).includes("render-field-text-through-the-field"),
    )
    const spans = reported.map((d) =>
      source.slice(d.location?.span?.[0] ?? 0, d.location?.span?.[1]),
    )
    expect(spans).toHaveLength(1)
    expect(spans[0]).toContain("fields.email.errors")
  })
})
