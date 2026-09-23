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

## Your PR targets `main`. Always.

This repo squash-merges. A branch that has already landed keeps its name and its tip on the remote,
its content on `main` under a different sha, and nothing about it looks spent — it stays selectable
as a PR base, and a PR merged into it is green, silent and reaches `main` never. It has happened
here (PRs #45 and #47) and cost a session to unpick weeks later. The `.worktrees/` workflow is what
makes it easy to hit: a follow-up worked in a worktree cut from a task branch will offer that task
branch as the base.

Two guards, either of which catches it:

- `delete_branch_on_merge` is on for the repo, so a merged branch stops existing and the mistake is
  unrepresentable rather than merely detectable. It is a repo setting, so nothing in the tree shows
  you it is there — except that now it does: it is one of the `desiredRepoSettings` in
  `scripts/repo-config.ts`, and `bun run repo:config` says whether it is still true.
- The `base-branch` job in `.github/workflows/ci.yml` fails any PR whose base is not `main`, and
  its message says how to retarget and rebase. It is a plain "base must be main" rule on purpose;
  stacked PRs are not a pattern here, and there is no opt-out. `.github/rulesets/main.json` makes it
  a *required* check, and that ruleset is live, so the job blocks the merge instead of merely
  reporting it.

So: branch from `main`, and pass `--base main` when the tool lets you. If your commits sit on top of
a task branch, `git rebase --onto origin/main origin/<that-branch>` before you open the PR — a
retarget alone would carry that branch's commits into the diff.

## How a PR lands

`gh pr merge --auto --squash --delete-branch`. Auto-merge *queues* the PR; GitHub lands it when the
required checks go green. That is the only merge an agent container may ask for — an immediate merge
is refused by policy, on the premise that the required checks are the gate.

That premise is now true, and for this repo's whole life before task #30 it was not: auto-merge was
off, so `gh` quietly downgraded `--auto` to the immediate merge that gets refused, and `main` had no
ruleset, so `lint`, `test`, `typecheck` and `base-branch` all reported and none of them blocked.
Today `main` carries a ruleset that requires a PR and requires `check` and `base-branch` to pass, and
auto-merge is on — so `gh pr merge --auto --squash --delete-branch` queues, CI runs, and GitHub lands
the PR without anyone touching it. Expect a few minutes between the command and the merge, and
expect nothing at all to happen if a check is red. That is the gate working.

Both halves are data in the tree — `.github/rulesets/main.json` and `desiredRepoSettings` in
`scripts/repo-config.ts`, whose header carries the argument for every knob in it, including why
"require branches to be up to date" is off and what would have to change to turn it on.

```sh
bun run repo:config           # is the live configuration the one in the tree?
bun run repo:config --apply   # make it so — needs admin, which the agent App does not have
```

Applying is a human step. Drift shows up as a failing `bun run repo:config`, not as a red build:
making CI fail on it would leave every open PR red until someone with admin got round to it. A
clean run also prints notes — live settings the tree does not declare, and the bypass list, which
GitHub shows only to a token that could edit the ruleset. Notes are not drift; read them, don't fix
them. `tests/repo-config.test.ts` checks the halves that *are* in the tree: that the contexts the
ruleset requires are exactly the jobs `ci.yml` defines, so renaming a CI job cannot silently unhook
the gate or hang every PR on a check that will never report, and that the comparison itself reports
a weakened rule by path rather than passing over it.

If your PR is green and nothing merges it, run the check before looking for a token problem.

## The rules are not advice, they are lint

`/rules` publishes fifteen rules about using this library. They are enforced here too, so the same
messages you would give a consumer are the ones you get:

- **Layout is yours. Appearance is the library's.** Raw `button`, `a`, `input`, `select`,
  `textarea`, `form`, `label`, `dialog` and `table` are banned — import the component the message
  names. `div`/`span` are fine until their classes describe a surface (radius + border = you are
  rebuilding `Card`). And a `Card` written inside a `Card` is a section — a `Heading`, with a
  `Separator` if a line is needed. Design values are quebi tokens, never `bg-[#f00]` or
  `text-gray-500`.
- **Validation is yours. Wiring is the library's.** Conform fields bind through the `conform-*`
  variants; label, description and error come from the field, not from markup beside it. Never
  spread `getInputProps` onto a `Checkbox` or `Switch` (both props are dropped in silence);
  `lastResult` is gated on an idle navigation; an intent button is `type="submit"`.
- Import components, not `react-aria-components` primitives, above the library layer.
- Numbers and dates go through `FormattedNumber` / `FormattedDate` (or `formatNumber(value,
  locale)`), never a bare `toLocaleString()` — the site is prerendered, so an implicit locale is a
  hydration bug.
- **The platform will do it for you. That is not the same as your app doing it.** `alert`,
  `confirm` and `prompt` are out, and this one **fails**: feedback is a `Toast` under a
  `ToastProvider`, and a question is `await confirm(...)` from `useConfirm()` under a
  `ConfirmProvider` — it returns `Promise<boolean>`, so the branch below the question survives and
  the fix is an import plus an `await`, not a refactor. (`<AlertDialog isOpen …>` is the same
  surface where something else owns the open state.) `ServerTable`, by contrast, reports the whole
  new query through `onQueryChange` so you can re-run it — sorting its `rows` in the component
  reorders one page of the answer to the last query instead of asking for a new one — and that one
  still warns, because the fix really is a change of shape. When the rows really are all of them,
  that is `DataTable`, which sorts them with the TanStack row model on purpose. The two are named
  for the only question that chooses between them — who owns the query — and they are two
  assemblies of the same parts: `TableShell` draws rows, `TableControls` draws the chrome, and
  neither mode depends on the other.

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
| `build/client/og/*.jpg` | `src/registry/*.og.tsx` through the `/og/:slug` route | `bun run screenshot:og` |

The share images are the odd one out: they are photographs, not a rendering of data. Every
component has a scene in `src/registry/<slug>.og.tsx` — a reduced composition of itself, written
for a 1200×630 thumbnail rather than for the gallery — and `scripts/screenshot-og.ts` opens
`/og/<slug>` in Chromium and saves what it sees. So the generator runs *after* `react-router build`
rather than before it, and `bun run build` needs a browser (`bunx playwright install chromium`;
`deploy.yml` caches it). CI does not: `tests/og-scenes.test.ts` checks from the source what can be
checked without one — that every slug has a scene or a written `noOgScene` reason, and that no
scene reads the clock, rolls a die, or leaves a recharts animation on, each of which would publish
a different image every deploy.

A scene is also *measured*, in the same browser, by `scripts/og-audit.ts`: its bounding rect has to
sit inside the stage, no text may render under 18px after the stage's `scale`, and nothing may be
ellipsis-truncated. A scene that breaks one of those fails the build by name, exactly like a scene
that throws — the three failures are silent otherwise, because the stage is `overflow-hidden` and a
share image is a file nobody opens. `bun run og:audit --base http://localhost:5173` runs the same
measurement against `bun run dev` and writes nothing; `--report` prints every scene's size and
smallest type. The floor, and the two lists of scenes excused from part of it (a surface pinned to
the window's edge; a month grid the component draws at a fixed cell size), are argued in that
file's header, and `tests/og-scenes.test.ts` checks the half of it that is data.

One thing the frame does that no scene can: every overlay in this library is portalled to
`document.body`, and a `transform` reaches only its own subtree, so the stage's magnification stops
at the edge of the popover. `magnifyOverlays` in `src/routes/og.$slug.tsx` applies it a second time
to each portalled surface, anchored where the surface meets its trigger — which is why a Select
scene photographs a listbox the same size as the control above it.

`biome.jsonc` and `ui-lib-rules/` are committed on purpose: the hook and CI need them without a
build step, and a rule change showing up as a config diff in the same PR is the point. A test fails
if they drift from the records.

## Adding a component

See the [`add-component`](.claude/skills/add-component/SKILL.md) skill — source → meta → examples →
register, plus the quebi styling and self-contained-dependency conventions.

## Adding a route: the frame is synchronous, every chunk is its own boundary

A page on this site is two different things arriving at two different times, and the split is the
same on every route:

- **The frame paints on the first frame.** Breadcrumb, eyebrow, title, description, badges, section
  headings, static prose — all of it comes out of `metaRegistry` / `rulesRegistry`, which are plain
  data the route already holds. None of it goes inside a Suspense boundary, and the loader returns
  only serializable fields, because `ssr: false` + `prerender()` runs it in Node at build and writes
  the answer into `build/client/<path>.data`.
- **Everything that arrives in its own chunk gets its own boundary, one per thing the reader is
  waiting for** — not one per chunk. `src/routes/components.$slug.tsx` is the worked example: the
  gallery, each card inside it, and the baked source block are four kinds of boundary, and the
  fallbacks are in `src/site/page-states.tsx`, whose header is the long form of this section.

Three rules the shapes obey, each of which was once broken here:

1. **A fallback is the shape of what replaces it.** One `h-60` bar for a fifteen-example gallery is
   a 240px block that becomes several thousand pixels in one frame — the scroll position jumps and
   the reader learns nothing about how much is coming. The gallery's fallback is its unit repeated
   `exampleCount` times, and that count is real: the loader counts the examples at prerender.
2. **A fallback is never also an empty state.** A pulse means "this is coming". The source block
   used to render the same `<Skeleton>` for "still loading" and for "there is no source", so a
   component whose source never made it into the build pulsed forever. If it is not coming, say so
   in words — `SourceUnavailable`.
3. **Nothing in a fallback is random.** A `Math.random()` width draws a different skeleton every
   time the same section suspends, and in a prerendered page it would bake one number into the HTML
   and roll another at hydration. Widths cycle through a fixed list by index.

None of these fallbacks reaches a built file, and that is deliberate rather than incidental. The
prerender renders with `onAllReady` *and* an unbounded `progressiveChunkSize` — two settings, both
needed, both in `src/lib/document-shape.ts` with the argument for each. Without them React writes
the page as the transcript of a stream: the fallback in the content position behind a `<!--$?-->`
marker, the real content appended at the end of the document in a `<div hidden id="S:n">` with a
`$RC` call to swap them. A browser cannot tell the difference. Everything the prerender exists for
— SEO, social, AI readers, anything that reads the HTML without executing it — finds a skeleton
where the gallery belongs, which is what every component page shipped until task #200.
`onAllReady` alone does not fix it: React outlines a boundary that has *already resolved* if its
content is larger than `progressiveChunkSize`, whose default is 12800 bytes, and a gallery is tens
of kilobytes. `scripts/check-prerender.ts` greps the built HTML for all three marks and fails
`bun run build`; `tests/prerender-completeness.test.tsx` is the half CI can run without a build.

Two things about hydration that are easy to get wrong and are pinned by
`tests/hydration-boundaries.test.tsx`: the prerendered HTML holds the *resolved* boundary, and React
19 keeps that markup when the chunk is still in flight at hydration — it does **not** paint the
fallback over it. It does client-render the boundary, fallback and all, if an ancestor re-renders
while the boundary is still dehydrated. So state that changes on its own above `<Outlet />` turns
every component page into a content → skeleton → content flash.

A navigation between routes is a route module download, so it is visible: every NavLink composes
`NAV_PENDING` when react-router's `isPending` is set on it, and `NavigationStatus` in `src/root.tsx`
announces it once, politely, for a reader who cannot see the link. The treatment is local on purpose
— a bar across the top of the window is a second place to look for a site whose pages are this
small. No route needs a `HydrateFallback`: every one of them is prerendered with its data.

## Things that will bite you

- `bun run lint` is Biome's recommended set *plus* the rules this repo publishes, over `src/**`,
  `scripts/**`, `tests/**` and the root config files — including `src/components/**`. The
  library source is excepted from nine of the fifteen by the records themselves; what still
  applies there is the element ban minus `<input>`, the two platform-defaults rules and
  `no-nested-card`, which the library has no reason to break and so no reason to be excused from. A raw `<button>` in a
  library component fails the pre-commit hook like anywhere else. Its
  `biome-ignore lint/a11y/...` comments now land on rules that actually run, which is what let the
  directory back into the file list.
- That exception is an argument about a *layer*, not about a directory, so only published
  components may live there: a test fails if a file in `src/components/` has no `slug` in
  `src/registry/meta.ts`. The site's own chrome lives in `src/site/` (header, footer, sidebars,
  theme toggle, code block) and is linted at full strength, exactly like `src/routes/`. Put new
  app-side UI there; do not park it next to the library source.
- The plugin rules are about JSX, and a `.grit` file says nothing about where it applies. Its
  scope is the `overrides` entry that loads it: `includes` is the record's `appliesTo`, then its
  exception paths and any `localScopes` entries as `!` lines. That is what lets the file list above
  be the repo's code rather than only its TSX — a `.ts` file is linted by Biome's recommended set
  and by the built-in rules the records configure, and the plugin rules stay quiet about a file no
  record claims (plus `tests/**/*.tsx`, which the repo adds — see below). Widen a record's `appliesTo` and its override widens with it; there is nothing
  per-plugin to hand-edit. A built-in is scoped by the config that switches it on instead, so its
  `appliesTo` is documentation — which is why `no-browser-dialogs` names `.ts` and `.js` too: a
  `confirm()` in a helper module is the same bug as one in a component, and the rule really does
  fire there.
- Nothing is listed in the top-level `plugins`, and that is load-bearing rather than tidy. An
  override *adds* its plugins to the files it matches and cannot subtract one already loaded
  globally, so a plugin named in both would run everywhere and its `includes` would be decoration.
  Both halves are pinned in `tests/config.test.ts`. Until task #93 a plugin's scope was instead a
  `$filename` regex compiled into the pattern — and `$filename` is the file's *absolute* path, so
  `src/**` matched every file in a checkout under `~/src/…` and `bun run lint` was red on a clean
  tree for anyone who keeps their repos there. No regex over an absolute path can find the project
  root; Biome resolving an override's `includes` against it is the whole fix. `tests/harness.ts`
  materialises its temp project under `…/src/components/project/` so the suite keeps proving it.
- CSS is still outside the file list: Biome cannot parse Tailwind v4's at-rules. The
  `no-hardcoded-design-values` record documents that gap.
- `src/registry/*.og.tsx` is linted at full strength, like `src/routes/`, and the two rules the
  examples are excused from bite hardest there: a scene wants a fixed-size box, and `w-[30rem]` is
  a hardcoded design value while `w-120` is the spacing scale. The one local scope the scenes have
  is `src/registry/og-scene.tsx`, where `OgForm` calls `useForm` for all thirty-two `conform-*`
  scenes and has no server to validate on.
- `src/registry/*.examples.tsx` is copied verbatim by agents through
  `/api/components/<slug>.json`. A shortcut taken in an example propagates.
- The `@/…` alias is resolved for `bun test` by the `paths` entry in the *root* `tsconfig.json`.
  Each project config declares its own copy for tsc; Bun reads only the root one, and without it
  every component import fails at runtime with "Cannot find module '@/lib/utils'".
- `tests/**/*.tsx` is in the file list now, so a rendering fixture gets the same reading as
  `src/routes/` — from the built-ins through the file list, and from the plugin rules through
  `localPluginIncludes` in `scripts/generate-lint-config.ts`, which adds `tests/**/*.tsx` to every
  plugin override on the repo side (the published `appliesTo` stays app code). Until task #225 that
  second half was missing and no GritQL rule read `tests/` at all. Three things are named one at a
  time in `localScopes`: a raw `<form>` (a Conform form binds to one, and react-router's `<Form>`
  would need a router mounted around every test), `useForm` without `lastResult` (there is no route
  action to return one), and the two class-string rules for `tests/components/**` only (a
  component test quotes the library's own classes to assert them). The `<form>` entry excuses that
  element and no other — a raw `<button>` in a fixture is reported exactly as it is in a route —
  and `repo-lint.test.ts` proves each entry is what changes the answer. Anything else is a
  `biome-ignore` whose reason says what forces it: `conform-binding.test.tsx` imports react-aria
  primitives because it is asserting what react-aria itself does with an id, and renders the
  banned `getInputProps` spread under a `biome-ignore lint/plugin/seed-toggles-with-default-selected`
  because measuring what that spread drops is the test.
- A plugin (GritQL) diagnostic is suppressed like any other, by name:
  `// biome-ignore lint/plugin/<rule-id>: <reason>`, where the name is the `.grit` file's name —
  which is the rule id. The bare `lint/plugin` form is valid too and quiets *every* plugin rule on
  that node, so do not write it. The repo said for a long time that plugin diagnostics could not be
  suppressed at all, and two `localScopes` entries were argued from that premise; it was never true
  of the Biome in `node_modules`, and `tests/plugin-suppression.test.ts` now pins what is.
