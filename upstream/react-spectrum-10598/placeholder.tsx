/**
 * adobe/react-spectrum#10598, third shape: a header row shorter than the table
 * cannot be rendered at all.
 *
 *     npm install && npm run placeholder
 *
 * Nothing to do with SSR — the same shape throws under `createRoot` in a
 * browser. `buildHeaderRows` fills a short header row with a node it builds
 * from a literal (`packages/react-stately/src/table/TableCollection.ts:120-132`
 * and `:164-177`): `type: 'placeholder'`, `rendered: null`, and no `render`.
 * RAC's renderer calls `node.render!(node)` on every child it walks
 * (`packages/react-aria-components/src/Collection.tsx:225`), and has no case for
 * a placeholder. So it throws.
 *
 * That is a second, independent path by which RAC consumes `buildHeaderRows`'
 * output — this one does not even involve the node mutation.
 *
 * Exits 1 while the bug is present, 0 once it is fixed.
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

const Band = createBranchComponent<object, { id?: string; label?: string; children?: unknown }, HTMLTableCellElement>(
  "column",
  ({ label }, ref, node) => (
    <th ref={ref} colSpan={(node as { colSpan?: number }).colSpan ?? 1} data-key={String(node.key)}>
      {label}
    </th>
  ),
)

// Two leaves under a band, one leaf beside it: the top header row covers two of
// the three columns, so it needs a placeholder to stay rectangular.
const App = () => (
  <Table aria-label="Devices">
    <TableHeader>
      <Band id="identity" label="Identity">
        <Column id="name" isRowHeader>
          Name
        </Column>
        <Column id="owner">Owner</Column>
      </Band>
      <Column id="storage">Storage</Column>
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

try {
  renderToString(<App />)
  console.log("OK — fixed; the placeholder rendered.")
  process.exit(0)
} catch (error) {
  console.log(`FAIL — ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
}
