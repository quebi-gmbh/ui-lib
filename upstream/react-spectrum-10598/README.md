# adobe/react-spectrum#10598 — the reply, and the repro that backs it

This folder is not ui-lib code. It is the attachment to an outbound bug report:
[adobe/react-spectrum#10598](https://github.com/adobe/react-spectrum/issues/10598), which ui-lib's
SSR band gate in `src/components/table-shell.tsx` exists to work around, and which task #34 is
waiting on. It sits outside `biome.jsonc`'s `files.includes` on purpose — it imports
`react-aria-components` primitives and writes a raw `<th>`, which is exactly what this repo's own
rules forbid, because it has to be a plain consumer of the upstream library and nothing else. Same
reason it has its own `package.json` and lockfile: the versions that reproduce are part of the
report.

The issue's one reply declines to investigate, on the premise that react-aria-components does not
use react-stately's `TableCollection`. That premise is checkable and half wrong, so the reply below
checks it — with file and line references into the published sources, three runnable shapes of the
bug (a corrupted header, a render that never returns, and one that throws with no SSR involved), and
a fix for the first two that is verified to work and verified not to disturb react-stately's own
`TableCollection`.

**Posting it is a human step.** An agent speaking for the repo owner in someone else's tracker, in a
thread that opened this way, is not a thing to automate. Everything here is ready to paste.

One placeholder is left in the reply on purpose: **STACKBLITZ LINK**. The issue template asks for a
sandbox, and this folder is one — drop it into a StackBlitz node project (or a gist, or any public
repo) and put the URL there. `npm install && npm run repro` is the whole instruction.

## Run it

```sh
npm install
npm run repro        # prints the server-rendered <thead>; exits 1 while the bug is present
npm run hang         # second shape: renderToString never returns. Kill it yourself.
npm run placeholder  # third shape: a short header row throws. Not SSR-specific.
```

Pinned to react-aria-components 1.21.1 / react-aria 3.52.1 / react-stately 3.50.0 / React 19.3.0 —
the newest released stack as of 2026-09-11.

`npm run repro` currently prints:

```
leaf header cells: expected 3, got 4
cells for the "storage" column: expected 1, got 2
aria-colindex values: expected 1,2,3 — got 1,2,4,4
```

## What was verified, and how

Everything asserted in the reply was checked against the installed packages in this folder, not
recalled:

| Claim | How |
|---|---|
| RAC imports `buildHeaderRows` from react-stately | `react-aria-components/dist/private/Table.js:12`, and `Table.js.map` maps it to `packages/react-aria-components/src/Table.tsx:16` |
| RAC calls it in `TableCollection.updateColumns` | `dist/private/Table.js:144` → `src/Table.tsx:244` |
| `buildHeaderRows` writes to the caller's nodes | `react-stately/dist/private/table/TableCollection.js` → `packages/react-stately/src/table/TableCollection.ts:144-149` (and `:71-73`, `:92-93`, `:102`) |
| `getChildren` walks `prevKey`/`nextKey` | `packages/react-aria/src/collections/BaseCollection.ts:182-194` |
| SSR commits once per appended node | `packages/react-aria/src/collections/CollectionBuilder.tsx:186-190` |
| The corrupted header | `npm run repro` |
| The non-terminating render | `npm run hang` |
| A short header row throws | `npm run placeholder`, and — on the client, under happy-dom — `tests/components/table.test.tsx`'s "a header row shorter than the table is still unrenderable", plus a scratch run of the same shape written against plain `react-aria-components` rather than ui-lib's wrappers |
| RAC calls `render` on every child it walks | `packages/react-aria-components/src/Collection.tsx:225` |
| the placeholder node has no `render` | `packages/react-stately/src/table/TableCollection.ts:120-132` and `:164-177` |
| `item.nextKey = item.key` is what hangs it | patched a `console.log` into the installed `TableCollection.mjs` at the `row[row.length - 1].nextKey = item.key` line; it fires for node `c2` |
| Dropping the `prevKey`/`nextKey` writes fixes the first two shapes | same patch, removing those two blocks and the trailing placeholder's `prevKey`; `npm run repro` passes and `npm run hang` returns |
| …and is a no-op for react-stately's own `TableCollection` | built a `TableCollection` directly from hand-made nodes, stock vs patched, for a two-band shape and a mixed-depth shape that produces a placeholder: byte-identical output. `GridCollection`'s `visit` re-chains every child from `childNodes` order at `packages/react-stately/src/grid/GridCollection.ts:99-112`, after `buildHeaderRows` has run — so for that consumer the writes are dead |

`buildHeaderRows` has exactly two callers in the published packages: react-stately's own
`TableCollection`, and RAC's.

---

## The reply, ready to post

> Thanks for looking. The premise is checkable, so here are the lines — all from the released
> packages.
>
> ### RAC does call `buildHeaderRows`
>
> You're right that RAC does not use react-stately's `TableCollection` **class**. It does call
> `buildHeaderRows`, which is exported from that same module, and that function is what the report
> is about.
>
> `packages/react-aria-components/src/Table.tsx:16`:
>
> ```ts
> import {buildHeaderRows} from 'react-stately/private/table/TableCollection';
> ```
>
> and `packages/react-aria-components/src/Table.tsx:244`, inside RAC's own
> `TableCollection.updateColumns`:
>
> ```ts
> this.headerRows = buildHeaderRows(columnKeyMap, this.columns);
> ```
>
> Both lines are in the shipped artifact too — `react-aria-components/dist/private/Table.js`, lines
> 12 and 144 of 1.21.1.
>
> ### Why that breaks on the server but not on the client
>
> `buildHeaderRows` writes to the nodes it is handed —
> `packages/react-stately/src/table/TableCollection.ts:144-149`:
>
> ```ts
> if (row.length > 0) {
>   row[row.length - 1].nextKey = item.key;
>   item.prevKey = row[row.length - 1].key;
> }
>
> item.level = i;
> item.colIndex = colIndex;
> ```
>
> For react-stately's own `TableCollection` that is harmless. Under RAC, `item` is the live
> `CollectionNode` that is already in `BaseCollection`, and `prevKey`/`nextKey` are precisely the
> fields `BaseCollection.getChildren` walks
> (`packages/react-aria/src/collections/BaseCollection.ts:182-194`). So laying out the header rows
> overwrites the **tree's** sibling links.
>
> On the client that is invisible: `commit` runs once, with every column already in the collection,
> so the links it leaves behind agree with the layout it just computed. On the SSR path there is no
> portal, so `packages/react-aria/src/collections/CollectionBuilder.tsx:186-190` appends one node at
> a time during render and commits after each one:
>
> ```tsx
> element = parentNode.ownerDocument.createElement(CollectionNodeClass.type);
> element.setProps(props, ref, CollectionNodeClass, rendered, render);
> parentNode.appendChild(element);
> parentNode.ownerDocument.updateCollection();
> ```
>
> The second `updateColumns` therefore walks a tree whose sibling links now cross parent-column
> boundaries: a leaf is reachable through two parents, `this.columns` collects it twice, and the
> parent's `colSpan` comes out too wide.
>
> ### Repro
>
> react-aria-components 1.21.1 / react-aria 3.52.1 / react-stately 3.50.0 / React 19.3.0,
> `npm install && npm run repro`: **STACKBLITZ LINK**
>
> Two parent columns over three leaf columns. RAC's `Column` is a `createLeafComponent`, so a column
> containing columns is declared with `createBranchComponent('column', …)` — the factory RAC builds
> `TableHeader`, `TableBody` and `Row` with, and a public typed export of the package. It is the
> only way to produce the multi-level header that `buildHeaderRows` exists to lay out.
>
> `renderToString` gives four leaf `<th>` for three columns:
>
> ```html
> <th ... data-key="name"    id="react-aria-_R_2_-name"    aria-colindex="1">Name</th>
> <th ... data-key="owner"   id="react-aria-_R_2_-owner"   aria-colindex="2">Owner</th>
> <th ... data-key="storage" id="react-aria-_R_2_-storage" aria-colindex="4">Storage</th>
> <th ... data-key="storage" id="react-aria-_R_2_-storage" aria-colindex="4">Storage</th>
> ```
>
> `storage` twice with a duplicate `id`, `aria-colindex="4"` in a three-column table, and both parent
> cells claiming `colspan="2"`.
>
> ### The same bug, one step further: the render never returns
>
> `npm run hang` in the same sandbox — three parent columns with one leaf column each. The
> duplication reaches a point where the last entry of a header row **is** the node about to be
> appended to it, so line 144 executes `item.nextKey = item.key`, and `getChildren`'s `nextKey` walk
> has a one-node cycle. `renderToString` does not return. On a server that is a hung request, not a
> wrong pixel.
>
> ### And a third shape, with no SSR in it at all
>
> `npm run placeholder` — two leaf columns under a parent column, one leaf column beside it. The top
> header row covers two of the three columns, so `buildHeaderRows` fills the gap with a node built
> from a literal (`packages/react-stately/src/table/TableCollection.ts:120-132`, and `:164-177` for
> the trailing one): `type: 'placeholder'`, `rendered: null`, and no `render`. RAC's renderer calls
> `node.render!(node)` on every child it walks
> (`packages/react-aria-components/src/Collection.tsx:225`) and has no case for a placeholder, so:
>
> ```
> TypeError: node.render is not a function
> ```
>
> This one throws under `createRoot` in a browser too — it is not an SSR bug, and it does not
> involve the node mutation at all. It is a second, independent place where RAC consumes what
> `buildHeaderRows` returns.
>
> ### A fix
>
> For the first two shapes: dropping just the `prevKey`/`nextKey` writes from `buildHeaderRows` —
> the block at `TableCollection.ts:143-146`, the placeholder one at `:135-138`, and the trailing
> placeholder's own `prevKey` at `:176`. With those three gone, the repro renders three leaf cells
> with colindexes 1, 2, 3, and the hanging shape returns.
>
> It also looks like a no-op for react-stately's own `TableCollection`, because `GridCollection`'s
> `visit` re-chains every child from `childNodes` order **after** `buildHeaderRows` has run
> (`packages/react-stately/src/grid/GridCollection.ts:99-112`), so those particular writes are
> already dead for that consumer. I built a `TableCollection` directly, stock vs patched, for a
> two-band shape and for a mixed-depth shape that produces a placeholder, and the resulting
> `headerRows` — `colSpan`, `level`, `colIndex`, `prevKey`, `nextKey` — came out identical.
>
> I am not attached to that shape of it. Having `buildHeaderRows` lay out copies rather than the
> caller's nodes at all is the more thorough version; `level`, `colIndex` and `colSpan` are still
> written onto RAC's live nodes either way, and they happen to be harmless today only because every
> commit recomputes them from scratch.
>
> The third shape needs its own fix, on the RAC side: a `case` for `type: 'placeholder'` in
> `Collection.tsx`'s child renderer, or a `render` on the placeholder literal.
>
> Happy to open either PR, or both, if you'd take them — just say which shape you'd prefer.
