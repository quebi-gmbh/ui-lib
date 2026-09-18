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
   * **Nobody upstream is fixing this, so do not read a passing run as "not yet".**
   * #10598 was closed on 2026-09-12. The mechanism was not disputed — the
   * contributor who first declined to investigate edited his reply to concede it
   * ("we should be making mutable clones of nodes before passing them into
   * `buildHeaderRows`") — but a maintainer closed it because react-aria-components'
   * table collection does not support nested columns at all. That is
   * https://github.com/adobe/react-spectrum/issues/5263, open since 2023 and
   * labelled a bug, with the advice that an application wanting a branch column
   * "will probably have to create your own table collection". #5263 is what this
   * test now watches: a fix would arrive as part of nested-column support, not as
   * a patch release against the report.
   *
   * **If this test does fail, that has happened.** Then: drop the `useIsSSR` gate
   * and the band-name fallback block in `table-shell.tsx`, drop
   * `TABLE_BAND_HEIGHT` (nothing else needs a hard-coded row height), turn the
   * server-render test in `data-table.test.tsx` into one that asserts two header
   * rows in the server HTML, and delete this test. Check the sibling test below
   * separately — the two halves can move independently.
   *
   * Everything needed to act on that, or to make the case again if #5263 is ever
   * picked up, is in `upstream/react-spectrum-10598/`: a standalone repro of all
   * three shapes that needs none of this repo, and the provenance for every
   * claim. Two things live there that this test cannot show. Three bands over one
   * leaf each make `buildHeaderRows` execute `item.nextKey = item.key`, so the
   * `nextKey` walk has a one-node cycle and `renderToString` never returns. And
   * deleting only the `prevKey`/`nextKey` writes from `buildHeaderRows` fixes
   * both of those shapes while leaving react-stately's own `TableCollection`
   * byte-identical, because `GridCollection` re-chains every child from
   * `childNodes` order after `buildHeaderRows` has run — so those particular
   * writes are already dead for the only other caller. The fix is three lines and
   * it is verified; what is missing is a maintainer who wants it.
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

  /**
   * The second bug reported in the same upstream issue, asserted the same way
   * and for the same reason: this test fails when the fix ships.
   *
   * A header row shorter than the table is what makes react-stately's
   * `buildHeaderRows` fill the gap with a `placeholder` node. It builds one out
   * of a literal — `type: 'placeholder'`, `rendered: null`, and no `render`
   * function — while react-aria-components' renderer calls `node.render(node)`
   * on every child it walks. So the shape throws rather than rendering a blank
   * cell, and `TableHeader`'s `bandDepth` exists only to keep it from arising:
   * the drag and selection gutters get empty bands stacked above them so the
   * header stays rectangular.
   *
   * `bandDepth` is left at its default here, which is precisely the workaround
   * being withheld. When react-aria-components learns to render a placeholder,
   * this stops throwing — and then `bandDepth`, `banded()` and `bandClassName`
   * can go, along with the `bandDepth` argument `table-shell.tsx` computes.
   *
   * Upstream status, checked 2026-09-18: still present, and still nobody's
   * errand. react-stately's `buildHeaderRows` is unchanged from the 3.48.0 in
   * this lockfile through 3.50.0 and the 2026-09-18 nightly, and the placeholder
   * literal it constructs still has no `render`. #10598 is closed as out of
   * scope; see the sibling test above for what was actually said and why the
   * watch now points at
   * https://github.com/adobe/react-spectrum/issues/5263 instead.
   *
   * This half needs a fix on the react-aria-components side rather than the
   * react-stately one — `Collection.tsx` calls `node.render!(node)` with no case
   * for a placeholder — so it is separate from the mutation bug above and could
   * still land separately, whatever happens to #5263: rendering a placeholder as
   * a blank cell is a defensible change on its own terms and does not require
   * anyone to commit to nested columns. That is why this test exists rather than
   * being folded into the one above, and why its instructions are its own.
   * `upstream/react-spectrum-10598/placeholder.tsx` is
   * this same shape written against plain react-aria-components, for the upstream
   * thread; it is worth knowing that this one is not SSR-specific, which is what
   * makes it the cleanest of the three to hand someone.
   */
  test("a header row shorter than the table is still unrenderable", () => {
    expect(() =>
      render(
        <Table aria-label="Devices" selectionMode="multiple">
          <TableHeader>
            <TableColumnGroup id="identity" label="Identity">
              <TableColumn id="name" isRowHeader>
                Name
              </TableColumn>
              <TableColumn id="owner">Owner</TableColumn>
            </TableColumnGroup>
          </TableHeader>
          <TableBody>
            <TableRow id="1">
              <TableCell>Galaxy S24</TableCell>
              <TableCell>Ada</TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      ),
    ).toThrow(/render is not a function/)
  })
})
