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
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
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

  test("a local scope on a plugin rule reaches the entry that loads it", async () => {
    // A local scope on a built-in rule is an ordinary override, and the
    // comparison above would catch it going missing. On a plugin rule it is a
    // negated pattern on the entry that loads the plugin, which is the only
    // place a plugin's scope can be stated — there is no `overrides` entry that
    // unloads one, and no suppression comment for a plugin diagnostic either.
    // Lose it and the rule fires on a fixture that renders its counter-example
    // on purpose.
    const config = await buildRepoConfig()
    for (const rule of pluginRules(rulesRegistry)) {
      const entry = config.overrides.find((o) =>
        o.plugins?.some((p) => p.endsWith(`/${rule.id}.grit`)),
      )
      expect(entry).toBeTruthy()
      for (const { glob } of localIgnoresFor(rule.id)) {
        expect(entry?.includes).toContain(`!${glob}`)
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

/**
 * Lint an identical little tree from several checkout paths and return what each
 * one reported, keyed by the path it was checked out to.
 *
 * The tree is two files, one for each direction the bug ran in: a `src/routes/`
 * file that every rule claims, and a `tests/` file that no plugin rule does. The
 * config and the plugins are the committed ones, copied rather than rebuilt —
 * the question is what a consumer of these artifacts gets, not what the
 * generator thinks it emitted.
 */
function lintFromCheckouts(paths: string[]): Record<string, string[]> {
  const sandbox = join("/tmp", `quebi-checkout-path-${process.pid}`)
  rmSync(sandbox, { recursive: true, force: true })
  const reported: Record<string, string[]> = {}

  try {
    for (const relative of paths) {
      const root = join(sandbox, relative)
      mkdirSync(join(root, "src", "routes"), { recursive: true })
      mkdirSync(join(root, "tests"), { recursive: true })
      cpSync(join(ROOT, CONFIG_FILE), join(root, CONFIG_FILE))
      cpSync(join(ROOT, PLUGIN_DIR), join(root, PLUGIN_DIR), { recursive: true })
      // The config reads .gitignore, so Biome wants a git checkout to read it
      // from and refuses to run at all without one.
      writeFileSync(join(root, ".gitignore"), "")
      Bun.spawnSync(["git", "init", "-q"], { cwd: root })

      // An arbitrary spacing value in a test fixture: outside every plugin
      // rule's appliesTo, and the false positive that started this.
      writeFileSync(
        join(root, "tests", "probe.test.tsx"),
        'export const Probe = () => <div className="p-2">{"py-[3px]"}</div>\n',
      )
      // A hardcoded colour in app code: inside every plugin rule's appliesTo,
      // and the diagnostic an over-matching exception guard used to swallow.
      writeFileSync(
        join(root, "src", "routes", "probe.tsx"),
        'export const Probe = () => <div className="bg-[#f00]">x</div>\n',
      )

      const run = Bun.spawnSync(
        [BIOME, "lint", "--reporter=json", "--max-diagnostics=none"],
        { cwd: root, stdout: "pipe", stderr: "pipe" },
      )
      const stdout = run.stdout.toString()
      let diagnostics: Diagnostic[]
      try {
        diagnostics = (JSON.parse(stdout) as { diagnostics?: Diagnostic[] }).diagnostics ?? []
      } catch {
        throw new Error(
          `Biome produced no JSON in ${root}.\nstderr:\n${run.stderr.toString()}\nstdout:\n${stdout.slice(0, 600)}`,
        )
      }
      // Path and category only: the message is the same either way, and the
      // absolute path differs by construction.
      reported[relative] = diagnostics
        .map((d) => {
          const file = typeof d.location?.path === "string" ? d.location.path : d.location?.path?.file
          return `${file ?? "?"} — ${d.category ?? "?"}`
        })
        .sort()
    }
  } finally {
    rmSync(sandbox, { recursive: true, force: true })
  }

  return reported
}

describe("a rule's scope does not depend on where the repo is checked out", () => {
  // The bug this pins, found in this repo's own `.worktrees/` layout: a plugin's
  // scope used to be a regex over GritQL's `$filename`, which is absolute, while
  // a rule record's globs are relative to the project. The compiled guard let any
  // prefix stand in front, so a directory *above* the checkout could satisfy it,
  // and both halves of a rule's scope broke in opposite directions:
  //
  //   ~/src/…/repo             — `appliesTo: src/**` matched the whole tree,
  //                              so plugin rules fired on tests/** as well;
  //   ~/src/components/…/repo  — the `!src/components/**` exception matched the
  //                              whole tree, so the rule reported nothing at all.
  //
  // The second is the one that matters: it points at green. "`bun run lint` is
  // clean" below passes just as happily against a rule that has been silently
  // switched off, which is why this case lints the same tree from several places
  // and compares, rather than asserting a count from any one of them.
  const reported = lintFromCheckouts([
    "plain/repo",
    "src/repo",
    "src/components/repo",
    "app/repo",
  ])

  test("the same tree reports the same thing from every checkout path", () => {
    const [control, ...rest] = Object.keys(reported)
    for (const path of rest) {
      expect({ path, diagnostics: reported[path] }).toEqual({
        path,
        diagnostics: reported[control],
      })
    }
  })

  test("...and what they all report is the app-code violation, and only it", () => {
    // The positive control the comparison needs: four identical empty lists
    // would satisfy it too, and that is exactly what a config that failed to
    // load looks like.
    for (const [path, diagnostics] of Object.entries(reported)) {
      expect({ path, diagnostics }).toEqual({
        path,
        diagnostics: ["src/routes/probe.tsx — plugin"],
      })
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
})
