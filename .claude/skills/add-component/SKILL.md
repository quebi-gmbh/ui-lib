---
name: add-component
description: "Use when adding a new UI component (or a Conform-bound variant) to the quebi ui-lib in this repo. Trigger when the user asks to add/port/create a component, add a checkbox/input/dialog/etc., add a conform variant, or wire a new element into the gallery and the AI-discovery API. Covers the source → meta → examples → register workflow, quebi styling rules, self-contained dependency conventions, and verification."
---

# Add a component to quebi ui-lib

This repo is a copy-paste React component library. Each component is **self-contained**
(no dangling shared imports), styled with the **quebi design system**, rendered live in a
gallery, and auto-published to a static AI-discovery API at build time.

Adding a component is four files + one line, then a build. Follow this exactly so the
gallery, the dependency graph, and the generated API all stay correct.

## Architecture in one breath

- `src/components/<slug>.tsx` — the component source (what gets copy-pasted / shipped).
- `src/registry/<slug>.meta.ts` — curated metadata (name, description, category, tags).
- `src/registry/<slug>.examples.tsx` — live gallery examples (JSX).
- `src/registry/meta.ts` + `src/registry/index.ts` — register the above.
- `scripts/generate-api.ts` — reads metadata + source, emits `public/api/**`, `public/r/**`,
  `llms.txt`. **Never hand-write JSON.** Runs automatically on `bun run build` / `bun run dev`.

The metadata is split from the examples on purpose: `meta.ts` is plain serializable data the
build script can import under bun without pulling in React/JSX.

## Conventions (non-negotiable)

1. **Slug** is kebab-case and matches the source filename: `date-picker` → `src/components/date-picker.tsx`.
2. **Self-contained.** The shared `cn` helper lives in `@/lib/utils`. Import it as
   `import { cn } from "@/lib/utils"`. Do NOT inline a duplicate `cn`/`cx`. The generator ships
   `lib/utils` as a registry dependency automatically.
3. **Sibling components** are imported as `@/components/<other-slug>`. The generator detects these
   and adds them to `registryDependencies` so they're pulled recursively. Don't import sibling
   components by relative path.
4. **Build on `react-aria-components`** for interactive elements (accessibility baseline), and
   `tailwind-variants` (`tv`) for variant APIs — matching the existing Button/Checkbox.
5. **Quebi styling only.** Use quebi tokens, never the old Cellestial tokens (`brand-*`, `ink-*`,
   `text-body-*`, `rounded-xs`). See the styling section below.
6. **`@/` is the `src/` alias.** It's fine — shadcn's CLI rewrites it for consumers.

## Quebi styling cheatsheet

Pull from `src/quebi-theme.css` tokens (the quebi-styleguide skill is the source of truth):

- Background `bg-quebi-bg`, text `text-white` / muted `text-quebi-fg-muted` / subtle `text-quebi-fg-subtle`.
- Brand teal: `bg-quebi-brand`, `text-quebi-brand`, hover `quebi-brand-hover`. Teal is the accent —
  reserve it for the primary/active state, not body text or headings.
- Borders: the signature is `border border-cyan-500/10` (or `/20` for interactive).
- Radii: `rounded-quebi-sm` (inputs/buttons), `rounded-quebi-md` (cards/surfaces).
- Depth = glows, never drop shadows: `shadow-quebi-glow`, `shadow-quebi-glow-strong`.
- Motion: `transition-* duration-150/200`, `hover:scale-[1.02]` (buttons) / `hover:-translate-y-0.5`
  (cards). No bouncy springs.
- Focus: `focus-visible:ring-2 focus-visible:ring-quebi-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-quebi-bg`.
- Invalid: `border-red-500` / `text-red-500`. Eyebrow labels: the `quebi-eyebrow` utility.

When porting from the old `components/` folder (Cellestial), **restyle entirely** — don't keep its
tokens. Keep its accessibility structure (react-aria, slots, render props) and rewrite the classes.

## Steps

### 1. Source — `src/components/<slug>.tsx`

Write the component on quebi tokens. Use the template in `templates/component.tsx` as a starting
point. Keep it self-contained: only `@/lib/utils`, npm packages, and `@/components/<sibling>` imports.

### 2. Metadata — `src/registry/<slug>.meta.ts`

```ts
import type { ComponentMeta } from "./types"

export const <camelSlug>Meta: ComponentMeta = {
  slug: "<slug>",
  name: "<Display Name>",
  description: "One clear sentence. Used in the gallery, search, llms.txt, and the API.",
  category: "Forms", // Actions | Forms | Layout | Navigation | Overlays | Feedback | Display | ...
  tags: ["form", "input"], // lowercase; power search and filtering
}
```

Pick `category` from the set already in use (check existing `*.meta.ts`). Reuse an existing
category name verbatim so grouping stays tidy — don't invent near-duplicates.

### 3. Examples — `src/registry/<slug>.examples.tsx`

```tsx
import { <Component> } from "@/components/<slug>"
import type { ComponentExample } from "./types"

export const <camelSlug>Examples: ComponentExample[] = [
  {
    title: "Default",
    description: "Optional one-liner shown above the preview.",
    render: () => <Component />,
  },
  // Add one example per meaningful state/variant.
]
```

Cover the meaningful states (variants, sizes, disabled, invalid, grouped, controlled) — see
`src/registry/checkbox.examples.tsx` for the pattern.

### 4. Register — two edits

In `src/registry/meta.ts`: import the meta and add it to `metaRegistry`.
In `src/registry/index.ts`: import the examples and add a `examplesBySlug["<slug>"]` entry.

### 5. Build & verify

```bash
bun run build        # regenerates the API and type-checks; must be clean
```

Then check the verification list below.

## Conform variants

Conform variants wrap a base form component and bind it to a Conform field. Rules:

- **Naming**: name after the base component, not the abstract field type
  (`conform-checkbox`, NOT `conform-boolean-field`). Slug starts with `conform-`.
- **Category**: set `category` to the base's real category (e.g. `"Forms"`). The nav auto-buckets
  anything with a `conform-` slug (or a `conform` tag) into a separate **Conform** group via
  `src/registry/grouping.ts` — you do not set category to "Conform".
- **Import the base** via `@/components/<base-slug>` so it becomes a `registryDependency`.
- **Field prop typing**: use `field: FieldMetadata<any, any, string[]>` — checkbox-style fields
  surface as `boolean | "on"` depending on the zod schema; only name/default/required/errors are used.
- The example should use a real `useForm` + zod (`@conform-to/zod/v4`, `parseWithZod`) so validation
  is demonstrable. See `src/registry/conform-checkbox.examples.tsx`.

## Verification checklist

- [ ] `bun run build` is clean (no TS errors, generator prints the new count).
- [ ] `public/api/components/<slug>.json` exists; its `dependencies` (npm) and
      `registryDependencies` (siblings + `lib-utils`) look right.
- [ ] `public/r/<slug>.json` exists (shadcn registry item).
- [ ] Component imports only `@/lib/utils`, npm packages, and `@/components/<sibling>` — no other
      `@/...` or relative imports that won't exist in a consumer's project.
- [ ] No Cellestial tokens (`brand-*`, `ink-*`, `text-body-*`) remain — quebi tokens only.
- [ ] Visit `/components/<slug>` (run `bun run dev`): examples render on-brand, the source block
      shows highlighted source, the sidebar lists it under the right category, breadcrumbs read right.
- [ ] For a conform variant: it appears under the **Conform** nav group and its form validates.

## Don't

- ❌ Don't hand-write or edit anything under `public/api/` or `public/r/` — it's generated.
- ❌ Don't duplicate the `cn` helper or import shared code by relative path.
- ❌ Don't keep Cellestial tokens when porting.
- ❌ Don't set a conform variant's `category` to "Conform" (the nav derives that).
- ❌ Don't invent a new `category` string when an existing one fits.

## Promote to the marketplace (later)

To make this skill available across repos, copy this folder into
`quebi-gmbh/claude-skills` under `plugins/claude-skills/skills/add-component/` and it ships as a
plugin. Keep this in-repo copy as the canonical version for ui-lib work.
