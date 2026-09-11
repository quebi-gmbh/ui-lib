/**
 * The gate on `main`, checked against the CI that is supposed to be the gate.
 *
 * `.github/rulesets/main.json` names status checks by string. A string that no
 * longer matches a job name does not fail loudly at the moment it goes wrong —
 * it either stops gating (the check is gone, nothing notices) or starts gating
 * forever (the check never reports, every PR hangs on a context that will never
 * arrive). Neither is discoverable from the file. So the pairing is asserted
 * here, where renaming a CI job breaks a test in the same commit.
 *
 * The rest of these are the decisions from `scripts/repo-config.ts` written down
 * as invariants: a gate that a bot can bypass, a ruleset in `evaluate` mode, or
 * strictness turned on without a merge queue underneath it are each a way for
 * this configuration to look present and do nothing.
 */
import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { desiredRepoSettings, readRuleset } from "../scripts/repo-config"

const ruleset = readRuleset()

type Rule = { type: string; parameters?: Record<string, unknown> }

const rules = (ruleset.rules ?? []) as unknown as Rule[]

function rule(type: string): Rule | undefined {
  return rules.find((r) => r.type === type)
}

const workflow = Bun.YAML.parse(
  readFileSync(join(import.meta.dir, "..", ".github", "workflows", "ci.yml"), "utf8"),
) as { on?: Record<string, unknown>; jobs: Record<string, unknown> }

const jobNames = Object.keys(workflow.jobs)
const requiredContexts = (
  (rule("required_status_checks")?.parameters?.required_status_checks ?? []) as {
    context: string
  }[]
).map((c) => c.context)

describe("the required checks are the CI jobs", () => {
  test("CI runs on pull requests at all", () => {
    // A required context is only ever satisfied by a run triggered on the PR.
    expect(Object.keys(workflow.on ?? {})).toContain("pull_request")
  })

  test("every required check is a job in ci.yml", () => {
    // GitHub matches a required check by the name it reports under, which for a
    // job with no `name:` is the job id. A typo here blocks every PR forever on
    // a context nothing will ever send.
    for (const context of requiredContexts) expect(jobNames).toContain(context)
  })

  test("every job in ci.yml is a required check", () => {
    // The direction that matters going forward. CI was advisory for this repo's
    // whole life (task #30); the way it comes back is one new job at a time,
    // each individually forgotten in the ruleset. Add a job, gate it — or say
    // in the same commit why it should not be a gate.
    for (const job of jobNames) expect(requiredContexts).toContain(job)
  })

  test("required checks are pinned to GitHub Actions", () => {
    // Without an integration id, any app — or any token that can POST a commit
    // status — can report `check: success` on a PR and satisfy the gate. 15368
    // is GitHub Actions: `gh api /apps/github-actions --jq .id`. Get it wrong
    // and the checks never count as reported, so every PR waits forever — that
    // is the first thing to look at if one does.
    const checks = (rule("required_status_checks")?.parameters?.required_status_checks ??
      []) as { integration_id?: number }[]
    for (const check of checks) expect(check.integration_id).toBe(15368)
  })
})

describe("the gate is a gate", () => {
  test("the ruleset is active, not evaluating", () => {
    // `evaluate` reports what it would have blocked and blocks nothing — it is
    // the state this task was filed about, wearing a ruleset's clothes.
    expect(ruleset.enforcement).toBe("active")
  })

  test("it targets whatever the default branch is", () => {
    // A literal "main" silently stops matching the day the default is renamed.
    expect(ruleset.target).toBe("branch")
    expect((ruleset.conditions as { ref_name: { include: string[] } }).ref_name.include).toEqual([
      "~DEFAULT_BRANCH",
    ])
  })

  test("only an org admin can bypass", () => {
    // The bypass list is the one place where this whole file can be made
    // decorative. A human needs an escape hatch for a broken `main`; the bot
    // that opens the PRs must not have one, or the checks are advisory again
    // for exactly the actor they were added to constrain.
    const actors = (ruleset.bypass_actors ?? []) as { actor_type: string }[]
    expect(actors.map((a) => a.actor_type)).toEqual(["OrganizationAdmin"])
  })

  test("a PR is required, and lands on CI rather than on a reviewer", () => {
    const pr = rule("pull_request")
    expect(pr).toBeDefined()
    // Agents are the point: a required approval would leave every agent PR
    // waiting on a human, which is the symptom, not the fix.
    expect(pr?.parameters?.required_approving_review_count).toBe(0)
  })

  test("main is not deletable or rewritable", () => {
    expect(rule("deletion")).toBeDefined()
    expect(rule("non_fast_forward")).toBeDefined()
  })
})

describe("the ruleset and the repo settings agree", () => {
  test("squash is the only way in, and the repo still allows it", () => {
    // A ruleset permitting only a merge method the repo has switched off is a
    // PR that satisfies every check and cannot be merged by anyone.
    const allowed = rule("pull_request")?.parameters?.allowed_merge_methods
    expect(allowed).toEqual(["squash"])
    expect(desiredRepoSettings.allow_squash_merge).toBe(true)
  })

  test("auto-merge is on, or there is no queue for --auto to use", () => {
    // The other half of task #30: without this, `gh pr merge --auto` falls back
    // to an immediate merge, which is the mutation an agent container refuses.
    expect(desiredRepoSettings.allow_auto_merge).toBe(true)
  })

  test("the merged branch still disappears", () => {
    // Guard one of the two in CLAUDE.md against a PR merging into an already
    // -merged branch. It was true before this task and nothing in the tree said
    // so; now something does.
    expect(desiredRepoSettings.delete_branch_on_merge).toBe(true)
  })
})

describe("strictness", () => {
  test("up-to-date is only required if a merge queue can deliver it", () => {
    // With several agents landing in parallel and no queue, strict means each
    // merge into `main` invalidates every other PR's green, and nothing is
    // arranging the re-runs. The livelock looks exactly like the bug this task
    // was filed for: PRs that simply never land. Turn it on together with a
    // `merge_queue` rule (and a `merge_group` trigger in ci.yml), or not at all.
    const strict = rule("required_status_checks")?.parameters
      ?.strict_required_status_checks_policy
    if (strict === true) expect(rule("merge_queue")).toBeDefined()
    else expect(strict).toBe(false)
  })
})
