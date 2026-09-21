# react-aria `calculatePosition` — the evidence, and a report waiting to be filed

This folder is not ui-lib code. It is a standalone consumer of the published `react-aria`
packages: a runnable repro for an upstream positioning bug, a candidate fix measured against the
same released build, and the report written around what the measurements actually showed. It sits
outside `biome.jsonc`'s `files.includes` on purpose — it imports `react-aria-components` directly,
which is exactly what this repo's own rules forbid above the library layer, because it has to be a
plain consumer of the upstream library and nothing else. Same reason it has its own `package.json`
and lockfile: the versions that reproduce are part of the claim.

## Status: verified, **not filed**

The report below is ready to paste. Nobody has posted it, because the agent container's GitHub
token is scoped to the quebi org and has no permissions on `adobe/react-spectrum` — not even
`pull`. Filing needs a human with an account that can open an issue there. That is task **#184**.

Once it is filed:

1. Rename this folder to `react-spectrum-<issue number>`, matching
   [`../react-spectrum-10598`](../react-spectrum-10598/README.md).
2. Drop the issue link on task #184's thread and close it.
3. If upstream wants a hosted sandbox, this folder is the sandbox — `npm install && npm run repro`
   is the whole instruction, and the report's one placeholder (**STACKBLITZ LINK**) is unfilled
   until someone actually needs a URL.

ui-lib itself is **not** waiting on any of this. Tasks #180/#181 fixed our side in PR #141 by
taking OverlayScrollbars off `document.body`, so `<html>` is never positioned and we never reach
the branch. The upstream bug is still there for anyone else who makes the document the scroll
host, which scroll-lock and smooth-scroll libraries routinely do.

## Run it

```sh
npm install
npx playwright install chromium   # the measurements need a real browser; there is no layout without one
npm run repro        # react-aria as published; exits 1 while the bug is present
npm run verify-fix   # stock vs patched, same released build; exits 0 if the fix works and regresses nothing
```

Pinned to react-aria 3.52.1 / react-aria-components 1.21.1 / React 19.3.0 — the newest released
stack as of 2026-09-21. `npm run verify-fix` patches the installed `react-aria` in place via
`lib/patch.mjs`, measures, and puts it back, so "stock" and "patched" are the same published build
differing in exactly the lines under discussion.

`npm run repro` currently prints:

```
case                        placement  expected  overlay y  gap     on screen  emitted
static, popover             top        top       1458       8       true       bottom: -692px
static, select              top        top       1426       8       true       bottom: -692px
static, menu                top        top       1426       8       true       bottom: -692px
html relative, popover      top        top       3658       2137    false      bottom: -692px    <-- BUG
html relative, select       top        top       3626       2105    false      bottom: -692px    <-- BUG
html relative, menu         top        top       3626       2105    false      bottom: -692px    <-- BUG
static, must flip           bottom     bottom    1529       8       true       top: 1529px
html relative, must flip    bottom     bottom    1529       8       true       top: 1529px
body relative, popover      bottom     top       1529       8       true       top: 1529px       <-- BUG
body relative, must flip    bottom     bottom    1529       8       true       top: 1529px
no-flip, static             top        top       1458       8       true       bottom: -692px
no-flip, html relative      top        top       3658       2137    false      bottom: -692px    <-- BUG
no-flip, body relative      top        top       3674       2153    false      bottom: -692px    <-- BUG

scrollHeight - clientHeight = 2200
misplaced: 6 of 13
```

and `npm run verify-fix`:

```
fixed by the patch:        5
regressed by the patch:    0
wrong in both (not addressed by this patch): 1
  body relative, popover: stock bottom/gap 8, patched bottom/gap 8

fix works and regresses nothing: true
```

## What the harness holds still

A 3000px page in an 800px viewport, triggers at `y=1500`, overlays portalled to `document.body`
with no positioned ancestor of their own — so the containing block is whichever of `<html>` /
`<body>` the case positions. `scroll: 1100` leaves 400px above the trigger (the overlay stays
`top`); `scroll: 1450` leaves 50px (it must flip to `bottom`). Scrolling is explicit so no
auto-scroll-into-view perturbs the geometry.

Three things are being measured at once, and the third is why the case table is longer than the
bug strictly needs:

- **the bug** — a bottom-anchored overlay under a positioned `<html>` or `<body>`
- **the guard** — flipping and clamping, which are driven by the *boundary* measurement and must
  not move when the *container* measurement is corrected
- **the mask** — with `shouldFlip` left on, a positioned `<body>` flips to a top-anchored
  placement and looks fine. `shouldFlip={false}` is the only reason the `<body>` half of this bug
  is visible at all.

---

## The report, ready to file

**Title**: `calculatePosition` mispositions flipped overlays when `<html>`/`<body>` is positioned

`getContainerDimensions()` in `@react-aria/overlays`' `calculatePosition` branches on tag name
(`react-aria` 3.52.1, `packages/@react-aria/overlays/src/calculatePosition.ts`):

```js
if (containerNode.tagName === 'BODY' || containerNode.tagName === 'HTML') {
    totalHeight = documentElement.clientHeight;
    height = visualViewport?.height ?? totalHeight;
} else { /* measures the element's real box */ }
```

`computePosition()` then does:

```js
let containerHeight = isContainerPositioned ? containerDimensions[size] : containerDimensions[TOTAL_SIZE[size]];
position[FLIPPED_DIRECTION[axis]] = Math.floor(containerHeight - childOffset[axis] + offset);
```

When `<html>` or `<body>` *is* positioned, `isContainerPositioned` is correctly true but `height`
is still the **visual viewport**, not the container's real box — so the emitted `bottom:` is
viewport-relative while the browser resolves it against the container's own box. Every overlay
placed with `bottom:` (i.e. anchored above its trigger) lands `documentHeight − viewportHeight`
too low.

The comment above that branch states the assumption being violated in so many words: "*in the case
where the container is `html` or `body` and the container doesn't have something like
`position: relative`*".

### The sharpest form of it

React-aria emits **the same value either way**. In the repro, a 3000px page in an 800px viewport
with the trigger at `y=1500`:

| | emitted | overlay lands at |
|---|---|---|
| `<html>` static | `bottom: -692px` | 1458 ✅ |
| `<html>` `position: relative` | `bottom: -692px` | 3658 ❌ |

Identical `bottom`, and the overlay moves 2200px — exactly `scrollHeight − clientHeight`. The
correct value for the positioned case is `bottom: 1508px` (`3000 − 1500 + 8`), which is what the
patch below emits, landing the overlay back at 1458, pixel-identical to the static page.

`top:`-anchored placements (`bottom`, `left`, `right`) are unaffected, which is what makes the bug
look component-specific at first.

### Repro

react-aria 3.52.1 / react-aria-components 1.21.1 / React 19.3.0, `npm install && npm run repro`:
**STACKBLITZ LINK**

Six of thirteen placements are wrong. Popover, Select and Menu all miss by the same amount; the
component does not matter, only whether the placement resolves to `bottom:`.

Measured separately in a real app (Chromium, `react-aria` 3.50.0 / `react-aria-components`
1.19.0), overlay `y` with the bug vs. without: tooltip 1728 → 443, popover 1673 → 313, Select
2698 → 331, ComboBox 2851 → 233, Menu 2212 → 390, DatePicker 2467 → 243.

### `<body>` is affected too, and flipping hides it

With `<body>` positioned rather than `<html>`, the overlay flips to a top-anchored placement in
geometry where the static page keeps `top` — so it looks correct, because `top:` is the placement
the bug does not touch. `shouldFlip={false}` shows the same failure underneath: the overlay lands
3674 instead of 1458.

Worth saying because "only `<html>`" would send someone looking in the wrong place.

### Suggested fix

Report the container's real box whenever `body`/`html` is positioned. `npm run verify-fix` applies
exactly this to the installed package and re-measures:

```js
if (containerNode.tagName === 'BODY' || containerNode.tagName === 'HTML') {
    // ... existing viewport-based measurement ...

    // `body`/`html` is only the initial containing block while it is static. Once it is
    // positioned, absolutely positioned children resolve against its own box.
    if (window.getComputedStyle(containerNode).position !== 'static') {
        let box = getOffset(containerNode, false);
        width = box.width;
        height = box.height;
        totalWidth = box.width;
        totalHeight = box.height;
    }
}
```

Result: **5 placements fixed, 0 regressed.**

Note it overrides only the size fields, and deliberately does *not* take the `else` branch
wholesale. `getContainerDimensions` serves two callers:

```js
let boundaryDimensions = getContainerDimensions(boundaryElement, visualViewport);
let containerDimensions = getContainerDimensions(container, visualViewport);
```

Viewport semantics are *correct* for the boundary call — overlays should be clamped to what is
visible, not to the whole document. Switching that call to the element's box would tell an overlay
it had document-height of room above its trigger and it would stop flipping, trading a positioning
bug for a flipping bug. Keeping `scroll`/`top`/`left` on the document path leaves the four
flip-and-clamp cases in the repro byte-identical to stock, `max-height` included.

I am not attached to that shape of it. Threading the container's real box through to the two
places that consume it — `computePosition`'s `containerHeight`, and the `bottom`-to-`top`
inversion in `getMaxHeight` — is the more surgical version, and would also close a latent
inconsistency between them: `getMaxHeight` inverts using `totalHeight` while `computePosition`
produced that `bottom` from `height`. Those agree today only because `documentElement.clientHeight`
≈ `visualViewport.height` when you are not pinch-zoomed.

Happy to open the PR if you would take it — just say which shape you would prefer.

### Two things I did not chase

- `bottom:` resolves against the containing block's **padding** box, while `getOffset` is
  `getBoundingClientRect`-based and so reports the **border** box. Identical for an unstyled
  `<html>`; they diverge if someone puts a border on it.
- With `<body>` positioned there are two adjacent oddities the patch above does not address and
  does not cause, both present on stock: the needless flip described earlier, and a
  `max-height: 0px` on the `shouldFlip={false}` case. They look like the same tag-name branch
  reached through `getPosition`/`containerOffsetWithBoundary` rather than `computePosition`, but I
  did not track them down.

---

## What was verified, and how

Everything asserted above was checked against the installed packages in this folder, not recalled:

| Claim | How |
|---|---|
| the tag-name branch, and its comment | `node_modules/react-aria/dist/private/overlays/calculatePosition.mjs:48-73` |
| `computePosition` selects on `isContainerPositioned` | same file, `:181-182` |
| `isContainerPositioned` comes from the real containing block | same file, `:298-299` |
| `getOffset` is `getBoundingClientRect`-based, so reports `<html>`'s real 3000px box | same file, `:363-372` |
| the emitted `bottom` is identical static vs positioned | `npm run repro`, `emitted` column |
| the overlay moves exactly `scrollHeight − clientHeight` | `npm run repro`, `overlay y` 1458 → 3658 against `scrollHeight - clientHeight = 2200` |
| Popover, Select and Menu all fail identically | `npm run repro`, rows 4–6 |
| `<body>` fails too, once flipping is disabled | `npm run repro`, `no-flip, body relative` |
| the patch fixes it and regresses nothing | `npm run verify-fix`: 5 fixed, 0 regressed |
| flipping and clamping are untouched | `npm run verify-fix`, the four `must flip` / `static` rows, identical `gap` and `max-height` |
| widening the branch would break flipping | argued from the two `getContainerDimensions` call sites, **not** measured — the patch avoids it rather than demonstrating the failure |

The one claim above that is reasoning rather than measurement is flagged as such in the last row.
