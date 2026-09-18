---
name: add-component
description: "Use when adding a new UI component (or a Conform-bound variant) to the quebi ui-lib in this repo. Trigger when the user asks to add/port/create a component, add a checkbox/input/dialog/etc., add a conform variant, or wire a new element into the gallery and the AI-discovery API. Covers the source → meta → examples → register workflow, quebi styling rules, self-contained dependency conventions, and verification."
---

# Add a component to quebi ui-lib

This repo is a copy-paste React component library. Each component is **self-contained**
(no dangling shared imports), styled with the **quebi design system**, rendered live in a
gallery, and auto-published to a static AI-discovery API at build time.

Adding a component is five files + two lines, then a build. Follow this exactly so the
gallery, the dependency graph, the share image and the generated API all stay correct.

## Architecture in one breath

- `src/components/<slug>.tsx` — the component source (what gets copy-pasted / shipped).
- `src/registry/<slug>.meta.ts` — curated metadata (name, description, category, tags).
- `src/registry/<slug>.examples.tsx` — live gallery examples (JSX).
- `src/registry/<slug>.og.tsx` — the 1200×630 share-image scene (JSX). A test fails without it.
- `src/registry/meta.ts` + `src/registry/index.ts` + `src/registry/og.ts` — register the above.
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
- A surface that **floats above the page** — a popover, a menu, a list box, a dialog panel, a toast,
  a `float`/inset chrome variant — is `bg-quebi-elevated`, not `bg-quebi-bg`. The two share a value
  on dark and differ in light, where the page is `#f4f6f6`, a Card tints *down* from it, and an
  overlay painted in the page colour renders lighter than the card it sits in — a pale patch rather
  than something raised. A surface that is *flush* with the page (a docked sidebar, a default
  navbar, a table's pinned column, an input) stays on `bg-quebi-bg`.
- Brand teal is three tokens, one per role, because one value cannot clear three contrast bars in
  light mode. A **fill** is `bg-quebi-brand` (hover `bg-quebi-brand-hover`), and a `border-` belongs
  here only when it is that fill's own edge (`border-quebi-brand bg-quebi-brand`). **Text or a
  glyph** is `text-quebi-brand-text` / `decoration-quebi-brand-text`. A **thin graphical mark** — a
  focus ring, an SVG stroke, a lone border that is the only thing marking a state — is
  `ring-`/`stroke-`/`outline-`/`border-quebi-brand-mark`, drawn opaque: an alpha'd mark is under
  3:1 in *both* themes, not just light. `tests/mark-contrast.test.ts` and
  `tests/badge-contrast.test.ts` recompute all of this from the theme, so getting it wrong fails.
  Teal is the accent either way — reserve it for the primary/active state, not body text or
  headings.
- Borders: the signature is `border border-cyan-500/10` (or `/20` for interactive).
- Radii: `rounded-quebi-sm` (inputs/buttons), `rounded-quebi-md` (cards/surfaces). If a variant
  changes the radius (`isCircle`, `isSquare`, …), put the radius on *every* branch of that variant
  and none of it in `base` — a base radius and a variant radius both survive the merge, and the
  sheet decides the winner, so the variant silently loses. `tests/radius-merge.test.ts` enforces it.
- Depth = `shadow-quebi-glow` / `shadow-quebi-glow-strong`, never a hand-rolled `shadow-lg`. The
  token is theme-aware: the signature mint bloom on dark, a neutral downward shadow on light, where
  an emissive glow reads as "shiny" rather than "raised". Both are declared in the `@theme inline`
  block of `src/quebi-theme.css` and flip through `--q-glow*`, so the class means "this is raised"
  and the theme decides how that looks.
- Motion: `transition-* duration-150/200`, `hover:scale-[1.02]` (buttons) / `hover:-translate-y-0.5`
  (cards). No bouncy springs.
- Focus: `focus-visible:ring-2 focus-visible:ring-quebi-brand-mark focus-visible:ring-offset-2 focus-visible:ring-offset-quebi-bg`.
- Invalid: `border-red-500` / `text-red-500`. Eyebrow labels: the `quebi-eyebrow` utility.

When porting a component from the Cellestial-era source (it lived in a top-level `components/`
folder, deleted in task #4 — recover a file from git history if you need one), **restyle entirely**
— don't keep its tokens. Keep its accessibility structure (react-aria, slots, render props) and
rewrite the classes.

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

### 4. Share image — `src/registry/<slug>.og.tsx`

The OG image for `/components/<slug>` is a screenshot of this scene, taken by Playwright in the
deploy build (`scripts/screenshot-og.ts` → `/og/<slug>` → `build/client/og/<slug>.jpg`). It is not
`examples[0]`: a gallery example is read at full size next to its own prose, and this is read as a
thumbnail in a Slack unfurl with no caption at all.

```tsx
import { <Component> } from "@/components/<slug>"
import type { OgScene } from "./types"

/** One line on what the scene shows and why that is the thing to show. */
export const <camelSlug>OgScene: OgScene = {
  scale: 1.8,          // the stage magnifies; 1.5 is the default, raise it for small parts
  render: () => <Component />,
}
```

Rules of thumb:

- One or two instances, short labels, no long prose, nothing that scrolls or clips. The stage is
  1072×372 CSS pixels, so a scene has about 715×248 of natural room at the default scale.
- Show the state that makes the component recognisable: a value in the field, one item selected,
  the overlay already open (`defaultOpen`, `isOpen`, or a focus on mount — see `./og-scene.tsx`).
- `align: "top"` for a scene that opens a popover, so the overlay has the stage to fall into
  rather than landing on the component's name.
- **Deterministic.** No `new Date()`, no `today()`, no `Math.random()`, and no animation: a
  recharts series needs `isAnimationActive: false` through its escape prop
  (`barProps`, `lineProps`, …). `tests/og-scenes.test.ts` fails on all four.
- A conform variant wraps its field in `OgForm` from `./og-scene`; the calendars share the pinned
  fixtures in `./og-calendar-data`, the charts the ones in `./og-chart-data`.
- If the component genuinely has nothing to photograph, write why in `noOgScene` on its `.meta.ts`
  instead (see `container.meta.ts`) — the share image falls back to a text card. The test accepts a
  scene or a reason, and nothing else.

Look at it while you work: `bun run dev` and open `/og/<slug>`.

### 5. Register — three edits

In `src/registry/meta.ts`: import the meta and add it to `metaRegistry`.
In `src/registry/index.ts`: import the examples and add a `examplesBySlug["<slug>"]` entry.
In `src/registry/og.ts`: import the scene and add an `ogScenes["<slug>"]` entry.

### 6. Build & verify

```bash
bun run build        # regenerates the API, builds the site, photographs the share images
```

The last step of `build` is Playwright, so a first run needs `bunx playwright install chromium`.
Without a browser to hand, `bun run typecheck && bun run lint && bun run test` is the same coverage
minus the screenshots.

Then check the verification list below.

### 7. A behaviour test, if the component has behaviour

`bun test` renders: `bunfig.toml` preloads `tests/dom.ts`, which installs happy-dom's globals,
React Testing Library's cleanup and the jest-dom matchers. A test file in `tests/components/`
imports the component by relative path (`../../src/components/<slug>`) and renders it — see
`tests/components/gallery.test.tsx` for the stateful case.

Most components need nothing here; write one when the component has state a user drives (selection,
paging, open/closed), branches on its input (Link's external-href bypass), or carries an
accessibility guarantee the markup could quietly drop (a decorative icon's `aria-hidden`, a value
rendered as text and not only as colour). Test that behaviour, not class names.

## Conform variants

Conform variants wrap a base form component and bind it to a Conform field. Rules:

- **Naming**: name after the base component, not the abstract field type
  (`conform-checkbox`, NOT `conform-boolean-field`). Slug starts with `conform-`.
- **Category**: set `category` to the base's real category (e.g. `"Forms"`). The nav auto-buckets
  anything with a `conform-` slug (or a `conform` tag) into a separate **Conform** group via
  `src/registry/grouping.ts` — you do not set category to "Conform".
- **Import the base** via `@/components/<base-slug>` so it becomes a `registryDependency`.
- **Field prop typing**: use the concrete type — `FieldMetadata<string>`, `FieldMetadata<boolean>`,
  `FieldMetadata<string[]>`. Where the wire value and the parsed value differ, say so with a union:
  `FieldMetadata<number | string>` (NumberField), `FieldMetadata<Date | string>` (DateField),
  `FieldMetadata<string | DaySpan[]>` (DaySchedule). Not `FieldMetadata<any, any, string[]>` —
  `any` hides exactly the mismatch this prop exists to catch.
- **Export the props interface**: `export interface Conform<Name>Props`, so a consumer can extend it.
- The example should use a real `useForm` + valibot (`@conform-to/valibot`, `parseWithValibot`, `import * as v from "valibot"`)
  so validation is demonstrable. See `src/registry/conform-checkbox.examples.tsx`.

### The shape every variant follows

The 29 variants are deliberately identical in structure. Copy the closest one and keep these:

```tsx
const hasErrors = !field.valid && !!field.errors     // exactly this expression
const isRequired = field.required ?? false
```

- **Bind by naming the props, never by spreading `getInputProps`.** The helper returns the DOM
  names (`required`, `defaultChecked`, `min`, `max`); react-aria takes `isRequired`,
  `defaultSelected`, `minValue`, `maxValue`. A JSX spread skips excess-property checking, so the
  mismatched half is dropped by `filterDOMProps` with no error anywhere. Set all seven —
  `id`, `name`, `form`, required, default, invalid, described-by — by name.
- **Error message, one shape everywhere:**
  `{hasErrors && <FieldError>{field.errors?.join(", ")}</FieldError>}`
- **Whoever owns the ids does the wiring.** Inside a react-aria field (TextField, RadioGroup,
  ComboBox, DateField, …) the field generates ids for its description and error slots and already
  points the control at them: pass no `id` and no `aria-describedby`. Outside one (Switch, Slider,
  ChoiceBox, a hidden-input control) nothing does, so set `id={field.errorId}` /
  `id={field.descriptionId}` and `aria-describedby={describedBy(...)}` from `@/components/field`.
- **Required marker:** `{isRequired && <span className="ml-1 text-quebi-brand-text">*</span>}` in the
  label, and `cn(hasErrors && "text-red-500")` on the label itself.
- **A control with no native form value** (TimeField, DateRangePicker, FileTrigger, ChoiceBox,
  Calendar, RangeCalendar, DaySchedule, ColorPicker) uses `useControl` + `BaseControl` from
  `@conform-to/react/future`, never `useState` + a hand-written hidden input. Three things about
  that registered control are load-bearing and all three fail silently — see the comment in
  `src/components/conform-time-field.tsx`:
  1. never `type="hidden"` (`register()` strips the type, React re-applies it, changes are lost);
  2. no React `value` prop (React reverts what `control.change()` wrote);
  3. hidden by CSS, not by the `hidden` **attribute** — pass `hidden={false} tabIndex={-1}
     className="sr-only"`. A real browser no-ops `.focus()` on a `hidden` element, so Conform's
     focus-on-error lands nowhere. Pair it with an `onFocus` on `useControl` that calls
     `focusFirstControl` from `@/components/field` with the container holding the visible control.
- **Import order:** conform → npm → `@/lib/utils` → `@/components/*` (alphabetical).
- **JSDoc goes above the function**, not above the interface.

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
- [ ] Visit `/og/<slug>`: the scene reads at a glance, nothing clips, the name is legible.
      `bun run screenshot:og --base http://localhost:5173 --only <slug>` writes the real file.
- [ ] For a conform variant: it appears under the **Conform** nav group and its form validates.
- [ ] If the component has state, an input-dependent branch, or an accessibility guarantee:
      a test in `tests/components/`, and `bun test` is clean.

## Don't

- ❌ Don't hand-write or edit anything under `public/api/` or `public/r/` — it's generated.
- ❌ Don't duplicate the `cn` helper or import shared code by relative path.
- ❌ Don't keep Cellestial tokens when porting.
- ❌ Don't set a radius in `base` and override it from a variant — see the radii note above.
- ❌ Don't set a conform variant's `category` to "Conform" (the nav derives that).
- ❌ Don't invent a new `category` string when an existing one fits.
- ❌ Don't copy `examples[0]` into the OG scene — it is too detailed to read at thumbnail size,
      which is the whole reason the scenes are separate files.

## Promote to the marketplace (later)

To make this skill available across repos, copy this folder into
`quebi-gmbh/claude-skills` under `plugins/claude-skills/skills/add-component/` and it ships as a
plugin. Keep this in-repo copy as the canonical version for ui-lib work.
