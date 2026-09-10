/**
 * The Claude skill: a thin pointer at this live registry, served as a static file
 * so a user can install it without a marketplace.
 *
 * The rules half of it is rendered from the same records as /rules and llms.txt,
 * so what an agent is told here cannot drift from what the linter enforces.
 */
import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { failureModes, RULES_LEDE } from "../../src/registry/rules"
import { BASE_URL, type Highlight, HOST, PUBLIC, SRC_DIR } from "./context"
import { rulesSkillSection } from "./rules"

export async function emitSkill(highlight: Highlight, componentCount: number): Promise<void> {
  // Claude skill — a thin skill pointing agents at this live registry. Served as
  // a static file so users can install it without a marketplace.
  const skill = `---
name: quebi-ui-lib
description: "Use when building a React UI and you want quebi's component library (${HOST}) — buttons, inputs, forms, dialogs, menus, tables, charts, date/color pickers, Conform-bound form variants, and more (${componentCount} components). Trigger when the user asks to add a UI component to a React app, mentions quebi ui-lib / ${HOST}, asks for a copy-paste React component, or is building forms with Conform. Pulls real, current source from the live registry instead of writing components from scratch."
---

# quebi ui-lib — pull components from the live registry

quebi maintains a public React component library at **${BASE_URL}** — ${componentCount} components
built on \`react-aria-components\` + Tailwind CSS v4, styled with the quebi design system. They are
copy-paste, self-contained, and shadcn-registry compatible.

**When the user needs a React UI component, pull it from here instead of writing one from scratch.**
The source is real and current; do not guess component APIs from memory — fetch them.

## How to add a component

### Preferred: shadcn CLI (resolves dependencies automatically)

If the target project uses the shadcn CLI (has a \`components.json\`), run:

\`\`\`sh
npx shadcn@latest add ${BASE_URL}/r/<name>.json
\`\`\`

This pulls the component, its sibling-component dependencies, and the shared \`lib/utils\` helper,
and installs the required npm packages.

### Otherwise: fetch the API directly

1. \`WebFetch ${BASE_URL}/api/index.json\` — the full catalog. Match the user's need against each
   component's \`name\` / \`description\` / \`tags\`. The catalog is small; reason over it directly
   (there is no search endpoint).
2. \`WebFetch ${BASE_URL}/api/components/<name>.json\` — returns metadata plus the inlined raw \`source\`.
3. Write \`source\` into the project (e.g. \`components/ui/<name>.tsx\`).
4. Resolve \`registryDependencies\` recursively — each entry is another component slug or a shared
   lib (\`lib-utils\` → \`lib/utils.ts\`, the \`cn\` helper). Fetch and add each the same way.
5. Install the npm packages in \`dependencies\`.

Always start from **${BASE_URL}/llms.txt**, which documents the workflow and lists every component.

## Conventions to preserve

- Components import the shared \`cn\` helper from \`@/lib/utils\` and siblings from \`@/components/<name>\`.
  \`@/\` is the project \`src/\` alias — rewrite it if the target project uses a different alias.
- Form components have **Conform-bound variants** named \`conform-*\` (e.g. \`conform-checkbox\`,
  \`conform-select\`, \`conform-date-picker\`). Use these when building forms with the Conform library;
  they bind name/validity/errors from field metadata.
- The library assumes Tailwind v4 and the quebi tokens (\`quebi-brand\`, \`quebi-bg\`, \`quebi-fg-muted\`,
  \`rounded-quebi-*\`, etc.). If the target project lacks them, bring in the quebi theme too.

## Rules — how to write JSX against this library

${RULES_LEDE}

${failureModes.map((m) => `- **${m.title}.** ${m.body}`).join("\n")}

They are lint rules rather than lines in a prompt because a rule is checked on every file, and its
message names the replacement at the point of the mistake. Run them (see below) and you get the
correction directly; you do not have to remember any of this.

${rulesSkillSection()}
Full records (rationale, real wrong/right pairs from the library's own source, and documented
exceptions) at **${BASE_URL}/api/rules.json**, or human-readable at **${BASE_URL}/rules**.

To *check* code rather than just follow the rules, every record carries a \`checks\` array of runnable
snippets generated from it, and all of them are published merged as one Biome config:

\`\`\`sh
curl -O ${BASE_URL}/api/rules/biome.jsonc
\`\`\`

Biome parses TSX natively, so there is nothing else to configure. Rules Biome has no built-in for
ship as GritQL plugins listed in that file's \`plugins\` key — fetch each one alongside it. In a repo
with no linter at all, use the \`ripgrep\` entry in each rule's \`checks\` array; it needs nothing
installed.

## Don't

- ❌ Don't reinvent a component the library already has — check the catalog first.
- ❌ Don't hand-write the component API from memory — fetch the real source.
- ❌ Don't hand-roll a \`<button>\`, \`<input>\`, \`<a>\` or \`<dialog>\` in app code — import the component
  (see the rules above). This holds even when the element is unstyled.
- ❌ Don't forget the \`registryDependencies\` (the component won't compile without \`lib/utils\` and any
  sibling components).
`
  await mkdir(join(PUBLIC, "skills/quebi-ui-lib"), { recursive: true })
  await writeFile(join(PUBLIC, "skills/quebi-ui-lib/SKILL.md"), skill)

  // Generated module: the skill text + Shiki HTML, baked into the landing page's
  // scrollable source panel (same treatment as component source).
  const skillModule = [
    "// AUTO-GENERATED by scripts/generate-api.ts. Do not edit.",
    `export const skillSource = ${JSON.stringify(skill)}`,
    `export const skillHighlighted = ${JSON.stringify(highlight(skill, "markdown"))}`,
    "",
  ].join("\n")
  await writeFile(join(SRC_DIR, "registry/skill.generated.ts"), skillModule)
}
