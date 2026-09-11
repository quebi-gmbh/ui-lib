/**
 * adobe/react-spectrum#10598, second shape: `renderToString` never returns.
 *
 *     npm install && npm run hang     # kill it yourself; it will not finish
 *
 * Three bands with one leaf column each. The same corruption as `repro.tsx`,
 * one step further along: `buildHeaderRows` reaches a header row whose last
 * entry is the node it is about to append, so it writes
 *
 *     row[row.length - 1].nextKey = item.key      // item.nextKey = item.key
 *
 * and `BaseCollection.getChildren`, which walks `nextKey`, now has a cycle of
 * length one. On a server this is a hung request, not a wrong pixel.
 *
 * Self-contained on purpose: this file is the whole repro.
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

const App = () => (
  <Table aria-label="Devices">
    <TableHeader>
      <Band id="a" label="A">
        <Column id="c1" isRowHeader>
          One
        </Column>
      </Band>
      <Band id="b" label="B">
        <Column id="c2">Two</Column>
      </Band>
      <Band id="c" label="C">
        <Column id="c3">Three</Column>
      </Band>
    </TableHeader>
    <TableBody>
      <Row id="1">
        <Cell>a</Cell>
        <Cell>b</Cell>
        <Cell>c</Cell>
      </Row>
    </TableBody>
  </Table>
)

console.log("calling renderToString — this does not return")
console.log(renderToString(<App />).length)
