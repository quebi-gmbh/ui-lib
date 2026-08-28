import type { RuleMeta } from "./types"

/**
 * Element usage, tier 5 — the size of the file the rest of it lives in.
 */
export const keepFilesReadableRule: RuleMeta = {
  id: "keep-files-readable",
  title: "Keep a route or component file under 500 lines",
  navTitle: "File length",
  summary:
    "A file past 500 lines is doing more than one job. Split it — extract the sub-components, move the helpers, lift the data. This is a warning, not an error: the number is a prompt to look, not a law.",
  severity: "warn",
  category: "element-usage",
  tier: 5,
  failureMode:
    "An agent appends. Asked for one more feature it adds it to the file already open, because that is the cheapest edit to make and it never has to scroll the result. Nothing stops the file at 400 lines, or 900, or 2,000 — and by then no human reviews it properly and every later agent edit is working from a worse starting point.",
  rationale: [
    "Length is a proxy, and a good one. A 2,000-line route is not bad because of the number; it is bad because it is holding a page, four sub-components, three data transforms and a form, none of which can be read, tested, or reused on their own. The line count is simply the first symptom visible from outside, which is what makes it checkable.",
    "It compounds specifically with agents. Every edit starts by reading the file, so an oversized file makes every future change more expensive and less accurate — more context spent, more chance of an edit landing in the wrong one of four similar blocks. Splitting is the cheapest thing you can do to keep later work correct, and it is nearly free at 500 lines and painful at 2,000.",
    "500 is deliberately generous. This library is 119 components and 117 of them are under it; the two that are not — sidebar and chart — are composite components with many sub-parts, which is the honest case for exceeding the limit rather than a licence to. If a file needs to be longer, say so in the pull request; the warning exists to make that a decision rather than an accident.",
  ],
  appliesTo: ["app/**/*.{tsx,jsx}", "src/**/*.{tsx,jsx}"],
  examples: [
    {
      title: "A route that grew four components",
      wrong: `// app/routes/dashboard.tsx — 1,400 lines
export default function Dashboard() { /* … 300 lines of JSX … */ }
function MetricCard() { /* … */ }
function UsageChart() { /* … */ }
function InviteForm() { /* … */ }
const transformUsage = (rows) => { /* … */ }`,
      right: `// app/routes/dashboard.tsx — 90 lines
import { MetricCard } from "@/features/dashboard/metric-card"
import { UsageChart } from "@/features/dashboard/usage-chart"
import { InviteForm } from "@/features/dashboard/invite-form"
import { transformUsage } from "@/features/dashboard/usage"

export default function Dashboard() { /* … the page, and only the page … */ }`,
      note: "Each extracted piece is now testable and reusable on its own, and the next agent asked to change the invite form opens a 60-line file instead of reading 1,400 to find it.",
    },
    {
      title: "When the limit is the wrong answer",
      wrong: `// One 900-line component split into six files that only ever appear together,
// each importing the other five, none meaningful alone.`,
      right: `// src/components/sidebar.tsx — 888 lines, one cohesive component with its
// sub-parts (SidebarHeader, SidebarContent, SidebarRail, …) that are only ever
// used with each other, and a warning acknowledged in review.`,
      note: "Splitting a genuinely cohesive component into files that cannot stand alone trades one problem for a worse one. That is why this is a warning: it asks the question, and you are allowed to answer no.",
    },
  ],
  exceptions: [
    {
      scope: "The ui-lib component source itself, wherever you pasted it (components/ui/**)",
      paths: ["src/components/**", "components/ui/**"],
      reason:
        "You did not write it and cannot split it without forking it. Two of the library's own components are over the limit — sidebar and chart — which is a fair criticism of the library, not something a consumer should be asked to act on in their lint run.",
    },
    {
      scope: "Generated files",
      reason:
        "A generated module is read by the machine that wrote it. Length says nothing about whether it is well organised, and splitting it means changing the generator for no reader's benefit.",
    },
  ],
  enforcement: {
    kind: "lint",
    // A built-in rule whose entire configuration is the threshold, so unlike the
    // element and import bans there is nothing here to derive from the record.
    biome: {
      via: "rule",
      rule: "style/noExcessiveLinesPerFile",
      options: { maxLines: 500 },
    },
    message:
      "This file is over 500 lines, which usually means it is doing more than one job: extract the sub-components, move the helpers out, lift the data transforms. If it is genuinely one cohesive thing, say so in review — this is a warning, not a gate. See https://ui-lib.quebi.de/rules/keep-files-readable",
    note: "With no linter at all the equivalent is `find src -name '*.tsx' | xargs wc -l | awk '$1 > 500'`, which is why this rule ships no ripgrep check — counting lines is not a pattern match. Biome counts every line, including imports and comments — so a file with a long licence header sits closer to the limit than its code does. It also cannot tell a cohesive 600-line component from an incoherent one; that judgement is the reason this rule warns rather than fails.",
  },
  tags: ["structure", "readability", "agents", "tier-5"],
}
