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

A typical agent flow:

1. `GET /api/index.json`, match the user's need against `name`/`description`/`tags`.
2. `GET /api/components/<name>.json`, write its `source` into the project.
3. Recursively resolve `registryDependencies` (sibling components + the shared `lib/utils` helper).
4. Install the npm `dependencies`.

Or just have the agent run the `npx shadcn add <url>` command above, which resolves all of that.

## Development

Requires [Bun](https://bun.sh).

```sh
bun install
bun run dev        # dev server (regenerates the API first)
bun run build      # generate API + typecheck + production build
```

The site is a Vite + React Router SPA that auto-deploys to GitHub Pages on merge to `main`.

### Project layout

```
src/components/      component source (what gets shipped/copy-pasted)
src/registry/        per-component metadata (*.meta.ts) + live gallery examples (*.examples.tsx)
src/routes/          the SPA pages (landing, gallery, component detail)
scripts/generate-api.ts   builds the static AI-discovery API from source
```

### Adding a component

See the [`add-component`](.claude/skills/add-component/SKILL.md) skill — it documents the
source → meta → examples → register workflow, the quebi styling rules, and the self-contained
dependency conventions. The static API and shadcn registry are generated automatically from the
registry at build time (never hand-edit `public/api` or `public/r`).
