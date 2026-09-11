/**
 * Table's rendered structure.
 *
 * A smoke test, deliberately: Table composes React Aria's collection components
 * and the risk is in the composition, not in the styling. What is asserted is
 * that a plain declaration produces real table semantics — a `table` role with
 * `columnheader`s and `rowheader`s, so it is navigable — and that turning on
 * selection adds the selection column rather than throwing, which is the shape
 * that used to break when `isRowHeader` was missing.
 */
import { describe, expect, test } from "bun:test"
import { render, screen, within } from "@testing-library/react"
import { renderToString } from "react-dom/server"
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableColumnGroup,
  TableHeader,
  TableRow,
} from "../../src/components/table"

const BasicTable = () => (
  <Table aria-label="Devices">
    <TableHeader>
      <TableColumn isRowHeader>Name</TableColumn>
      <TableColumn>Storage</TableColumn>
    </TableHeader>
    <TableBody>
      <TableRow id="1">
        <TableCell>Galaxy S24</TableCell>
        <TableCell>256GB</TableCell>
      </TableRow>
    </TableBody>
  </Table>
)

describe("Table", () => {
  test("renders table semantics, not a grid of divs", () => {
    render(<BasicTable />)

    const table = screen.getByRole("grid", { name: "Devices" })
    expect(within(table).getAllByRole("columnheader")).toHaveLength(2)
    expect(within(table).getByRole("rowheader")).toHaveTextContent("Galaxy S24")
  })

  test("renders every cell of the row", () => {
    render(<BasicTable />)

    expect(screen.getByText("256GB")).toBeInTheDocument()
  })

  test("selection mode adds a selection column", () => {
    render(
      <Table aria-label="Devices" selectionMode="multiple">
        <TableHeader>
          <TableColumn isRowHeader>Name</TableColumn>
          <TableColumn>Storage</TableColumn>
        </TableHeader>
        <TableBody>
          <TableRow id="1">
            <TableCell>Galaxy S24</TableCell>
            <TableCell>256GB</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    )

    expect(screen.getAllByRole("columnheader")).toHaveLength(3)
    expect(screen.getAllByRole("checkbox").length).toBeGreaterThan(0)
  })

  test("renders the empty state instead of rows when there are none", () => {
    render(
      <Table aria-label="Devices">
        <TableHeader>
          <TableColumn isRowHeader>Name</TableColumn>
        </TableHeader>
        <TableBody renderEmptyState={() => "No devices yet"}>{[]}</TableBody>
      </Table>,
    )

    expect(screen.getByText("No devices yet")).toBeInTheDocument()
  })

  /**
   * This test asserts a bug in somebody else's code, on purpose: it is the
   * alarm that tells us when the bug is gone.
   *
   * react-stately's `buildHeaderRows` chains each header row by writing
   * `prevKey`/`nextKey` onto the very column nodes the collection's tree is made
   * of, and those are the fields `BaseCollection.getChildren` walks. react-aria's
   * server path commits the collection once per appended node, so the second
   * commit walks a tree whose sibling links now cross band boundaries: a leaf is
   * reached through two parents, `updateColumns` collects it twice, and the
   * header comes out with the leaf duplicated and the band's `colSpan` too wide.
   * In a shape with one more band — the one `DataTable` produces, where the
   * selection gutter gets a band of its own — the duplicate grows until
   * `buildHeaderRows` links a node to itself and the walk never ends.
   *
   * Reported as https://github.com/adobe/react-spectrum/issues/10598. Two bands
   * over every leaf is the shape that corrupts without hanging, so this can be
   * asserted rather than timed out.
   *
   * **When this test fails, the upstream fix has shipped.** Then: drop the
   * `useIsSSR` gate and the band-name fallback block in `data-table.tsx`, drop
   * `TABLE_BAND_HEIGHT` (nothing else needs a hard-coded row height), turn the
   * server-render test in `data-table.test.tsx` into one that asserts two header
   * rows in the server HTML, and delete this test.
   */
  test("a band is still corrupted by react-stately on the server", () => {
    const html = renderToString(
      <Table aria-label="Devices">
        <TableHeader>
          <TableColumnGroup id="identity" label="Identity">
            <TableColumn id="name" isRowHeader>
              Name
            </TableColumn>
            <TableColumn id="owner">Owner</TableColumn>
          </TableColumnGroup>
          <TableColumnGroup id="hardware" label="Hardware">
            <TableColumn id="storage">Storage</TableColumn>
          </TableColumnGroup>
        </TableHeader>
        <TableBody>
          <TableRow id="1">
            <TableCell>Galaxy S24</TableCell>
            <TableCell>Ada</TableCell>
            <TableCell>256GB</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    )
    const thead = html.slice(html.indexOf("<thead"), html.indexOf("</thead>"))

    // Three leaf columns, four leaf header cells: the leaf of the second band is
    // reached through the first band as well, so it is emitted twice — and the
    // band above it is told it spans two columns, which is why the colindex of
    // the last one is 4 in a table three columns wide.
    expect(thead.match(/data-slot="table-column"/g) ?? []).toHaveLength(4)
    expect(thead.match(/data-key="storage"/g) ?? []).toHaveLength(2)
    expect(thead).toContain('aria-colindex="4"')
  })
})
