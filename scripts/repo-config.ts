/**
 * The repository settings this project depends on, as data, with a command that
 * applies them and a command that checks them.
 *
 * Run: bun run repo:config          # compare live config against the tree
 *      bun run repo:config --apply  # write the difference to GitHub
 *
 * ## Why this file exists
 *
 * CLAUDE.md already makes the argument: `delete_branch_on_merge` is load-bearing
 * for this repo — it is one of the two guards against a PR merging into an
 * already-merged branch — and it is a repo setting, so nothing in the tree shows
 * a reader that it is there, or tells anyone when it stops being there. The
 * `base-branch` CI job exists as a second guard precisely because the first one
 * is invisible.
 *
 * The same hole, one level up, is what task #30 is about. CI has been advisory
 * for this repo's whole life: `main` had no protection and no ruleset, so `lint`,
 * `test`, `typecheck` and `base-branch` all *reported* and none of them *blocked*.
 * A red PR could be merged by hand and nothing would stop it. And with
 * `allow_auto_merge: false` there was no merge queue to put a PR into, so
 * `gh pr merge --auto` degraded to a plain merge — the one mutation the agent
 * container's merge policy refuses — and every agent PR sat open until a human
 * landed it.
 *
 * Both halves are one change: required checks are what make `--auto` mean
 * something, and `--auto` is what makes required checks reachable for an agent.
 * So they live together here, in the tree, where the reasoning is readable and
 * the drift is detectable.
 *
 * ## What is configured, and the decisions inside it
 *
 * Repo settings: see `desiredRepoSettings` below.
 * Branch rules:  `.github/rulesets/main.json`, in GitHub's own ruleset
 *                import/export shape, so it can also be pasted into
 *                Settings → Rules → New ruleset → Import a ruleset.
 *
 * **A pull request is required for `main`** (the `pull_request` rule), with zero
 * required approvals. Nothing in this repo pushes to `main`: `deploy.yml` only
 * *triggers* on a push to `main`, and the only `git push` anywhere in the tree is
 * inside the advice text the `base-branch` job prints. Zero approvals is the
 * point of the exercise — the gate is CI, not a human, or agents are back where
 * they started.
 *
 * **Squash is the only allowed merge method.** This repo squash-merges; that is
 * the premise the whole `base-branch` guard is reasoning about. Saying so in the
 * ruleset costs nothing and removes a way to get it wrong.
 *
 * **`strict_required_status_checks_policy` is false** — a PR does *not* have to
 * be up to date with `main` to merge. This is the knob task #30 asked to be
 * decided on purpose, so: with several agents landing work in parallel and no
 * merge queue, strict means every merge into `main` invalidates the green on
 * every other queued PR, which then has to be updated and re-run, in an order
 * nobody is arranging. Two agents is already enough to livelock, and the failure
 * mode is silent — PRs simply never land, which is the exact symptom #30 was
 * filed about. What strict buys is catching a semantic conflict between two
 * individually-green PRs, and this repo already catches that one commit later:
 * `ci.yml` runs on `push: main`, so a broken `main` reports immediately rather
 * than being discovered by the next PR.
 *
 * The configuration that gets both is a merge queue (`merge_queue` ruleset rule),
 * which serialises and re-tests without anyone re-pushing. It is deliberately not
 * here: it needs `ci.yml` to handle the `merge_group` event, and it is a lot of
 * moving parts for a repo whose CI is one job of a few minutes. If PRs start
 * colliding on `main`, that is the change to make, and this is the file to make
 * it in.
 *
 * **Org admins can bypass.** A ruleset that requires a PR and has no bypass can
 * lock the humans out of their own `main` when something needs unsticking at 2am.
 * `OrganizationAdmin` keeps the escape hatch; the bot is not one, so agents get
 * no bypass from it. (The other escape hatch is setting `enforcement` to
 * `disabled` — which this script would then report as drift, loudly, which is
 * the behaviour you want from a temporary measure.)
 *
 * ## Permissions
 *
 * Applying needs `administration: write`. Reading needs nothing special — the
 * repo object and `GET /rulesets` are both readable by any token that can see the
 * repo, which is why `--check` works from an agent container even though
 * `--apply` does not. If `--apply` returns 403 from an agent, that is the App's
 * permission set, not a transient error and not the merge proxy: a human with
 * admin has to run it, or the installation has to be granted the scope.
 */
import { spawnSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const RULESET_PATH = join(ROOT, ".github", "rulesets", "main.json")

/**
 * Repo-level settings, each one something the tree relies on.
 *
 * `allow_auto_merge` is what gives `gh pr merge --auto --squash` a queue to put a
 * PR into, instead of silently falling back to an immediate merge.
 *
 * `delete_branch_on_merge` is guard one against merging into an already-merged
 * branch (see CLAUDE.md and the `base-branch` job). It has been true all along;
 * it is listed here so that it stops being true *visibly*.
 *
 * `allow_squash_merge` has to stay on for the ruleset's `allowed_merge_methods`
 * to be satisfiable at all. The other two methods are left alone on purpose: the
 * ruleset already forbids them for `main`, and this repo has no business deciding
 * what a future branch protected by nothing is allowed to do.
 */
export const desiredRepoSettings = {
  allow_auto_merge: true,
  allow_squash_merge: true,
  delete_branch_on_merge: true,
} as const

type Json = string | number | boolean | null | Json[] | { [key: string]: Json }

type Ruleset = {
  name: string
  target: string
  enforcement: string
  bypass_actors?: Json[]
  conditions?: Json
  rules?: Json[]
}

function gh(args: string[]): { ok: boolean; stdout: string; stderr: string } {
  const run = spawnSync("gh", args, { encoding: "utf8" })
  if (run.error) {
    throw new Error(
      `Could not run \`gh\`: ${run.error.message}\nThis script drives the GitHub CLI; install it and run \`gh auth login\`.`,
    )
  }
  return { ok: run.status === 0, stdout: run.stdout ?? "", stderr: run.stderr ?? "" }
}

function ghJson(args: string[]): Json {
  const run = gh(args)
  if (!run.ok) throw new Error(run.stderr.trim() || `gh ${args.join(" ")} failed`)
  return JSON.parse(run.stdout) as Json
}

/**
 * Is every value we declared present in what GitHub reports?
 *
 * One-directional on purpose. A GET on a ruleset comes back with ids, timestamps,
 * `_links` and every parameter GitHub defaults, none of which the tree declares
 * or wants to. So this asks the only question worth asking — "is what we asked
 * for in effect?" — and says nothing about extra live configuration, which the
 * caller reports separately where it can be judged rather than diffed.
 */
function contains(desired: Json, live: Json | undefined): boolean {
  if (Array.isArray(desired)) {
    if (!Array.isArray(live) || live.length !== desired.length) return false
    const remaining = [...live]
    for (const want of desired) {
      const at = remaining.findIndex((got) => contains(want, got))
      if (at === -1) return false
      remaining.splice(at, 1)
    }
    return true
  }
  if (desired !== null && typeof desired === "object") {
    if (live === null || live === undefined || typeof live !== "object" || Array.isArray(live)) {
      return false
    }
    const got = live as { [key: string]: Json }
    return Object.entries(desired).every(([key, value]) => contains(value, got[key]))
  }
  return desired === live
}

function show(value: Json | undefined): string {
  return JSON.stringify(value ?? null)
}

export function readRuleset(): Ruleset {
  return JSON.parse(readFileSync(RULESET_PATH, "utf8")) as Ruleset
}

function repoSlug(): string {
  const repo = ghJson(["api", "repos/{owner}/{repo}", "--jq", "{ nameWithOwner: .full_name }"])
  const slug = (repo as { nameWithOwner?: Json }).nameWithOwner
  return typeof slug === "string" ? slug : "this repo"
}

function main(): number {
  const apply = process.argv.includes("--apply")
  const desiredRuleset = readRuleset()
  const slug = repoSlug()

  console.log(`${apply ? "Applying" : "Checking"} repo configuration for ${slug}\n`)

  const drift: string[] = []

  // --- repo settings ------------------------------------------------------
  const live = ghJson(["api", "repos/{owner}/{repo}"]) as { [key: string]: Json }
  const wrongSettings = Object.entries(desiredRepoSettings).filter(
    ([key, want]) => live[key] !== want,
  )

  if (wrongSettings.length === 0) {
    console.log("settings: ok")
  } else if (!apply) {
    for (const [key, want] of wrongSettings) {
      drift.push(`settings: ${key} is ${show(live[key])}, should be ${show(want)}`)
    }
  } else {
    const fields = wrongSettings.flatMap(([key, want]) => ["-F", `${key}=${want}`])
    const run = gh(["api", "-X", "PATCH", "repos/{owner}/{repo}", ...fields])
    if (!run.ok) {
      drift.push(`settings: PATCH failed — ${run.stderr.trim()}`)
    } else {
      for (const [key, want] of wrongSettings) console.log(`settings: set ${key}=${want}`)
    }
  }

  // --- ruleset ------------------------------------------------------------
  const rulesets = ghJson(["api", "repos/{owner}/{repo}/rulesets"]) as Json[]
  const existing = rulesets.find(
    (rs) => (rs as { name?: Json }).name === desiredRuleset.name,
  ) as { id?: Json } | undefined

  if (existing === undefined) {
    if (!apply) {
      drift.push(`ruleset: no ruleset named "${desiredRuleset.name}" exists on ${slug}`)
    } else {
      const run = gh([
        "api",
        "-X",
        "POST",
        "repos/{owner}/{repo}/rulesets",
        "--input",
        RULESET_PATH,
      ])
      if (!run.ok) drift.push(`ruleset: POST failed — ${run.stderr.trim()}`)
      else console.log(`ruleset: created "${desiredRuleset.name}"`)
    }
  } else {
    // The list endpoint returns each ruleset without its rules; only the
    // by-id endpoint has them, so comparing anything means fetching it.
    const full = ghJson(["api", `repos/{owner}/{repo}/rulesets/${String(existing.id)}`]) as {
      [key: string]: Json
    }
    const matches = contains(desiredRuleset as unknown as Json, full)
    if (matches) {
      console.log(`ruleset: ok ("${desiredRuleset.name}", ${String(full.enforcement)})`)
      const declared = new Set((desiredRuleset.rules ?? []).map((r) => (r as { type: string }).type))
      const extra = ((full.rules ?? []) as Json[])
        .map((r) => (r as { type?: Json }).type)
        .filter((type): type is string => typeof type === "string" && !declared.has(type))
      if (extra.length > 0) {
        console.log(
          `ruleset: note — also enforcing rules the tree does not declare: ${extra.join(", ")}`,
        )
      }
    } else if (!apply) {
      drift.push(
        `ruleset: "${desiredRuleset.name}" does not match .github/rulesets/main.json\n` +
          `           live: ${JSON.stringify(full.rules)}\n` +
          `           want: ${JSON.stringify(desiredRuleset.rules)}`,
      )
    } else {
      const run = gh([
        "api",
        "-X",
        "PUT",
        `repos/{owner}/{repo}/rulesets/${String(existing.id)}`,
        "--input",
        RULESET_PATH,
      ])
      if (!run.ok) drift.push(`ruleset: PUT failed — ${run.stderr.trim()}`)
      else console.log(`ruleset: updated "${desiredRuleset.name}"`)
    }
  }

  if (drift.length === 0) {
    console.log(apply ? "\nDone." : "\nLive configuration matches the tree.")
    return 0
  }

  console.log("")
  for (const line of drift) console.log(`  ${line}`)
  if (apply) {
    console.log(
      "\nApplying needs `administration: write`. A 403 here from an agent container is the" +
        "\nGitHub App's permission set, not a transient error and not the merge proxy — a human" +
        "\nwith admin on the repo has to run this, or the installation needs the scope.",
    )
  } else {
    console.log("\nRun `bun run repo:config --apply` (needs admin) to fix.")
  }
  return 1
}

if (import.meta.main) {
  try {
    process.exit(main())
  } catch (err) {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  }
}
