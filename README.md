# ui-lib

quebi's public React component library — **104 components** built on
[`react-aria-components`](https://react-spectrum.adobe.com/react-aria/) and Tailwind CSS v4,
styled with the quebi design system. Copy-paste source, no package install required; every
component is self-contained.

🌐 **[ui-lib.quebi.de](https://ui-lib.quebi.de)** — live gallery with examples and source.

## Using a component

### Humans

Browse the [gallery](https://ui-lib.quebi.de/components), open a component, and copy its source
from the **Source** panel. Resolve the dependencies listed on the page.

### shadcn CLI

Components are published as a shadcn-compatible registry. The CLI pulls a component and all of its
dependencies automatically:

```sh
npx shadcn@latest add https://ui-lib.quebi.de/r/button.json
```

### AI agents

The library ships a static, fetchable API designed for coding agents — no scraping, no auth.

Start at **[ui-lib.quebi.de/llms.txt](https://ui-lib.quebi.de/llms.txt)**, which documents the
full workflow. In short:

| Endpoint | What |
|---|---|
| `/llms.txt` | Agent entry point and instructions |
| `/api/index.json` | Full catalog: every component with metadata, `dependencies`, `registryDependencies` |
| `/api/components/<name>.json` | One component: metadata + inlined raw `source` + highlighted HTML |
| `/api/components/<name>.tsx` | Raw, copy-paste-ready source |
| `/api/registry.json` | shadcn registry index |
| `/r/<name>.json` | shadcn registry item |
| `/api/rules.json` | Usage rules: when a raw HTML element is allowed and what to import instead |
| `/api/rules/<id>.json` | One rule: rationale, wrong/right pair, exceptions, runnable checks |
| `/api/rules/biome.jsonc` | Every rule as one Biome config, exceptions applied |
| `/api/rules/plugins/<id>.grit` | The GritQL plugin for a rule Biome has no built-in for |

A typical agent flow:

1. `GET /api/index.json`, match the user's need against `name`/`description`/`tags`.
2. `GET /api/components/<name>.json`, write its `source` into the project.
3. Recursively resolve `registryDependencies` (sibling components + the shared `lib/utils` helper).
4. Install the npm `dependencies`.

Or just have the agent run the `npx shadcn add <url>` command above, which resolves all of that.

## Rules

> **Layout is yours. Appearance is the library's.**

[ui-lib.quebi.de/rules](https://ui-lib.quebi.de/rules) documents when a raw HTML element is allowed
in an app that uses ui-lib, and which component to import when it is not — in three tiers:
interactive and semantic elements (`button`, `input`, `a`, `dialog`, …) are always the library's;
layout elements (`div`, `span`, `section`, …) are yours as long as their classes only lay things
out; design values are always quebi tokens.

Rules are registry records (`src/registry/rules/*.rule.ts`), not prose: the page, the JSON
endpoints, `llms.txt` and the Claude skill all render from the same data, each rule names its
replacement component and its documented exceptions, and the build fails if a rule points at a
component that no longer exists.

The checks are generated from those same records rather than written alongside them. **Biome**
carries them two ways: the element rule is its built-in `noRestrictedElements`, configured from the
same replacement table the page renders, and the rest ship as **GritQL plugins**. Everything is
published ready to drop in — [`/api/rules/biome.jsonc`](https://ui-lib.quebi.de/api/rules/biome.jsonc)
plus one `.grit` file per plugin rule — with each documented exception applied: `overrides` for the
built-in rule, `$filename` guards inside the pattern for the plugins, because Biome's overrides do
not scope plugins. ui-lib itself has no lint setup, so nothing is enforced on the library's own
source; the config is for the apps that consume it.

## Development

Requires [Bun](https://bun.sh).

```sh
bun install
bun run dev        # dev server (regenerates the API first)
bun run test       # rule suite: selectors, exceptions, generated config
bun run build      # generate API + typecheck + production build
```

`bun run test` covers the rules under `tests/`: every check is run through the real Biome CLI with
the generated config and plugins — the same artifacts consumers download — and checked for true and
false positives and negatives, with each known blind spot asserted as a miss so the list only
shrinks deliberately.
(The library components themselves have no tests; the stale `*.test.tsx` files in the top-level
`components/` folder are leftovers from the Cellestial port and do not run.)

The site is a Vite + React Router SPA that auto-deploys to GitHub Pages on merge to `main`.

### Project layout

```
src/components/      component source (what gets shipped/copy-pasted)
src/registry/        per-component metadata (*.meta.ts) + live gallery examples (*.examples.tsx)
src/registry/rules/  usage rule records (*.rule.ts) behind /rules and /api/rules*.json
tests/               rule suite (bun test): selectors, exceptions, generated config
src/routes/          the SPA pages (landing, gallery, component detail, rules)
scripts/generate-api.ts   builds the static AI-discovery API from source
```

### Adding a component

See the [`add-component`](.claude/skills/add-component/SKILL.md) skill — it documents the
source → meta → examples → register workflow, the quebi styling rules, and the self-contained
dependency conventions. The static API and shadcn registry are generated automatically from the
registry at build time (never hand-edit `public/api` or `public/r`).

## License

[MIT](LICENSE) © quebi GmbH. Use the components freely, commercially or otherwise.

## Thanks

Hosted for free on [GitHub Pages](https://pages.github.com/) — thank you, GitHub.
