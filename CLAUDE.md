# quebi ui-lib — working in this repo

A React component library plus the static site that publishes it. Bun, Vite, React Router v8,
Tailwind v4, react-aria-components.

## Check your work

```sh
bun run lint        # the rules this repo publishes, run on this repo
bun run test        # the rule suite (real Biome CLI over the generated artifacts)
bun run typecheck   # generate API + react-router typegen + tsc -b
```

Run `bun run lint` after editing anything under `src/`. It is fast (well under a second) and it is
the same check the pre-commit hook and CI run, so a clean run here means the commit will go
through. `bun run lint:fix` applies Biome's safe fixes.

## The rules are not advice, they are lint

`/rules` publishes twelve rules about using this library. They are enforced here too, so the same
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

- `src/components/**` is outside `biome.jsonc`'s file list. The library source is excepted from
  most rules by the records themselves, and it carries `biome-ignore lint/a11y/...` comments meant
  for a consumer's fuller Biome setup, which a rules-only config reports as unused suppressions.
  What still holds there — the library hand-rolls none of the controls it forbids — is asserted in
  `tests/repo-lint.test.ts` instead.
- That exception is an argument about a *layer*, not about a directory, so only published
  components may live there: a test fails if a file in `src/components/` has no `slug` in
  `src/registry/meta.ts`. The site's own chrome lives in `src/site/` (header, footer, sidebars,
  theme toggle, code block) and is linted at full strength, exactly like `src/routes/`. Put new
  app-side UI there; do not park it next to the library source.
- `src/registry/*.examples.tsx` is copied verbatim by agents through
  `/api/components/<slug>.json`. A shortcut taken in an example propagates.
