import type { RuleMeta } from "./types"

/**
 * Platform defaults, second of two — the array method standing in for a query.
 *
 * Note the name. The original proposal said "server-paginated", which
 * AsyncTable is not: `AsyncTableProps` has no `page`, `pageSize`, `total` or
 * `hasMore`. What it does have is a controlled `sort` prop and an
 * `onSortChange` callback, and those are the thing the rule is about — the
 * component reports intent, the consumer runs the query.
 */
export const noClientSortingOnAServerDrivenTableRule: RuleMeta = {
  id: "no-client-sorting-on-a-server-driven-table",
  title: "Sorting a server-driven table is a query, not an array method",
  navTitle: "Client sorting",
  summary:
    "AsyncTable is controlled: it reports sort intent through onSortChange and draws its header from the sort prop. Re-query and pass the rows back. If the whole dataset is already in the browser, that is a Table with allowsSorting, not an AsyncTable.",
  severity: "warn",
  category: "platform-defaults",
  failureMode:
    "An agent wires `onSortChange` to `setSort`, then makes the column headers work the only way it can do in one file: `[...rows].sort(compare(sort))`. The table sorts on the first click, with no loader change, no query parameter and no round trip — which is what makes it look finished. Nothing in the component objects, because a controlled component cannot tell where its rows came from.",
  rationale: [
    "The rows are an answer, not the table. AsyncTable's filter popovers load their values through `loadFilterValues`, which is a call to the server — so by the time you are sorting in the client, half the table is already the server's opinion and half is yours. The moment the query behind those rows has a `LIMIT`, or a filter, or a cursor, sorting what you were handed reorders a slice: the top row of your sort is the top of the answer you got, not the top of the data.",
    "Two orderings, one column, and they do not agree. `Array.prototype.sort` with no comparator compares UTF-16 code units, so `Zürich` sorts before `Ähre`; with a `localeCompare` comparator it uses whatever locale the runtime has, which on a prerendered page is one locale on the server and another in the browser — the hydration bug that `format-values-through-the-library` exists to stop. Postgres sorted the same column under its own collation. Whichever of the three is right, having all three is not.",
    "It also throws away the state the component is asking you for. The sort indicator in the header is drawn from the `sort` prop, and `toggleSort` does nothing except call `onSortChange` — the component deliberately owns no sort state. A client sort that never lifts `sort` back up leaves a table whose rows are ordered and whose header says they are not; one that does lift it back up has the same value driving a query that never runs and an array method that does.",
    "The right shape is smaller than the wrong one. `onSortChange` writes the column and direction into the URL, the loader reads them and puts them in the `ORDER BY`, and `rows` and `sort` both arrive from the loader — which also makes the sorted view a link someone can send, a back button that works, and a prerender that matches. Nothing in the component has to change; the sort simply stops being a thing the page computes.",
    "And if the whole dataset really is in the browser, none of this applies — but then you are not building a server-driven table. `Table` from @/components/table passes `sortDescriptor` and `onSortChange` straight through to react-aria and marks columns with `allowsSorting`, which is client sorting done deliberately, with the indicator and the announcement handled. Reaching for AsyncTable and then sorting locally gets you the filter popovers' network calls with none of their point.",
  ],
  appliesTo: ["app/**/*.{tsx,jsx}", "src/**/*.{tsx,jsx}"],
  examples: [
    {
      title: "The sort that never leaves the page",
      wrong: `const { rows } = useLoaderData<typeof loader>()
const [sort, setSort] = useState<AsyncTableSort | null>(null)

const sorted = useMemo(
  () => (sort ? [...rows].sort(compare(sort)) : rows),
  [rows, sort],
)

return (
  <AsyncTable
    aria-label="Orders"
    columns={columns}
    rows={sorted}
    sort={sort}
    onSortChange={setSort}
    getRowId={(o) => o.id}
  />
)`,
      right: `// the loader reads the params and puts them in the ORDER BY
const { rows, sort } = useLoaderData<typeof loader>()
const [params, setParams] = useSearchParams()

return (
  <AsyncTable
    aria-label="Orders"
    columns={columns}
    rows={rows}
    sort={sort}
    onSortChange={(next) => {
      setParams((p) => {
        if (next) {
          p.set("sort", next.column)
          p.set("dir", next.direction)
        } else {
          p.delete("sort")
          p.delete("dir")
        }
        return p
      })
    }}
    getRowId={(o) => o.id}
  />
)`,
      note: "The wrong version is shorter by one loader argument and wrong by a whole dataset. The right one also gets a shareable URL and a working back button for free, because the sort now lives where the query does.",
    },
    {
      title: "When the rows really are all of them",
      wrong: `<AsyncTable
  aria-label="Team"
  columns={columns}
  rows={[...members].sort(byName)}
  getRowId={(m) => m.id}
/>`,
      right: `<Table aria-label="Team" sortDescriptor={sort} onSortChange={setSort}>
  <TableHeader>
    <TableColumn id="name" isRowHeader allowsSorting>
      Name
    </TableColumn>
  </TableHeader>
  <TableBody items={sorted}>{/* … */}</TableBody>
</Table>`,
      note: "Twelve members loaded in one go is a table, not a server-driven table. Sorting them in the browser is correct — it is only wrong when it is pretending to be a query. If AsyncTable's filter popovers are what you actually wanted, keep it and suppress this rule with a reason that says where the rows come from.",
    },
  ],
  exceptions: [
    {
      scope: "An AsyncTable over a dataset that is complete in the browser",
      reason:
        "Nothing stops you rendering AsyncTable over a list you already hold in full — a demo that fakes the server, or a screen where the filter popovers are the feature and the twelve rows behind them are not worth a round trip. There the client sort is the query, and there is nothing to disagree with. Say so in a biome-ignore whose reason names where the rows come from; that note is the difference between a carve-out someone decided and one nobody noticed.",
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
      "AsyncTable is controlled: it reports sort intent through onSortChange and draws its header from the sort prop, so sorting the rows here reorders the answer to the last query instead of asking for a new one. Put the column and direction in the URL from onSortChange, sort in the loader's ORDER BY, and pass rows and sort back down. If the whole dataset is already in the browser, use Table from @/components/table with allowsSorting columns and a sortDescriptor — that is client sorting on purpose. See https://ui-lib.quebi.de/rules/no-client-sorting-on-a-server-driven-table",
    grep: "[Rr]ows\\]?\\.(?:sort|toSorted)\\(",
    note: "Two limits, both deliberate. The receiver guard is a name heuristic: it matches a receiver whose text contains `rows` (so `[...rows]` and `sortedRows` are found, and `columns.sort(...)` is not), plus anything sorted inside a `rows={...}` attribute — a rows array named `data` and assigned to a local is missed. And the enclosing-function conjunction is what makes the check specific, so anything lifted into a sibling function or another module leaves the scope the check can see. Between them that means this finds the copy-paste case, which is the one an agent writes, and not the architectural one, which is the one a person writes on purpose. Client *filtering* is the same mistake with the same cure and is not linted at all: `rows.filter(...)` has too many legitimate uses to separate by shape.",
  },
  tags: ["tables", "data", "server", "async-table", "agents"],
}
