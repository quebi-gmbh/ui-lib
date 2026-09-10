# quebi ui-lib — working in this repo

A React component library plus the static site that publishes it. Bun, Vite, React Router v8,
Tailwind v4, react-aria-components.

## Check your work

```sh
bun run lint        # the rules this repo publishes, run on this repo
bun run test        # the rule suite (real Biome CLI) + component tests (rendered in happy-dom)
bun run typecheck   # generate API + react-router typegen + tsc -b
```

Run `bun run lint` after editing anything under `src/`, `scripts/` or `tests/` — all three are in
the file list, along with the root config files. It is fast (well under a second) and it is the
same check the pre-commit hook and CI run, so a clean run here means the commit will go through.
`bun run lint:fix` applies Biome's safe fixes. `bun run typecheck` covers `scripts/` too.

## The rules are not advice, they are lint

`/rules` publishes fourteen rules about using this library. They are enforced here too, so the same
messages you would give a consumer are the ones you get:

- **Layout is yours. Appearance is the library's.** Raw `button`, `a`, `input`, `select`,
  `textarea`, `form`, `label`, `dialog` and `table` are banned — import the component the message
  names. `div`/`span` are fine until their classes describe a surface (radius + border = you are
  rebuilding `Card`). Design values are quebi tokens, never `bg-[#f00]` or `text-gray-500`.
- **Validation is yours. Wiring is the library's.** Conform fields bind through the `conform-*`
  variants; label, description and error come from the field, not from markup beside it. Never
  spread `getInputProps` onto a `Checkbox` or `Switch` (both props are dropped in silence);
  `lastResult` is gated on an idle navigation; an intent button is `type="submit"`.
- Import components, not `react-aria-components` primitives, above the library layer.
- Numbers and dates go through `FormattedNumber` / `FormattedDate` (or `formatNumber(value,
  locale)`), never a bare `toLocaleString()` — the site is prerendered, so an implicit locale is a
  hydration bug.
- **The platform will do it for you. That is not the same as your app doing it.** `alert`,
  `confirm` and `prompt` are out: feedback is a `Toast` under a `ToastProvider`, a question is a
  `Modal` whose own button runs the rest of the handler. And `AsyncTable` reports sort intent
  through `onSortChange` so you can re-query — sorting its `rows` in the component reorders the
  answer to the last query instead of asking for a new one. Both of these warn rather than fail,
  because both fixes are a change of shape rather than a change of import.

Each message names its replacement and links to the rule page. If a rule is wrong for a case you
hit, the answer is a documented exception with a reason — either an `exceptions` entry on the
record (if it is true for consumers too) or a `biome-ignore` comment whose reason says what forces
it. A bare suppression with no reason is the thing these rules exist to prevent.

Where the rule set is deliberately relaxed for part of *this* repo, that decision is data:
`localScopes` in `scripts/generate-lint-config.ts`, naming the rules and the argument. Add to it
rather than switching a rule off.

## What is generated, and from what

Never hand-edit these; change the source and re-run the generator.

| Generated | From | Command |
|---|---|---|
| `public/api/**`, `public/llms.txt`, `public/r/**`, `public/skills/**` | `src/registry/*.meta.ts`, `src/registry/rules/*.rule.ts` | `bun run generate:api` |
| `biome.jsonc`, `ui-lib-rules/*.grit` | `src/registry/rules/*.rule.ts` | `bun run generate:lint` |

`biome.jsonc` and `ui-lib-rules/` are committed on purpose: the hook and CI need them without a
build step, and a rule change showing up as a config diff in the same PR is the point. A test fails
if they drift from the records.

## Adding a component

See the [`add-component`](.claude/skills/add-component/SKILL.md) skill — source → meta → examples →
register, plus the quebi styling and self-contained-dependency conventions.

## Things that will bite you

- `bun run lint` is Biome's recommended set *plus* the rules this repo publishes, over `src/**`,
  `scripts/**`, `tests/**/*.ts` and the root config files — including `src/components/**`. The
  library source is excepted from nine of the fourteen by the records themselves; what still
  applies there is the element ban minus `<input>`, plus the two platform-defaults rules, which
  the library has no reason to break and so no reason to be excused from. A raw `<button>` in a
  library component fails the pre-commit hook like anywhere else. Its
  `biome-ignore lint/a11y/...` comments now land on rules that actually run, which is what let the
  directory back into the file list.
- That exception is an argument about a *layer*, not about a directory, so only published
  components may live there: a test fails if a file in `src/components/` has no `slug` in
  `src/registry/meta.ts`. The site's own chrome lives in `src/site/` (header, footer, sidebars,
  theme toggle, code block) and is linted at full strength, exactly like `src/routes/`. Put new
  app-side UI there; do not park it next to the library source.
- The plugin rules are about JSX, and each `.grit` plugin says so itself: the generator compiles
  the record's `appliesTo` into a `$filename` guard alongside the exception guards, because Biome
  loads plugins globally and `overrides` cannot scope them. That is what lets the file list above
  be the repo's code rather than only its TSX — a `.ts` file is linted by Biome's recommended set
  and by the built-in rules the records configure, and the plugin rules stay quiet about a file no
  record claims. Widen a record's `appliesTo` and its plugin widens with it; there is no per-plugin
  guard to hand-edit. A built-in is scoped by the config that switches it on instead, so its
  `appliesTo` is documentation — which is why `no-browser-dialogs` names `.ts` and `.js` too: a
  `confirm()` in a helper module is the same bug as one in a component, and the rule really does
  fire there.
- CSS is still outside the file list: Biome cannot parse Tailwind v4's at-rules. The
  `no-hardcoded-design-values` record documents that gap.
- `src/registry/*.examples.tsx` is copied verbatim by agents through
  `/api/components/<slug>.json`. A shortcut taken in an example propagates.
- The `@/…` alias is resolved for `bun test` by the `paths` entry in the *root* `tsconfig.json`.
  Each project config declares its own copy for tsc; Bun reads only the root one, and without it
  every component import fails at runtime with "Cannot find module '@/lib/utils'".
- `tests/**/*.tsx` is still outside `biome.jsonc`'s file list (the `.ts` files are in), so a
  rendering fixture may use the raw elements the rules ban and import react-aria primitives
  directly — a Conform test needs a real `<form>`. Say why in a comment: it is not a suppression,
  but the next reader will wonder. A `.ts` test file has no such licence; it is linted like the
  rest of the repo.
