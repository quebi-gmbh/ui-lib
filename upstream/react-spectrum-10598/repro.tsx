/**
 * adobe/react-spectrum#10598 — `renderToString` of a react-aria-components
 * `Table` with a two-level header emits the wrong header row.
 *
 *     npm install && npm run repro
 *
 * Exits 1 while the bug is present, 0 once it is fixed.
 *
 * Self-contained on purpose: this file is the whole repro, so it can be pasted
 * into a sandbox as-is.
 */
import { renderToString } from "react-dom/server"
import {
  Cell,
  Column,
  Row,
  Table,
  TableBody,
  TableHeader,
  createBranchComponent,
} from "react-aria-components"

/**
 * A column that contains columns.
 *
 * RAC's own `Column` is built with `createLeafComponent`, so it cannot hold
 * child columns; `createBranchComponent` — the factory RAC builds `TableHeader`,
 * `TableBody` and `Row` with, and a public typed export of the package — is what
 * declares one. `node` is the live `CollectionNode` out of RAC's
 * `BaseCollection`, and `colSpan` on it is written by react-stately's
 * `buildHeaderRows`.
 */
const Band = createBranchComponent<object, { id?: string; label?: string; children?: unknown }, HTMLTableCellElement>(
  "column",
  ({ label }, ref, node) => (
    <th ref={ref} colSpan={(node as { colSpan?: number }).colSpan ?? 1} data-key={String(node.key)}>
      {label}
    </th>
  ),
)

const App = () => (
  <Table aria-label="Devices">
    <TableHeader>
      <Band id="identity" label="Identity">
        <Column id="name" isRowHeader>
          Name
        </Column>
        <Column id="owner">Owner</Column>
      </Band>
      <Band id="hardware" label="Hardware">
        <Column id="storage">Storage</Column>
      </Band>
    </TableHeader>
    <TableBody>
      <Row id="1">
        <Cell>Galaxy S24</Cell>
        <Cell>Ada</Cell>
        <Cell>256GB</Cell>
      </Row>
    </TableBody>
  </Table>
)

const html = renderToString(<App />)
const thead = html.slice(html.indexOf("<thead"), html.indexOf("</thead>"))

console.log("--- server-rendered <thead> ---")
console.log(thead.replaceAll("><", ">\n<"))
console.log("-------------------------------")

const leaves = (thead.match(/role="columnheader"/g) ?? []).length
const storage = (thead.match(/data-key="storage"/g) ?? []).length
const colIndexes = [...thead.matchAll(/aria-colindex="(\d+)"/g)].map((m) => m[1])

console.log(`leaf header cells: expected 3, got ${leaves}`)
console.log(`cells for the "storage" column: expected 1, got ${storage}`)
console.log(`aria-colindex values: expected 1,2,3 — got ${colIndexes.join(",")}`)

const broken = leaves !== 3 || storage !== 1 || colIndexes.join(",") !== "1,2,3"
console.log(broken ? "\nFAIL — the header is corrupted." : "\nOK — fixed.")
process.exit(broken ? 1 : 0)
