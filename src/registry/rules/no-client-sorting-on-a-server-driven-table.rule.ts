import type { RuleMeta } from "./types"

/**
 * Platform defaults, second of two — the array method standing in for a query.
 *
 * Note the name. It was chosen over "server-paginated" when `AsyncTableProps`
 * had no pagination at all; it has since gained `page`, `pageSize`, `total`,
 * `hasMore` and cursors, which makes the original title the accurate one twice
 * over: the rows are now explicitly a page of an answer, so sorting them in
 * the browser reorders a slice rather than a dataset. The name still says
 * "server-driven" rather than "server-paginated" because the rule holds for an
 * unpaginated AsyncTable too — the filters and the search are queries either
 * way.
 */
export const noClientSortingOnAServerDrivenTableRule: RuleMeta = {
  id: "no-client-sorting-on-a-server-driven-table",
  title: "Sorting a server-driven table is a query, not an array method",
  navTitle: "Client sorting",
  summary:
    "AsyncTable is controlled: it reports the whole new query through onQueryChange and draws its header from the query it was given. Re-query and pass the rows back. If the whole dataset is already in the browser, that is a DataTable, not an AsyncTable.",
  severity: "warn",
  category: "platform-defaults",
  failureMode:
    "An agent wires `onQueryChange` to `setQuery`, then makes the column headers work the only way it can do in one file: `[...rows].sort(compare(query.sort))`. The table sorts on the first click, with no loader change, no query parameter and no round trip — which is what makes it look finished. Nothing in the component objects, because a controlled component cannot tell where its rows came from.",
  rationale: [
    "The rows are an answer, not the table. AsyncTable's filter popovers load their values through `loadFilterValues`, which is a call to the server — so by the time you are sorting in the client, half the table is already the server's opinion and half is yours. And the query behind those rows has a `LIMIT`: `pageSize` is in `DataTableQuery`, so what you were handed is page 3 of something. Sorting it puts the largest of those twenty rows on top and calls it the largest, which it is not.",
    "Two orderings, one column, and they do not agree. `Array.prototype.sort` with no comparator compares UTF-16 code units, so `Zürich` sorts before `Ähre`; with a `localeCompare` comparator it uses whatever locale the runtime has, which on a prerendered page is one locale on the server and another in the browser — the hydration bug that `format-values-through-the-library` exists to stop. Postgres sorted the same column under its own collation. Whichever of the three is right, having all three is not.",
    "It also throws away the state the component is asking you for. The sort indicator in the header is drawn from `query.sort`, and the header press does nothing except call `onQueryChange` with the next query — the component deliberately owns no sort state. A client sort that never lifts the query back up leaves a table whose rows are ordered and whose header says they are not; one that does lift it back up has the same value driving a query that never runs and an array method that does.",
    "The right shape is smaller than the wrong one. `onQueryChange` writes the whole query into the URL — `queryToSearchParams` from @/lib/data-table does exactly that — the loader reads it back with `queryFromSearchParams` and puts the sort in the `ORDER BY`, and `rows` and `query` both arrive from the loader. That also makes the sorted view a link someone can send, a back button that works, and a prerender that matches. Nothing in the component has to change; the sort simply stops being a thing the page computes.",
    "And if the whole dataset really is in the browser, none of this applies — but then you are not building a server-driven table. `DataTable` from @/components/data-table takes the same columns and sorts them with the TanStack row model, which is client sorting done deliberately: three-state and multi-column, type-aware comparators, faceted filters, and the same toolbar. Reaching for AsyncTable and then sorting locally gets you the round trips with none of their point, and none of DataTable's either.",
  ],
  appliesTo: ["app/**/*.{tsx,jsx}", "src/**/*.{tsx,jsx}"],
  examples: [
    {
      title: "The sort that never leaves the page",
      wrong: `const { rows } = useLoaderData<typeof loader>()
const [query, setQuery] = useState(emptyQuery)

const sorted = useMemo(
  () => (query.sort.length ? [...rows].sort(compare(query.sort)) : rows),
  [rows, query.sort],
)

return (
  <AsyncTable
    aria-label="Orders"
    columns={columns}
    rows={sorted}
    query={query}
    onQueryChange={setQuery}
    getRowId={(o) => String(o.id)}
  />
)`,
      right: `// the loader reads the params and puts them in the ORDER BY
const { rows, total } = useLoaderData<typeof loader>()
const [params, setParams] = useSearchParams()
const query = queryFromSearchParams(params, filterableColumns)

return (
  <AsyncTable
    aria-label="Orders"
    columns={columns}
    rows={rows}
    total={total}
    query={query}
    onQueryChange={(next) => {
      setParams(new URLSearchParams(queryToSearchParams(next)))
    }}
    tiebreakColumn="id"
    getRowId={(o) => String(o.id)}
  />
)`,
      note: "The wrong version is shorter by one loader argument and wrong by a whole dataset. The right one also gets a shareable URL and a working back button for free, because the sort now lives where the query does — and `queryFromSearchParams` runs in the loader, because @/lib/data-table has no React in it.",
    },
    {
      title: "When the rows really are all of them",
      wrong: `<AsyncTable
  aria-label="Team"
  columns={columns}
  rows={[...members].sort(byName)}
  getRowId={(m) => m.id}
/>`,
      right: `<DataTable
  aria-label="Team"
  columns={columns}
  data={members}
  getRowId={(m) => String(m.id)}
/>`,
      note: "Twelve members loaded in one go is a DataTable, not a server-driven table: the same column definitions, sorted by the row model instead of by hand. Sorting in the browser is correct here — it is only wrong when it is pretending to be a query. If AsyncTable's filter popovers are what you actually wanted, keep it and suppress this rule with a reason that says where the rows come from.",
    },
  ],
  exceptions: [
    {
      scope: "An AsyncTable over a dataset that is complete in the browser",
      reason:
        "Nothing stops you rendering AsyncTable over a list you already hold in full — a demo that fakes the server, or a screen where the filter popovers are the feature and the twelve rows behind them are not worth a round trip. There the client sort is the query, and there is nothing to disagree with. Say so in a biome-ignore whose reason names where the rows come from; that note is the difference between a carve-out someone decided and one nobody noticed. DataTable is usually the better answer, and it is the same columns.",
    },
  ],
  enforcement: {
    kind: "lint",
    // The conjunction is the rule: a sort, and an <AsyncTable> in the same
    // function. `within ... where { ... }` backtracks through the enclosing
    // functions, so the sort inside a useMemo callback is found by the
    // component two levels out rather than by the callback it sits in.
    //
    // The receiver guard is a name heuristic and nothing more. It is what keeps
    // `columns.sort(...)` — reordering the columns, which is fine — out of the
    // rule, at the price of missing a rows array called something else. The
    // second arm of the `or` recovers the inline case by position instead:
    // anything sorted inside `rows={...}` is a rows array whatever it is named.
    biome: {
      via: "plugin",
      pattern: `or { \`$src.sort($cmp)\`, \`$src.toSorted($cmp)\` } as $call where {
  or {
    $src <: r".*(?i)rows.*",
    $call <: within bubble JsxAttribute(name = $prop) where { $prop <: r"^rows$" }
  },
  $call <: within bubble or {
    JsFunctionDeclaration(body = $body),
    JsArrowFunctionExpression(body = $body),
    JsFunctionExpression(body = $body)
  } where {
    $body <: contains bubble or {
      JsxSelfClosingElement(name = $table),
      JsxOpeningElement(name = $table)
    } where { $table <: r"^AsyncTable$" }
  }`,
    },
    message:
      "AsyncTable is controlled: it reports the whole new query through onQueryChange and draws its header from the query it was given, so sorting the rows here reorders one page of the answer to the last query instead of asking for a new one. Put the query in the URL from onQueryChange (queryToSearchParams), sort in the loader's ORDER BY, and pass rows and query back down. If the whole dataset is already in the browser, use DataTable from @/components/data-table — same columns, and the row model does the sorting on purpose. See https://ui-lib.quebi.de/rules/no-client-sorting-on-a-server-driven-table",
    grep: "[Rr]ows\\]?\\.(?:sort|toSorted)\\(",
    note: "Two limits, both deliberate. The receiver guard is a name heuristic: it matches a receiver whose text contains `rows` (so `[...rows]` and `sortedRows` are found, and `columns.sort(...)` is not), plus anything sorted inside a `rows={...}` attribute — a rows array named `data` and assigned to a local is missed. And the enclosing-function conjunction is what makes the check specific, so anything lifted into a sibling function or another module leaves the scope the check can see. Between them that means this finds the copy-paste case, which is the one an agent writes, and not the architectural one, which is the one a person writes on purpose. Client *filtering* is the same mistake with the same cure and is not linted at all: `rows.filter(...)` has too many legitimate uses to separate by shape.",
  },
  tags: ["tables", "data", "server", "async-table", "agents"],
}
