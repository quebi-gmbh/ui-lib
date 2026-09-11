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
 * ## What the tree does not declare, and why the check still mentions it
 *
 * The ruleset file declares what this repo *requires*. GitHub's answer to a GET
 * is larger than that in both directions, and the two ways of getting this wrong
 * are equally bad: declare something GitHub never reports and the check fails
 * forever over a phantom; ignore everything undeclared and a knob GitHub turns on
 * by default is never seen by anyone.
 *
 * So an undeclared setting that is *on* is printed as a note and is not drift.
 * There is one today, and it is worth knowing about:
 * `require_extra_approval_for_unattributed_changes`, which GitHub defaults to
 * true and which, on its face, is the shape of thing that could put every agent
 * PR back in front of a reviewer — the symptom this whole file exists to remove.
 * It does not: PRs #67, #68 and #69 all landed under this ruleset with zero
 * reviews, #69 auto-merging 28 seconds after its last check went green. It is
 * left on, undeclared, and visible. If it ever does hold a PR, the note is where
 * you will see it, and turning it off is then a decision with evidence behind it
 * rather than a default nobody chose.
 *
 * Two keys are deliberately *absent* from the ruleset file for the same reason.
 * `automatic_copilot_code_review_enabled` is accepted on write and never returned
 * on read, so declaring it made every check red about something unverifiable.
 * `bypass_actors` is the reverse — it is returned only to a token that could edit
 * the ruleset, so from an agent container an empty list and a redacted one look
 * identical; it stays declared (it is a real decision) and the check says out
 * loud that it could not confirm it.
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

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json }

export type Ruleset = {
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

export type Difference = { path: string; live: Json | undefined; want: Json }
export type Extra = { path: string; live: Json }
export type Comparison = { differences: Difference[]; extras: Extra[] }

function isObject(value: Json | undefined): value is { [key: string]: Json } {
  return value !== null && value !== undefined && typeof value === "object" && !Array.isArray(value)
}

/**
 * A name for an element of a list, so a path reads `rules.pull_request.…` rather
 * than `rules[2].…`. GitHub's lists are keyed by a field, never by position, and
 * a position is the one thing about them that is not stable.
 */
function label(value: Json, index: number): string {
  if (isObject(value)) {
    for (const key of ["type", "context", "actor_type"]) {
      const named = value[key]
      if (typeof named === "string") return named
    }
  }
  return `[${index}]`
}

function at(path: string, segment: string): string {
  return path === "" ? segment : `${path}.${segment}`
}

/**
 * Live configuration that is switched *on* and that the tree says nothing about.
 *
 * GitHub answers a ruleset GET with every parameter it defaults, and it grows new
 * ones over time — `require_extra_approval_for_unattributed_changes` arrived long
 * after this file did. A knob that is off or empty is enforcing nothing and is
 * noise; a knob that is on and undeclared is configuration this repo is subject
 * to and has never decided, which is precisely what this script exists to
 * surface. So: report the second, ignore the first, and do not treat either as
 * drift — the tree declares what it *requires*, not the whole of GitHub.
 */
function active(live: Json, path: string): Extra[] {
  if (Array.isArray(live)) return live.length === 0 ? [] : [{ path, live }]
  if (isObject(live)) return Object.entries(live).flatMap(([key, v]) => active(v, at(path, key)))
  if (live === null || live === false || live === 0 || live === "") return []
  return [{ path, live }]
}

/**
 * What in the live configuration fails to match what we declared, and what is in
 * effect that we never declared.
 *
 * The match is one-directional on purpose: a GET comes back with ids, timestamps,
 * `_links` and defaults the tree has no business restating. Reporting a *path*
 * for each mismatch rather than a verdict is the point — the first version of
 * this printed the live and desired rule arrays side by side, which for a
 * difference anywhere else in the ruleset (`bypass_actors`, `conditions`,
 * `enforcement`) printed two identical-looking lists and left the reader to hunt.
 *
 * Lists are matched by content, not by position, and a desired element is paired
 * with whichever live element is closest to it, so one wrong field reads as one
 * wrong field instead of as two unrelated elements.
 */
export function compare(desired: Json, live: Json | undefined, path = ""): Comparison {
  if (Array.isArray(desired)) {
    if (!Array.isArray(live)) return { differences: [{ path, live, want: desired }], extras: [] }
    const remaining = live.map((value, index) => ({ value, index }))
    const differences: Difference[] = []
    const extras: Extra[] = []
    desired.forEach((want, index) => {
      const name = label(want, index)
      const where = at(path, name)
      if (remaining.length === 0) {
        differences.push({ path: where, live: undefined, want })
        return
      }
      // Pair by the element's own name where it has one, so a rule that is gone
      // reads as that one rule missing rather than as every rule after it having
      // shifted along by one — which is the difference between "base-branch is no
      // longer required" and three lines of apparent nonsense.
      const named = remaining.findIndex((got) => label(got.value, got.index) === name)
      if (named === -1 && !name.startsWith("[")) {
        differences.push({ path: where, live: undefined, want })
        return
      }
      let best = named === -1 ? 0 : named
      let closest = compare(want, remaining[best].value, where)
      if (named === -1) {
        // An unnamed element — a bare value in a list. Nothing identifies it but
        // its content, so pair it with whatever it is closest to.
        for (let i = 1; i < remaining.length && closest.differences.length > 0; i++) {
          const next = compare(want, remaining[i].value, where)
          if (next.differences.length < closest.differences.length) {
            best = i
            closest = next
          }
        }
      }
      remaining.splice(best, 1)
      differences.push(...closest.differences)
      extras.push(...closest.extras)
    })
    for (const left of remaining) {
      extras.push(...active(left.value, at(path, label(left.value, left.index))))
    }
    return { differences, extras }
  }

  if (isObject(desired)) {
    if (!isObject(live)) return { differences: [{ path, live, want: desired }], extras: [] }
    const differences: Difference[] = []
    const extras: Extra[] = []
    for (const [key, want] of Object.entries(desired)) {
      const below = compare(want, live[key], at(path, key))
      differences.push(...below.differences)
      extras.push(...below.extras)
    }
    for (const [key, got] of Object.entries(live)) {
      if (!(key in desired)) extras.push(...active(got, at(path, key)))
    }
    return { differences, extras }
  }

  if (desired === live) return { differences: [], extras: [] }
  return { differences: [{ path, live, want: desired }], extras: [] }
}

function show(value: Json | undefined): string {
  return JSON.stringify(value ?? null)
}

/**
 * Keys a GET adds that describe the *record* rather than the rule: ids, the
 * source, timestamps, links, and `current_user_can_bypass`, which is an answer
 * about the caller and not about the branch. Comparing against them, or
 * reporting them as undeclared configuration, is noise in either direction.
 */
const RULESET_ENVELOPE = [
  "id",
  "node_id",
  "source",
  "source_type",
  "created_at",
  "updated_at",
  "_links",
  "current_user_can_bypass",
]

/**
 * The tree's ruleset against the live one, with the two things GitHub's answer
 * does not let you compare directly taken out of the comparison and said in
 * words instead.
 *
 * `bypass_actors` comes back only for a token that could edit the ruleset; for
 * the agent App the key is simply absent, which is indistinguishable from "the
 * bypass list is empty". Reporting that as drift would make this command fail
 * forever for every agent — the one reader CLAUDE.md sends here — over something
 * it cannot see, so it is a note that says whose eyes can settle it.
 */
export function compareRuleset(
  desired: Ruleset,
  live: { [key: string]: Json },
): Comparison & { notes: string[] } {
  const notes: string[] = []
  const want = { ...desired } as { [key: string]: Json }
  const got = { ...live }
  for (const key of RULESET_ENVELOPE) delete got[key]

  if (want.bypass_actors !== undefined && got.bypass_actors === undefined) {
    delete want.bypass_actors
    const actors = (desired.bypass_actors ?? [])
      .map((a) => String((a as { actor_type?: Json }).actor_type))
      .join(", ")
    notes.push(
      `bypass_actors is not in GitHub's answer to this token (it is shown only to a token that` +
        ` could edit the ruleset), so "${actors}" is unverified from here — check it as a human,` +
        ` or run --apply, which sets it either way`,
    )
  }

  return { ...compare(want, got), notes }
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
    const { differences, extras, notes } = compareRuleset(desiredRuleset, full)
    if (differences.length === 0) {
      console.log(`ruleset: ok ("${desiredRuleset.name}", ${String(full.enforcement)})`)
      for (const note of notes) console.log(`ruleset: note — ${note}`)
      for (const { path, live: value } of extras) {
        console.log(`ruleset: note — in effect but not declared: ${path} = ${show(value)}`)
      }
    } else if (!apply) {
      drift.push(
        [
          `ruleset: "${desiredRuleset.name}" does not match .github/rulesets/main.json`,
          ...differences.map(
            (d) => `           ${d.path}: live ${show(d.live)}, want ${show(d.want)}`,
          ),
        ].join("\n"),
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
